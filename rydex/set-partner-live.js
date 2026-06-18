const mongoose = require('mongoose');

const MONGODB_URL = 'mongodb://localhost:27017/rydex';

async function setPartnerLive() {
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

  // 2. Elevate user role and set onboarding step to live (7 / Step 8)
  await mongoose.connection.db.collection('users').updateOne(
    { _id: userId },
    {
      $set: {
        role: 'partner',
        partnerOnBoardingSteps: 7,
        partnerStatus: 'approved',
        videoKycStatus: 'approved',
        isOnline: true
      }
    }
  );
  console.log("User onboarding steps & status updated to Approved/Live!");

  // 3. Create or update vehicle details
  const vehicle = {
    owner: userId,
    type: 'car',
    number: 'DL1CA1234',
    vehicleModel: 'Toyota Camry',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
    baseFare: 50,
    pricePerKM: 15,
    waitingCharge: 2,
    status: 'approved',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await mongoose.connection.db.collection('vehicles').updateOne(
    { owner: userId },
    { $set: vehicle },
    { upsert: true }
  );
  console.log("Vehicle record created and approved!");

  // 4. Create or update partner docs
  const partnerDoc = {
    owner: userId,
    aadharUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
    rcUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
    licenseUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await mongoose.connection.db.collection('partnerdocs').updateOne(
    { owner: userId },
    { $set: partnerDoc },
    { upsert: true }
  );
  console.log("Partner documents uploaded!");

  // 5. Create or update bank details
  const partnerBank = {
    owner: userId,
    accountHolder: 'Aman',
    accountNumber: '1234567890',
    ifsc: 'SBI0001234',
    upi: 'aman@upi',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await mongoose.connection.db.collection('partnerbanks').updateOne(
    { owner: userId },
    { $set: partnerBank },
    { upsert: true }
  );
  console.log("Partner bank details uploaded!");

  console.log("Aman is now a LIVE partner! Please log out and log back in to see the active driver dashboard.");
  process.exit(0);
}

setPartnerLive().catch(err => {
  console.error("Error setting partner live:", err);
  process.exit(1);
});
