/**
 * Gerenciador de autenticação e modais
 * Controla login, registro e proteção de rotas
 */

/**
 * Mostra mensagem de erro no formulário
 * @param {string} message - Mensagem de erro
 * @param {HTMLElement} container - Container onde exibir o erro
 */
function showError(message, container) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4';
    errorDiv.textContent = message;
    
    // Remove erro anterior se existir
    const existingError = container.querySelector('.bg-red-50');
    if (existingError) {
        existingError.remove();
    }
    
    container.insertBefore(errorDiv, container.firstChild);
    
    // Remove erro após 5 segundos
    setTimeout(() => errorDiv.remove(), 5000);
}

/**
 * Mostra mensagem de sucesso
 * @param {string} message - Mensagem de sucesso
 * @param {HTMLElement} container - Container onde exibir a mensagem
 */
function showSuccess(message, container) {
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4';
    successDiv.textContent = message;
    
    container.insertBefore(successDiv, container.firstChild);
    
    // Remove mensagem após 3 segundos
    setTimeout(() => successDiv.remove(), 3000);
}

/**
 * Abre o modal de login
 */
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Fecha o modal de login
 */
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Limpa formulário
        const form = document.getElementById('loginForm');
        if (form) form.reset();
    }
}

/**
 * Abre o modal de registro
 */
function openRegisterModal() {
    closeLoginModal();
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Fecha o modal de registro
 */
function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Limpa formulário
        const form = document.getElementById('registerForm');
        if (form) form.reset();
    }
}

/**
 * Valida email
 * @param {string} email - Email a ser validado
 * @returns {boolean} - true se válido
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Processa o formulário de login
 * @param {Event} event - Evento do formulário
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const errorContainer = form.querySelector('.error-container') || form;
    
    // Validações
    if (!email || !password) {
        showError('Preencha todos os campos', errorContainer);
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Email inválido', errorContainer);
        return;
    }
    
    // Desabilita botão durante requisição
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';
    
    try {
        await login(email, password);
        
        // Redireciona para dashboard
        window.location.href = '/dashboard.html';
    } catch (error) {
        showError(error.message || 'Erro ao fazer login. Verifique suas credenciais.', errorContainer);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Processa o formulário de registro
 * @param {Event} event - Evento do formulário
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const nome = formData.get('nome');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const clinicId = formData.get('clinicId');
    const errorContainer = form.querySelector('.error-container') || form;
    
    // Validações
    if (!nome || !email || !password || !confirmPassword || !clinicId) {
        showError('Preencha todos os campos', errorContainer);
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Email inválido', errorContainer);
        return;
    }
    
    if (password.length < 6) {
        showError('A senha deve ter no mínimo 6 caracteres', errorContainer);
        return;
    }
    
    if (password !== confirmPassword) {
        showError('As senhas não coincidem', errorContainer);
        return;
    }
    
    // Desabilita botão durante requisição
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Criando conta...';
    
    try {
        await register({ nome, email, password, clinicId });
        
        // Redireciona para dashboard
        window.location.href = '/dashboard.html';
    } catch (error) {
        showError(error.message || 'Erro ao criar conta. Tente novamente.', errorContainer);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Atualiza interface baseado no estado de autenticação
 */
function updateAuthUI() {
    const user = getCurrentUser();
    const authButtons = document.querySelectorAll('.auth-button');
    const logoutButtons = document.querySelectorAll('.logout-button');
    const dashboardButtons = document.querySelectorAll('.dashboard-button');
    
    if (user) {
        // Usuário logado - mostra botões de dashboard e logout
        authButtons.forEach(btn => btn.classList.add('hidden'));
        logoutButtons.forEach(btn => btn.classList.remove('hidden'));
        dashboardButtons.forEach(btn => btn.classList.remove('hidden'));
    } else {
        // Usuário não logado - mostra botões de login
        authButtons.forEach(btn => btn.classList.remove('hidden'));
        logoutButtons.forEach(btn => btn.classList.add('hidden'));
        dashboardButtons.forEach(btn => btn.classList.add('hidden'));
    }
}

/**
 * Protege páginas que requerem autenticação
 * Redireciona para homepage se não estiver logado
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/index_new.html';
    }
}

/**
 * Inicializa eventos de autenticação
 */
function initAuth() {
    // Atualiza UI baseado no estado de autenticação
    updateAuthUI();
    
    // Event listeners para modais
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    // Fecha modal ao clicar fora
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeLoginModal();
            }
        });
    }
    
    if (registerModal) {
        registerModal.addEventListener('click', (e) => {
            if (e.target === registerModal) {
                closeRegisterModal();
            }
        });
    }
    
    // Event listeners para formulários
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Event listeners para botões de logout
    document.querySelectorAll('.logout-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Deseja realmente sair?')) {
                logout();
            }
        });
    });
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
