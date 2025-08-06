const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      
      console.log('Firebase Admin SDK initialized successfully');
    }
    
    return admin;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

// Verify Firebase ID Token
const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid token');
  }
};

// Create Firebase user
const createFirebaseUser = async (email, password, displayName) => {
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false,
    });
    
    console.log('Successfully created new user:', userRecord.uid);
    return userRecord;
  } catch (error) {
    console.error('Error creating new user:', error);
    throw error;
  }
};

// Update Firebase user
const updateFirebaseUser = async (uid, updateParams) => {
  try {
    const userRecord = await admin.auth().updateUser(uid, updateParams);
    console.log('Successfully updated user:', userRecord.uid);
    return userRecord;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete Firebase user
const deleteFirebaseUser = async (uid) => {
  try {
    await admin.auth().deleteUser(uid);
    console.log('Successfully deleted user:', uid);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Generate password reset link
const generatePasswordResetLink = async (email) => {
  try {
    const link = await admin.auth().generatePasswordResetLink(email);
    return link;
  } catch (error) {
    console.error('Error generating password reset link:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  verifyFirebaseToken,
  createFirebaseUser,
  updateFirebaseUser,
  deleteFirebaseUser,
  generatePasswordResetLink,
  admin,
};
