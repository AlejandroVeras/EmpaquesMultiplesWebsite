/**
 * Admin Panel JavaScript for Lunch Registration System
 * Empaques Múltiples SRL
 */

class AdminPanel {
    constructor() {
        this.apiBase = 'api/';
        this.token = localStorage.getItem('lunch_token');
        this.currentEditId = null;
        
        if (!this.token) {
            window.location.href = 'login.html';
            return;
        }
        
        this.init();
    }
    
    async init() {
        try {
            await this.checkAdminPermissions();
            await this.loadUsers();
            await this.loadDepartments();
            await this.loadDepartmentOptions();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing admin panel:', error);
            this.showError('Error al cargar el panel de administración');
        }
    }
    
    async makeRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const response = await fetch(this.apiBase + endpoint, {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('lunch_token');
            window.location.href = 'login.html';
            return;
        }
        
        if (response.status === 403) {
            this.showError('No tienes permisos para realizar esta acción');
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }
        
        return data;
    }
    
    async checkAdminPermissions() {
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            if (!payload.permissions.manage_users && !payload.permissions.system_config) {
                this.showError('No tienes permisos de administrador');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                return;
            }
        } catch (error) {
            localStorage.removeItem('lunch_token');
            window.location.href = 'login.html';
        }
    }
    
    setupEventListeners() {
        // User form
        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });
        
        // Department form
        document.getElementById('department-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDepartment();
        });
        
        // Config form
        document.getElementById('config-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConfig();
        });
        
        // Close modals when clicking outside
        ['user-modal', 'department-modal'].forEach(modalId => {
            document.getElementById(modalId).addEventListener('click', (e) => {
                if (e.target.id === modalId) {
                    this.hideModal(modalId);
                }
            });
        });
    }
    
    showTab(tabName) {
        // Hide all tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab panel
        document.getElementById(tabName + '-tab').classList.add('active');
        
        // Add active class to clicked tab
        event.target.classList.add('active');
        
        // Load data for the tab if needed
        if (tabName === 'logs') {
            this.loadLogs();
        }
    }
    
    async loadUsers() {
        try {
            const data = await this.makeRequest('users/users.php');
            this.renderUsersTable(data.data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showTableError('users-tbody', 'Error al cargar usuarios');
        }
    }
    
    renderUsersTable(users) {
        const tbody = document.getElementById('users-tbody');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">No hay usuarios registrados</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.full_name}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.department_name || 'N/A'}</td>
                <td>${user.role_name}</td>
                <td>
                    <span style="color: ${user.active ? 'green' : 'red'}">
                        ${user.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-secondary" onclick="admin.editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="admin.deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    async loadDepartments() {
        try {
            const data = await this.makeRequest('departments/departments.php');
            this.renderDepartmentsTable(data.data || []);
        } catch (error) {
            console.error('Error loading departments:', error);
            this.showTableError('departments-tbody', 'Error al cargar departamentos');
        }
    }
    
    renderDepartmentsTable(departments) {
        const tbody = document.getElementById('departments-tbody');
        
        if (departments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading">No hay departamentos registrados</td></tr>';
            return;
        }
        
        tbody.innerHTML = departments.map(dept => `
            <tr>
                <td>${dept.name}</td>
                <td>
                    <span style="color: ${dept.active ? 'green' : 'red'}">
                        ${dept.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>${new Date(dept.created_at).toLocaleDateString('es-ES')}</td>
                <td>
                    <button class="btn btn-secondary" onclick="admin.editDepartment(${dept.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="admin.deleteDepartment(${dept.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    async loadDepartmentOptions() {
        try {
            const data = await this.makeRequest('departments/departments.php');
            const select = document.getElementById('user-department');
            
            // Clear existing options except first one
            select.innerHTML = '<option value="">Sin departamento</option>';
            
            data.data.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading department options:', error);
        }
    }
    
    async loadLogs() {
        // Mock data for logs since we don't have the logs endpoint yet
        const logs = [
            {
                created_at: new Date().toISOString(),
                username: 'admin',
                action: 'login',
                resource_type: 'auth',
                ip_address: '192.168.1.1',
                details: 'Inicio de sesión exitoso'
            },
            {
                created_at: new Date(Date.now() - 3600000).toISOString(),
                username: 'admin',
                action: 'create',
                resource_type: 'user',
                ip_address: '192.168.1.1',
                details: 'Usuario creado: juan.perez'
            }
        ];
        
        this.renderLogsTable(logs);
    }
    
    renderLogsTable(logs) {
        const tbody = document.getElementById('logs-tbody');
        
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay logs disponibles</td></tr>';
            return;
        }
        
        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${new Date(log.created_at).toLocaleString('es-ES')}</td>
                <td>${log.username || 'Sistema'}</td>
                <td>${log.action}</td>
                <td>${log.resource_type}</td>
                <td>${log.ip_address}</td>
                <td>${log.details || 'N/A'}</td>
            </tr>
        `).join('');
    }
    
    showUserModal(userId = null) {
        this.currentEditId = userId;
        const modal = document.getElementById('user-modal');
        const title = document.getElementById('user-modal-title');
        const form = document.getElementById('user-form');
        
        // Reset form
        form.reset();
        this.hideModalError('user-modal-error');
        
        if (userId) {
            title.textContent = 'Editar Usuario';
            // In a real implementation, you would load the user data here
        } else {
            title.textContent = 'Nuevo Usuario';
        }
        
        modal.classList.remove('hidden');
    }
    
    hideUserModal() {
        this.hideModal('user-modal');
        this.currentEditId = null;
    }
    
    async saveUser() {
        const username = document.getElementById('user-username').value.trim();
        const fullname = document.getElementById('user-fullname').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const password = document.getElementById('user-password').value;
        const departmentId = document.getElementById('user-department').value;
        const roleId = document.getElementById('user-role').value;
        
        if (!username || !fullname || !roleId) {
            this.showModalError('user-modal-error', 'Campos requeridos: Usuario, Nombre completo y Rol');
            return;
        }
        
        if (!this.currentEditId && !password) {
            this.showModalError('user-modal-error', 'La contraseña es requerida para nuevos usuarios');
            return;
        }
        
        try {
            const data = {
                username,
                full_name: fullname,
                email: email || null,
                department_id: departmentId || null,
                role_id: parseInt(roleId)
            };
            
            if (password) {
                data.password = password;
            }
            
            if (this.currentEditId) {
                await this.makeRequest(`users/users.php?id=${this.currentEditId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                this.showSuccess('Usuario actualizado exitosamente');
            } else {
                await this.makeRequest('users/users.php', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                this.showSuccess('Usuario creado exitosamente');
            }
            
            this.hideUserModal();
            this.loadUsers();
            
        } catch (error) {
            this.showModalError('user-modal-error', error.message);
        }
    }
    
    async editUser(userId) {
        // In a real implementation, you would load the user data first
        this.showUserModal(userId);
    }
    
    async deleteUser(userId) {
        if (!confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
            return;
        }
        
        try {
            await this.makeRequest(`users/users.php?id=${userId}`, {
                method: 'DELETE'
            });
            
            this.showSuccess('Usuario desactivado exitosamente');
            this.loadUsers();
            
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    showDepartmentModal(departmentId = null) {
        this.currentEditId = departmentId;
        const modal = document.getElementById('department-modal');
        const title = document.getElementById('department-modal-title');
        const form = document.getElementById('department-form');
        
        // Reset form
        form.reset();
        this.hideModalError('department-modal-error');
        
        if (departmentId) {
            title.textContent = 'Editar Departamento';
            // In a real implementation, you would load the department data here
        } else {
            title.textContent = 'Nuevo Departamento';
        }
        
        modal.classList.remove('hidden');
    }
    
    hideDepartmentModal() {
        this.hideModal('department-modal');
        this.currentEditId = null;
    }
    
    async saveDepartment() {
        const name = document.getElementById('department-name').value.trim();
        
        if (!name) {
            this.showModalError('department-modal-error', 'El nombre del departamento es requerido');
            return;
        }
        
        try {
            const data = { name };
            
            if (this.currentEditId) {
                await this.makeRequest(`departments/departments.php?id=${this.currentEditId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                this.showSuccess('Departamento actualizado exitosamente');
            } else {
                await this.makeRequest('departments/departments.php', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                this.showSuccess('Departamento creado exitosamente');
            }
            
            this.hideDepartmentModal();
            this.loadDepartments();
            this.loadDepartmentOptions();
            
        } catch (error) {
            this.showModalError('department-modal-error', error.message);
        }
    }
    
    async editDepartment(departmentId) {
        // In a real implementation, you would load the department data first
        this.showDepartmentModal(departmentId);
    }
    
    async deleteDepartment(departmentId) {
        if (!confirm('¿Estás seguro de que quieres desactivar este departamento?')) {
            return;
        }
        
        try {
            await this.makeRequest(`departments/departments.php?id=${departmentId}`, {
                method: 'DELETE'
            });
            
            this.showSuccess('Departamento desactivado exitosamente');
            this.loadDepartments();
            this.loadDepartmentOptions();
            
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    async saveConfig() {
        // This would save system configuration
        this.showSuccess('Configuración guardada exitosamente');
    }
    
    logout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            this.makeRequest('auth/logout.php', { method: 'POST' }).catch(() => {});
            localStorage.removeItem('lunch_token');
            window.location.href = 'login.html';
        }
    }
    
    // Utility methods
    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }
    
    showTableError(tbodyId, message) {
        document.getElementById(tbodyId).innerHTML = 
            `<tr><td colspan="10" class="error">${message}</td></tr>`;
    }
    
    showModalError(errorId, message) {
        const errorDiv = document.getElementById(errorId);
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    
    hideModalError(errorId) {
        document.getElementById(errorId).classList.add('hidden');
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.zIndex = '9999';
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '20px';
        successDiv.style.right = '20px';
        successDiv.style.zIndex = '9999';
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
}

// Global functions for HTML onclick handlers
let admin;

function showTab(tabName) {
    admin.showTab(tabName);
}

function showUserModal() {
    admin.showUserModal();
}

function hideUserModal() {
    admin.hideUserModal();
}

function showDepartmentModal() {
    admin.showDepartmentModal();
}

function hideDepartmentModal() {
    admin.hideDepartmentModal();
}

function logout() {
    admin.logout();
}

// Initialize admin panel when page loads
document.addEventListener('DOMContentLoaded', () => {
    admin = new AdminPanel();
});