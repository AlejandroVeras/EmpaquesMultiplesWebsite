// Firebase Configuration
// IMPORTANTE: Reemplazar estos valores con las credenciales reales de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID",
    databaseURL: "TU_DATABASE_URL"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a servicios de Firebase
const auth = firebase.auth();
const database = firebase.database();

// Email del administrador
const ADMIN_EMAIL = "admin@casaempaques.com";
