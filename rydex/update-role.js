const mongoose = require('mongoose');
const MONGODB_URL = 'mongodb://localhost:27017/rydex';

async function update() {
  await mongoose.connect(MONGODB_URL);
  await mongoose.connection.db.collection('users').updateOne(
    { email: 'Amanv2225@gmail.com' },
    { $set: { role: 'partner', partnerOnBoardingSteps: 0 } }
  );
  console.log("Updated Aman to partner!");
  process.exit(0);
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
