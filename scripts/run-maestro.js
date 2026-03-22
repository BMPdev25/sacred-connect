const axios = require('axios');
const { execSync } = require('child_process');

const TEST_API_URL = 'http://localhost:5000/api/test';
const targetFlow = process.argv[2];

if (!targetFlow) {
  console.error('❌ Please specify a Maestro YAML file \nUsage: node scripts/run-maestro.js <filename.yaml>');
  process.exit(1);
}

// Map the specific yaml test file to the necessary backend state required to run it
let bookingStatus = 'pending';
let paymentStatus = 'pending';

if (targetFlow.includes('payment')) {
  bookingStatus = 'confirmed';
} else if (targetFlow.includes('cancellation')) {
  bookingStatus = 'confirmed';
} else if (targetFlow.includes('completion')) {
  bookingStatus = 'confirmed'; // Confirmed booking needed for Priest to mark it completed
} else if (targetFlow.includes('rating')) {
  bookingStatus = 'completed';
}

async function runTeardown() {
  console.log('🧹 Tearing down previous test data on backend...');
  try {
    await axios.post(`${TEST_API_URL}/teardown`);
  } catch (e) {
    console.error('Teardown failed (Ensure backend is running):', e.message);
  }
}

async function runSeed() {
  console.log(`🌱 Seeding initial database state (Booking Status: ${bookingStatus})...`);
  try {
    const res = await axios.post(`${TEST_API_URL}/seed/booking`, {
      bookingStatus,
      paymentStatus
    });
    console.log('✅ Seed successful. Booking ID:', res.data.data.booking.id);
  } catch (e) {
    console.error('❌ Seeding failed:', e.message);
    process.exit(1);
  }
}

async function main() {
  // Always start with a clean DB
  await runTeardown();
  
  // The 'success' flow creates a booking from scratch, so we only need to seed for the others
  if (!targetFlow.includes('booking-success')) {
    await runSeed();
  }

  let testFailed = false;

  try {
    console.log(`\n📱 Triggering Maestro Test: ${targetFlow}\n`);
    // Run the native mobile E2E test via shell execution
    execSync(`maestro test .maestro/${targetFlow}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Maestro test encountered an error or assertion failure.');
    testFailed = true;
  } finally {
    // Ensure we ALWAYS clean up the database even if the test hard-failed
    await runTeardown();
    if (testFailed) {
      process.exit(1);
    }
  }
}

main();
