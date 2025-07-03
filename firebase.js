// firebase.js
// Note: These are client-side Firebase config keys that are safe to expose
// For production, consider using environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBWwe0KXoAGrQVnJusIIsrWwvFZFdjip8o",
  authDomain: "catformation-25a9d.firebaseapp.com",
  databaseURL: "https://catformation-25a9d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "catformation-25a9d",
  storageBucket: "catformation-25a9d.appspot.com",
  messagingSenderId: "964464036069",
  appId: "1:964464036069:web:dfd6f3f023c870fbaba2b0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
window.firebaseDB = db; // Make it globally accessible 