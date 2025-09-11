// Registro de Almuerzo - Empaques Múltiples (Demo Version)
// JavaScript Module with Mock Supabase

class MockSupabase {
  constructor() {
    this.data = {
      empleados: [
        { id: 1, usuario: 'admin', password_hash: '$2b$10$example', nombre: 'Administrador Test' },
        { id: 2, usuario: 'test', password_hash: '$2b$10$example2', nombre: 'Usuario Test' }
      ],
      almuerzos: []
    };
  }

  from(table) {
    return new MockTable(this.data, table);
  }
}

class MockTable {
  constructor(data, tableName) {
    this.data = data;
    this.tableName = tableName;
    this.query = {};
  }

  select(columns) {
    this.query.select = columns;
    return this;
  }

  eq(column, value) {
    this.query.eq = { column, value };
    return this;
  }

  gte(column, value) {
    this.query.gte = { column, value };
    return this;
  }

  order(column, options) {
    this.query.order = { column, options };
    return this;
  }

  async insert(records) {
    const table = this.data[this.tableName];
    records.forEach(record => {
      record.id = table.length + 1;
      table.push(record);
    });
    return { data: records, error: null };
  }

  then(resolve) {
    const table = this.data[this.tableName];
    let results = [...table];

    if (this.query.eq) {
      results = results.filter(item => item[this.query.eq.column] === this.query.eq.value);
    }

    if (this.query.gte) {
      results = results.filter(item => item[this.query.gte.column] >= this.query.gte.value);
    }

    if (this.query.order) {
      const { column, options } = this.query.order;
      results.sort((a, b) => {
        if (options?.ascending === false) {
          return b[column] > a[column] ? 1 : -1;
        }
        return a[column] > b[column] ? 1 : -1;
      });
    }

    resolve({ data: results, error: null });
    return this;
  }
}

// Mock bcrypt
const mockBcrypt = {
  compareSync: (password, hash) => {
    // Simple mock - in real app this would check actual hash
    return password === 'test123' || password === 'admin123';
  },
  hashSync: (password, rounds) => {
    return `$2b$${rounds}$mock_hash_${password}`;
  }
};

// Make mock available globally
window.supabase = {
  createClient: () => new MockSupabase()
};
window.bcrypt = mockBcrypt;

class AlmuerzoApp {
  constructor() {
    this.initializeSupabase();
    this.initializeVariables();
    this.initializeEventListeners();
    this.loadFromLocalStorage();
    this.initializeDepartments();
  }

  initializeSupabase() {
    this.client = new MockSupabase();
  }

  initializeVariables() {
    // Estado de sesión
    this.empleadoActual = null;
    this.localRecords = [];

    // Elementos DOM
    this.authDiv = document.getElementById('auth');
    this.mainDiv = document.getElementById('main');
    this.loginBtn = document.getElementById('login');
    this.registerBtn = document.getElementById('register');
    this.logoutBtn = document.querySelector('.logout');
    this.usuarioInput = document.getElementById('usuario');
    this.passInput = document.getElementById('password');
    this.authError = document.getElementById('auth-error');
    this.bienvenidaDiv = document.getElementById('bienvenida');
    this.form = document.getElementById('almuerzo-form');
    this.nombreInput = document.getElementById('nombre');
    this.horaInput = document.getElementById('hora');
    this.departamentoSelect = document.getElementById('departamento');
    this.comentariosTextarea = document.getElementById('comentarios');
    this.formError = document.getElementById('form-error');
    this.formSuccess = document.getElementById('form-success');
    this.recordsTableBody = document.getElementById('records-table-body');
    this.searchInput = document.getElementById('search');
    this.filterDate = document.getElementById('filter-date');
    this.filterDepartment = document.getElementById('filter-department');
    this.exportBtn = document.getElementById('export-csv');
    this.clearFiltersBtn = document.getElementById('clear-filters');
    this.loadingOverlay = document.getElementById('loading-overlay');

    // Stats elements
    this.totalRecordsSpan = document.getElementById('total-records');
    this.thisMonthSpan = document.getElementById('this-month');
    this.thisWeekSpan = document.getElementById('this-week');

    // Departamentos predefinidos
    this.departamentos = [
      'Administración',
      'Producción',
      'Calidad',
      'Ventas',
      'Recursos Humanos',
      'Mantenimiento',
      'Logística',
      'Contabilidad'
    ];

    // Lista de empleados validados (se puede expandir)
    this.empleadosValidados = [
      'Juan Pérez',
      'María García',
      'Carlos López',
      'Ana Martínez',
      'Luis Rodríguez',
      'Carmen Díaz',
      'José Hernández',
      'Laura Sánchez'
    ];
  }

