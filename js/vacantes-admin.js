// Script específico para la página de administración de vacantes (admin-vacantes.html)

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay sesión activa
    const isLoggedIn = localStorage.getItem('admin_session') === 'true';
    
    if (isLoggedIn) {
        // Si está logueado, mostrar el contenido del admin
        showAdminContent();
    } else {
        // Si no está logueado, mostrar el login
        showAdminLogin();
    }
});

// Mostrar formulario de login
function showAdminLogin() {
    document.getElementById('adminLoginContainer').style.display = 'block';
    document.getElementById('adminContentContainer').style.display = 'none';
}

// Mostrar contenido del admin
function showAdminContent() {
    document.getElementById('adminLoginContainer').style.display = 'none';
    document.getElementById('adminContentContainer').style.display = 'block';
    renderAdminVacantes();
    updateStats();
}

// Login de administrador
function loginAdmin() {
    const password = document.getElementById('adminPassword').value;
    const ADMIN_PASSWORD = 'RRHH2025'; // Debe coincidir con el de vacantes.js
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('admin_session', 'true');
        document.getElementById('adminPassword').value = '';
        showAdminContent();
    } else {
        alert('Contraseña incorrecta');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

// Cerrar sesión
function logoutAdmin() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        localStorage.removeItem('admin_session');
        showAdminLogin();
        alert('Sesión cerrada correctamente');
    }
}

// Renderizar vacantes en el panel de administración
function renderAdminVacantes() {
    const vacantes = getVacantes();
    const container = document.getElementById('adminVacantesList');
    container.innerHTML = '';

    if (vacantes.length === 0) {
        container.innerHTML = '<div class="no-vacantes-admin"><p>No hay vacantes registradas. Agregue una nueva vacante para comenzar.</p></div>';
        return;
    }

    // Ordenar por fecha de actualización (más recientes primero)
    const vacantesOrdenadas = vacantes.sort((a, b) => b.fechaActualizacion - a.fechaActualizacion);

    vacantesOrdenadas.forEach(vacante => {
        const vacanteAdminCard = createAdminVacanteCard(vacante);
        container.appendChild(vacanteAdminCard);
    });
}

