const mongoose = require('mongoose');
require('dotenv').config();

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(col => console.log('- ' + col.name));
    
    // Check some collections for data
    const User = require('./model/user');
    const userCount = await User.countDocuments();
    console.log(`\nUsers: ${userCount}`);
    
    try {
      const Product = require('./model/product');
      const productCount = await Product.countDocuments();
      console.log(`Products: ${productCount}`);
    } catch(e) {
      console.log('Products: 0 (model not found)');
    }
    
    try {
      const Category = require('./model/category');
      const categoryCount = await Category.countDocuments();
      console.log(`Categories: ${categoryCount}`);
    } catch(e) {
      console.log('Categories: 0 (model not found)');
    }
    
    try {
      const Brand = require('./model/brand');
      const brandCount = await Brand.countDocuments();
      console.log(`Brands: ${brandCount}`);
    } catch(e) {
      console.log('Brands: 0 (model not found)');
    }
    
    mongoose.disconnect();
  } catch(error) {
    console.error('Error:', error.message);
  }
}

checkDB();
