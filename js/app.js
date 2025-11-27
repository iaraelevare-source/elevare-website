/**
 * Inicialização da aplicação
 * Configura eventos globais e funcionalidades comuns
 */

/**
 * Inicializa ícones Lucide
 */
function initIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Inicializa menu mobile
 */
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

/**
 * Inicializa smooth scroll para links internos
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Fecha menu mobile se estiver aberto
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });
}

/**
 * Substitui links wa.me por ações de API
 * Usuários logados criam leads, não logados abrem modal de login
 */
function initCTAButtons() {
    // Seleciona todos os botões CTA que antes abriam WhatsApp
    const ctaButtons = document.querySelectorAll('a[href*="wa.me"], button.auth-button');
    
    ctaButtons.forEach(button => {
        // Remove href original se for link
        if (button.tagName === 'A' && button.href.includes('wa.me')) {
            button.removeAttribute('href');
            button.style.cursor = 'pointer';
        }
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (isAuthenticated()) {
                // Usuário logado - redireciona para dashboard
                window.location.href = '/dashboard.html';
            } else {
                // Usuário não logado - abre modal de login
                openLoginModal();
            }
        });
    });
}

/**
 * Formata data para exibição
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} - Data formatada
 */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formata valor monetário
 * @param {number} value - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Retorna badge HTML baseado no status
 * @param {string} status - Status do item
 * @returns {string} - HTML do badge
 */
function getStatusBadge(status) {
    const badges = {
        'novo': '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Novo</span>',
        'contatado': '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Contatado</span>',
        'qualificado': '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Qualificado</span>',
        'convertido': '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Convertido</span>',
        'perdido': '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Perdido</span>',
        'agendado': '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Agendado</span>',
        'confirmado': '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Confirmado</span>',
        'realizado': '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Realizado</span>',
        'cancelado': '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelado</span>',
        'faltou': '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Faltou</span>',
    };
    
    return badges[status] || `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">${status}</span>`;
}

/**
 * Retorna cor da barra de score
 * @param {number} score - Score do lead (0-100)
 * @returns {string} - Classe CSS da cor
 */
function getScoreColor(score) {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
}

/**
 * Inicializa a aplicação
 */
function initApp() {
    initIcons();
    initMobileMenu();
    initSmoothScroll();
    initCTAButtons();
    
    console.log('✅ Aplicação Elevare inicializada');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Reinicializa ícones após mudanças no DOM
const observer = new MutationObserver(() => {
    initIcons();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
