// ===== CONFIGURACIÓN DE SEGURIDAD MEJORADA =====
// Implementar estas mejoras para mayor seguridad

// 1. SANITIZACIÓN DE DATOS
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 2. VALIDACIÓN DE INPUTS
function validateInput(input, type) {
    const patterns = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
        cep: /^\d{5}-?\d{3}$/,
        cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
    };
    
    if (type === 'required' && (!input || input.trim().length === 0)) {
        return { valid: false, message: 'Campo obrigatório' };
    }
    
    if (patterns[type] && !patterns[type].test(input)) {
        return { valid: false, message: `Formato de ${type} inválido` };
    }
    
    return { valid: true, message: 'Válido' };
}

// 3. RATE LIMITING FRONTEND
class RateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
        this.requests = [];
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    
    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        
        if (this.requests.length >= this.maxRequests) {
            return false;
        }
        
        this.requests.push(now);
        return true;
    }
    
    getTimeUntilReset() {
        if (this.requests.length === 0) return 0;
        const oldestRequest = Math.min(...this.requests);
        return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
    }
}

// 4. LOGGER DE SEGURIDAD
class SecurityLogger {
    static log(event, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.warn('🔒 Security Event:', logEntry);
        
        // Em produção, enviar para serviço de log
        // this.sendToSecurityService(logEntry);
    }
    
    static logSuspiciousActivity(activity, details) {
        this.log('SUSPICIOUS_ACTIVITY', { activity, details });
    }
    
    static logFailedValidation(field, value, reason) {
        this.log('VALIDATION_FAILED', { field, value, reason });
    }
}

// 5. CONFIGURAÇÃO ASAAS SEGURA
const ASAAS_CONFIG = {
    // ✅ URLs públicas apenas
    SANDBOX_URL: 'https://sandbox.asaas.com/api/v3',
    PRODUCTION_URL: 'https://api.asaas.com/v3',
    
    // ✅ Endpoints seguros (sem chaves)
    PUBLIC_ENDPOINTS: {
        WEBHOOK_VERIFY: '/webhooks/verify',
        PAYMENT_STATUS: '/payments/status'  // Apenas status públicos
    },
    
    // ⚠️ NUNCA colocar API keys aqui
    // ❌ API_KEY: "sua_chave_aqui" // JAMAIS FAZER ISSO
};

// 6. PROXY SEGURO PARA ASAAS
async function secureAsaasRequest(endpoint, data) {
    // ✅ Sempre usar proxy backend
    const proxyUrl = '/api/asaas-proxy'; // Seu backend
    
    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' // CSRF protection
            },
            body: JSON.stringify({
                endpoint,
                data: sanitizeData(data)
            })
        });
        
        if (!response.ok) {
            throw new Error(`Proxy error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        SecurityLogger.logSuspiciousActivity(
            'ASAAS_REQUEST_FAILED', 
            { endpoint, error: error.message }
        );
        throw error;
    }
}

// 7. SANITIZAÇÃO PARA API CALLS
function sanitizeData(data) {
    if (typeof data === 'string') {
        return escapeHTML(data.trim());
    }
    
    if (Array.isArray(data)) {
        return data.map(sanitizeData);
    }
    
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[escapeHTML(key)] = sanitizeData(value);
        }
        return sanitized;
    }
    
    return data;
}

// 8. INICIALIZAÇÃO DE SEGURANÇA
function initSecurity() {
    // Rate limiter global
    window.rateLimiter = new RateLimiter(20, 60000); // 20 req/min
    
    // CSP via JS (mejor en servidor)
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;";
    document.head.appendChild(meta);
    
    // Event listeners de seguridad
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.tagName === 'FORM') {
            if (!window.rateLimiter.canMakeRequest()) {
                e.preventDefault();
                const waitTime = Math.ceil(window.rateLimiter.getTimeUntilReset() / 1000);
                alert(`Muitas tentativas. Aguarde ${waitTime} segundos.`);
                return false;
            }
        }
    });
    
    console.log('🔒 Security config loaded');
}

// Auto-inicializar quando o documento estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurity);
} else {
    initSecurity();
}

// Exportar funções globalmente
window.SecurityUtils = {
    sanitizeHTML,
    escapeHTML,
    validateInput,
    SecurityLogger,
    secureAsaasRequest,
    sanitizeData
};