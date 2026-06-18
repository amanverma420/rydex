const mongoose = require('mongoose');

const MONGODB_URL = 'mongodb://localhost:27017/rydex';

async function diagnose() {
  console.log("Connecting to database...");
  await mongoose.connect(MONGODB_URL);

  const email = 'Amanv2225@gmail.com';
  
  // 1. Check User
  const user = await mongoose.connection.db.collection('users').findOne({ email });
  console.log("Partner User Record:", JSON.stringify(user, null, 2));

  if (!user) {
    console.error("Partner user does not exist in the database!");
    process.exit(1);
  }

  // 2. Check Vehicles
  const vehicles = await mongoose.connection.db.collection('vehicles').find({ owner: user._id }).toArray();
  console.log("Partner Vehicles Count:", vehicles.length);
  console.log("Vehicles Detail:", JSON.stringify(vehicles, null, 2));

  // 3. Test Indexes
  const indexes = await mongoose.connection.db.collection('users').indexes();
  console.log("Users Collection Indexes:", JSON.stringify(indexes, null, 2));

  // 4. Test near-by query
  try {
    const lat = 28.6139;
    const lon = 77.2090;
    
    // Explicitly try to force index creation in case it's missing
    console.log("Ensuring users collection 2dsphere index is created...");
    await mongoose.connection.db.collection('users').createIndex({ location: "2dsphere" });
    
    console.log("Running nearby query simulation...");
    const matches = await mongoose.connection.db.collection('users').find({
      role: 'partner',
      partnerStatus: 'approved',
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat]
          },
          $maxDistance: 10000
        }
      }
    }).toArray();
    
    console.log("Query completed successfully!");
    console.log("Found matching partners:", matches.length);
    if (matches.length > 0) {
      console.log("Matches details:", JSON.stringify(matches, null, 2));
    }
  } catch (error) {
    console.error("Geospatial query failed with error:", error);
  }

  process.exit(0);
}

diagnose().catch(err => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});
