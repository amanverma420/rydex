const mongoose = require('mongoose');

const MONGODB_URL = 'mongodb://localhost:27017/rydex';

async function setAllVehicles() {
  console.log("Connecting to database...");
  await mongoose.connect(MONGODB_URL);

  const email = 'Amanv2225@gmail.com';
  
  // 1. Get the user
  const user = await mongoose.connection.db.collection('users').findOne({ email });
  if (!user) {
    console.error("User not found! Please run node create-user.js first.");
    process.exit(1);
  }

  const userId = user._id;

  // 2. Define the vehicle types and unique registration numbers
  const vehicleTypes = [
    { type: 'bike', number: 'DL1BI1111', model: 'Honda Activa', baseFare: 30, pricePerKM: 8, waitingCharge: 1 },
    { type: 'auto', number: 'DL1AU3333', model: 'Bajaj RE', baseFare: 40, pricePerKM: 12, waitingCharge: 1 },
    { type: 'car', number: 'DL1CA1234', model: 'Toyota Camry', baseFare: 50, pricePerKM: 15, waitingCharge: 2 },
    { type: 'loading', number: 'DL1LO4444', model: 'Tata Ace', baseFare: 80, pricePerKM: 20, waitingCharge: 3 },
    { type: 'truck', number: 'DL1TR5555', model: 'Ashok Leyland', baseFare: 150, pricePerKM: 35, waitingCharge: 5 }
  ];

  for (const v of vehicleTypes) {
    const vehicleData = {
      owner: userId,
      type: v.type,
      number: v.number,
      vehicleModel: v.model,
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
      baseFare: v.baseFare,
      pricePerKM: v.pricePerKM,
      waitingCharge: v.waitingCharge,
      status: 'approved',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Upsert each vehicle type for the owner
    await mongoose.connection.db.collection('vehicles').updateOne(
      { owner: userId, type: v.type },
      { $set: vehicleData },
      { upsert: true }
    );
    console.log(`Approved vehicle type: "${v.type}" successfully created!`);
  }

  console.log("All vehicle types are now approved and live for Aman!");
  process.exit(0);
}

setAllVehicles().catch(err => {
  console.error("Error setting vehicles live:", err);
  process.exit(1);
});
