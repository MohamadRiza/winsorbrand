const mongoose = require('mongoose');

const TARGET_MONGO_URI = 'mongodb+srv://winsorbrandonline_db_user:683ain2QDe0fwQhg@winsor.mqbzfvh.mongodb.net/?appName=winsor';

async function cleanProductCategoryRefs() {
  const conn = await mongoose.createConnection(TARGET_MONGO_URI).asPromise();
  const prodCol = conn.db.collection('products');

  const removeSlugs = ['ny', '1testing', 'cm'];
  
  const updateResult = await prodCol.updateMany(
    { giftCategories: { $in: removeSlugs } },
    { $pull: { giftCategories: { $in: removeSlugs } } }
  );

  console.log(`Updated products array references: modified ${updateResult.modifiedCount} products.`);
  await conn.close();
  process.exit(0);
}

cleanProductCategoryRefs().catch(() => process.exit(1));
