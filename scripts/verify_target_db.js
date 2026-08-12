const mongoose = require('mongoose');

const TARGET_MONGO_URI = 'mongodb+srv://winsorbrandonline_db_user:683ain2QDe0fwQhg@winsor.mqbzfvh.mongodb.net/?appName=winsor';

async function checkTargetDb() {
  console.log('🔍 CHECKING TARGET PRODUCTION DATABASE...');
  const conn = await mongoose.createConnection(TARGET_MONGO_URI).asPromise();
  
  const collections = await conn.db.listCollections().toArray();
  console.log('Found collections in target DB:', collections.map(c => c.name));

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;
    const count = await conn.db.collection(colName).countDocuments();
    console.log(`  - ${colName}: ${count} documents`);
  }

  // Check Admin collection username and password hash presence
  const admins = await conn.db.collection('admins').find({}).toArray();
  console.log('\n👤 Admins in Target DB:', admins.map(a => ({ id: a._id, username: a.username, email: a.email })));

  // Check Products sample Cloudinary URL
  const products = await conn.db.collection('products').find({}).limit(2).toArray();
  console.log('\n⌚ Sample Products Cloudinary URLs in Target DB:');
  products.forEach(p => {
    console.log(`  Product: "${p.title}"`);
    console.log(`  Thumbnail URL: ${p.thumbnail?.url || p.thumbnail}`);
  });

  await conn.close();
  console.log('\n✅ TARGET DATABASE VERIFICATION COMPLETE!');
  process.exit(0);
}

checkTargetDb().catch(err => {
  console.error('❌ Check error:', err);
  process.exit(1);
});
