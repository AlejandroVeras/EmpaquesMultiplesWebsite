// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcwkUmqaiguV2MoEPsz8HSWUD9uzTIS-w",
  authDomain: "empaques-multiples-almuerzo.firebaseapp.com",
  databaseURL: "https://empaques-multiples-almuerzo-default-rtdb.firebaseio.com",
  projectId: "empaques-multiples-almuerzo",
  storageBucket: "empaques-multiples-almuerzo.firebasestorage.app",
  messagingSenderId: "687266639137",
  appId: "1:687266639137:web:084e8cbe40bb2e001a2260",
  measurementId: "G-2NRREN25E3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Referencias a servicios de Firebase
const auth = firebase.auth();
const database = firebase.database();

// Email del administrador
const ADMIN_EMAIL = "soporte.it.casaempaques@gmail.com";
