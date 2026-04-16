const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupEnvironment() {
  try {
    // Check if firebase-service-account.json exists
    const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('Error: firebase-service-account.json not found!');
      console.log('Please download it from Firebase Console and place it in the project root.');
      process.exit(1);
    }

    // Read the Firebase service account JSON file
    const serviceAccount = require(serviceAccountPath);

    // Prompt for Supabase connection string
    const databaseUrl = await prompt('Enter your Supabase connection string: ');

    // Create .env file content
    const envContent = `
# Database Configuration
DATABASE_URL=${databaseUrl}

# Firebase Configuration
FIREBASE_PROJECT_ID=${serviceAccount.project_id}
FIREBASE_PRIVATE_KEY="${serviceAccount.private_key}"
FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}
`;

    // Write to .env file
    const envPath = path.join(__dirname, '../.env');
    fs.writeFileSync(envPath, envContent);

    console.log('\nEnvironment variables have been set up successfully!');
    console.log('.env file has been created with the following variables:');
    console.log('- DATABASE_URL');
    console.log('- FIREBASE_PROJECT_ID');
    console.log('- FIREBASE_PRIVATE_KEY');
    console.log('- FIREBASE_CLIENT_EMAIL');

  } catch (error) {
    console.error('Error setting up environment variables:', error);
  } finally {
    rl.close();
  }
}

setupEnvironment();