// Configuración para la API de productos
const API_CONFIG = {
    // URL base de tu ERP Firebase - CONFIGURADA
    BASE_URL: 'https://studio--firebase-explorer-7hc2p.us-central1.hosted.app',
    
    // Endpoints
    ENDPOINTS: {
        PRODUCTS: '/api/products',
        CONTACT: '/api/contact',
        ORDERS: '/api/orders',
        STOCK: '/api/inventory' // Para consultar stock individual: /api/inventory/[productId]
    },
    
    // Configuración de la solicitud
    REQUEST_CONFIG: {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Agregar otros headers si es necesario (Authorization, etc.)
        }
    },
    
    // Configuración de retry
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // ms
    
    // Timeout para las solicitudes
    TIMEOUT: 10000 // 10 seconds
};

// Función para hacer solicitudes con retry
async function apiRequest(endpoint, config = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const requestConfig = {
        ...API_CONFIG.REQUEST_CONFIG,
        ...config
    };
    
    let lastError;
    
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
            
            const response = await fetch(url, {
                ...requestConfig,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt));
            }
        }
    }
    
    throw lastError;
}

// Exportar para uso global
window.API_CONFIG = API_CONFIG;
window.apiRequest = apiRequest;

// E-mails para notificação de pedidos (envio de cópia por email)
window.ORDER_NOTIFICATION_EMAILS = [
    'leandro.zuleiman@abratecnica.com.br',
    'claudio.roma@abratecnica.com.br'
];