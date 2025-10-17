// auth.js - Sistema personalizado de autenticación

// Traer servicios expuestos por firebase-config.js
if (!window.db || !window.auth) {
    console.error('Firebase no está inicializado. Asegúrate de que js/firebase-config.js se cargue antes de js/auth.js');
}
const db = window.db;
const auth = window.auth;

// Variables globales
let currentUser = null;

// Función para iniciar sesión
function login(username, password) {
    // Normalizar el nombre de usuario (convertir a minúsculas)
    username = username.toLowerCase();
    
    // Buscar usuario en Firestore
    return db.collection('usuarios')
        .where('username', '==', username)
        .limit(1)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                throw new Error('user-not-found');
            }
            
            // Obtener documento del usuario
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            
            // Verificar contraseña
            if (!bcrypt.compareSync(password, userData.passwordHash)) {
                throw new Error('wrong-password');
            }
            
            // Actualizar último login
            db.collection('usuarios').doc(userDoc.id).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Guardar información del usuario en localStorage para mantener sesión
            const sessionUser = {
                id: userDoc.id,
                username: userData.username,
                displayName: userData.displayName,
                role: userData.role,
                timestamp: new Date().getTime()
            };
            
            localStorage.setItem('user', JSON.stringify(sessionUser));
            currentUser = sessionUser;
            
            // Redirigir según el rol
            if (userData.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'usuario.html';
            }
            
            return sessionUser;
        });
}

// ... resto del archivo sin cambios