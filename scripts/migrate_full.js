const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');

const SOURCE_MONGO_URI = 'mongodb+srv://79PVwwUBqB9X8Yx7:9pqAcTSC1gXQUQqw@nexasoft.mg01pcv.mongodb.net/?appName=winsor';
const TARGET_MONGO_URI = 'mongodb+srv://winsorbrandonline_db_user:683ain2QDe0fwQhg@winsor.mqbzfvh.mongodb.net/?appName=winsor';

// Configure Target Cloudinary Account
cloudinary.config({
  cloud_name: 'dux9i7yt',
  api_key: '232652146382734',
  api_secret: 'UU7y7V2lghc8ptiS7wLZq1TMRyQ',
  secure: true,
});

// Cache for uploaded image/video URLs to avoid duplicate uploads
const urlMap = new Map();

async function uploadToTargetCloudinary(oldUrl) {
  if (!oldUrl || typeof oldUrl !== 'string') return oldUrl;
  if (!oldUrl.includes('cloudinary.com') && !oldUrl.includes('http')) return oldUrl;
  
  // If already mapped, return cached new URL
  if (urlMap.has(oldUrl)) {
    return urlMap.get(oldUrl);
  }

  // If URL is already on new Cloudinary cloud name, return as is
  if (oldUrl.includes('dux9i7yt')) {
    return oldUrl;
  }

  try {
    console.log(`  -> Migrating asset to new Cloudinary: ${oldUrl.substring(0, 70)}...`);
    const isVideo = oldUrl.endsWith('.webm') || oldUrl.endsWith('.mp4') || oldUrl.includes('/video/upload/');
    const result = await cloudinary.uploader.upload(oldUrl, {
      folder: 'winsor_migrated',
      resource_type: isVideo ? 'video' : 'auto',
    });
    console.log(`     ✓ Uploaded: ${result.secure_url}`);
    urlMap.set(oldUrl, result.secure_url);
    return result.secure_url;
  } catch (err) {
    console.error(`     ❌ Failed to upload asset (${oldUrl}):`, err.message);
    return oldUrl;
  }
}

// Recursively scan objects for image/video URLs and migrate them
async function migrateAssetUrlsInObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = await migrateAssetUrlsInObject(obj[i]);
    }
    return obj;
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && (val.includes('res.cloudinary.com') || val.includes('cloudinary.com'))) {
      obj[key] = await uploadToTargetCloudinary(val);
    } else if (typeof val === 'object' && val !== null) {
      if (val.url && typeof val.url === 'string' && val.url.includes('cloudinary.com')) {
        val.url = await uploadToTargetCloudinary(val.url);
      }
      obj[key] = await migrateAssetUrlsInObject(val);
    }
  }
  return obj;
}

async function runMigration() {
  console.log('🚀 STARTING DATABASE AND CLOUDINARY MIGRATION...');
  console.log(`Source DB: ${SOURCE_MONGO_URI.substring(0, 35)}...`);
  console.log(`Target DB: ${TARGET_MONGO_URI.substring(0, 35)}...`);

  // Connect to Source DB
  const sourceConn = await mongoose.createConnection(SOURCE_MONGO_URI).asPromise();
  console.log('✅ Connected to Source MongoDB!');

  // Connect to Target DB
  const targetConn = await mongoose.createConnection(TARGET_MONGO_URI).asPromise();
  console.log('✅ Connected to Target MongoDB!');

  // List all collections in Source DB
  const collections = await sourceConn.db.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections in Source DB:`, collections.map(c => c.name));

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    console.log(`\n--------------------------------------------------`);
    console.log(`📦 Processing Collection: "${colName}"`);
    
    const sourceCol = sourceConn.db.collection(colName);
    const targetCol = targetConn.db.collection(colName);

    const docs = await sourceCol.find({}).toArray();
    console.log(`Found ${docs.length} documents in "${colName}".`);

    if (docs.length === 0) continue;

    let processedCount = 0;
    for (const doc of docs) {
      // Migrate asset URLs inside document
      const migratedDoc = await migrateAssetUrlsInObject(doc);

      // Upsert into target collection preserving _id
      await targetCol.replaceOne(
        { _id: migratedDoc._id },
        migratedDoc,
        { upsert: true }
      );
      processedCount++;
    }

    console.log(`✅ Successfully migrated ${processedCount}/${docs.length} documents into "${colName}"!`);
  }

  console.log('\n🎉 ALL COLLECTIONS & CLOUDINARY ASSETS MIGRATED SUCCESSFULLY!');
  await sourceConn.close();
  await targetConn.close();
  process.exit(0);
}

runMigration().catch(err => {
  console.error('\n❌ FATAL MIGRATION ERROR:', err);
  process.exit(1);
});
