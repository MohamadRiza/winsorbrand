const mongoose = require('mongoose');

const TARGET_MONGO_URI = 'mongodb+srv://winsorbrandonline_db_user:683ain2QDe0fwQhg@winsor.mqbzfvh.mongodb.net/?appName=winsor';

async function removeTestCategories() {
  console.log('🔍 CONNECTING TO PRODUCTION DATABASE...');
  const conn = await mongoose.createConnection(TARGET_MONGO_URI).asPromise();
  const giftCatCol = conn.db.collection('giftcategories');

  const targets = ['ny', '1testing', 'cm'];
  console.log('Target categories to remove:', targets);

  // Find all gift categories matching targets
  const matchingDocs = await giftCatCol.find({
    $or: [
      { slug: { $in: targets.map(t => t.toLowerCase()) } },
      { label: { $in: targets.map(t => new RegExp('^' + t + '$', 'i')) } }
    ]
  }).toArray();

  console.log(`Found ${matchingDocs.length} matching categories to delete:`, matchingDocs.map(d => ({ id: d._id, label: d.label, slug: d.slug })));

  if (matchingDocs.length > 0) {
    const deleteIds = matchingDocs.map(d => d._id);
    const deleteResult = await giftCatCol.deleteMany({ _id: { $in: deleteIds } });
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} gift categories!`);
  } else {
    console.log('⚠️ No matching gift categories found (they may have already been removed).');
  }

  // List remaining gift categories
  const remaining = await giftCatCol.find({}).toArray();
  console.log('\n📋 Remaining Gift Categories in Database:');
  remaining.forEach((cat, idx) => {
    console.log(`  ${idx + 1}. Label: "${cat.label}" (slug: "${cat.slug}", emoji: "${cat.emoji || '🎁'}")`);
  });

  await conn.close();
  console.log('\n✨ CATEGORY CLEANUP COMPLETE!');
  process.exit(0);
}

removeTestCategories().catch(err => {
  console.error('❌ Error during cleanup:', err);
  process.exit(1);
});
