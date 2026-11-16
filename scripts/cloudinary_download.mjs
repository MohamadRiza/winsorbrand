/**
 * Cloudinary -> local disk migration (STAGE 1: READ-ONLY).
 *
 * - Connects to MongoDB (read-only queries only) and deep-scans EVERY collection
 *   for strings that are Cloudinary URLs.
 * - Downloads each unique original file (no re-compression) into OUT_DIR,
 *   organised "one title -> one folder":
 *       products/<title-slug>-<id6>/thumbnail.<ext>
 *       products/<title-slug>-<id6>/gallery-01.<ext>
 *       products/<title-slug>-<id6>/color-<name>.<ext>
 *       products/<title-slug>-<id6>/video.<ext>
 *       other/<collection>/<name>.<ext>        (receipts, resumes, retailers, ...)
 * - Verifies every download (HTTP 200, non-empty, content-length match) + sha256.
 * - Writes manifest.json and report.csv next to OUT_DIR. NEVER writes to the DB.
 *
 * Usage (from project root):
 *   MONGODB_URI=... node scripts/cloudinary_download.mjs            # inventory only (dry run)
 *   MONGODB_URI=... node scripts/cloudinary_download.mjs --download # download + verify
 *
 * Env: MONGODB_URI (required), OUT_DIR (default storage/uploads), CONCURRENCY (default 4)
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const require = createRequire(path.resolve('package.json'));
const mongoose = require('mongoose');

const DOWNLOAD = process.argv.includes('--download');
const MONGODB_URI = process.env.MONGODB_URI;
const OUT_DIR = path.resolve(process.env.OUT_DIR || 'storage/uploads');
const MANIFEST_PATH = path.join(path.dirname(OUT_DIR), 'manifest.json');
const REPORT_PATH = path.join(path.dirname(OUT_DIR), 'report.csv');
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required.');
  process.exit(1);
}

const CLD_RE = /^https?:\/\/res\.cloudinary\.com\//i;
const TRANSFORM_RE = /^[a-z]{1,3}_[^/]+(,[a-z]{1,3}_[^/]+)*$/; // e.g. q_auto,f_auto
const VERSION_RE = /^v\d+$/;

const slugify = (s, max = 60) =>
  String(s || 'untitled')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '') || 'untitled';

/** Strip Cloudinary delivery transformations => URL of the stored original. */
function toOriginalUrl(url) {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean); // [cloud, resource_type, delivery_type, ...rest]
  if (parts.length < 4) return url;
  const head = parts.slice(0, 3);
  let rest = parts.slice(3);
  while (rest.length > 1 && !VERSION_RE.test(rest[0]) && TRANSFORM_RE.test(rest[0])) rest = rest.slice(1);
  return `${u.origin}/${[...head, ...rest].join('/')}`;
}

function urlMeta(url) {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  const cloud = parts[0];
  const resourceType = parts[1]; // image | video | raw
  const last = decodeURIComponent(parts[parts.length - 1] || 'file');
  const ext = path.extname(last).toLowerCase();
  const base = path.basename(last, ext);
  return { cloud, resourceType, ext, base };
}

function roleFor(collection, fieldPath, doc) {
  const m = fieldPath.match(/^images\.(\d+)\.url$/);
  if (fieldPath === 'thumbnail.url') return 'thumbnail';
  if (m) return `gallery-${String(Number(m[1]) + 1).padStart(2, '0')}`;
  const c = fieldPath.match(/^colorVariants\.(\d+)\.image\.url$/);
  if (c) {
    const v = doc?.colorVariants?.[Number(c[1])];
    return `color-${slugify(v?.colorName || `variant-${Number(c[1]) + 1}`, 30)}`;
  }
  if (fieldPath === 'video.url') return 'video';
  return slugify(fieldPath.replace(/\./g, '-'), 40);
}

