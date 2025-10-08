// firebase-config.js
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

// Inicializar Firebase usando la API de compatibilidad
firebase.initializeApp(firebaseConfig);

// Referencias a servicios de Firebase
const auth = firebase.auth();
const database = firebase.database();

// Email del administrador
const ADMIN_EMAIL = "soporte.it.casaempaques@gmail.com";