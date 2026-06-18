const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URL = 'mongodb://localhost:27017/rydex';

async function createUser() {
  console.log("Connecting to database...");
  await mongoose.connect(MONGODB_URL);
  
  const email = 'Amanv2225@gmail.com';
  const name = 'Aman';
  const password = 'Amanverma';

  // Check if user already exists
  const existingUser = await mongoose.connection.db.collection('users').findOne({ email });
  if (existingUser) {
    console.log("User already exists in local DB:", existingUser);
    process.exit(0);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Insert user
  const user = {
    name,
    email,
    password: hashedPassword,
    role: 'user', // default role
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await mongoose.connection.db.collection('users').insertOne(user);
  console.log("User created successfully in local DB!", result);
  process.exit(0);
}

createUser().catch(err => {
  console.error("Error creating user:", err);
  process.exit(1);
});
