// firebase-config.js
// ELIMINAR estas líneas que causan el error:
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

// Configuración de Firebase
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
const db = firebase.firestore();

// Email del administrador
const ADMIN_EMAIL = "soporte.it.casaempaques@gmail.com";

console.log("Firebase configurado correctamente");

// Verificar y crear usuario administrador por defecto
function verificarYCrearAdmin() {
    console.log("Verificando usuario administrador...");
    
    db.collection('usuarios')
        .where('username', '==', 'admin')
        .limit(1)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log("No existe usuario administrador. Creando uno por defecto...");
                
                // Generar hash para la contraseña "admin123"
                const salt = bcrypt.genSaltSync(10);
                const passwordHash = bcrypt.hashSync("admin123", salt);
                
                // Crear usuario administrador
                return db.collection('usuarios').add({
                    username: "admin",
                    passwordHash: passwordHash,
                    displayName: "Administrador",
                    role: "admin",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: null
                });
            } else {
                console.log("Usuario administrador ya existe.");
                return null;
            }
        })
        .then(docRef => {
            if (docRef) {
                console.log("Usuario administrador creado con ID:", docRef.id);
                alert("¡Sistema inicializado! Se ha creado un usuario administrador:\n\nUsuario: admin\nContraseña: admin123\n\nCambia esta contraseña después de iniciar sesión.");
            }
        })
        .catch(error => {
            console.error("Error al verificar/crear usuario administrador:", error);
        });
}

// Llamar a la función después de inicializar Firebase
verificarYCrearAdmin();