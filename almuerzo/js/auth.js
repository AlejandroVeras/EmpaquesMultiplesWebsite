// auth.js - Manejo de autenticación

// Función para iniciar sesión
function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Verificar si es administrador
            if (user.email === ADMIN_EMAIL) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'usuario.html';
            }
        })
        .catch((error) => {
            console.error('Error en login:', error);
            throw error;
        });
}

// Función para cerrar sesión
function logout() {
    return auth.signOut()
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('Error en logout:', error);
        });
}

// Verificar estado de autenticación
function checkAuth(requireAdmin = false) {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                if (requireAdmin && user.email !== ADMIN_EMAIL) {
                    window.location.href = 'usuario.html';
                    reject('No autorizado');
                } else {
                    resolve(user);
                }
            } else {
                window.location.href = 'login.html';
                reject('No autenticado');
            }
        });
    });
}

// Función para obtener el usuario actual
function getCurrentUser() {
    return auth.currentUser;
}

// Función para verificar si el usuario es administrador
function isAdmin(user) {
    return user && user.email === ADMIN_EMAIL;
}

// Función a tu archivo auth.js
function actualizarNombreUsuario(nuevoNombre) {
    return auth.currentUser.updateProfile({
        displayName: nuevoNombre
    }).then(() => {
        console.log("Nombre de usuario actualizado correctamente");
        return nuevoNombre;
    }).catch((error) => {
        console.error("Error al actualizar el nombre:", error);
        throw error;
    });
}


// Función para actualizar el nombre del usuario
function actualizarNombreUsuario(nuevoNombre) {
    return auth.currentUser.updateProfile({
        displayName: nuevoNombre
    }).then(() => {
        console.log("Nombre de usuario actualizado correctamente");
        return nuevoNombre;
    }).catch((error) => {
        console.error("Error al actualizar el nombre:", error);
        throw error;
    });
}