// auth.js - Manejo de autenticación

// Construir email sintético a partir de un nombre de usuario
function construirEmailDesdeUsuario(username) {
    const limpio = String(username || '').trim().toLowerCase();
    if (!limpio) return '';
    if (limpio.includes('@')) return limpio; // ya es un email
    return `${limpio}@empaques.local`;
}

// Función para iniciar sesión con usuario o correo
function login(identifier, password) {
    const emailParaLogin = construirEmailDesdeUsuario(identifier);
    return auth.signInWithEmailAndPassword(emailParaLogin, password)
        .then((userCredential) => userCredential.user)
        .then((user) => getUserRole(user.uid)
            .then((role) => ({ user, role }))
        )
        .then(({ user, role }) => {
            const esAdminPorEmail = (user.email === ADMIN_EMAIL);
            const esAdminPorRol = (role === 'admin');
            if (esAdminPorEmail || esAdminPorRol) {
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
                if (!requireAdmin) {
                    resolve(user);
                    return;
                }
                // Verificar admin por email o rol en DB
                getUserRole(user.uid)
                    .then((role) => {
                        const esAdmin = (user.email === ADMIN_EMAIL) || (role === 'admin');
                        if (!esAdmin) {
                            window.location.href = 'usuario.html';
                            reject('No autorizado');
                        } else {
                            resolve(user);
                        }
                    })
                    .catch(() => {
                        window.location.href = 'usuario.html';
                        reject('No autorizado');
                    });
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
    // Mantener compatibilidad: admin por email
    if (user && user.email === ADMIN_EMAIL) return true;
    return false;
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

// Obtener rol de usuario desde la base de datos
function getUserRole(uid) {
    return database.ref('roles/' + uid)
        .once('value')
        .then((snap) => {
            const rol = snap.val();
            console.log('Rol obtenido para', uid, ':', rol);
            return rol || 'usuario';
        })
        .catch((error) => {
            console.error('Error al obtener rol:', error);
            return 'usuario';
        });
}