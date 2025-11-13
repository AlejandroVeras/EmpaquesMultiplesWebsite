// Gestión de Vacantes - Empaques Múltiples
// Contraseña por defecto: RRHH2025 (debe cambiarse en producción)

const ADMIN_PASSWORD = 'RRHH2025'; // Cambiar esta contraseña en producción
const VACANTES_STORAGE_KEY = 'empaques_vacantes';
const ADMIN_SESSION_KEY = 'admin_session';

// Estructura de una vacante
// {
//   id: timestamp,
//   titulo: string,
//   departamento: string,
//   descripcion: string,
//   requisitos: string,
//   ubicacion: string,
//   tipo: string,
//   estado: 'activa' | 'cerrada',
//   fechaCreacion: timestamp,
//   fechaActualizacion: timestamp
// }

// Inicializar vacantes por defecto si no existen
function initializeVacantes() {
    const vacantes = getVacantes();
    if (vacantes.length === 0) {
        const vacantesDefault = [
            {
                id: Date.now(),
                titulo: 'Operario de Producción',
                departamento: 'Producción',
                descripcion: 'Buscamos operario para nuestra línea de producción. Responsable de operar maquinaria y asegurar la calidad de los productos.',
                requisitos: '• Experiencia previa en producción\n• Disponibilidad para turnos\n• Educación secundaria completa\n• Capacidad de trabajo en equipo',
                ubicacion: 'Santo Domingo Este',
                tipo: 'Tiempo Completo',
                estado: 'activa',
                fechaCreacion: Date.now(),
                fechaActualizacion: Date.now()
            }
        ];
        saveVacantes(vacantesDefault);
    }
}

// Obtener vacantes del localStorage
function getVacantes() {
    try {
        const vacantes = localStorage.getItem(VACANTES_STORAGE_KEY);
        return vacantes ? JSON.parse(vacantes) : [];
    } catch (e) {
        console.error('Error al obtener vacantes:', e);
        return [];
    }
}

// Guardar vacantes en localStorage
function saveVacantes(vacantes) {
    try {
        localStorage.setItem(VACANTES_STORAGE_KEY, JSON.stringify(vacantes));
    } catch (e) {
        console.error('Error al guardar vacantes:', e);
        alert('Error al guardar las vacantes. Verifica que el navegador permita el almacenamiento local.');
    }
}

// Mostrar vacantes en la página
function renderVacantes() {
    const vacantes = getVacantes();
    const vacantesActivas = vacantes.filter(v => v.estado === 'activa');
    const container = document.getElementById('vacantesContainer');
    const noVacantes = document.getElementById('noVacantes');
    const puestoSelect = document.getElementById('puestoSelect');

    // Limpiar contenedor
    container.innerHTML = '';
    
    // Actualizar select del formulario
    if (puestoSelect) {
        puestoSelect.innerHTML = '<option value="">Seleccione un puesto...</option>';
        vacantesActivas.forEach(vacante => {
            const option = document.createElement('option');
            option.value = vacante.titulo;
            option.textContent = vacante.titulo;
            puestoSelect.appendChild(option);
        });
    }

    if (vacantesActivas.length === 0) {
        noVacantes.style.display = 'block';
        return;
    }

    noVacantes.style.display = 'none';

    vacantesActivas.forEach(vacante => {
        const vacanteCard = createVacanteCard(vacante);
        container.appendChild(vacanteCard);
    });
}

// Crear tarjeta de vacante
function createVacanteCard(vacante) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';

    const card = document.createElement('div');
    card.className = 'vacante-card';
    card.setAttribute('data-id', vacante.id);

    const requisitosHTML = vacante.requisitos.split('\n').map(req => req.trim()).filter(req => req).map(req => {
        return `<li>${req.replace(/^•\s*/, '')}</li>`;
    }).join('');

    card.innerHTML = `
        <div class="vacante-card-header">
            <h3>${escapeHtml(vacante.titulo)}</h3>
            <span class="vacante-badge">${vacante.estado === 'activa' ? 'Disponible' : 'Cerrada'}</span>
        </div>
        <div class="vacante-card-body">
            <div class="vacante-info">
                <p><i class="fas fa-building"></i> <strong>Departamento:</strong> ${escapeHtml(vacante.departamento)}</p>
                <p><i class="fas fa-map-marker-alt"></i> <strong>Ubicación:</strong> ${escapeHtml(vacante.ubicacion)}</p>
                <p><i class="fas fa-clock"></i> <strong>Tipo:</strong> ${escapeHtml(vacante.tipo)}</p>
            </div>
            <div class="vacante-descripcion">
                <p>${escapeHtml(vacante.descripcion)}</p>
            </div>
            <div class="vacante-requisitos">
                <h4>Requisitos:</h4>
                <ul>${requisitosHTML}</ul>
            </div>
        </div>
        <div class="vacante-card-footer">
            <a href="#empleo" class="btn-aplicar">Aplicar Ahora</a>
        </div>
    `;

    // Scroll suave al formulario cuando se hace clic en "Aplicar Ahora"
    const aplicarBtn = card.querySelector('.btn-aplicar');
    aplicarBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // Seleccionar la vacante en el formulario
        if (puestoSelect) {
            puestoSelect.value = vacante.titulo;
        }
        // Scroll al formulario
        const empleoSection = document.getElementById('empleo');
        if (empleoSection) {
            empleoSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    col.appendChild(card);
    return col;
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

// Nota: Las funciones de administración se han movido a vacantes-admin.js
// Este archivo solo maneja la visualización pública de vacantes

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeVacantes();
    renderVacantes();
});

