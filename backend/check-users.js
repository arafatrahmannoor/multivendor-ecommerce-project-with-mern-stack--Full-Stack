const mongoose = require('mongoose');
require('dotenv').config();

async function getUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./model/user');
  const users = await User.find({}, 'name email role').limit(5);
  console.log('Available users:');
  users.forEach(user => console.log(`- ${user.name} (${user.email}) - ${user.role}`));
  mongoose.disconnect();
}
getUsers();
