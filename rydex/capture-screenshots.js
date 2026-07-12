const { chromium } = require('playwright');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MONGODB_URL = 'mongodb://127.0.0.1:27017/rydex';

async function run() {
  const imagesDir = path.join(__dirname, '..', 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log("Connecting to database for seeding...");
  await mongoose.connect(MONGODB_URL);

  // 1. Ensure 2dsphere index is created on users collection
  console.log("Ensuring users collection 2dsphere index...");
  await mongoose.connection.db.collection('users').createIndex({ location: "2dsphere" });
  
  // 2. Set Aman to default 'user' role
  await mongoose.connection.db.collection('users').updateOne(
    { email: 'Amanv2225@gmail.com' },
    { $set: { role: 'user', partnerOnBoardingSteps: 0 } }
  );
  console.log("Reset Aman to default 'user' role.");

  // 3. Seed a nearby driver/partner
  const driverEmail = 'driver@rydex.com';
  let driverUser = await mongoose.connection.db.collection('users').findOne({ email: driverEmail });
  let driverId;
  
  if (!driverUser) {
    const result = await mongoose.connection.db.collection('users').insertOne({
      name: 'John Driver',
      email: driverEmail,
      role: 'partner',
      partnerStatus: 'approved',
      partnerOnBoardingSteps: 7,
      videoKycStatus: 'approved',
      isOnline: true,
      location: {
        type: 'Point',
        coordinates: [77.2177, 28.6304] // Connaught Place coordinates [lng, lat]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    driverId = result.insertedId;
    console.log("Seeded a new driver: driver@rydex.com");
  } else {
    driverId = driverUser._id;
    await mongoose.connection.db.collection('users').updateOne(
      { _id: driverId },
      {
        $set: {
          role: 'partner',
          partnerStatus: 'approved',
          partnerOnBoardingSteps: 7,
          videoKycStatus: 'approved',
          isOnline: true,
          location: {
            type: 'Point',
            coordinates: [77.2177, 28.6304]
          },
          updatedAt: new Date()
        }
      }
    );
    console.log("Updated existing driver location and status.");
  }

  // 4. Seed the vehicle for the driver
  await mongoose.connection.db.collection('vehicles').updateOne(
    { owner: driverId },
    {
      $set: {
        owner: driverId,
        type: 'car',
        number: 'DL1CA9999',
        vehicleModel: 'Toyota Premium Sedan',
        imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
        baseFare: 50,
        pricePerKM: 15,
        waitingCharge: 2,
        status: 'approved',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log("Driver vehicle seeded.");

  console.log("Launching Chromium browser with fake media devices...");
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ['camera', 'microphone']
  });
  const page = await context.newPage();
  
  // Set timeouts
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);

  // 1. Capture public home page
  console.log("Step 1: Navigating to public home page...");
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(imagesDir, 'home.png') });
  console.log("Captured images/home.png");

  // 2. Perform Login
  console.log("Step 2: Performing login...");
  await page.click('.fixed.top-3 button:has-text("Login")', { force: true });
  await page.waitForSelector('input[placeholder="Email"]', { state: 'visible' });
  await page.fill('input[placeholder="Email"]', 'Amanv2225@gmail.com');
  await page.fill('input[placeholder="Password"]', 'Amanverma');
  await page.click('.relative.w-full.max-w-md button:has-text("Login")', { force: true });
  
  console.log("Waiting for authentication to complete...");
  try {
    await page.waitForSelector('button:has-text("A")', { state: 'visible', timeout: 10000 });
  } catch (err) {
    console.warn("Auth check timeout, continuing anyway.");
    await page.waitForTimeout(4000);
  }
  console.log("User logged in successfully.");

  // 3. Capture partner onboarding pages (while still having user role)
  console.log("Step 3: Navigating to partner onboarding pages...");
  await page.goto('http://localhost:3000/partner/onboarding/vehicle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(imagesDir, 'partner_onboarding_vehicle.png') });
  console.log("Captured images/partner_onboarding_vehicle.png");

  await page.goto('http://localhost:3000/partner/onboarding/documents');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(imagesDir, 'partner_onboarding_documents.png') });
  console.log("Captured images/partner_onboarding_documents.png");

  await page.goto('http://localhost:3000/partner/onboarding/bank');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(imagesDir, 'partner_onboarding_bank.png') });
  console.log("Captured images/partner_onboarding_bank.png");

  // 4. Capture Video KYC page
  console.log("Step 4: Navigating to Video KYC page...");
  await page.goto('http://localhost:3000/video-kyc/room-test');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(imagesDir, 'video-kyc_room-test.png') });
  console.log("Captured images/video-kyc_room-test.png");

  // 5. Create a Booking Flow (as user)
  console.log("Step 5: Starting booking flow...");
  await page.goto('http://localhost:3000/user/book', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Fill booking form
  console.log("Selecting Car with retry verification...");
  let selected = false;
  for (let i = 0; i < 6; i++) {
    await page.click('text=Comfort rides', { force: true });
    await page.waitForTimeout(1000);
    // Find the Car card container and check if it has the active class (which has bg-zinc-900)
    const classAttr = await page.locator('div:has-text("Comfort rides")').first().evaluate(el => el.className);
    if (classAttr && classAttr.includes('bg-zinc-900')) {
      selected = true;
      console.log("Car selected successfully!");
      break;
    }
    console.log(`Car selection attempt ${i+1} failed, retrying...`);
  }
  
  await page.screenshot({ path: path.join(imagesDir, 'user_book.png') });
  console.log("Captured images/user_book.png");

  console.log("Filling mobile and route...");
  await page.fill('input[placeholder="Enter your mobile number"]', '9999999999');
  
  // Fill pickup and wait for suggestions
  await page.fill('input[placeholder="Pickup location"]', 'Con');
  await page.waitForTimeout(2000);
  await page.click('text=Connaught Place', { force: true });
  
  // Fill drop and wait for suggestions
  await page.fill('input[placeholder="Drop Location"]', 'Ind');
  await page.waitForTimeout(2000);
  await page.click('text=India Gate', { force: true });

  await page.waitForTimeout(2000);
  console.log("Clicking Continue...");
  await page.click('button:has-text("Continue")', { force: true });

  // 6. User Search Page
  console.log("Navigating to Search page...");
  await page.waitForTimeout(6000); // Wait extra for maps & network
  await page.screenshot({ path: path.join(imagesDir, 'user_search.png') });
  console.log("Captured images/user_search.png");

  // Click Book button of the available car
  console.log("Clicking Book button...");
  await page.click('button:has-text("Book")', { force: true });
  await page.waitForTimeout(4000);

  // 7. User Checkout Page
  console.log("Navigating to Checkout page...");
  await page.screenshot({ path: path.join(imagesDir, 'user_checkout.png') });
  console.log("Captured images/user_checkout.png");

  // Request the ride
  console.log("Requesting ride...");
  await page.click('button:has-text("Request Ride")', { force: true });
  await page.waitForTimeout(3000);

  // Programmatically accept the booking so the checkout page proceeds
  console.log("Accepting booking programmatically via Mongo and API...");
  const latestBooking = await mongoose.connection.db.collection('bookings')
    .find()
    .sort({ createdAt: -1 })
    .limit(1)
    .next();

  if (latestBooking) {
    const bookingId = String(latestBooking._id);
    console.log(`Latest booking ID: ${bookingId}. Triggering accept GET API...`);
    await page.evaluate(async (id) => {
      await fetch(`/api/partner/bookings/${id}/accept`);
    }, bookingId);

    console.log("Waiting for checkout page to react to accept-booking socket event...");
    await page.waitForTimeout(5000);

    // Now on "payment" screen
    console.log("Selecting Cash Payment option and confirming...");
    await page.click('text=Cash', { force: true });
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Confirm Cash Ride")', { force: true });
    await page.waitForTimeout(5000);
  } else {
    console.warn("Could not find latest booking in MongoDB!");
  }

  // 8. Capture User Bookings Page
  console.log("Step 8: Navigating to User Bookings history...");
  await page.goto('http://localhost:3000/user/bookings');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(imagesDir, 'user_bookings.png') });
  console.log("Captured images/user_bookings.png");

  // 9. Elevated Aman to Partner Live dashboard
  console.log("Step 9: Elevating Aman to LIVE partner...");
  await mongoose.connection.db.collection('users').updateOne(
    { email: 'Amanv2225@gmail.com' },
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
  const partnerId = (await mongoose.connection.db.collection('users').findOne({ email: 'Amanv2225@gmail.com' }))._id;
  await mongoose.connection.db.collection('partnerdocs').updateOne(
    { owner: partnerId },
    {
      $set: {
        owner: partnerId,
        aadharUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
        rcUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
        licenseUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  await mongoose.connection.db.collection('partnerbanks').updateOne(
    { owner: partnerId },
    {
      $set: {
        owner: partnerId,
        accountHolder: 'Aman',
        accountNumber: '1234567890',
        ifsc: 'SBI0001234',
        upi: 'aman@upi',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log("Aman database record updated to live partner.");

  // Reload page and navigate to partner dashboard
  console.log("Navigating to Partner dashboards...");
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(4000);

  await page.goto('http://localhost:3000/partner/pending-requests');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(imagesDir, 'partner_pending-requests.png') });
  console.log("Captured images/partner_pending-requests.png");

  await page.goto('http://localhost:3000/partner/bookings');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(imagesDir, 'partner_bookings.png') });
  console.log("Captured images/partner_bookings.png");

  await page.goto('http://localhost:3000/partner/active-ride');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(imagesDir, 'partner_active-ride.png') });
  console.log("Captured images/partner_active-ride.png");

  console.log("Closing browser and mongoose connection...");
  await browser.close();
  await mongoose.disconnect();
  console.log("Screenshots capture process complete!");
  process.exit(0);
}

run().catch(err => {
  console.error("Error executing screenshots capture script:", err);
  process.exit(1);
});
