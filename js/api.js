/**
 * Cliente de API para comunicação com o backend
 * Gerencia todas as chamadas HTTP com autenticação JWT
 */

// URL base da API (ajustar conforme ambiente)
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Função genérica para fazer requisições à API
 * Adiciona automaticamente o token JWT no header Authorization
 * @param {string} endpoint - Endpoint da API (ex: '/leads')
 * @param {object} options - Opções do fetch (method, body, etc)
 * @returns {Promise} - Resposta da API
 */
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    // Adiciona token de autenticação se existir
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // Se não autorizado, limpa token e redireciona para login
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/index_new.html';
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro na requisição');
        }
        
        return data;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

/**
 * Faz login do usuário
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise} - Dados do usuário e token
 */
async function login(email, password) {
    const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    
    // Armazena token e dados do usuário
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
}

/**
 * Registra novo usuário
 * @param {object} userData - Dados do usuário (email, password, nome, clinicId)
 * @returns {Promise} - Dados do usuário e token
 */
async function register(userData) {
    const data = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
    
    // Armazena token e dados do usuário
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
}

/**
 * Faz logout do usuário
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index_new.html';
}

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean} - true se autenticado, false caso contrário
 */
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

/**
 * Obtém dados do usuário autenticado
 * @returns {object|null} - Dados do usuário ou null
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Lista todos os leads da clínica
 * @param {object} filters - Filtros opcionais (status, minScore)
 * @returns {Promise} - Lista de leads
 */
async function getLeads(filters = {}) {
    let endpoint = '/leads';
    const params = new URLSearchParams();
    
    if (filters.status) {
        params.append('status', filters.status);
    }
    if (filters.minScore) {
        params.append('minScore', filters.minScore);
    }
    
    if (params.toString()) {
        endpoint += `?${params.toString()}`;
    }
    
    return await fetchAPI(endpoint);
}

/**
 * Busca um lead específico por ID
 * @param {string} id - ID do lead
 * @returns {Promise} - Dados do lead
 */
async function getLead(id) {
    return await fetchAPI(`/leads/${id}`);
}

/**
 * Cria um novo lead
 * @param {object} leadData - Dados do lead
 * @returns {Promise} - Lead criado
 */
async function createLead(leadData) {
    return await fetchAPI('/leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
    });
}

/**
 * Atualiza um lead existente
 * @param {string} id - ID do lead
 * @param {object} leadData - Dados a serem atualizados
 * @returns {Promise} - Lead atualizado
 */
async function updateLead(id, leadData) {
    return await fetchAPI(`/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(leadData),
    });
}

/**
 * Remove um lead
 * @param {string} id - ID do lead
 * @returns {Promise} - Confirmação da remoção
 */
async function deleteLead(id) {
    return await fetchAPI(`/leads/${id}`, {
        method: 'DELETE',
    });
}

/**
 * Lista todos os agendamentos da clínica
 * @param {object} filters - Filtros opcionais (status, dataInicio, dataFim)
 * @returns {Promise} - Lista de agendamentos
 */
async function getAgendamentos(filters = {}) {
    let endpoint = '/agendamentos';
    const params = new URLSearchParams();
    
    if (filters.status) {
        params.append('status', filters.status);
    }
    if (filters.dataInicio) {
        params.append('dataInicio', filters.dataInicio);
    }
    if (filters.dataFim) {
        params.append('dataFim', filters.dataFim);
    }
    
    if (params.toString()) {
        endpoint += `?${params.toString()}`;
    }
    
    return await fetchAPI(endpoint);
}

/**
 * Cria um novo agendamento
 * @param {object} agendamentoData - Dados do agendamento
 * @returns {Promise} - Agendamento criado
 */
async function createAgendamento(agendamentoData) {
    return await fetchAPI('/agendamentos', {
        method: 'POST',
        body: JSON.stringify(agendamentoData),
    });
}

/**
 * Atualiza um agendamento existente
 * @param {string} id - ID do agendamento
 * @param {object} agendamentoData - Dados a serem atualizados
 * @returns {Promise} - Agendamento atualizado
 */
async function updateAgendamento(id, agendamentoData) {
    return await fetchAPI(`/agendamentos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(agendamentoData),
    });
}

/**
 * Remove um agendamento
 * @param {string} id - ID do agendamento
 * @returns {Promise} - Confirmação da remoção
 */
async function deleteAgendamento(id) {
    return await fetchAPI(`/agendamentos/${id}`, {
        method: 'DELETE',
    });
}
