const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Define basic Product schema
const ProductSchema = new mongoose.Schema({
  title: String,
  isActive: Boolean,
  showOnHome: Boolean,
  collectionSections: [String],
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const total = await Product.countDocuments();
    console.log('Total products in DB:', total);

    const activeAndHome = await Product.countDocuments({ isActive: true, showOnHome: true });
    console.log('Active and showOnHome products in DB:', activeAndHome);

    const sections = ['sports', 'new', 'luxury', 'limited', 'bestsellers'];
    for (const sec of sections) {
      const count = await Product.countDocuments({ isActive: true, showOnHome: true, collectionSections: sec });
      console.log(`- Section "${sec}" count:`, count);
    }

    const sample = await Product.find({ isActive: true, showOnHome: true }).limit(5).select('title collectionSections');
    console.log('Sample products:', JSON.stringify(sample, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
