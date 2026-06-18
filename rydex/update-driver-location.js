const mongoose = require('mongoose');

const MONGODB_URL = 'mongodb://localhost:27017/rydex';

async function updateLocation() {
  console.log("Connecting to database...");
  await mongoose.connect(MONGODB_URL);

  const email = 'Amanv2225@gmail.com';
  
  const user = await mongoose.connection.db.collection('users').findOne({ email });
  if (!user) {
    console.error("User not found!");
    process.exit(1);
  }

  const userId = user._id;

  // Set the correct GeoJSON Point location field
  await mongoose.connection.db.collection('users').updateOne(
    { _id: userId },
    {
      $set: {
        location: {
          type: "Point",
          coordinates: [77.2090, 28.6139] // [longitude, latitude]
        }
      }
    }
  );
  console.log("Successfully updated driver location to [77.2090, 28.6139]!");
  process.exit(0);
}

updateLocation().catch(err => {
  console.error("Error updating location:", err);
  process.exit(1);
});
