// EJEMPLO DE CONFIGURACIÓN DE FIREBASE
// Este archivo muestra cómo debe lucir firebase-config.js después de configurar Firebase

// Configuración de Firebase
const firebaseConfig = {
    // Obtén estos valores de Firebase Console > Configuración del Proyecto > Tus Aplicaciones
    apiKey: "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567",
    authDomain: "empaques-multiples-almuerzo.firebaseapp.com",
    projectId: "empaques-multiples-almuerzo",
    storageBucket: "empaques-multiples-almuerzo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:1a2b3c4d5e6f7g8h9i0j1k",
    databaseURL: "https://empaques-multiples-almuerzo-default-rtdb.firebaseio.com"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a servicios de Firebase
const auth = firebase.auth();
const database = firebase.database();

// Email del administrador
// IMPORTANTE: Cambia esto por el email real del administrador
const ADMIN_EMAIL = "admin@casaempaques.com";
