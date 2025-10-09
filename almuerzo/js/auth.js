// auth.js - Sistema personalizado de autenticación

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

// Función para registrar un nuevo usuario
function registerUser(username, password, displayName, role = 'user') {
    // Normalizar el nombre de usuario
    username = username.toLowerCase();
    
    // Verificar si el usuario ya existe
    return db.collection('usuarios')
        .where('username', '==', username)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                throw new Error('username-exists');
            }
            
            // Generar hash de la contraseña
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(password, salt);
            
            // Crear nuevo usuario en Firestore
            return db.collection('usuarios').add({
                username: username,
                passwordHash: passwordHash,
                displayName: displayName,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: null
            });
        });
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('user');
    currentUser = null;
    window.location.href = 'login.html';
}

// Verificar estado de autenticación
function checkAuth(requireAdmin = false) {
    return new Promise((resolve, reject) => {
        // Intentar obtener el usuario del localStorage
        const userJson = localStorage.getItem('user');
        
        if (!userJson) {
            window.location.href = 'login.html';
            reject('No autenticado');
            return;
        }
        
        try {
            const user = JSON.parse(userJson);
            
            // Verificar tiempo de expiración (opcional: 8 horas)
            const maxSessionTime = 8 * 60 * 60 * 1000; // 8 horas en milisegundos
            if ((new Date().getTime() - user.timestamp) > maxSessionTime) {
                localStorage.removeItem('user');
                window.location.href = 'login.html?expired=1';
                reject('Sesión expirada');
                return;
            }
            
            // Verificar permisos de administrador si es necesario
            if (requireAdmin && user.role !== 'admin') {
                window.location.href = 'usuario.html';
                reject('No autorizado');
                return;
            }
            
            // Actualizar variable global de usuario actual
            currentUser = user;
            
            // Verificar que el usuario todavía existe en la base de datos
            db.collection('usuarios').doc(user.id).get()
                .then((doc) => {
                    if (!doc.exists) {
                        // El usuario ha sido eliminado de la base de datos
                        localStorage.removeItem('user');
                        window.location.href = 'login.html?deleted=1';
                        reject('Usuario no encontrado');
                    } else {
                        // Actualizar información de sesión con datos más recientes
                        const userData = doc.data();
                        const updatedUser = {
                            ...user,
                            displayName: userData.displayName,
                            role: userData.role,
                            // Actualizar timestamp para extender la sesión
                            timestamp: new Date().getTime()
                        };
                        
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        currentUser = updatedUser;
                        resolve(updatedUser);
                    }
                })
                .catch((error) => {
                    console.error('Error verificando usuario:', error);
                    reject(error);
                });
        } catch (e) {
            console.error('Error al parsear usuario de localStorage:', e);
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            reject('Error de sesión');
        }
    });
}

// Función para obtener el usuario actual
function getCurrentUser() {
    if (currentUser) {
        return currentUser;
    }
    
    const userJson = localStorage.getItem('user');
    if (userJson) {
        currentUser = JSON.parse(userJson);
        return currentUser;
    }
    
    return null;
}

// Función para actualizar el nombre de usuario
function actualizarNombreUsuario(nuevoNombre) {
    const user = getCurrentUser();
    if (!user) {
        return Promise.reject(new Error('No autenticado'));
    }
    
    // Actualizar en Firestore
    return db.collection('usuarios').doc(user.id).update({
        displayName: nuevoNombre
    })
    .then(() => {
        // Actualizar en localStorage
        user.displayName = nuevoNombre;
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log("Nombre de usuario actualizado correctamente");
        return nuevoNombre;
    })
    .catch((error) => {
        console.error("Error al actualizar el nombre:", error);
        throw error;
    });
}

// Función para cambiar contraseña
function cambiarPassword(passwordActual, passwordNueva) {
    const user = getCurrentUser();
    if (!user) {
        return Promise.reject(new Error('No autenticado'));
    }
    
    // Verificar contraseña actual
    return db.collection('usuarios').doc(user.id).get()
        .then((doc) => {
            if (!doc.exists) {
                throw new Error('user-not-found');
            }
            
            const userData = doc.data();
            
            // Verificar que la contraseña actual sea correcta
            if (!bcrypt.compareSync(passwordActual, userData.passwordHash)) {
                throw new Error('wrong-password');
            }
            
            // Generar nuevo hash
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(passwordNueva, salt);
            
            // Actualizar contraseña
            return db.collection('usuarios').doc(user.id).update({
                passwordHash: passwordHash
            });
        });
}

// Función para verificar si el usuario es administrador
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}