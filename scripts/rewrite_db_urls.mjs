/**
 * Cloudinary -> local disk migration (STAGE 2: DATABASE URL REWRITE).
 *
 * Run ONLY after storage/uploads has been copied to the VPS upload directory and
 * the new app version (with /media route) is deployed.
 *
 * Safety:
 *  - DRY RUN by default. Nothing is written unless --apply is passed.
 *  - Every target file is checked on disk (exists + exact byte size from manifest)
 *    BEFORE any write; one missing/mismatched file aborts everything.
 *  - Only the exact URL fields found by stage 1 are changed (publicId, titles,
 *    prices, stock, ... are never touched).
 *  - Each update is guarded by the field's current value, so a concurrent admin
 *    edit is never overwritten.
 *  - Full backup of every affected document is written first, plus a rollback.
 *
 * Usage (from project root, with MONGODB_URI and UPLOAD_DIR in the environment):
 *   node scripts/rewrite_db_urls.mjs                       # dry run
 *   node scripts/rewrite_db_urls.mjs --apply               # do it
 *   node scripts/rewrite_db_urls.mjs --rollback backups/url_rewrite_<timestamp>
 *
 * MANIFEST (default storage/manifest.json) must come from cloudinary_download.mjs.
 * Re-run cloudinary_download.mjs right before --apply if admins uploaded new
 * Cloudinary images since: unrewritten URLs simply keep working from Cloudinary
 * until you migrate them, nothing breaks.
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(path.resolve('package.json'));
const mongoose = require('mongoose');
const { EJSON } = mongoose.mongo.BSON;

const APPLY = process.argv.includes('--apply');
const rbIdx = process.argv.indexOf('--rollback');
const ROLLBACK_DIR = rbIdx > -1 ? process.argv[rbIdx + 1] : null;
const MONGODB_URI = process.env.MONGODB_URI;
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'storage/uploads');
const MANIFEST_PATH = path.resolve(process.env.MANIFEST || 'storage/manifest.json');

if (!MONGODB_URI) { console.error('MONGODB_URI is required.'); process.exit(1); }

const setByPath = (obj, p, val) => {
  const keys = p.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) cur = cur?.[keys[i]];
  if (cur) cur[keys[keys.length - 1]] = val;
};
const getByPath = (obj, p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const toObjectIdIfHex = (id) => (/^[a-f0-9]{24}$/i.test(id) ? new mongoose.Types.ObjectId(id) : id);

async function rollback() {
  const ops = JSON.parse(fs.readFileSync(path.join(ROLLBACK_DIR, 'changes.json'), 'utf8'));
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  let ok = 0, skipped = 0;
  for (const c of ops) {
    const res = await db.collection(c.collection).updateOne(
      { _id: toObjectIdIfHex(c.docId), [c.fieldPath]: c.newUrl },
      { $set: { [c.fieldPath]: c.oldUrl } }
    );
    res.modifiedCount ? ok++ : skipped++;
  }
  console.log(`Rollback complete: restored=${ok} skipped(already changed/absent)=${skipped}`);
  await mongoose.disconnect();
}

async function main() {
  if (ROLLBACK_DIR) return rollback();

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const entries = new Map(manifest.entries.map((e) => [e.originalUrl, e]));

  // 1) every target file must exist on disk with the exact verified size
  const problems = [];
  for (const e of manifest.entries) {
    const abs = path.join(UPLOAD_DIR, e.rel);
    if (e.status !== 'ok') problems.push(`manifest says not downloaded: ${e.originalUrl}`);
    else if (!fs.existsSync(abs)) problems.push(`MISSING on disk: ${e.rel}`);
    else if (fs.statSync(abs).size !== e.bytes) problems.push(`SIZE MISMATCH: ${e.rel}`);
  }
  if (problems.length) {
    console.error(`ABORT: ${problems.length} file problem(s). No database changes made.`);
    problems.slice(0, 25).forEach((p) => console.error('  -', p));
    process.exit(2);
  }
  console.log(`File check OK: ${manifest.entries.length} files present in ${UPLOAD_DIR}`);

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  console.log(`Connected. Database: "${db.databaseName}" (manifest was built from "${manifest.database}")`);
  if (db.databaseName !== manifest.database) {
    console.error('ABORT: database name differs from the one the manifest was built from.');
    process.exit(2);
  }

  // 2) plan: re-read each referenced field's CURRENT value; only rewrite exact matches
  const plan = [];
  const touchedDocs = new Map(); // collection|id -> original doc
  const byDoc = new Map();
  for (const r of manifest.refs) {
    const k = `${r.collection}|${r.docId}`;
    if (!byDoc.has(k)) byDoc.set(k, []);
    byDoc.get(k).push(r);
  }
  let stale = 0;
  for (const [k, rs] of byDoc) {
    const [collection, docId] = k.split('|');
    const doc = await db.collection(collection).findOne({ _id: toObjectIdIfHex(docId) });
    if (!doc) { stale += rs.length; continue; }
    let touched = false;
    for (const r of rs) {
      const current = getByPath(doc, r.fieldPath);
      const e = entries.get(r.originalUrl);
      if (current !== r.url || !e) { stale += 1; continue; } // changed since inventory -> leave alone
      plan.push({ collection, docId, fieldPath: r.fieldPath, oldUrl: r.url, newUrl: '/media/' + e.rel, owner: r.owner });
      touched = true;
    }
    if (touched) touchedDocs.set(k, doc);
  }
  console.log(`Planned changes: ${plan.length} field(s) in ${touchedDocs.size} document(s). Skipped (changed since inventory): ${stale}`);
  const perColl = {};
  plan.forEach((p) => (perColl[p.collection] = (perColl[p.collection] || 0) + 1));
  console.log('  by collection:', JSON.stringify(perColl));
  plan.slice(0, 6).forEach((p) => console.log(`  e.g. [${p.collection}] ${p.owner} :: ${p.fieldPath}\n       ${p.oldUrl}\n    -> ${p.newUrl}`));

  if (!APPLY) {
    console.log('\nDRY RUN - nothing written. Re-run with --apply to perform the rewrite.');
    await mongoose.disconnect();
    return;
  }

  // 3) full backup first
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve('backups', `url_rewrite_${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const docsByColl = {};
  for (const [k, doc] of touchedDocs) (docsByColl[k.split('|')[0]] ||= []).push(doc);
  for (const [coll, docs] of Object.entries(docsByColl)) fs.writeFileSync(path.join(backupDir, `${coll}.ejson`), EJSON.stringify(docs, null, 2));
  fs.writeFileSync(path.join(backupDir, 'changes.json'), JSON.stringify(plan, null, 2));
  console.log(`Backup written: ${backupDir}`);

  // 4) apply (guarded by current value)
  let ok = 0, skipped = 0;
  for (const p of plan) {
    const res = await db.collection(p.collection).updateOne(
      { _id: toObjectIdIfHex(p.docId), [p.fieldPath]: p.oldUrl },
      { $set: { [p.fieldPath]: p.newUrl } }
    );
    res.modifiedCount ? ok++ : skipped++;
  }
  console.log(`APPLIED: updated=${ok} skipped(changed meanwhile)=${skipped}`);
  console.log(`To undo:  node scripts/rewrite_db_urls.mjs --rollback "${backupDir}"`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
