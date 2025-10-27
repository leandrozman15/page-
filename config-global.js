/**
 * CONFIG - Configuração Global Abratécnica
 * 
 * Este arquivo centraliza todas as configurações do sistema,
 * incluindo URLs da API, configurações do carrito e constantes.
 */

// Configuração global do sistema
window.CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'https://studio--firebase-explorer-7hc2p.us-central1.hosted.app',
        ENDPOINTS: {
            PRODUCTS: '/api/products',
            ORDERS: '/api/orders',
            CONTACT: '/api/contact',
            INVENTORY: '/api/inventory'
        },
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    },
    
    // Cart Configuration
    CART: {
        STORAGE_KEY: 'abratecnica_cart',
        MAX_QUANTITY: 999,
        MIN_QUANTITY: 1,
        CURRENCY: 'BRL',
        CURRENCY_SYMBOL: 'R$'
    },
    
    // Shop Configuration
    SHOP: {
        ITEMS_PER_PAGE: 12,
        SORT_OPTIONS: ['name', 'price_asc', 'price_desc', 'newest'],
        DEFAULT_SORT: 'name'
    },
    
    // UI Configuration
    UI: {
        LOADING_DELAY: 500,
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 3000
    },
    
    // SEO and Meta
    META: {
        COMPANY_NAME: 'Abratécnica',
        DESCRIPTION: 'Produtos abrasivos de alta qualidade para indústria e profissionais',
        KEYWORDS: 'abrasivos, discos, rodas, lixa, polimento, desbaste'
    },
    
    // Contact Information
    CONTACT: {
        PHONE: '(11) 1234-5678',
        EMAIL: 'contato@abratecnica.com.br',
        ADDRESS: 'São Paulo, SP - Brasil'
    },
    
    // Development flags
    DEBUG: {
        ENABLE_CONSOLE_LOGS: true,
        SHOW_API_RESPONSES: true,
        MOCK_API_CALLS: false
    }
};

// Função para atualizar configuração dinamicamente
window.updateConfig = function(section, key, value) {
    if (window.CONFIG[section] && window.CONFIG[section].hasOwnProperty(key)) {
        window.CONFIG[section][key] = value;
        console.log(`✅ CONFIG atualizado: ${section}.${key} = ${value}`);
        return true;
    } else {
        console.error(`❌ CONFIG não encontrado: ${section}.${key}`);
        return false;
    }
};

// Função para obter configuração
window.getConfig = function(section, key = null) {
    if (key) {
        return window.CONFIG[section] ? window.CONFIG[section][key] : undefined;
    }
    return window.CONFIG[section];
};

// Log de inicialização
console.log('⚙️ CONFIG carregado:', window.CONFIG);