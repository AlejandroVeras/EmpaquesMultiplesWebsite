// firebase-config.js
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

// Inicializar Firebase una sola vez (guard)
if (!window.firebase) {
  console.error("Firebase SDK no encontrado. Asegúrate de incluir los scripts de firebase antes de este archivo.");
} else {
  // Si no hay apps inicializadas, inicializamos; si ya existe, reusamos
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  } else {
    firebase.app(); // reusar la app existente
  }

  // Exponer servicios en el objeto window para que otros scripts los usen
  // (let/const no crean propiedades en window)
  window.auth = window.auth || firebase.auth();
  window.db = window.db || firebase.firestore();
  window.ADMIN_EMAIL = "soporte.it.casaempaques@gmail.com";

  console.log("Firebase configurado correctamente (compat).");

  // Verificar y crear usuario administrador por defecto
  function verificarYCrearAdmin() {
    console.log("Verificando usuario administrador...");

    window.db.collection('usuarios')
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
          return window.db.collection('usuarios').add({
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
}