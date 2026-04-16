    // clinic-backend/scripts/get-firebase-id-token.js
    const { initializeApp } = require('firebase/app');
    const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
    const dotenv = require('dotenv');

    dotenv.config({ path: '../.env' }); // Load .env file from parent directory

    // Your Firebase client-side configuration (from Firebase project settings -> Web app -> Firebase SDK snippet)
    // IMPORTANT: Replace ALL these placeholder values with your actual Firebase web app configuration
    const firebaseConfig = {
        apiKey: "AIzaSyAAsm8Puc4Kmg8a5geuejpWxU4oeF_x9FU",
        authDomain: "maa-ce612.firebaseapp.com",
        projectId: "maa-ce612",
        storageBucket: "maa-ce612.firebasestorage.app",
        messagingSenderId: "81941170026",
        appId: "1:81941170026:web:9994bab814522e79934713",
        measurementId: "G-6M230KLBNB"
      };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const testEmail = 'your.registered.clinic@example.com'; // IMPORTANT: Use an email you will register below
    const testPassword = 'yourSecurePassword!'; // IMPORTANT: Use the password for that email

    async function getFirebaseIdToken() {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        const user = userCredential.user;
        const idToken = await user.getIdToken();
        console.log('Successfully obtained Firebase ID Token:');
        console.log(idToken);
        return idToken;
      } catch (error) {
        console.error('Error getting Firebase ID Token:', error.message);
        throw error;
      }
    }

    getFirebaseIdToken();