  initializeDepartments() {
    if (!this.departamentoSelect) return;
    
    this.departamentos.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept;
      option.textContent = dept;
      this.departamentoSelect.appendChild(option);
      
      // También agregar al filtro
      if (this.filterDepartment) {
        const filterOption = document.createElement('option');
        filterOption.value = dept;
        filterOption.textContent = dept;
        this.filterDepartment.appendChild(filterOption);
      }
    });
  }

  initializeEventListeners() {
    if (this.loginBtn) this.loginBtn.onclick = () => this.handleLogin();
    if (this.registerBtn) this.registerBtn.onclick = () => this.handleRegister();
    if (this.logoutBtn) this.logoutBtn.onclick = () => this.handleLogout();
    if (this.form) this.form.onsubmit = (e) => this.handleSubmitLunch(e);
    if (this.exportBtn) this.exportBtn.onclick = () => this.exportToCSV();
    if (this.clearFiltersBtn) this.clearFiltersBtn.onclick = () => this.clearFilters();
    
    // Filtros en tiempo real
    if (this.searchInput) this.searchInput.oninput = () => this.applyFilters();
    if (this.filterDate) this.filterDate.onchange = () => this.applyFilters();
    if (this.filterDepartment) this.filterDepartment.onchange = () => this.applyFilters();

    // Validación en tiempo real
    if (this.nombreInput) this.nombreInput.oninput = () => this.validateName();
    if (this.horaInput) this.horaInput.onchange = () => this.validateTime();

    // Auto-save en local storage
    if (this.nombreInput) this.nombreInput.oninput = () => this.saveToLocalStorage();
    if (this.horaInput) this.horaInput.onchange = () => this.saveToLocalStorage();
    if (this.departamentoSelect) this.departamentoSelect.onchange = () => this.saveToLocalStorage();
    if (this.comentariosTextarea) this.comentariosTextarea.oninput = () => this.saveToLocalStorage();
  }

  // Utilidades de fecha
  hoyISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  fechaNDiasAtras(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  formatearFecha(fecha) {
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getCurrentTime() {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  }

  // Manejo de loading
  showLoading() {
    if (this.loadingOverlay) this.loadingOverlay.classList.remove('hidden');
  }

  hideLoading() {
    if (this.loadingOverlay) this.loadingOverlay.classList.add('hidden');
  }

  // Sistema de notificaciones
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Local Storage
  saveToLocalStorage() {
    if (!this.nombreInput) return;
    
    const formData = {
      nombre: this.nombreInput.value || '',
      hora: this.horaInput?.value || '',
      departamento: this.departamentoSelect?.value || '',
      comentarios: this.comentariosTextarea?.value || '',
      timestamp: Date.now()
    };
    localStorage.setItem('almuerzo_draft', JSON.stringify(formData));
  }

  loadFromLocalStorage() {
    const draft = localStorage.getItem('almuerzo_draft');
    if (draft && this.nombreInput) {
      try {
        const data = JSON.parse(draft);
        // Solo cargar si es del mismo día
        const today = new Date().toDateString();
        const draftDate = new Date(data.timestamp).toDateString();
        
        if (today === draftDate) {
          this.nombreInput.value = data.nombre || '';
          if (this.horaInput) this.horaInput.value = data.hora || '';
          if (this.departamentoSelect) this.departamentoSelect.value = data.departamento || '';
          if (this.comentariosTextarea) this.comentariosTextarea.value = data.comentarios || '';
        }
      } catch (e) {
        console.log('Error loading draft:', e);
      }
    }

    // Cargar registros locales
    const localRecords = localStorage.getItem('almuerzo_records');
    if (localRecords) {
      try {
        this.localRecords = JSON.parse(localRecords);
      } catch (e) {
        this.localRecords = [];
      }
    }
  }

  saveRecordToLocalStorage(record) {
    this.localRecords.unshift(record);
    // Mantener solo los últimos 100 registros
    if (this.localRecords.length > 100) {
      this.localRecords = this.localRecords.slice(0, 100);
    }
    localStorage.setItem('almuerzo_records', JSON.stringify(this.localRecords));
  }

  clearDraft() {
    localStorage.removeItem('almuerzo_draft');
  }

  // Validaciones
  validateName() {
    if (!this.nombreInput) return true;
    
    const name = this.nombreInput.value.trim();
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
    
    if (name && !nameRegex.test(name)) {
      this.nombreInput.setCustomValidity('El nombre debe contener solo letras y espacios (2-50 caracteres)');
      return false;
    } else {
      this.nombreInput.setCustomValidity('');
      return true;
    }
  }

  validateTime() {
    if (!this.horaInput) return true;
    
    const time = this.horaInput.value;
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      if (hours < 11 || hours > 15) {
        this.horaInput.setCustomValidity('La hora del almuerzo debe estar entre 11:00 AM y 3:00 PM');
        return false;
      }
    }
    this.horaInput.setCustomValidity('');
    return true;
  }

  validateEmployee(nombre) {
    // Si hay lista de empleados validados, verificar
    if (this.empleadosValidados.length > 0) {
      return this.empleadosValidados.some(emp => 
        emp.toLowerCase().includes(nombre.toLowerCase()) ||
        nombre.toLowerCase().includes(emp.toLowerCase())
      );
    }
    return true; // Si no hay lista, permitir cualquier nombre
  }

  // Autenticación
  async handleLogin() {
    if (this.authError) this.authError.textContent = '';
    this.showLoading();
    
    try {
      const usuario = this.usuarioInput?.value.trim();
      const password = this.passInput?.value;
      
      if (!usuario || !password) {
        if (this.authError) this.authError.textContent = "Ingresa usuario y contraseña.";
        return;
      }
      
      // Demo login: usuario 'test' password 'test123' o usuario 'admin' password 'admin123'
      if ((usuario === 'test' && password === 'test123') || (usuario === 'admin' && password === 'admin123')) {
        this.empleadoActual = { 
          id: usuario === 'admin' ? 1 : 2, 
          usuario, 
          nombre: usuario === 'admin' ? 'Administrador Test' : 'Usuario Test' 
        };
        await this.mostrarPrincipal(this.empleadoActual);
        this.showNotification(`¡Bienvenido, ${this.empleadoActual.nombre}!`, 'success');
      } else {
        if (this.authError) this.authError.textContent = "Usuario o contraseña incorrectos. (Demo: test/test123 o admin/admin123)";
      }
      
    } catch (error) {
      if (this.authError) this.authError.textContent = "Error de conexión. Intenta nuevamente.";
      console.error('Login error:', error);
    } finally {
      this.hideLoading();
    }
  }

  async handleRegister() {
    if (this.authError) this.authError.textContent = '';
    this.showLoading();
    
    try {
      const usuario = this.usuarioInput?.value.trim();
      const password = this.passInput?.value;
      
      if (!usuario || !password) {
        if (this.authError) this.authError.textContent = "Completa usuario y contraseña.";
        return;
      }
      
      if (password.length < 6) {
        if (this.authError) this.authError.textContent = "La contraseña debe tener al menos 6 caracteres.";
        return;
      }
      
      // En modo demo, simplemente mostrar mensaje de éxito
      if (this.authError) this.authError.textContent = "¡Registro exitoso! En modo demo. Usar test/test123 para ingresar.";
      this.showNotification("Registro exitoso (demo)", 'success');
      
    } catch (error) {
      if (this.authError) this.authError.textContent = "Error de conexión. Intenta nuevamente.";
      console.error('Register error:', error);
    } finally {
      this.hideLoading();
    }
  }

  handleLogout() {
    this.empleadoActual = null;
    this.clearDraft();
    location.reload();
  }

  async mostrarPrincipal(empleado) {
    if (this.authDiv) this.authDiv.classList.add('hidden');
    if (this.mainDiv) this.mainDiv.classList.remove('hidden');
    if (this.logoutBtn) this.logoutBtn.classList.remove('hidden');
    if (this.bienvenidaDiv) this.bienvenidaDiv.textContent = `¡Bienvenido, ${empleado.nombre}!`;
    
    // Establecer hora actual por defecto
    if (this.horaInput) this.horaInput.value = this.getCurrentTime();
    
    await this.cargarRegistros();
    this.updateStats();
  }

  // Envío de formulario
  async handleSubmitLunch(e) {
    e.preventDefault();
    if (this.formError) this.formError.textContent = '';
    if (this.formSuccess) this.formSuccess.classList.add('hidden');
    
    if (!this.empleadoActual) {
      if (this.formError) this.formError.textContent = "Debes iniciar sesión.";
      return;
    }

    const nombre = this.nombreInput?.value.trim();
    const hora = this.horaInput?.value;
    const departamento = this.departamentoSelect?.value;
    const comentarios = this.comentariosTextarea?.value.trim();

    // Validaciones
    if (!nombre) {
      if (this.formError) this.formError.textContent = "Ingresa tu nombre.";
      return;
    }

    if (!this.validateName()) {
      if (this.formError) this.formError.textContent = "Formato de nombre inválido.";
      return;
    }

    if (!hora) {
      if (this.formError) this.formError.textContent = "Selecciona la hora del almuerzo.";
      return;
    }

    if (!this.validateTime()) {
      if (this.formError) this.formError.textContent = "La hora debe estar entre 11:00 AM y 3:00 PM.";
      return;
    }

    if (!departamento) {
      if (this.formError) this.formError.textContent = "Selecciona tu departamento.";
      return;
    }

    this.showLoading();

    try {
      // Verificar si ya se registró hoy
      const today = this.hoyISO();
      const yaRegistrado = this.localRecords.some(record => 
        record.empleado_id === this.empleadoActual.id && record.fecha === today
      );

      if (yaRegistrado) {
        if (this.formError) this.formError.textContent = "Ya registraste el almuerzo hoy.";
        return;
      }

      // Crear registro
      const registro = {
        empleado_id: this.empleadoActual.id,
        nombre,
        fecha: today,
        fecha_formateada: this.formatearFecha(today),
        hora,
        departamento,
        comentarios: comentarios || '',
        id: Date.now(),
        local_only: false
      };

      // Limpiar formulario
      if (this.nombreInput) this.nombreInput.value = "";
      if (this.horaInput) this.horaInput.value = this.getCurrentTime();
      if (this.departamentoSelect) this.departamentoSelect.value = "";
      if (this.comentariosTextarea) this.comentariosTextarea.value = "";
      
      if (this.formSuccess) {
        this.formSuccess.textContent = "¡Registro exitoso!";
        this.formSuccess.classList.remove('hidden');
      }
      
      // Guardar en local storage
      this.saveRecordToLocalStorage(registro);
      
      this.clearDraft();
      await this.cargarRegistros();
      this.updateStats();
      this.showNotification("¡Almuerzo registrado exitosamente!", 'success');
      
    } catch (error) {
      if (this.formError) this.formError.textContent = "Error procesando el registro.";
      console.error('Submit error:', error);
    } finally {
      this.hideLoading();
    }
  }

  // Carga de registros
  async cargarRegistros() {
    try {
      // En modo demo, solo usar registros locales
      const allRecords = [...this.localRecords]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      this.renderRecords(allRecords);
    } catch (error) {
      console.error('Error loading records:', error);
      this.renderRecords(this.localRecords);
    }
  }

  renderRecords(records) {
    if (!this.recordsTableBody) return;

    if (records.length === 0) {
      this.recordsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="no-records">No hay registros para mostrar</td>
        </tr>
      `;
      return;
    }

    this.recordsTableBody.innerHTML = records.map(record => `
      <tr ${record.local_only ? 'style="background-color: var(--warning-bg);" title="Registro local - pendiente de sincronización"' : ''}>
        <td>${record.fecha_formateada}</td>
        <td>${record.hora || 'N/A'}</td>
        <td>${record.departamento || 'N/A'}</td>
        <td>${record.nombre}</td>
        <td>${record.comentarios || ''}</td>
        <td>
          ${record.local_only ? '<span style="color: var(--warning-color); font-size: 0.8em;">📱 Local</span>' : '<span style="color: var(--verde); font-size: 0.8em;">✅ Demo</span>'}
        </td>
      </tr>
    `).join('');

    this.allRecords = records;
    this.applyFilters();
  }

  // Filtros y búsqueda
  applyFilters() {
    if (!this.allRecords) return;

    const searchTerm = this.searchInput?.value.toLowerCase() || '';
    const dateFilter = this.filterDate?.value || '';
    const departmentFilter = this.filterDepartment?.value || '';

    const filtered = this.allRecords.filter(record => {
      const matchesSearch = !searchTerm || 
        record.nombre.toLowerCase().includes(searchTerm) ||
        (record.comentarios && record.comentarios.toLowerCase().includes(searchTerm));
      
      const matchesDate = !dateFilter || record.fecha === dateFilter;
      
      const matchesDepartment = !departmentFilter || record.departamento === departmentFilter;

      return matchesSearch && matchesDate && matchesDepartment;
    });

    this.renderFilteredRecords(filtered);
  }

  renderFilteredRecords(records) {
    if (!this.recordsTableBody) return;

    if (records.length === 0) {
      this.recordsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="no-records">No se encontraron registros con los filtros aplicados</td>
        </tr>
      `;
      return;
    }

    this.recordsTableBody.innerHTML = records.map(record => `
      <tr ${record.local_only ? 'style="background-color: var(--warning-bg);" title="Registro local - pendiente de sincronización"' : ''}>
        <td>${record.fecha_formateada}</td>
        <td>${record.hora || 'N/A'}</td>
        <td>${record.departamento || 'N/A'}</td>
        <td>${record.nombre}</td>
        <td>${record.comentarios || ''}</td>
        <td>
          ${record.local_only ? '<span style="color: var(--warning-color); font-size: 0.8em;">📱 Local</span>' : '<span style="color: var(--verde); font-size: 0.8em;">✅ Demo</span>'}
        </td>
      </tr>
    `).join('');
  }

  clearFilters() {
    if (this.searchInput) this.searchInput.value = '';
    if (this.filterDate) this.filterDate.value = '';
    if (this.filterDepartment) this.filterDepartment.value = '';
    this.applyFilters();
  }

  // Estadísticas
  updateStats() {
    if (!this.allRecords) return;

    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const total = this.allRecords.length;
    
    const monthRecords = this.allRecords.filter(record => {
      const recordDate = new Date(record.fecha);
      return recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear;
    }).length;

    const weekRecords = this.allRecords.filter(record => {
      const recordDate = new Date(record.fecha);
      return recordDate >= startOfWeek;
    }).length;

    if (this.totalRecordsSpan) this.totalRecordsSpan.textContent = total;
    if (this.thisMonthSpan) this.thisMonthSpan.textContent = monthRecords;
    if (this.thisWeekSpan) this.thisWeekSpan.textContent = weekRecords;
  }

  // Exportar a CSV
  exportToCSV() {
    if (!this.allRecords || this.allRecords.length === 0) {
      this.showNotification("No hay registros para exportar", 'warning');
      return;
    }

    const headers = ['Fecha', 'Hora', 'Departamento', 'Nombre', 'Comentarios', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...this.allRecords.map(record => [
        record.fecha,
        record.hora || '',
        record.departamento || '',
        `"${record.nombre}"`,
        `"${record.comentarios || ''}"`,
        record.local_only ? 'Local' : 'Demo'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `almuerzos_${this.empleadoActual?.nombre || 'usuario'}_${this.hoyISO()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showNotification("Archivo CSV descargado exitosamente", 'success');
    } else {
      this.showNotification("Tu navegador no soporta la descarga de archivos", 'error');
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.almuerzoApp = new AlmuerzoApp();
});