// Crear tarjeta de vacante en el panel de admin
function createAdminVacanteCard(vacante) {
    const card = document.createElement('div');
    card.className = 'admin-vacante-card';
    card.setAttribute('data-id', vacante.id);

    const estadoBadge = vacante.estado === 'activa' 
        ? '<span class="badge badge-success">Activa</span>' 
        : '<span class="badge badge-secondary">Cerrada</span>';

    const fechaCreacion = new Date(vacante.fechaCreacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fechaActualizacion = new Date(vacante.fechaActualizacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    card.innerHTML = `
        <div class="admin-vacante-header">
            <div>
                <h4>${escapeHtml(vacante.titulo)}</h4>
                ${estadoBadge}
            </div>
        </div>
        <div class="admin-vacante-info">
            <p><strong>Departamento:</strong> ${escapeHtml(vacante.departamento)}</p>
            <p><strong>Ubicación:</strong> ${escapeHtml(vacante.ubicacion)}</p>
            <p><strong>Tipo:</strong> ${escapeHtml(vacante.tipo)}</p>
            <p><strong>Estado:</strong> ${vacante.estado === 'activa' ? 'Activa (visible públicamente)' : 'Cerrada (no visible)'}</p>
            <p class="fecha-info"><small><i class="fas fa-calendar"></i> Creada: ${fechaCreacion}</small></p>
            ${vacante.fechaActualizacion !== vacante.fechaCreacion ? `<p class="fecha-info"><small><i class="fas fa-edit"></i> Actualizada: ${fechaActualizacion}</small></p>` : ''}
        </div>
        <div class="admin-vacante-actions">
            <button class="btn-edit" onclick="editVacante(${vacante.id})">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn-delete" onclick="deleteVacante(${vacante.id})">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `;

    return card;
}

// Actualizar estadísticas
function updateStats() {
    const vacantes = getVacantes();
    const total = vacantes.length;
    const activas = vacantes.filter(v => v.estado === 'activa').length;
    const cerradas = vacantes.filter(v => v.estado === 'cerrada').length;

    document.getElementById('totalVacantes').textContent = total;
    document.getElementById('vacantesActivas').textContent = activas;
    document.getElementById('vacantesCerradas').textContent = cerradas;
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Función para mostrar el formulario de agregar vacante
function showAddVacanteForm() {
    document.getElementById('modalTitle').textContent = 'Agregar Nueva Vacante';
    document.getElementById('vacanteId').value = '';
    document.getElementById('vacanteForm').reset();
    document.getElementById('vacanteEstado').value = 'activa';
    document.getElementById('vacanteModal').style.display = 'flex';
}

// Función para editar vacante (debe estar disponible globalmente)
window.editVacante = function(id) {
    const vacantes = getVacantes();
    const vacante = vacantes.find(v => v.id === id);
    
    if (!vacante) {
        alert('Vacante no encontrada');
        return;
    }

    document.getElementById('modalTitle').textContent = 'Editar Vacante';
    document.getElementById('vacanteId').value = vacante.id;
    document.getElementById('vacanteTitulo').value = vacante.titulo;
    document.getElementById('vacanteDepartamento').value = vacante.departamento;
    document.getElementById('vacanteDescripcion').value = vacante.descripcion;
    document.getElementById('vacanteRequisitos').value = vacante.requisitos;
    document.getElementById('vacanteUbicacion').value = vacante.ubicacion;
    document.getElementById('vacanteTipo').value = vacante.tipo;
    document.getElementById('vacanteEstado').value = vacante.estado;
    document.getElementById('vacanteModal').style.display = 'flex';
};

// Función para eliminar vacante (debe estar disponible globalmente)
window.deleteVacante = function(id) {
    if (!confirm('¿Está seguro de que desea eliminar esta vacante? Esta acción no se puede deshacer.')) {
        return;
    }

    const vacantes = getVacantes();
    const vacantesFiltradas = vacantes.filter(v => v.id !== id);
    saveVacantes(vacantesFiltradas);
    renderAdminVacantes();
    updateStats();
    alert('Vacante eliminada correctamente');
};

// Función para cerrar modal
window.closeVacanteModal = function() {
    document.getElementById('vacanteModal').style.display = 'none';
    document.getElementById('vacanteForm').reset();
};

// Manejar el formulario de vacante
document.addEventListener('DOMContentLoaded', function() {
    const vacanteForm = document.getElementById('vacanteForm');
    if (vacanteForm) {
        vacanteForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const id = document.getElementById('vacanteId').value;
            const titulo = document.getElementById('vacanteTitulo').value.trim();
            const departamento = document.getElementById('vacanteDepartamento').value.trim();
            const descripcion = document.getElementById('vacanteDescripcion').value.trim();
            const requisitos = document.getElementById('vacanteRequisitos').value.trim();
            const ubicacion = document.getElementById('vacanteUbicacion').value.trim();
            const tipo = document.getElementById('vacanteTipo').value;
            const estado = document.getElementById('vacanteEstado').value;

            if (!titulo || !departamento || !descripcion || !requisitos || !ubicacion || !tipo) {
                alert('Por favor complete todos los campos requeridos');
                return;
            }

            const vacantes = getVacantes();
            let vacante;

            if (id) {
                // Editar vacante existente
                vacante = vacantes.find(v => v.id === parseInt(id));
                if (vacante) {
                    vacante.titulo = titulo;
                    vacante.departamento = departamento;
                    vacante.descripcion = descripcion;
                    vacante.requisitos = requisitos;
                    vacante.ubicacion = ubicacion;
                    vacante.tipo = tipo;
                    vacante.estado = estado;
                    vacante.fechaActualizacion = Date.now();
                }
            } else {
                // Agregar nueva vacante
                vacante = {
                    id: Date.now(),
                    titulo,
                    departamento,
                    descripcion,
                    requisitos,
                    ubicacion,
                    tipo,
                    estado,
                    fechaCreacion: Date.now(),
                    fechaActualizacion: Date.now()
                };
                vacantes.push(vacante);
            }

            saveVacantes(vacantes);
            renderAdminVacantes();
            updateStats();
            closeVacanteModal();
            alert(id ? 'Vacante actualizada correctamente' : 'Vacante agregada correctamente');
        });
    }

    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('vacanteModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeVacanteModal();
            }
        });
    }

    // Permitir cerrar modal con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('vacanteModal');
            if (modal && modal.style.display !== 'none') {
                closeVacanteModal();
            }
        }
    });
});

