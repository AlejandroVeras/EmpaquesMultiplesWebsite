// createAdmin.js - Script para crear el primer usuario administrador

// Estos valores serán proporcionados por ti manualmente
const adminUsername = 'admin';
const adminPassword = 'contraseña_segura'; // Cambia esto
const adminDisplayName = 'Administrador';

// Verificar si ya existe un admin
db.collection('usuarios')
    .where('role', '==', 'admin')
    .get()
    .then((querySnapshot) => {
        if (!querySnapshot.empty) {
            console.log('Ya existe un usuario administrador');
            return;
        }
        
        // Verificar si el nombre de usuario está disponible
        return db.collection('usuarios')
            .where('username', '==', adminUsername)
            .get();
    })
    .then((querySnapshot) => {
        if (querySnapshot && !querySnapshot.empty) {
            console.log('El nombre de usuario ya está en uso');
            return;
        }
        
        // Crear el hash de la contraseña
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(adminPassword, salt);
        
        // Crear usuario administrador
        return db.collection('usuarios').add({
            username: adminUsername,
            passwordHash: passwordHash,
            displayName: adminDisplayName,
            role: 'admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: null
        });
    })
    .then(() => {
        console.log('Usuario administrador creado exitosamente');
    })
    .catch((error) => {
        console.error('Error al crear usuario administrador:', error);
    });