function* walk(value, p = '') {
  if (typeof value === 'string') {
    yield [p, value];
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* walk(value[i], p ? `${p}.${i}` : String(i));
  } else if (value && typeof value === 'object' && !(value._bsontype) && !(value instanceof Date)) {
    for (const k of Object.keys(value)) yield* walk(value[k], p ? `${p}.${k}` : k);
  }
}

async function main() {
  console.log(`Mode: ${DOWNLOAD ? 'DOWNLOAD + VERIFY' : 'INVENTORY ONLY (dry run)'}`);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  console.log(`Connected. Database: "${db.databaseName}"`);

  const colls = (await db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'))
    .sort((a, b) => (a === 'products' ? -1 : b === 'products' ? 1 : a.localeCompare(b)));

  const refs = []; // every occurrence
  const embeddedWarnings = [];
  for (const name of colls) {
    let docCount = 0;
    let found = 0;
    for await (const doc of db.collection(name).find({})) {
      docCount++;
      for (const [fp, val] of walk(doc)) {
        if (CLD_RE.test(val.trim()) && !/\s/.test(val.trim())) {
          refs.push({
            collection: name,
            docId: String(doc._id),
            fieldPath: fp,
            url: val.trim(),
            owner: doc.title || doc.name || doc.productTitle || doc.fullName || doc.orderRef || doc.orderId || String(doc._id),
            role: roleFor(name, fp, doc),
          });
          found++;
        } else if (/res\.cloudinary\.com/i.test(val)) {
          embeddedWarnings.push({ collection: name, docId: String(doc._id), fieldPath: fp });
        }
      }
    }
    console.log(`  ${name.padEnd(24)} docs=${String(docCount).padStart(5)}  cloudinary-refs=${found}`);
  }

  const uniqueUrls = new Set(refs.map((r) => toOriginalUrl(r.url)));
  const clouds = [...new Set(refs.map((r) => urlMeta(r.url).cloud))];
  const byType = {};
  for (const u of uniqueUrls) byType[urlMeta(u).resourceType] = (byType[urlMeta(u).resourceType] || 0) + 1;
  console.log(`\nTotal references: ${refs.length}`);
  console.log(`Unique files:     ${uniqueUrls.size}  ${JSON.stringify(byType)}`);
  console.log(`Cloud names seen: ${clouds.join(', ') || '(none)'}`);
  if (embeddedWarnings.length) {
    console.log(`WARNING: ${embeddedWarnings.length} string(s) embed a Cloudinary URL inside longer text (not auto-handled).`);
    embeddedWarnings.slice(0, 10).forEach((w) => console.log('   ', JSON.stringify(w)));
  }

  // ── assign deterministic local paths ────────────────────────────────────────
  const entries = new Map(); // originalUrl -> entry
  const usedRel = new Set();
  const uniqueRel = (rel) => {
    if (!usedRel.has(rel.toLowerCase())) return rel;
    const ext = path.extname(rel);
    const stem = rel.slice(0, rel.length - ext.length);
    const h = crypto.createHash('sha1').update(rel + usedRel.size).digest('hex').slice(0, 6);
    return `${stem}-${h}${ext}`;
  };
  for (const r of refs) {
    const orig = toOriginalUrl(r.url);
    r.originalUrl = orig;
    if (entries.has(orig)) {
      r.rel = entries.get(orig).rel;
      continue;
    }
    const meta = urlMeta(orig);
    let rel;
    if (r.collection === 'products') {
      const folder = `${slugify(r.owner)}-${r.docId.slice(-6)}`;
      rel = `products/${folder}/${r.role}${meta.ext || ''}`;
    } else {
      rel = `other/${slugify(r.collection, 30)}/${slugify(meta.base, 80)}${meta.ext || ''}`;
    }
    rel = uniqueRel(rel);
    usedRel.add(rel.toLowerCase());
    entries.set(orig, { originalUrl: orig, rel, resourceType: meta.resourceType, bytes: null, sha256: null, contentType: null, status: 'pending' });
    r.rel = rel;
  }

  if (!DOWNLOAD) {
    console.log('\nSample of planned layout:');
    [...entries.values()].slice(0, 12).forEach((e) => console.log('  ', e.rel));
    console.log('\nDry run only. Re-run with --download to fetch files.');
    await mongoose.disconnect();
    return;
  }

  // ── download + verify ──────────────────────────────────────────────────────
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let prior = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      for (const e of JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')).entries) prior[e.originalUrl] = e;
    } catch {}
  }

  const list = [...entries.values()];
  let done = 0, failed = 0, skipped = 0;
  const extFromType = (ct) => ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif', 'image/svg+xml': '.svg', 'video/mp4': '.mp4', 'video/webm': '.webm', 'application/pdf': '.pdf' }[(ct || '').split(';')[0].trim()] || '');

  async function fetchOne(e) {
    const abs = path.join(OUT_DIR, e.rel);
    const p = prior[e.originalUrl];
    if (p && p.sha256 && fs.existsSync(abs) && fs.statSync(abs).size === p.bytes) {
      Object.assign(e, p, { rel: e.rel });
      skipped++;
      return;
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    for (let attempt = 1; attempt <= 4; attempt++) {
      const tmp = abs + '.part';
      try {
        const res = await fetch(e.originalUrl, { redirect: 'follow' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const hash = crypto.createHash('sha256');
        let bytes = 0;
        const body = Readable.fromWeb(res.body);
        body.on('data', (c) => { hash.update(c); bytes += c.length; });
        await pipeline(body, fs.createWriteStream(tmp));
        const expected = Number(res.headers.get('content-length') || 0);
        const enc = res.headers.get('content-encoding');
        if (bytes === 0) throw new Error('empty file');
        if (expected && !enc && bytes !== expected) throw new Error(`size mismatch ${bytes}/${expected}`);
        e.contentType = res.headers.get('content-type');
        let finalAbs = abs;
        if (!path.extname(abs)) {
          const x = extFromType(e.contentType);
          if (x) { finalAbs = abs + x; e.rel = e.rel + x; }
        }
        fs.renameSync(tmp, finalAbs);
        e.bytes = bytes;
        e.sha256 = hash.digest('hex');
        e.status = 'ok';
        return;
      } catch (err) {
        try { fs.rmSync(tmp, { force: true }); } catch {}
        if (attempt === 4) { e.status = `FAILED: ${err.message}`; failed++; return; }
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }
  }

  let idx = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (idx < list.length) {
        const e = list[idx++];
        await fetchOne(e);
        done++;
        if (done % 10 === 0 || done === list.length) console.log(`  progress ${done}/${list.length} (skipped ${skipped}, failed ${failed})`);
      }
    })
  );

  // refs must follow any ext fix-ups
  for (const r of refs) r.rel = entries.get(r.originalUrl).rel;

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), database: db.databaseName, entries: list, refs }, null, 2));
  const csv = ['collection,docId,owner,role,fieldPath,localPath,bytes,originalUrl'];
  for (const r of refs) {
    const e = entries.get(r.originalUrl);
    csv.push([r.collection, r.docId, JSON.stringify(r.owner), r.role, r.fieldPath, '/media/' + e.rel, e.bytes ?? '', r.url].join(','));
  }
  fs.writeFileSync(REPORT_PATH, csv.join('\n'));

  const totalBytes = list.reduce((s, e) => s + (e.bytes || 0), 0);
  console.log(`\nDone. ok=${list.filter((e) => e.status === 'ok').length} failed=${failed} total=${(totalBytes / 1048576).toFixed(1)} MB`);
  list.filter((e) => e.status !== 'ok').forEach((e) => console.log('  FAILED:', e.originalUrl, e.status));
  console.log(`Files:    ${OUT_DIR}\nManifest: ${MANIFEST_PATH}\nReport:   ${REPORT_PATH}`);
  await mongoose.disconnect();
  if (failed) process.exit(2);
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
