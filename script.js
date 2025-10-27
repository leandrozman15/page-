// Variables globales
let cart = [];
let isCartOpen = false;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Inicializar la aplicación
function initializeApp() {
    // Navegación móvil
    initializeMobileMenu();
    
    // Filtros de productos
    initializeFilters();
    
    // Búsqueda
    initializeSearch();
    
    // Carrito
    initializeCart();
    
    // Formularios
    initializeForms();
    
    // Scroll effects
    initializeScrollEffects();
    
    // Animaciones
    initializeAnimations();
    
    // Vídeos de fundo
    initializeBackgroundVideos();
    
    // Bibliotecas modernas
    initializeModernLibraries();
}

// === NAVEGACIÓN MÓVIL ===
function initializeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
        
        // Cerrar menú al hacer click en un enlace
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
    }
}

// === FILTROS DE PRODUCTOS ===
function initializeFilters() {
    // Filtros por categoría (página de productos)
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos los botones
            filterBtns.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            filterProducts(filter);
        });
    });
    
    // Filtros de tienda
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const sortBy = document.getElementById('sortBy');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyShopFilters);
    }
    if (priceFilter) {
        priceFilter.addEventListener('change', applyShopFilters);
    }
    if (sortBy) {
        sortBy.addEventListener('change', applyShopFilters);
    }
}

function filterProducts(category) {
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        if (category === 'all' || product.getAttribute('data-category') === category) {
            product.style.display = 'block';
            product.style.animation = 'fadeIn 0.5s ease';
        } else {
            product.style.display = 'none';
        }
    });
}

function applyShopFilters() {
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const priceFilter = document.getElementById('priceFilter')?.value || 'all';
    const sortBy = document.getElementById('sortBy')?.value || 'name';
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    // Crear copia de todos los productos originales para filtrar
    let filteredProducts = [...originalProducts];
    
    // Filtrar por categoría
    if (categoryFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => {
            return getProductCategory(product.type) === categoryFilter;
        });
    }
    
    // Filtrar por precio
    if (priceFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => {
            const price = parseFloat(product.price) || 0;
            
            switch (priceFilter) {
                case '0-100': return price <= 100;
                case '100-300': return price > 100 && price <= 300;
                case '300-500': return price > 300 && price <= 500;
                case '500+': return price > 500;
                default: return true;
            }
        });
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => {
            const name = (product.name || '').toLowerCase();
            const description = (product.description || '').toLowerCase();
            const code = (product.code || '').toLowerCase();
            
            return name.includes(searchTerm) || 
                   description.includes(searchTerm) || 
                   code.includes(searchTerm);
        });
    }
    
    // Ordenar productos
    filteredProducts.sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
            case 'price-high':
                return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
            case 'rating':
                // Si tienes sistema de rating, usa: return (b.rating || 0) - (a.rating || 0);
                return (b.currentStock || 0) - (a.currentStock || 0); // Temporal: ordenar por stock
            case 'name':
            default:
                return (a.name || '').localeCompare(b.name || '');
        }
    });
    
    // Actualizar productos filtrados y resetear paginación
    allProducts = filteredProducts;
    totalProducts = filteredProducts.length;
    currentPage = 1;
    
    // Mostrar productos con paginación
    displayShopProductsWithPagination();
    
    // Mostrar/ocultar paginación según sea necesario
    const paginationContainer = document.getElementById('paginationContainer');
    if (paginationContainer) {
        paginationContainer.style.display = totalProducts > itemsPerPage ? 'flex' : 'none';
    }
}

// === BÚSQUEDA ===
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyShopFilters, 300));
    }
}

// === CARRITO DE COMPRAS ===
// COMPORTAMENTO MEJORADO: El carrito permanece abierto durante las modificaciones
// Los usuarios pueden cerrarlo manualmente usando el botón X en el header del carrito
function initializeCart() {
    // Cargar carrito del localStorage
    loadCartFromStorage();
    updateCartUI();
    // Asegurar que el icono del carrito siempre sea visible (fallback SVG si FontAwesome no carga)
    try { ensureCartIconVisible(); } catch (e) { console.warn('ensureCartIconVisible error', e); }
    
    // Event listeners para cantidad
    document.addEventListener('click', function(e) {
        if (e.target.closest('.quantity-selector button')) {
            e.preventDefault();
        }
    });
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        isCartOpen = !isCartOpen;
        cartSidebar.classList.toggle('open', isCartOpen);
        
        // Agregar/remover clase al body para prevenir scroll
        document.body.style.overflow = isCartOpen ? 'hidden' : '';
    }
}

function addToCart(id, name, price, buttonElement) {
    const quantityInput = buttonElement.parentElement.querySelector('input[type=\"number\"]');
    const quantity = parseInt(quantityInput?.value || 1);
    
    // Tentar capturar a imagem real do produto
    let productImage = getProductImage(id);
    
    // Tentar encontrar a imagem do produto no card atual
    const productCard = buttonElement.closest('.product-item, .shop-product-card, .product-card');
    if (productCard) {
        const img = productCard.querySelector('img');
        if (img && img.src && !img.src.includes('placeholder')) {
            productImage = img.src;
        }
    }
    
    // Buscar se o produto já existe no carrinho
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: quantity,
            image: productImage
        });
    }
    
    // Animação do botão
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = '<i class=\"fas fa-check\"></i> Adicionado!';
    buttonElement.style.background = '#27ae60';
    
    setTimeout(() => {
        buttonElement.innerHTML = originalText;
        buttonElement.style.background = '';
    }, 1500);
    
    updateCartUI();
    saveCartToStorage();
    
    // Mostrar el carrito si no está abierto
    if (!isCartOpen) {
        toggleCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    saveCartToStorage();
}

function updateCartQuantity(id, newQuantity) {
    const item = cart.find(item => item.id === id);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(id);
        } else {
            item.quantity = newQuantity;
            updateCartUI();
            saveCartToStorage();
        }
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // Actualizar contador
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Atualizar itens do carrinho
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<div class=\"empty-cart\"><p>Seu carrinho está vazio</p></div>';
        } else {
                // Normalizar imágenes de carrito para evitar src invalidas
                cart.forEach(item => {
                    if (!item.image || typeof item.image !== 'string' || item.image.trim() === '') {
                        item.image = fallbackImageForProduct({ name: item.name }, '200x200');
                    }
                });
                cartItems.innerHTML = cart.map(item => `
                    <div class=\"cart-item\">
                            <img src="${item.image}" alt="${item.name}" data-original-src="${item.image}" data-name="${(item.name||'').replace(/"/g,'&quot;')}" data-size="200x200" onerror="handleProductImageError(this)">
                        <div class=\"cart-item-info\">
                            <h4>${item.name}</h4>
                            <div class=\"cart-item-price\">R$ ${formatCurrency(item.price)}</div>
                            <div class=\"cart-item-quantity\">
                                <button onclick=\"updateCartQuantity('${item.id}', ${item.quantity - 1})\">-</button>
                                <span>${item.quantity}</span>
                                <button onclick=\"updateCartQuantity('${item.id}', ${item.quantity + 1})\">+</button>
                            </div>
                        </div>
                        <button class=\"remove-item\" onclick=\"removeFromCart('${item.id}')\">
                            <i class=\"fas fa-trash\"></i>
                        </button>
                    </div>
                `).join('');
        }
    }
    
    // Actualizar total
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = parseFloat(window.selectedShippingCost || 0);
    const total = subtotal + shippingCost;
    
    // Atualizar elementos de total
    const cartSubtotal = document.getElementById('cartSubtotal');
    if (cartSubtotal) {
        cartSubtotal.textContent = formatCurrency(subtotal);
    }
    
    const shippingLine = document.getElementById('shippingLine');
    const shippingCostEl = document.getElementById('shippingCost');
    if (shippingCost > 0) {
        if (shippingLine) shippingLine.style.display = 'flex';
        if (shippingCostEl) shippingCostEl.textContent = formatCurrency(shippingCost);
    } else {
        if (shippingLine) shippingLine.style.display = 'none';
    }
    
    if (cartTotal) {
        cartTotal.textContent = formatCurrency(total);
    }
    
    // Asegurar que el icono del carrito esté visible (por si FontAwesome no se cargó)
    try { ensureCartIconVisible(); } catch (e) { console.warn('ensureCartIconVisible error', e); }
}

// Função para limpar carrinho completamente
function clearCart() {
    if (cart.length === 0) {
        console.log('🛒 Carrinho já está vazio');
        return;
    }
    
    // Confirmar ação
    const confirmed = confirm('Tem certeza que deseja limpar todo o carrinho?');
    if (!confirmed) return;
    
    // Limpar array do carrinho
    cart = [];
    
    // Atualizar UI
    updateCartUI();
    
    // Salvar no localStorage
    saveCart();
    
    // Log da ação
    console.log('🗑️ Carrinho limpo com sucesso');
    
    // Mostrar feedback visual (opcional)
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cartItems.innerHTML = '<div class="empty-cart success-message"><p>✅ Carrinho limpo com sucesso!</p></div>';
        
        // Voltar ao estado normal após 2 segundos
        setTimeout(() => {
            updateCartUI();
        }, 2000);
    }
}

function changeQuantity(button, change) {
    const input = button.parentElement.querySelector('input[type=\"number\"]');
    let currentValue = parseInt(input.value);
    let newValue = currentValue + change;
    
    if (newValue < 1) newValue = 1;
    if (newValue > 10) newValue = 10;
    
    input.value = newValue;
}

function getProductImage(id) {
    // Tentar encontrar a imagem real do produto na página
    const productCard = document.getElementById(`shop-product-${id}`) || document.getElementById(`product-${id}`);
    if (productCard) {
        const img = productCard.querySelector('img');
        if (img && img.src && !img.src.includes('placeholder')) {
            return img.src;
        }
    }
    
    // Se não encontrar, usar imagem padrão para abrasivos
    const abrasiveImages = {
        'disco': 'https://via.placeholder.com/200x200/e74c3c/ffffff?text=Disco+Flap',
        'escova': 'https://via.placeholder.com/200x200/27ae60/ffffff?text=Escova',
        'manta': 'https://via.placeholder.com/200x200/3498db/ffffff?text=Manta',
        'lixa': 'https://via.placeholder.com/200x200/f39c12/ffffff?text=Lixa',
        'roda': 'https://via.placeholder.com/200x200/9b59b6/ffffff?text=Roda'
    };
    
    // Tentar identificar o tipo de produto pelo nome/id
    const idLower = id.toString().toLowerCase();
    const name = document.getElementById(`shop-product-${id}`)?.querySelector('h3')?.textContent?.toLowerCase() || '';
    
    if (idLower.includes('disco') || name.includes('disco') || name.includes('flap')) {
        return abrasiveImages.disco;
    } else if (idLower.includes('escova') || name.includes('escova')) {
        return abrasiveImages.escova;
    } else if (idLower.includes('manta') || name.includes('manta')) {
        return abrasiveImages.manta;
    } else if (idLower.includes('lixa') || name.includes('lixa')) {
        return abrasiveImages.lixa;
    } else if (idLower.includes('roda') || name.includes('roda')) {
        return abrasiveImages.roda;
    }
    
    // Imagem padrão para abrasivos industriais
    return 'https://via.placeholder.com/200x200/2c3e50/ffffff?text=Abrasivo';
}

// === CHECKOUT ===
let currentStep = 1;

function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio');
        return;
    }
    
    // Mantener el carrito abierto para referencia visual
    // if (isCartOpen) toggleCart();
    
    // Mostrar el modal de checkout
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Reset al primer step
        currentStep = 1;
        showStep(1);
        showCheckoutForm();
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Solo ajustar overflow si el carrito no está abierto
        if (!isCartOpen) {
            document.body.style.overflow = 'auto';
        }
        
        // Reset form
        resetCheckoutForm();
    }
}

function showCheckoutForm() {
    document.getElementById('checkout-form').style.display = 'block';
    document.getElementById('checkout-loading').style.display = 'none';
    document.getElementById('checkout-success').style.display = 'none';
    document.getElementById('checkout-error').style.display = 'none';
}

function showCheckoutLoading() {
    document.getElementById('checkout-form').style.display = 'none';
    document.getElementById('checkout-loading').style.display = 'block';
    document.getElementById('checkout-success').style.display = 'none';
    document.getElementById('checkout-error').style.display = 'none';
}

function showCheckoutSuccess(orderNumber, isAlternativeMethod = false) {
    document.getElementById('checkout-form').style.display = 'none';
    document.getElementById('checkout-loading').style.display = 'none';
    document.getElementById('checkout-success').style.display = 'block';
    document.getElementById('checkout-error').style.display = 'none';
    
    document.getElementById('order-number').textContent = orderNumber;
    
    // Mostrar mensagem especial se foi pelo método alternativo
    const successMessage = document.querySelector('#checkout-success p');
    if (isAlternativeMethod && successMessage) {
        successMessage.innerHTML = `
            <strong>✅ Pedido recebido com sucesso!</strong><br>
            <small style="color: #666;">📧 Seu pedido foi enviado por email e será processado em breve. Entraremos em contato para confirmar os detalhes.</small>
        `;
    }
}

function showCheckoutError(message) {
    document.getElementById('checkout-form').style.display = 'none';
    document.getElementById('checkout-loading').style.display = 'none';
    document.getElementById('checkout-success').style.display = 'none';
    document.getElementById('checkout-error').style.display = 'block';
    
    document.getElementById('checkout-error-message').textContent = message;
}

// Steps do checkout
function showStep(step) {
    // Ocultar todos los steps
    document.querySelectorAll('.checkout-step').forEach(el => {
        el.classList.remove('active');
    });
    
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active');
    });
    
    // Mostrar el step actual
    const stepElement = document.getElementById(`step-${step}`);
    const stepIndicator = document.querySelector(`.step[data-step="${step}"]`);
    
    if (stepElement) stepElement.classList.add('active');
    if (stepIndicator) stepIndicator.classList.add('active');
    
    currentStep = step;
    
    // Si es el step 3, cargar el resumen
    if (step === 3) {
        loadOrderSummary();
    }
}

function nextStep() {
    if (currentStep === 1) {
        if (validateCustomerForm()) {
            showStep(2);
            updatePaymentSummary();
        }
    } else if (currentStep === 2) {
        if (validatePaymentForm()) {
            showStep(3);
            updateOrderSummary();
        }
    }
}

function previousStep() {
    if (currentStep === 2) {
        showStep(1);
    } else if (currentStep === 3) {
        showStep(2);
    }
}

function validateCustomerForm() {
    const name = document.getElementById('customer-name').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    
    let isValid = true;
    
    // Limpiar errores previos
    clearCheckoutErrors();
    
    // Validar nombre
    if (!name || name.length < 2) {
        showCheckoutFieldError('name-checkout-error', 'Nome deve ter pelo menos 2 caracteres');
        document.getElementById('customer-name').classList.add('error');
        isValid = false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showCheckoutFieldError('email-checkout-error', 'Email inválido'); 
        document.getElementById('customer-email').classList.add('error');
        isValid = false;
    }
    
    return isValid;
}

function showCheckoutFieldError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearCheckoutErrors() {
    const errorElements = document.querySelectorAll('#checkoutModal .field-error');
    const inputElements = document.querySelectorAll('#checkoutModal input, #checkoutModal textarea');
    
    errorElements.forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
    
    inputElements.forEach(el => {
        el.classList.remove('error');
    });
}

function loadOrderSummary() {
    // Cargar datos del cliente
    const customerSummary = document.getElementById('customer-summary');
    const name = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    const phone = document.getElementById('customer-phone').value;
    const company = document.getElementById('customer-company').value;
    const notes = document.getElementById('customer-notes').value;
    
    let customerHTML = `<p><strong>Nome:</strong> ${name}</p>`;
    customerHTML += `<p><strong>Email:</strong> ${email}</p>`;
    if (phone) customerHTML += `<p><strong>Telefone:</strong> ${phone}</p>`;
    if (company) customerHTML += `<p><strong>Empresa:</strong> ${company}</p>`;
    if (notes) customerHTML += `<p><strong>Observações:</strong> ${notes}</p>`;
    
    customerSummary.innerHTML = customerHTML;
    
    // Cargar items do pedido
    const itemsSummary = document.getElementById('items-summary');
    const finalTotal = document.getElementById('final-total');
    
    const itemsHTML = cart.map(item => `
        <div class="item-summary">
            <span>${item.name} x ${item.quantity}</span>
            <span>R$ ${formatCurrency(item.price * item.quantity)}</span>
        </div>
    `).join('');
    
    itemsSummary.innerHTML = itemsHTML;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = parseFloat(window.selectedShippingCost || 0);
    const total = subtotal + shippingCost;
    finalTotal.textContent = formatCurrency(total);
}

async function submitOrder() {
    showCheckoutLoading();
    
    try {
        // Preparar dados do cliente
        const customerData = {
            name: document.getElementById('customer-name').value.trim(),
            email: document.getElementById('customer-email').value.trim(),
            phone: document.getElementById('customer-phone').value.trim(),
            document: document.getElementById('customer-document').value.trim(),
            company: document.getElementById('customer-company').value.trim(),
            companyDocument: document.getElementById('customer-company-document').value.trim(),
            // Endereço
            cep: document.getElementById('customer-cep').value.trim(),
            address: document.getElementById('customer-address').value.trim(),
            number: document.getElementById('customer-number').value.trim(),
            complement: document.getElementById('customer-complement').value.trim(),
            neighborhood: document.getElementById('customer-neighborhood').value.trim(),
            city: document.getElementById('customer-city').value.trim(),
            state: document.getElementById('customer-state').value.trim(),
            notes: document.getElementById('customer-notes').value.trim()
        };
        
        // Validar dados obrigatórios
        const validationError = validateCustomerData(customerData);
        if (validationError) {
            throw new Error(validationError);
        }
        
        // Calcular total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Preparar dados do pedido para a nova API ERP
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = parseFloat(window.selectedShippingCost || 0);
        const orderData = {
            customerName: customerData.name,
            customerEmail: customerData.email,
            customerPhone: customerData.phone,
            customerDocument: customerData.document,
            customerCompany: customerData.company,
            customerCompanyDocument: customerData.companyDocument,
            // Endereço de entrega
            deliveryAddress: {
                cep: customerData.cep,
                address: customerData.address,
                number: customerData.number,
                complement: customerData.complement,
                neighborhood: customerData.neighborhood,
                city: customerData.city,
                state: customerData.state
            },
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                grain: item.selectedGrain || '',
                notes: item.notes || ''
            })),
            subtotal: subtotal,
            shippingCost: shippingCost,
            shippingService: window.selectedShippingService,
            // Dados de pagamento
            paymentMethod: window.selectedPayment.method,
            paymentInstallments: window.selectedPayment.installments,
            paymentDiscount: window.selectedPayment.discount,
            paymentInterest: window.selectedPayment.interest,
            total: window.selectedPayment.finalTotal || (subtotal + shippingCost),
            type: 'pedido',
            paymentTerms: getPaymentTermsText(),
            deliveryTime: window.selectedShippingService ? window.selectedShippingService.name : 'A combinar',
            notes: customerData.notes
        };

        console.log('🛒 Enviando pedido via ERP API Manager...');
        
        // Usar Circuit Breaker para proteger contra falhas
        const response = await window.circuitBreaker.execute(async () => {
            return await window.erpAPI.sendOrder(orderData);
        });
        
        console.log('✅ Pedido enviado com sucesso via ERP API:', response);
        
        // Verificar se a resposta tem os campos esperados
        if (!response.success && !response.orderId && !response.orcamentoId) {
            throw new Error('Resposta inválida da API: ' + JSON.stringify(response));
        }
        
        // Limpar carrinho
        cart = [];
        updateCartUI();
        saveCart();
        
        // Mostrar sucesso com número correto
        const orderNumber = response.orcamentoNumero || response.orderNumber || response.orderId || response.orcamentoId || `ORDER_${Date.now()}`;
        showCheckoutSuccess(orderNumber);

        // Enviar cópia do pedido por email para os responsáveis
        try {
            await sendOrderEmailNotification(orderData, orderNumber);
            console.log('📨 Notificação de pedido enviada por email');
        } catch (emailErr) {
            console.warn('Não foi possível enviar notificação de pedido por email:', emailErr);
        }
        
        // Log metrics para debug
        const metrics = window.erpAPI.getMetrics();
        console.log('📊 ERP Metrics after order:', metrics);
        
    } catch (error) {
        console.error('❌ Erro ao enviar pedido:', error);
        
        // Usar error handler para mensagem amigável
        const friendlyError = window.erpErrorHandler.getUserFriendlyMessage(error);
        window.erpErrorHandler.logError(error, { 
            endpoint: 'orders', 
            context: 'checkout',
            customerEmail: document.getElementById('customer-email').value
        });
        
        // Verificar status do circuit breaker
        const cbStatus = window.circuitBreaker.getStatus();
        console.log('🔌 Circuit Breaker Status:', cbStatus);
        
        // Se o circuit breaker está aberto OU erro de rede/CORS ("Failed to fetch"), tentar fallback por contato
        const errorType = window.erpErrorHandler.classifyError(error);
        const isNetworkOrCors = errorType === 'network' || /failed to fetch/i.test(error.message);
        if (!cbStatus.canRetry || isNetworkOrCors) {
            console.log('🆘 Tentando método de fallback...');
            
            try {
                // Fallback: enviar via contato
                const fallbackResult = await sendOrderViaContactFallback(orderData);
                console.log('✅ Pedido enviado via fallback');
                
                // Limpar carrinho mesmo com fallback
                cart = [];
                updateCartUI();
                saveCart();
                
                showCheckoutSuccess(fallbackResult.orderId, true);
                return;
                
            } catch (fallbackError) {
                console.error('❌ Fallback também falhou:', fallbackError);
                // Continuar para mostrar erro
            }
        }
        
        // Mostrar erro
        showCheckoutError(friendlyError.message, error.message);
    }
}

// Função de fallback para enviar pedido via contato
async function sendOrderViaContactFallback(orderData) {
    const productsList = orderData.items.map(item => 
        `• ${item.name} ${item.grain ? `(Grão ${item.grain})` : ''} - Qtd: ${item.quantity} - Valor: R$ ${item.price.toFixed(2)}`
    ).join('\n');
    
    const contactMessage = `🛒 NOVO PEDIDO DA LOJA ONLINE (VIA FALLBACK)

📋 DADOS DO CLIENTE:
Nome: ${orderData.customerName}
Email: ${orderData.customerEmail}
${orderData.customerPhone ? `Telefone: ${orderData.customerPhone}` : ''}
${orderData.customerCompany ? `Empresa: ${orderData.customerCompany}` : ''}

🛍️ PRODUTOS SOLICITADOS:
${productsList}

💰 VALOR TOTAL: R$ ${orderData.total.toFixed(2)}

📝 OBSERVAÇÕES:
${orderData.notes || 'Nenhuma observação adicional'}

⏰ DATA/HORA: ${new Date().toLocaleString('pt-BR')}

---
⚠️ IMPORTANTE: Este pedido foi enviado via método de emergência.
Sistema principal indisponível no momento.
---`;

    const response = await window.erpAPI.sendContact({
        name: orderData.customerName,
        email: orderData.customerEmail,
        phone: orderData.customerPhone,
        company: orderData.customerCompany,
        subject: 'Pedido via fallback (Loja Abratecnica)',
        message: contactMessage,
        type: 'order_email',
        toRecipients: (window.ORDER_NOTIFICATION_EMAILS || [])
    });
    
    return {
        orderId: `FALLBACK-${Date.now().toString().slice(-6)}`,
        success: true,
        method: 'contact_fallback'
    };
}

function resetCheckoutForm() {
    // Limpar formulário
    document.getElementById('customerForm').reset();
    clearCheckoutErrors();
    
    // Reset ao primeiro step
    currentStep = 1;
    showStep(1);
}

// Função auxiliar para formatação de moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Função de compatibilidade (manter por compatibilidade)
function closeCheckout() {
    closeCheckoutModal();
}

// === MODALES DE PRODUCTOS ===
function openModal(productId) {
    const modal = document.getElementById('productModal');
    const modalContent = document.getElementById('modalContent');
    
    if (modal && modalContent) {
        const productData = getProductData(productId);
        modalContent.innerHTML = createProductModalContent(productData);
        modal.classList.add('show');
        modal.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

function getProductData(id) {
    const products = {
        'taladro': {
            name: 'Taladro Profesional HD-2000',
            price: 299.99,
            image: 'https://via.placeholder.com/500x400/e74c3c/ffffff?text=Taladro+Profesional',
            description: 'Taladro de alta potencia con motor de 850W, velocidad variable y mandril de 13mm. Ideal para trabajos profesionales en madera, metal y mampostería.',
            features: ['Motor de 850W', 'Velocidad variable 0-3000 RPM', 'Mandril de 13mm', 'Reversible', 'Luz LED integrada'],
            specs: {
                'Potencia': '850W',
                'Velocidad': '0-3000 RPM',
                'Mandril': '13mm',
                'Peso': '2.1 kg',
                'Garantía': '2 años'
            }
        },
        'destornilladores': {
            name: 'Kit Destornilladores Precisión',
            price: 89.99,
            image: 'https://via.placeholder.com/500x400/27ae60/ffffff?text=Kit+Destornilladores',
            description: 'Set profesional de 32 destornilladores de precisión con puntas intercambiables y estuche organizador.',
            features: ['32 puntas diferentes', 'Mango ergonómico', 'Estuche organizador', 'Acero templado', 'Puntas magnéticas'],
            specs: {
                'Cantidad': '32 piezas',
                'Material': 'Acero templado',
                'Mango': 'Ergonómico antideslizante',
                'Estuche': 'Incluido',
                'Garantía': '1 año'
            }
        }
        // Agregar más productos según sea necesario
    };
    
    return products[id] || {
        name: 'Producto',
        price: 0,
        image: 'https://via.placeholder.com/500x400/95a5a6/ffffff?text=Producto',
        description: 'Descripción del producto',
        features: [],
        specs: {}
    };
}

function createProductModalContent(product) {
    return `
        <div class="product-modal-content">
            <div class="product-modal-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-modal-info">
                <h2>${product.name}</h2>
                <div class="product-modal-price">$${product.price.toFixed(2)}</div>
                <div class="product-modal-description">
                    <p>${product.description}</p>
                </div>
                <div class="product-modal-features">
                    <h3>Características:</h3>
                    <ul>
                        ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
                <div class="product-modal-specs">
                    <h3>Especificaciones:</h3>
                    <table>
                        ${Object.entries(product.specs).map(([key, value]) => 
                            `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`
                        ).join('')}
                    </table>
                </div>
                <div class="product-modal-actions">
                    <div class="quantity-selector">
                        <button onclick="changeQuantity(this, -1)">-</button>
                        <input type="number" value="1" min="1" max="10">
                        <button onclick="changeQuantity(this, 1)">+</button>
                    </div>
                    <button class="btn btn-primary" onclick="addToCartFromModal('${product.name.toLowerCase().replace(/\s+/g, '')}', '${product.name}', ${product.price})">
                        <i class="fas fa-cart-plus"></i> Añadir al Carrito
                    </button>
                </div>
            </div>
        </div>
    `;
}

function addToCartFromModal(id, name, price) {
    const quantityInput = document.querySelector('.product-modal-actions input[type="number"]');
    const quantity = parseInt(quantityInput?.value || 1);
    
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: quantity,
            image: getProductImage(id)
        });
    }
    
    updateCartUI();
    saveCartToStorage();
    closeModal();
    
    // Mostrar mensaje de éxito
    showNotification('Produto adicionado ao carrinho', 'success');
}

// === FORMULARIOS ===
function initializeForms() {
    // Formulario de contacto
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Formulario de checkout
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutForm);
    }
}

function handleContactForm(e) {
    e.preventDefault();
    
    // Simular envio
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    
    button.textContent = 'Enviando...';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = 'Mensagem Enviada ✓';
        button.style.background = '#27ae60';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
            button.disabled = false;
            e.target.reset();
        }, 2000);
    }, 1500);
    
    showNotification('Mensagem enviada com sucesso', 'success');
}

function handleCheckoutForm(e) {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    
    button.textContent = 'Procesando...';
    button.disabled = true;
    
    setTimeout(() => {
        // Simular procesamiento exitoso
        cart = [];
        updateCartUI();
        saveCartToStorage();
        closeCheckout();
        
        showNotification('Pedido confirmado! Entraremos em contato em breve.', 'success');
        
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}

// === EFECTOS DE SCROLL ===
function initializeScrollEffects() {
    window.addEventListener('scroll', handleScroll);
}

function handleScroll() {
    const navbar = document.querySelector('.navbar');

    // Umbral en px para activar el header reducido
    const SHRINK_THRESHOLD = 50;

    if (!navbar) return;

    // Alternar clase 'shrunk' para manejar tamaño y logo vía CSS
    if (window.scrollY > SHRINK_THRESHOLD) {
        navbar.classList.add('shrunk');
    } else {
        navbar.classList.remove('shrunk');
    }

    // Mantener compatibilidad visual: cambiar ligero fondo si se desea
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(26, 26, 26, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        // Restaurar al estilo por defecto (puede venir de CSS)
        navbar.style.background = '#ffffff';
        navbar.style.backdropFilter = 'none';
    }
}

// === ANIMACIONES ===
function initializeAnimations() {
    // Intersection Observer para animaciones
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar elementos para animación
    document.querySelectorAll('.service-card, .product-card, .shop-product-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// === NOTIFICACIONES ===
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Estilos para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// === PERSISTENCIA ===
function saveCartToStorage() {
    localStorage.setItem('abratecnica_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('abratecnica_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// === UTILIDADES ===
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// === EVENT LISTENERS GLOBALES ===

// Cerrar modales al hacer click fuera
window.addEventListener('click', function(e) {
    const productModal = document.getElementById('productModal');
    const checkoutModal = document.getElementById('checkoutModal');
    
    if (e.target === productModal) {
        closeModal();
    }
    if (e.target === checkoutModal) {
        closeCheckout();
    }
});

// Cerrar modales con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeCheckout();
        // El carrito ya NO se cierra automáticamente con ESC
        // Mantener abierto para permitir modificaciones continuas
        // if (isCartOpen) toggleCart();
    }
});

// DESHABILITADO: Auto-cerrar carrito al hacer click fuera
// Mantener carrito abierto para permitir modificaciones continuas sin interrupciones
// Los usuarios pueden cerrar manualmente usando el ícono del carrito o botón de cerrar
/*
document.addEventListener('click', function(e) {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartIcon = document.querySelector('.cart-icon');
    const checkoutModal = document.getElementById('checkoutModal');
    
    // No cerrar si está en checkout o interactuando con elementos del carrito
    if (isCartOpen && cartSidebar && 
        !cartSidebar.contains(e.target) && 
        !cartIcon.contains(e.target) &&
        (!checkoutModal || checkoutModal.style.display !== 'block') &&
        !e.target.closest('.shipping-calculator') &&
        !e.target.closest('.btn-checkout')) {
        toggleCart();
    }
});
*/

// Smooth scroll para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// === VÍDEOS DE FUNDO ===
function initializeBackgroundVideos() {
    // Inicializar vídeos do hero
    const heroVideos = document.querySelectorAll('.hero-video');
    if (heroVideos.length > 0) {
        startVideoRotation(heroVideos, 'hero');
    }
    
    // Inicializar vídeos do page-header
    const headerVideos = document.querySelectorAll('.page-header-video');
    if (headerVideos.length > 0) {
        startVideoRotation(headerVideos, 'header');
    }
}

function startVideoRotation(videos, type) {
    if (videos.length === 0) return;
    
    let currentIndex = 0;
    
    // Configurar todos os vídeos
    videos.forEach((video, index) => {
        video.style.opacity = index === 0 ? '1' : '0';
        
        // Tentar carregar e reproduzir vídeo
        video.addEventListener('loadstart', () => {
            video.play().catch(console.log);
        });
        
        // Fallback se vídeo não carregar
        video.addEventListener('error', () => {
            console.log(`Erro ao carregar vídeo ${index + 1}`);
            const section = video.closest('.hero, .page-header');
            if (section) {
                section.classList.add('no-video');
            }
        });
        
        // Tentar carregar vídeo
        video.load();
    });
    
    // Função para trocar vídeo
    function switchVideo() {
        // Fade out do vídeo atual
        videos[currentIndex].style.opacity = '0';
        
        // Próximo vídeo
        currentIndex = (currentIndex + 1) % videos.length;
        
        // Fade in do próximo vídeo
        setTimeout(() => {
            videos[currentIndex].style.opacity = '1';
            videos[currentIndex].currentTime = 0; // Reiniciar vídeo
            videos[currentIndex].play().catch(console.log);
        }, 1000);
    }
    
    // Trocar vídeo a cada 8 segundos
    setInterval(switchVideo, 8000);
    
    // Garantir que o primeiro vídeo comece a tocar
    setTimeout(() => {
        videos[0].play().catch(console.log);
    }, 500);
}

// Função para pausar/resumir vídeos quando a página não está visível
document.addEventListener('visibilitychange', function() {
    const videos = document.querySelectorAll('.hero-video, .page-header-video');
    
    if (document.hidden) {
        videos.forEach(video => video.pause());
    } else {
        videos.forEach(video => {
            if (video.style.opacity === '1' || video.classList.contains('active')) {
                video.play().catch(console.log);
            }
        });
    }
});

// Agregar estilos CSS dinámicos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
    }
    
    .product-modal-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        padding: 2rem;
    }
    
    .product-modal-image img {
        width: 100%;
        border-radius: 10px;
    }
    
    .product-modal-price {
        font-size: 2rem;
        color: #e74c3c;
        font-weight: bold;
        margin: 1rem 0;
    }
    
    .product-modal-features ul {
        list-style: none;
        padding: 0;
    }
    
    .product-modal-features li {
        padding: 5px 0;
        border-bottom: 1px solid #eee;
    }
    
    .product-modal-features li:before {
        content: "✓ ";
        color: #27ae60;
        font-weight: bold;
    }
    
    .product-modal-specs table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }
    
    .product-modal-specs td {
        padding: 8px;
        border-bottom: 1px solid #eee;
    }
    
    .product-modal-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-top: 2rem;
    }
    
    .empty-cart {
        text-align: center;
        padding: 2rem;
        color: #666;
    }
    
    @media (max-width: 768px) {
        .product-modal-content {
            grid-template-columns: 1fr;
            gap: 1rem;
            padding: 1rem;
        }
        
        .notification {
            right: 10px !important;
            left: 10px !important;
            max-width: none !important;
        }
    }
`;
document.head.appendChild(style);

// === BIBLIOTECAS MODERNAS ===
function initializeModernLibraries() {
    // Aguardar carregamento das bibliotecas
    setTimeout(() => {
        initializeAOS();
        initializeGSAP();
        initializeSwiper();
        initializeParticles();
        initializeTyped();
        initializeCounters();
        initializeTilt();
        initializeScrollReveal();
    }, 100);
}

// AOS - Animate On Scroll
function initializeAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1200,
            easing: 'ease-out-cubic',
            once: true,
            offset: 100,
            delay: 100
        });
    }
}

// GSAP - Animações avançadas
function initializeGSAP() {
    if (typeof gsap !== 'undefined') {
        // Registrar plugins (TextPlugin es opcional)
        try {
            if (typeof ScrollTrigger !== 'undefined' && typeof TextPlugin !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger, TextPlugin);
            } else if (typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);
            }
        } catch (e) {
            console.warn('GSAP plugin registration warning:', e);
        }
        
        // Animação do navbar
        gsap.to('.navbar', {
            scrollTrigger: {
                trigger: '.hero',
                start: 'bottom top',
                toggleActions: 'play none none reverse'
            },
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(10px)',
            duration: 0.3
        });
    }
}

// Swiper - Carrosséis modernos
function initializeSwiper() {
    if (typeof Swiper !== 'undefined') {
        // Services Swiper
        new Swiper('.services-swiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
            }
        });
        
        // Testimonials Swiper
        new Swiper('.testimonials-swiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.testimonials-swiper .swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
            }
        });
    }
}

// Particles.js - Fundo de partículas
function initializeParticles() {
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            particles: {
                number: { value: 50, density: { enable: true, value_area: 800 } },
                color: { value: '#ffffff' },
                shape: { type: 'circle' },
                opacity: { value: 0.3, random: false },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.2, width: 1 },
                move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
                modes: { repulse: { distance: 200, duration: 0.4 }, push: { particles_nb: 4 } }
            },
            retina_detect: true
        });
    }
}

// Typed.js - Efeito de digitação
function initializeTyped() {
    if (typeof Typed !== 'undefined') {
        const typedElement = document.getElementById('typed-hero');
        if (typedElement) {
            new Typed('#typed-hero', {
                strings: ['Bem-vindos à Abratecnica', 'Soluções Técnicas Avançadas', 'Inovação em Tecnologia', 'Qualidade Profissional'],
                typeSpeed: 70,
                backSpeed: 30,
                backDelay: 2000,
                startDelay: 1000,
                loop: true,
                showCursor: true
            });
        }
    }
}

// Counters animados
function initializeCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        updateCounter();
    };
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });
        counters.forEach(counter => observer.observe(counter));
    }
}

// Tilt Effect
function initializeTilt() {
    const tiltElements = document.querySelectorAll('[data-tilt]');
    
    tiltElements.forEach(element => {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });
}

// ScrollReveal
function initializeScrollReveal() {
    if (typeof ScrollReveal !== 'undefined') {
        const sr = ScrollReveal({
            origin: 'bottom',
            distance: '60px',
            duration: 2000,
            delay: 200,
            reset: false
        });
        
        sr.reveal('.service-card', { interval: 200 });
        sr.reveal('.testimonial-card', { interval: 300 });
    }
}

// === PRODUCTOS DINÁMICOS ===
// Función para cargar productos desde el endpoint
async function loadProducts() {
    const loadingElement = document.getElementById('loading-products');
    const errorElement = document.getElementById('error-products');
    const productsGrid = document.getElementById('products-grid');
    const noProductsElement = document.getElementById('no-products');
    
    // Mostrar estado de carga
    if (loadingElement) loadingElement.style.display = 'block';
    if (errorElement) errorElement.style.display = 'none';
    if (productsGrid) productsGrid.style.display = 'none';
    if (noProductsElement) noProductsElement.style.display = 'none';
    
    try {
        // Usar la función apiRequest del archivo de configuración
        const products = await window.apiRequest(API_CONFIG.ENDPOINTS.PRODUCTS);
        
        // Ocultar estado de carga
        if (loadingElement) loadingElement.style.display = 'none';
    // DEBUG: mostrar objeto de respuesta para diagnosticar formatos inesperados
    try { console.debug('Raw products response:', response); } catch(e) {}
        
        if (products && products.length > 0) {
            displayProducts(products);
            if (productsGrid) productsGrid.style.display = 'grid';
        } else {
            if (noProductsElement) noProductsElement.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        
        // Mostrar estado de error
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'block';
    }
}

// Función para mostrar productos en el grid
function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    
    if (!productsGrid) return;
    
    // Limpiar el grid
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Función para crear una tarjeta de producto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-aos', 'fade-up');
    
    // Imagen placeholder si no hay imagen
    const imageUrl = product.imageUrl || `https://via.placeholder.com/400x300/e74c3c/ffffff?text=${encodeURIComponent(product.name || 'Produto')}`;
    const fallbackUrl = fallbackImageForProduct(product, '400x300');
    
    // Construir descripción usando los campos disponibles
    let description = product.description || '';
    
    // Agregar especificaciones técnicas si están disponibles
    const specs = [];
    if (product.diametroExt) specs.push(`Diâmetro: ${product.diametroExt}mm`);
    if (product.alturaRoda) specs.push(`Altura: ${product.alturaRoda}mm`);
    if (product.grao) specs.push(`Grão: ${product.grao}`);
    if (product.rpmMax) specs.push(`RPM Máx: ${product.rpmMax}`);
    if (product.weight) specs.push(`Peso: ${product.weight}kg`);
    
    if (specs.length > 0) {
        description += (description ? ' • ' : '') + specs.join(' • ');
    }
    
    // Si no hay descripción, usar información básica
    if (!description) {
        description = `${product.type || 'Produto técnico'} de alta qualidade.`;
        if (product.code) description += ` Código: ${product.code}`;
    }
    
    // Determinar estado do stock
    // Stock siempre disponible (oculto para el usuario)
    const hasStock = true;
    const price = product.price || 0;
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${imageUrl}" alt="${product.name || 'Produto'}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackUrl}';">
        </div>
        <div class="product-info">
            <h3>${product.name || 'Produto sem nome'}</h3>
            <p class="product-description">${description}</p>
            ${product.code ? `<p class="product-code">Código: ${product.code}</p>` : ''}
            ${price > 0 ? `<div class="product-price">R$ ${formatCurrency(price)}</div>` : ''}
            <div class="product-actions">
                ${hasStock && price > 0 ? `
                    <button 
                        class="btn-add-to-cart" 
                        onclick="addToCartFromProduct('${product.id}', '${product.name.replace(/'/g, "\\'")}', ${price})"
                    >
                        <i class="fas fa-cart-plus"></i> Adicionar
                    </button>
                ` : `
                    <button class="btn-add-to-cart disabled" disabled>
                        <i class="fas fa-ban"></i> Indisponível
                    </button>
                `}
            </div>
        </div>
    `;
    
    return card;
}

// Inicializar carga de produtos se estamos na página de produtos
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de produtos
    if (document.getElementById('products-grid')) {
        loadProducts();
    }
});

// Función para formatear precio (si es necesario)
function formatPrice(price) {
    if (typeof price === 'number') {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    }
    return price;
}

// === FORMULÁRIO DE CONTATO ===
// Función para inicializar el formulario de contacto
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
}

// Función para manejar el envío del formulario
async function handleContactFormSubmit(event) {
    event.preventDefault();
    
    // Limpiar errores previos
    clearFormErrors();
    
    // Obtener datos del formulario
    const formData = {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        message: document.getElementById('contact-message').value.trim()
    };
    
    // Validar campos
    if (!validateContactForm(formData)) {
        return;
    }
    
    // Mostrar estado de loading
    showFormLoading();
    
    try {
        // Enviar datos usando el ERP API Manager (retry, timeout, métricas)
        const response = await window.erpAPI.sendContact(formData);

        if (response && response.success !== false) {
            showFormSuccess();
        } else {
            showFormError((response && (response.error || response.message)) || 'Erro ao enviar mensagem');
        }
        
    } catch (error) {
        console.error('Error sending contact form:', error);
        showFormError('Erro de conexão. Verifique sua internet e tente novamente.');
    }
}

// Función para validar el formulario
function validateContactForm(data) {
    let isValid = true;
    
    // Validar nombre
    if (!data.name || data.name.length < 2) {
        showFieldError('name-error', 'Nome deve ter pelo menos 2 caracteres');
        document.getElementById('contact-name').classList.add('error');
        isValid = false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        showFieldError('email-error', 'Email inválido');
        document.getElementById('contact-email').classList.add('error');
        isValid = false;
    }
    
    // Validar mensaje
    if (!data.message || data.message.length < 10) {
        showFieldError('message-error', 'Mensagem deve ter pelo menos 10 caracteres');
        document.getElementById('contact-message').classList.add('error');
        isValid = false;
    }
    
    return isValid;
}

// Función para mostrar error en campo específico
function showFieldError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

// Función para limpiar errores del formulario
function clearFormErrors() {
    const errorElements = document.querySelectorAll('.field-error');
    const inputElements = document.querySelectorAll('#contactForm input, #contactForm textarea');
    
    errorElements.forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
    
    inputElements.forEach(el => {
        el.classList.remove('error');
    });
}

// Estados do formulário
function showFormLoading() {
    document.getElementById('form-fields').style.display = 'none';
    document.getElementById('form-loading').style.display = 'block';
    document.getElementById('form-success').style.display = 'none';
    document.getElementById('form-error').style.display = 'none';
}

function showFormSuccess() {
    document.getElementById('form-fields').style.display = 'none';
    document.getElementById('form-loading').style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
    document.getElementById('form-error').style.display = 'none';
}

function showFormError(message) {
    document.getElementById('form-fields').style.display = 'none';
    document.getElementById('form-loading').style.display = 'none';
    document.getElementById('form-success').style.display = 'none';
    document.getElementById('form-error').style.display = 'block';
    document.getElementById('error-message').textContent = message;
}

function showContactForm() {
    document.getElementById('form-fields').style.display = 'block';
    document.getElementById('form-loading').style.display = 'none';
    document.getElementById('form-success').style.display = 'none';
    document.getElementById('form-error').style.display = 'none';
    clearFormErrors();
}

function resetContactForm() {
    // Limpar campos
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-email').value = '';
    document.getElementById('contact-message').value = '';
    
    // Mostrar formulário
    showContactForm();
}

// Inicializar formulário de contato quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    initializeContactForm();
    
    // Cargar productos de la loja se estiver na página da loja
    if (document.getElementById('shopProductsGrid')) {
        loadShopProducts();
    }
});

// === GESTIÓN DE STOCK ===
// Función para determinar el estado del stock
function getStockStatus(stock) {
    if (!stock || stock === 0) {
        return {
            class: 'out-of-stock',
            text: 'Fora de Estoque'
        };
    } else if (stock <= 5) {
        return {
            class: 'low-stock',
            text: 'Estoque Baixo'
        };
    } else if (stock <= 20) {
        return {
            class: 'medium-stock', 
            text: 'Estoque Médio'
        };
    } else {
        return {
            class: 'high-stock',
            text: 'Em Estoque'
        };
    }
}

// Función para actualizar stock de un producto específico
async function refreshProductStock(productId) {
    const stockElement = document.getElementById(`stock-${productId}`);
    const refreshButton = document.querySelector(`button[onclick="refreshProductStock('${productId}')"]`);
    
    if (!stockElement || !refreshButton) return;
    
    // Mostrar estado de carga
    refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    refreshButton.disabled = true;
    
    try {
        // Fazer requisição para obter stock atualizado
        const response = await window.apiRequest(`${API_CONFIG.ENDPOINTS.STOCK}/${productId}`);
        
        if (response.productId && response.stock !== undefined) {
            // Atualizar indicador de stock
            const stockStatus = getStockStatus(response.stock);
            stockElement.className = `stock-indicator ${stockStatus.class}`;
            stockElement.innerHTML = `
                <span class="stock-dot"></span>
                <span class="stock-text">${stockStatus.text}</span>
                <span class="stock-count">(${response.stock})</span>
            `;
            
            // Atualizar botão de adicionar ao carrinho
            const productCard = stockElement.closest('.product-card');
            const addToCartButton = productCard.querySelector('.btn-add-to-cart:not(.btn-refresh-stock)');
            const outOfStockOverlay = productCard.querySelector('.out-of-stock-overlay');
            
            if (addToCartButton) {
                if (response.stock > 0) {
                    addToCartButton.disabled = false;
                    addToCartButton.classList.remove('disabled');
                    addToCartButton.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar';
                    if (outOfStockOverlay) outOfStockOverlay.remove();
                } else {
                    addToCartButton.disabled = true;
                    addToCartButton.classList.add('disabled');
                    addToCartButton.innerHTML = '<i class="fas fa-ban"></i> Indisponível';
                    if (!outOfStockOverlay) {
                        const productImage = productCard.querySelector('.product-image');
                        productImage.insertAdjacentHTML('beforeend', '<div class="out-of-stock-overlay">Fora de Estoque</div>');
                    }
                }
            }
            
            // Mostrar animação de sucesso
            stockElement.classList.add('updated');
            setTimeout(() => stockElement.classList.remove('updated'), 1000);
            
        } else {
            throw new Error('Invalid response format');
        }
        
    } catch (error) {
        console.error('Error refreshing stock:', error);
        
        // Mostrar erro temporariamente
        const originalHTML = stockElement.innerHTML;
        stockElement.innerHTML = '<span class="stock-error">Erro ao atualizar</span>';
        setTimeout(() => {
            stockElement.innerHTML = originalHTML;
        }, 2000);
    } finally {
        // Restaurar botão
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshButton.disabled = false;
    }
}

// Función para agregar producto al carrito desde la página de produtos
function addToCartFromProduct(productId, productName, price) {
    // Preferir la función addToCart existente (más completa)
    if (typeof addToCart === 'function') {
        try {
            // addToCart en el código original espera (id, name, price, buttonElement)
            // Intentamos llamar sin buttonElement; la función debe manejarlo.
            addToCart(productId, productName, price);
            return;
        } catch (e) {
            console.warn('addToCart threw, fallback to internal cart handler', e);
        }
    }

    // Fallback coherente: usar la variable global `cart` y las utilidades ya definidas
    if (typeof cart === 'undefined') window.cart = [];

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: price,
            quantity: 1
        });
    }

    // Guardar usando la función estándar y actualizar la UI del carrito
    try {
        saveCartToStorage();
    } catch (e) {
        // En caso de que la función no exista por algún motivo
        localStorage.setItem('abratecnica_cart', JSON.stringify(cart));
    }

    try {
        updateCartUI();
    } catch (e) {
        console.warn('updateCartUI failed after adding product', e);
    }

    showNotification(`${productName} adicionado ao carrinho!`, 'success');
}

// === LOJA/TIENDA ===

// Variables de paginación
let currentPage = 1;
let itemsPerPage = 15;
let totalProducts = 0;
let allProducts = [];
let originalProducts = []; // Para guardar todos los productos sin filtrar

// Función para agrupar productos SOLO por SKU (campo code)
function groupProductsByBase(products) {
    console.log('🔧 Iniciando agrupamento EXCLUSIVO por SKU (campo code):', products.length);
    
    // Mostrar todos los SKUs para análisis
    console.log('\n📋 SKUs encontrados:');
    products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   SKU: ${product.code}`);
        console.log(`   Precio: R$ ${product.price}`);
    });
    
    const grouped = {};
    const processedProducts = new Set();
    
    // Analizar SOLO los SKUs para encontrar prefijos comunes
    const skuGroups = {};
    
    // Probar diferentes longitudes de prefijo de SKU
    for (let prefixLength = 6; prefixLength <= 12; prefixLength++) {
        const currentGroups = {};
        
        products.forEach(product => {
            if (product.code && product.code.length > prefixLength) {
                const prefix = product.code.substring(0, prefixLength);
                
                if (!currentGroups[prefix]) {
                    currentGroups[prefix] = [];
                }
                currentGroups[prefix].push(product);
            }
        });
        
        // Buscar prefijos con múltiples productos
        Object.entries(currentGroups).forEach(([prefix, productsInGroup]) => {
            if (productsInGroup.length > 1) {
                console.log(`\n🎯 Prefijo ${prefix} (${prefixLength} chars): ${productsInGroup.length} produtos`);
                productsInGroup.forEach(p => {
                    console.log(`   • ${p.name} → SKU: ${p.code}`);
                });
                
                // Solo usar si no hay un grupo más específico ya creado
                if (!skuGroups[prefix]) {
                    skuGroups[prefix] = {
                        products: productsInGroup,
                        prefixLength: prefixLength
                    };
                }
            }
        });
    }
    
    // Procesar grupos encontrados (empezar por prefijos más largos)
    const sortedPrefixes = Object.entries(skuGroups)
        .sort(([,a], [,b]) => b.prefixLength - a.prefixLength);
    
    sortedPrefixes.forEach(([prefix, groupInfo]) => {
        const { products: groupProducts } = groupInfo;
        
        // Verificar que ningún producto ya fue procesado
        const unprocessedProducts = groupProducts.filter(p => !processedProducts.has(p.code));
        
        if (unprocessedProducts.length > 1) {
            console.log(`\n✅ Creando grupo para prefijo SKU: ${prefix}`);
            
            // Crear nombre base común (parte común de los nombres)
            const productNames = unprocessedProducts.map(p => p.name);
            const baseName = findCommonProductName(productNames);
            const baseId = `sku-group-${prefix}`;
            
            console.log(`   Nombre base: ${baseName}`);
            
            // Crear producto base usando el primer producto del grupo
            const baseProduct = unprocessedProducts[0];
            grouped[baseId] = {
                ...baseProduct,
                id: baseId,
                name: baseName,
                variants: [],
                description: baseProduct.description,
                imageUrl: baseProduct.imageUrl,
                type: baseProduct.type,
                published: baseProduct.published
            };
            
            // Crear variantes para cada producto del grupo
            unprocessedProducts.forEach((product, index) => {
                const skuSuffix = product.code.substring(prefix.length);
                const variantDisplayName = createVariantNameFromProduct(product, baseName);
                
                const variant = {
                    value: variantDisplayName,
                    sku: skuSuffix || `v${index + 1}`,
                    price: product.price || 0,
                    currentStock: product.currentStock || 0,
                    stock: product.currentStock || 0,
                    code: product.code, // SKU completo original
                    name: variantDisplayName,
                    // Propiedades del producto original
                    grao: product.grao,
                    diametroExt: product.diametroExt,
                    alturaRoda: product.alturaRoda,
                    encaixe: product.encaixe,
                    type: product.type,
                    originalId: product.id,
                    originalName: product.name
                };
                
                grouped[baseId].variants.push(variant);
                processedProducts.add(product.code);
                
                console.log(`   ➕ Variante: ${variantDisplayName}`);
                console.log(`      SKU original: ${product.code}`);
                console.log(`      SKU sufijo: ${skuSuffix}`);
                console.log(`      Precio: R$ ${product.price}`);
                
                // Usar primer producto para datos base
                if (index === 0) {
                    grouped[baseId].price = product.price;
                    grouped[baseId].currentStock = product.currentStock;
                }
            });
        }
    });
    
    // Agregar productos que NO se agruparon como productos individuales
    products.forEach(product => {
        if (!processedProducts.has(product.code)) {
            grouped[product.code || product.id] = {
                ...product,
                variants: []
            };
            console.log(`📝 Produto individual: ${product.name} (SKU: ${product.code})`);
        }
    });
    
    const result = Object.values(grouped);
    
    console.log('\n🎉 RESULTADO FINAL DEL AGRUPAMENTO POR SKU:');
    console.log(`   Produtos originais: ${products.length}`);
    console.log(`   Produtos agrupados: ${result.length}`);
    
    const withVariants = result.filter(p => p.variants && p.variants.length > 1);
    console.log(`   Produtos com variantes: ${withVariants.length}`);
    
    result.forEach((product, index) => {
        const variantCount = product.variants ? product.variants.length : 0;
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   Variantes: ${variantCount}`);
        
        if (variantCount > 1) {
            product.variants.forEach((variant, vIndex) => {
                console.log(`      ${vIndex + 1}. ${variant.value}`);
                console.log(`         SKU: ${variant.code}`);
                console.log(`         Preço: R$ ${variant.price}`);
            });
        }
    });
    
    return result;
}

// Función auxiliar para encontrar nombre común entre productos
function findCommonProductName(names) {
    if (names.length === 0) return 'Produto';
    if (names.length === 1) return names[0];
    
    // Encontrar palabras común al inicio
    const words = names[0].split(' ');
    let commonWords = [];
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const isCommon = names.every(name => 
            name.toLowerCase().includes(word.toLowerCase())
        );
        
        if (isCommon) {
            commonWords.push(word);
        }
    }
    
    let result = commonWords.join(' ').trim();
    
    // Si el resultado es muy corto, usar el nombre más corto
    if (result.length < 8) {
        result = names.reduce((shortest, name) => 
            name.length < shortest.length ? name : shortest
        );
        
        // Limpiar información específica del final
        result = result.replace(/\s+(x\d+|\(\w+\)|\d+mm.*|Grão.*|MF-\d+.*)$/i, '');
    }
    
    return result.trim() || names[0];
}

// Función auxiliar para crear nombre de variante desde el producto
function createVariantNameFromProduct(product, baseName) {
    // Intentar extraer la diferencia específica
    let variantName = product.name.replace(baseName, '').trim();
    
    // Si no hay diferencia clara, usar propiedades del producto
    if (!variantName || variantName === product.name) {
        const specs = [];
        
        if (product.diametroExt && product.alturaRoda) {
            specs.push(`${product.diametroExt}x${product.alturaRoda}mm`);
        } else if (product.diametroExt) {
            specs.push(`⌀${product.diametroExt}mm`);
        }
        
        if (product.grao && product.grao.trim()) {
            specs.push(`Grão ${product.grao}`);
        }
        
        if (product.encaixe && !product.encaixe.includes('Furo')) {
            specs.push(product.encaixe);
        }
        
        variantName = specs.length > 0 ? specs.join(' ') : `SKU ${product.code.slice(-4)}`;
    }
    
    // Limpiar el resultado
    variantName = variantName.replace(/^[\s\-\(\)]+|[\s\-\(\)]+$/g, '');
    
    return variantName || `Variante ${product.code.slice(-4)}`;
}

// Función auxiliar para encontrar nombre base común
function findCommonBaseName(names) {
    if (names.length === 0) return 'Produto';
    if (names.length === 1) return names[0];
    
    // Encontrar la parte común al inicio de todos los nombres
    let commonStart = names[0];
    for (let i = 1; i < names.length; i++) {
        let j = 0;
        while (j < commonStart.length && j < names[i].length && 
               commonStart[j].toLowerCase() === names[i][j].toLowerCase()) {
            j++;
        }
        commonStart = commonStart.substring(0, j);
    }
    
    // Limpiar el resultado
    commonStart = commonStart.trim();
    
    // Si queda muy corto, usar el nombre más corto
    if (commonStart.length < 10) {
        commonStart = names.reduce((shortest, name) => 
            name.length < shortest.length ? name : shortest
        );
        
        // Remover información específica de variante del final
        commonStart = commonStart.replace(/\s+(x\d+|\(\w+\)|Grão\s+\w+|MF-\d+|\d+mm).*$/i, '');
    }
    
    return commonStart.trim() || 'Produto';
}

// Función auxiliar para crear nombre de display de variante
function createVariantDisplayName(product, baseName) {
    // Intentar extraer la diferencia del nombre base
    let variantPart = product.name.replace(baseName, '').trim();
    
    // Si no hay diferencia clara, usar propiedades del producto
    if (!variantPart || variantPart === product.name) {
        const parts = [];
        
        if (product.grao && product.grao.trim()) {
            parts.push(`Grão ${product.grao}`);
        }
        if (product.diametroExt && product.alturaRoda) {
            parts.push(`${product.diametroExt}x${product.alturaRoda}mm`);
        } else if (product.diametroExt) {
            parts.push(`⌀${product.diametroExt}mm`);
        }
        if (product.encaixe && product.encaixe !== 'N/A') {
            parts.push(product.encaixe);
        }
        
        variantPart = parts.length > 0 ? parts.join(' ') : `SKU ${product.code.slice(-4)}`;
    }
    
    // Limpiar caracteres innecesarios del inicio
    variantPart = variantPart.replace(/^[\s\-\(\)]+/, '').replace(/[\s\-\(\)]+$/, '');
    
    return variantPart || `Variante ${product.code.slice(-4)}`;
}

// FUNÇÃO DEBUG PARA DIAGNOSTICAR PROBLEMAS DE SKU
function groupProductsByBase_Debug(products) {
    console.log('🔧 INICIANDO AGRUPAMENTO DEBUG');
    console.log('   Produtos recebidos:', products.length);
    
    // Analisar padrões
    const patterns = {
        withHyphenInId: 0,
        withHyphenInName: 0,
        withVariantFields: 0,
        withCode: 0
    };
    
    products.forEach((product, index) => {
        if (product.id && product.id.includes('-')) patterns.withHyphenInId++;
        if (product.name && product.name.includes(' - ')) patterns.withHyphenInName++;
        if (product.grao || product.diametroExt || product.alturaRoda || product.encaixe) patterns.withVariantFields++;
        if (product.code) patterns.withCode++;
        
        // Log dos primeiros 3 produtos
        if (index < 3) {
            console.log(`\n🔍 Produto ${index + 1}:`);
            console.log('  ID:', product.id);
            console.log('  Nome:', product.name);
            console.log('  Code:', product.code);
            console.log('  Grão:', product.grao);
            console.log('  Diâmetro:', product.diametroExt);
        }
    });
    
    console.log('\n📊 Padrões encontrados:');
    Object.entries(patterns).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
    
    // Se não há padrões claros, retornar produtos simples
    if (patterns.withHyphenInName < 2 && patterns.withVariantFields < 2) {
        console.log('⚠️  Poucos padrões de variante detectados. Retornando produtos simples.');
        return products.map(product => ({
            ...product,
            variants: []
        }));
    }
    
    // Continuar com agrupamento normal
    return groupProductsByBase(products);
}

// Função de teste para verificar agrupamento (remover em produção)
function testProductGrouping() {
    const sampleProducts = [
        {
            id: "prod1-var1",
            name: "Disco Abrasivo - Grão 40",
            price: 25.90,
            currentStock: 10,
            code: "var1",
            grao: "40"
        },
        {
            id: "prod1-var2", 
            name: "Disco Abrasivo - Grão 60",
            price: 27.90,
            currentStock: 15,
            code: "var2",
            grao: "60"
        },
        {
            id: "prod2",
            name: "Lixa Simples",
            price: 5.90,
            currentStock: 20,
            code: "simple"
        }
    ];
    
    console.log('=== TESTE DE AGRUPAMENTO ===');
    console.log('Produtos originais:', sampleProducts);
    const grouped = groupProductsByBase(sampleProducts);
    console.log('Produtos agrupados:', grouped);
    console.log('Produto com variantes:', grouped[0]);
    console.log('Produto sem variantes:', grouped[1]);
    return grouped;
}

// Función para cargar productos de la tienda
async function loadShopProducts() {
    const loadingElement = document.getElementById('shop-loading');
    const errorElement = document.getElementById('shop-error');
    const productsGrid = document.getElementById('shopProductsGrid');
    const noProductsElement = document.getElementById('shop-no-products');
    const paginationContainer = document.getElementById('paginationContainer');
    const isFileProtocol = window.location.protocol === 'file:';
    
    // Mostrar estado de carga
    if (loadingElement) loadingElement.style.display = 'block';
    if (errorElement) errorElement.style.display = 'none';
    if (productsGrid) productsGrid.style.display = 'none';
    if (noProductsElement) noProductsElement.style.display = 'none';
    if (paginationContainer) paginationContainer.style.display = 'none';
    
    try {
        if (isFileProtocol) {
            console.warn('Atenção: a página está aberta via file://. Para evitar erros de CORS, use o servidor local (http://localhost:8080/tienda.html).');
        }
        // Usar a nova API ERP com sistema de retry e cache
        console.log('🔄 Loading products from ERP...');

        let response = null;
        const apiUrl = 'https://studio--firebase-explorer-7hc2p.us-central1.hosted.app/api/products';

        // Strategy: try ERP manager -> local server proxy (if on localhost) -> direct fetch -> public CORS proxy -> local products.json fallback
        try {
            // Método 1: Via ERP API Manager (preferido, com retry/backoff)
            if (window.erpAPI && typeof window.erpAPI.getProducts === 'function') {
                try {
                    response = await window.erpAPI.getProducts();
                    console.log('✅ ERP API Manager returned response');
                } catch (e) {
                    console.warn('ERP API Manager failed:', e.message || e);
                    response = null;
                }
            }

            // Método 2: Se estamos sirvendo desde un servidor local, intentar el proxy PHP interno
            const isLocalhost = /(^localhost$)|(^127\.0\.0\.1$)/.test(window.location.hostname);
            if (!response && isLocalhost) {
                try {
                    const proxyResp = await fetch('/api/erp-proxy.php', { method: 'GET', cache: 'no-cache' });
                    if (proxyResp.ok) {
                        const proxyData = await proxyResp.json();
                        // Si el proxy devuelve un objeto con success:false, propagar
                        if (proxyData && proxyData.success === false && proxyData.body) {
                            response = proxyData.body;
                        } else {
                            response = proxyData;
                        }
                        console.log('✅ ERP proxy (/api/erp-proxy.php) funcionó');
                    } else {
                        console.warn('ERP proxy returned status', proxyResp.status);
                    }
                } catch (proxyErr) {
                    console.warn('ERP proxy failed:', proxyErr.message || proxyErr);
                }
            }

            // Método 3: Conexión directa al ERP
            if (!response) {
                try {
                    const directResponse = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-cache', mode: 'cors' });
                    if (directResponse.ok) {
                        const directData = await directResponse.json();
                        response = directData;
                        console.log('✅ Conexión directa al ERP funcionó');
                    } else {
                        throw new Error(`Direct API: ${directResponse.status} ${directResponse.statusText}`);
                    }
                } catch (directError) {
                    console.warn('Conexión directa falló:', directError.message || directError);
                }
            }

            // Método 4: Proxy CORS público como último recurso
            if (!response) {
                try {
                    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(apiUrl);
                    const proxyResponse = await fetch(proxyUrl, { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-cache', mode: 'cors' });
                    if (proxyResponse.ok) {
                        const proxyData = await proxyResponse.json();
                        response = proxyData;
                        console.log('✅ Proxy CORS público funcionó');
                    } else {
                        throw new Error(`Public proxy failed: ${proxyResponse.status}`);
                    }
                } catch (publicProxyError) {
                    console.warn('Public CORS proxy failed:', publicProxyError.message || publicProxyError);
                }
            }

            // Método 5: último recurso — tentar carregar products.json local (fallback para testes)
            if (!response) {
                try {
                    const localResp = await fetch('products.json');
                    if (localResp.ok) {
                        const localData = await localResp.json();
                        response = localData;
                        console.log('✅ Cargado products.json local como fallback');
                    } else {
                        console.warn('products.json no disponible en el servidor estático (status:', localResp.status, ')');
                    }
                } catch (localErr) {
                    console.warn('No se pudo cargar products.json local:', localErr.message || localErr);
                }
            }

            if (!response) throw new Error('No se pudo obtener datos del ERP por ninguna vía');

        } catch (e) {
            // Re-lanzar para el catch externo
            throw e;
        }
        
        // Ocultar estado de carga
        if (loadingElement) loadingElement.style.display = 'none';

        // DEBUG: mostrar objeto de respuesta para diagnosticar formatos inesperados
        try { console.debug('Raw products response:', response); } catch(e) {}

        // Normalizar diferentes formatos de respuesta del ERP
        let productsArray = [];
        if (Array.isArray(response)) {
            productsArray = response;
        } else if (response && Array.isArray(response.products)) {
            productsArray = response.products;
        } else if (response && response.data && Array.isArray(response.data)) {
            productsArray = response.data;
        } else if (response && Array.isArray(response.items)) {
            productsArray = response.items;
        } else if (response && Array.isArray(response.value)) {
            // Some ERP endpoints (or Firebase wrappers) return the array under `value`
            productsArray = response.value;
        }

        // Si la respuesta contiene un Count/total explícito, mostrarlo para debugging
        try {
            if (!productsArray.length && response && response.Count) {
                console.debug('API reports Count:', response.Count);
            }
        } catch (e) {
            // noop
        }

        if (productsArray && productsArray.length > 0) {
            const total = productsArray.length;
            const publishedCount = productsArray.filter(p => p.published !== false).length;
            console.log(`✅ Loaded ${publishedCount} published products (${total} total)`);

            // Agrupar produtos por ID base para recriar estrutura de variantes
            const groupedProducts = groupProductsByBase(productsArray);

            // Guardar todos los productos originales y actuales
            originalProducts = groupedProducts;
            allProducts = groupedProducts;
            totalProducts = groupedProducts.length;
            currentPage = 1;

            // Validar y corregir URLs de imagen antes de renderizar (fallbacks locales)
            try {
                await validateAndFixProductImages(groupedProducts);
            } catch (imgErr) {
                console.warn('Image validation failed:', imgErr);
            }

            // Mostrar productos de la primera página
            displayShopProductsWithPagination();

            if (productsGrid) productsGrid.style.display = 'grid';
            if (paginationContainer && totalProducts > itemsPerPage) {
                paginationContainer.style.display = 'flex';
            }

            // Mostrar métricas da API no console para debug
            const metrics = window.erpAPI.getMetrics ? window.erpAPI.getMetrics() : {};
            console.log('📊 ERP API Metrics:', metrics);

        } else {
            console.warn('⚠️ No published products found');
            if (noProductsElement) {
                noProductsElement.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-box-open" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                        <h3>Nenhum produto disponível</h3>
                        <p>Os produtos estão sendo carregados ou não há produtos publicados no momento.</p>
                        <button onclick="loadShopProducts()" class="btn btn-primary" style="margin-top: 20px;">
                            <i class="fas fa-sync-alt"></i> Tentar Novamente
                        </button>
                    </div>
                `;
                noProductsElement.style.display = 'block';
            }
        }
        
    } catch (error) {
        console.error('❌ Error loading shop products:', error);
        
        // Usar o error handler para criar mensagem amigável
        const friendlyError = window.erpErrorHandler.getUserFriendlyMessage(error);
        window.erpErrorHandler.logError(error, { endpoint: 'products', context: 'shop' });
        
        // Mostrar estado de erro
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) {
            errorElement.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 20px;"></i>
                    <h3 style="color: #e74c3c; margin-bottom: 15px;">${friendlyError.title}</h3>
                    <p style="color: #666; margin-bottom: 25px;">${friendlyError.message}</p>
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="loadShopProducts()" class="btn btn-primary">
                            <i class="fas fa-sync-alt"></i> ${friendlyError.action}
                        </button>
                        <button onclick="window.erpErrorHandler.exportErrorLogs()" class="btn btn-secondary" style="background: #6c757d;">
                            <i class="fas fa-download"></i> Exportar Logs
                        </button>
                    </div>
                    ${isFileProtocol ? `
                    <div style="margin-top: 20px; padding: 12px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; color: #856404;">
                        <strong>Dica:</strong> Você abriu o arquivo diretamente (file://). Para evitar bloqueios de navegador, use o servidor local:<br>
                        <code style="background:#f8f9fa; padding:4px 6px; border-radius:4px; display:inline-block; margin-top:6px;">http://localhost:8080/tienda.html</code><br>
                        (Use o atalho: tools/iniciar-servidor-simples.bat)
                    </div>
                    ` : ''}
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; font-size: 12px; color: #666;">
                        <strong>Para desenvolvedores:</strong><br>
                        Erro: ${error.message}<br>
                        Status ERP: ${window.erpAPI.erpStatus}<br>
                        Online: ${window.erpAPI.isOnline ? 'Sim' : 'Não'}
                    </div>
                </div>
            `;
            errorElement.style.display = 'block';
        }
    }
}

// Función para mostrar productos de la tienda en el grid
function displayShopProducts(products) {
    const productsGrid = document.getElementById('shopProductsGrid');
    
    if (!productsGrid) return;
    
    // Limpiar el grid
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createShopProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // Aplicar animações AOS se disponível
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

// Función para mostrar productos con paginación
function displayShopProductsWithPagination() {
    // Calcular índices de productos para la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Obtener productos de la página actual
    const currentPageProducts = allProducts.slice(startIndex, endIndex);
    
    // Mostrar productos
    displayShopProducts(currentPageProducts);
    
    // Actualizar información de paginación
    updatePaginationInfo();
    
    // Generar botones de paginación
    generatePaginationButtons();
    
    // Scroll suave hacia arriba
    const shopSection = document.querySelector('.shop-products');
    if (shopSection) {
        shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Función para actualizar información de paginación
function updatePaginationInfo() {
    const itemsRangeElement = document.getElementById('itemsRange');
    const totalItemsElement = document.getElementById('totalItems');
    
    if (!itemsRangeElement || !totalItemsElement) return;
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalProducts);
    
    itemsRangeElement.textContent = `${startItem}-${endItem}`;
    totalItemsElement.textContent = totalProducts;
}

// Función para generar botones de paginación
function generatePaginationButtons() {
    const paginationList = document.getElementById('paginationList');
    if (!paginationList) return;
    
    // Limpiar paginación existente
    paginationList.innerHTML = '';
    
    const totalPages = Math.ceil(totalProducts / itemsPerPage);
    
    // Botón "Anterior"
    const prevButton = createPaginationButton(
        '<i class="fas fa-chevron-left"></i>',
        currentPage - 1,
        currentPage <= 1
    );
    prevButton.title = 'Página anterior';
    paginationList.appendChild(prevButton);
    
    // Lógica para mostrar números de página
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Ajustar si estamos cerca del inicio o final
    if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
    }
    if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
    }
    
    // Primera página si no está visible
    if (startPage > 1) {
        paginationList.appendChild(createPaginationButton('1', 1, false));
        if (startPage > 2) {
            paginationList.appendChild(createPaginationEllipsis());
        }
    }
    
    // Páginas numeradas
    for (let i = startPage; i <= endPage; i++) {
        paginationList.appendChild(createPaginationButton(i, i, false, i === currentPage));
    }
    
    // Última página si no está visible
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationList.appendChild(createPaginationEllipsis());
        }
        paginationList.appendChild(createPaginationButton(totalPages, totalPages, false));
    }
    
    // Botón "Siguiente"
    const nextButton = createPaginationButton(
        '<i class="fas fa-chevron-right"></i>',
        currentPage + 1,
        currentPage >= totalPages
    );
    nextButton.title = 'Próxima página';
    paginationList.appendChild(nextButton);
}

// Función para crear botón de paginación
function createPaginationButton(text, page, disabled = false, active = false) {
    const li = document.createElement('li');
    li.className = 'pagination-item';
    
    const button = document.createElement('button');
    button.className = `pagination-link ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`;
    button.innerHTML = text;
    button.onclick = () => !disabled && !active && goToPage(page);
    
    li.appendChild(button);
    return li;
}

// Función para crear puntos suspensivos
function createPaginationEllipsis() {
    const li = document.createElement('li');
    li.className = 'pagination-item';
    
    const span = document.createElement('span');
    span.className = 'pagination-link disabled';
    span.innerHTML = '...';
    
    li.appendChild(span);
    return li;
}

// Función para ir a una página específica
function goToPage(page) {
    if (page < 1 || page > Math.ceil(totalProducts / itemsPerPage)) return;
    
    currentPage = page;
    displayShopProductsWithPagination();
}

// Función para crear una tarjeta de producto para la tienda
function createShopProductCard(product) {
    const card = document.createElement('div');
    card.className = 'shop-product-card';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-product-id', product.id);
    card.id = `shop-product-${product.id}`;
    
    // Agregar atributos para filtros
    card.setAttribute('data-category', getProductCategory(product.type));
    card.setAttribute('data-price', product.price || 0);
    card.setAttribute('data-name', product.name || 'Produto');
    
    // Imagen placeholder si no hay imagen
    const imageUrl = product.imageUrl || `https://via.placeholder.com/350x250/e74c3c/ffffff?text=${encodeURIComponent(product.name || 'Produto')}`;
    const fallbackUrl = fallbackImageForProduct(product, '350x250');
    
    // Construir descripción
    let description = product.description || '';
    if (!description) {
        const specs = [];
        if (product.diametroExt) specs.push(`Diâmetro: ${product.diametroExt}mm`);
        if (product.alturaRoda) specs.push(`Altura: ${product.alturaRoda}mm`);
        if (product.grao) specs.push(`Grão: ${product.grao}`);
        
        description = specs.length > 0 ? specs.join(' • ') : `${product.type || 'Produto técnico'} de alta qualidade.`;
    }
    
    // Determinar estado do stock (usar primera variante si existe)
    let currentStock = product.currentStock || 0;
    let currentPrice = product.price || 0;
    
    // Si hay variantes, usar los valores de la primera variante
    if (product.variants && product.variants.length > 0) {
        const firstVariant = product.variants[0];
        currentStock = firstVariant.currentStock || firstVariant.stock || 0;
        currentPrice = firstVariant.price || product.price || 0;
    }
    
    // Stock siempre disponible (oculto para el usuario)
    const hasStock = true;
    const price = currentPrice;
    
    // No mostrar badges relacionados con stock
    let badge = '';
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${imageUrl}" alt="${product.name || 'Produto'}" loading="lazy" data-original-src="${imageUrl}" data-name="${(product.name||'').replace(/"/g,'&quot;')}" data-size="350x250" onerror="handleProductImageError(this)">
            ${badge ? `<div class="product-badges">${badge}</div>` : ''}
        </div>
        <div class="product-info">
            <h3>${product.name || 'Produto sem nome'}</h3>
            
            <!-- Descripción desplegable -->
            <div class="product-description">
                <div class="product-description-preview">${truncateText(description, 80)}</div>
                ${description.length > 80 ? `
                    <div class="product-description-full" id="desc-full-${product.id}">${description}</div>
                    <button class="description-toggle" onclick="toggleDescription('${product.id}')" id="desc-toggle-${product.id}">
                        Ver mais <i class="fas fa-chevron-down"></i>
                    </button>
                ` : ''}
            </div>
            
            ${product.code ? `<p class="product-code">Cód: ${product.code}</p>` : ''}
            
            <!-- Selector de variantes de granos abrasivos -->
            ${createGrainVariantsSelector(product)}
            
            ${price > 0 ? `
                <div class="product-price" id="product-price-${product.id}">
                    <span class="current-price">R$ ${formatCurrency(price)}</span>
                </div>
            ` : ''}
            
            <div class="product-actions">
                <button 
                    class="btn-refresh-stock" 
                    onclick="refreshProductStock('${product.id}')"
                    title="Atualizar stock"
                >
                    <i class="fas fa-sync-alt"></i>
                </button>
                
                ${hasStock && price > 0 ? `
                    <div class="quantity-selector">
                        <button onclick="changeQuantity(this, -1)">-</button>
                        <input type="number" value="1" min="1" max="${Math.min(currentStock, 10)}">
                        <button onclick="changeQuantity(this, 1)">+</button>
                    </div>
                    <button class="btn-add-cart" onclick="addToCartFromShop('${product.id}', '${product.name.replace(/'/g, "\\'")}', ${price}, this)">
                        <i class="fas fa-cart-plus"></i> Adicionar
                    </button>
                ` : `
                    <button class="btn-add-cart disabled" disabled>
                        <i class="fas fa-ban"></i> Indisponível
                    </button>
                `}
            </div>
        </div>
    `;
    
    return card;
}

// Función para obtener categoría del producto
function getProductCategory(type) {
    if (!type) return 'outros';
    
    const categoryMap = {
        'ferramenta': 'herramientas',
        'ferramentas': 'herramientas', 
        'equipamento': 'equipos',
        'equipamentos': 'equipos',
        'componente': 'componentes',
        'componentes': 'componentes',
        'software': 'software'
    };
    
    return categoryMap[type.toLowerCase()] || 'outros';
}

// Función especializada para agregar al carrito desde la tienda
function addToCartFromShop(productId, productName, price, buttonElement) {
    // Obtener cantidad seleccionada
    const quantityInput = buttonElement.parentElement.querySelector('input[type="number"]');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    // Verificar si hay variantes seleccionadas
    const variantSelector = document.getElementById(`variants-${productId}`);
    let finalProductName = productName;
    let finalPrice = price;
    let variantInfo = '';
    
    if (variantSelector) {
        const selectedOption = variantSelector.options[variantSelector.selectedIndex];
        const variantName = selectedOption.dataset.name || selectedOption.text.split(' (')[0];
        const variantPrice = parseFloat(selectedOption.dataset.price) || price;
        
        finalProductName = `${productName} - ${variantName}`;
        finalPrice = variantPrice;
        variantInfo = ` (${variantName})`;
    }
    
    // Crear un ID único para la variante si existe
    const cartItemId = variantSelector ? 
        `${productId}-variant-${variantSelector.value}` : 
        productId;
    
    // Usar la función existente de addToCart pero con cantidad personalizada
    for (let i = 0; i < quantity; i++) {
        if (typeof addToCart === 'function') {
            addToCart(cartItemId, finalProductName, finalPrice, buttonElement);
        }
    }
    
    // Mostrar notificação com quantidade
    const quantityText = quantity > 1 ? ` (${quantity} unidades)` : '';
    showNotification(`${productName}${variantInfo}${quantityText} adicionado ao carrinho!`, 'success');
    
    // Reset quantity to 1
    if (quantityInput) quantityInput.value = 1;
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Mostrar com animação
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remover automaticamente após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// === FUNCIONES PARA DESCRIPCIONES DESPLEGABLES ===

// Función para truncar texto
function truncateText(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// Función para alternar descripción desplegable
function toggleDescription(productId) {
    const fullDesc = document.getElementById(`desc-full-${productId}`);
    const toggleBtn = document.getElementById(`desc-toggle-${productId}`);
    
    if (!fullDesc || !toggleBtn) return;
    
    const isExpanded = fullDesc.classList.contains('expanded');
    
    if (isExpanded) {
        // Ocultar descripción completa
        fullDesc.classList.remove('expanded');
        toggleBtn.innerHTML = 'Ver mais <i class="fas fa-chevron-down"></i>';
        toggleBtn.classList.remove('expanded');
    } else {
        // Mostrar descripción completa
        fullDesc.classList.add('expanded');
        toggleBtn.innerHTML = 'Ver menos <i class="fas fa-chevron-up"></i>';
        toggleBtn.classList.add('expanded');
    }
}

// === SISTEMA DE VARIANTES DE GRANOS ABRASIVOS ===

/*
EJEMPLO DE ESTRUCTURA DE PRODUCTO CON VARIANTES DE FIREBASE:

{
    "id": "abrasivo-001",
    "name": "Disco Abrasivo Industrial",
    "description": "Disco abrasivo de alta qualidade para uso industrial...",
    "imageUrl": "path/to/image.jpg",
    "code": "DAI-001",
    "type": "disco",
    "price": 25.50, // precio base (se puede sobrescribir por variante)
    "currentStock": 100, // stock base (se puede sobrescribir por variante)
    "published": true,
    "variants": [
        {
            "name": "Grão 36",
            "grao": "36",
            "currentStock": 50,
            "price": 25.50,
            "code": "DAI-001-G36"
        },
        {
            "name": "Grão 60",
            "grao": "60",
            "currentStock": 30,
            "price": 27.00,
            "code": "DAI-001-G60"
        },
        {
            "name": "Diâmetro 115mm",
            "diametroExt": "115",
            "currentStock": 20,
            "price": 28.50,
            "code": "DAI-001-D115"
        },
        {
            "name": "Encaixe 22.2mm",
            "encaixe": "22.2",
            "currentStock": 15,
            "price": 30.00,
            "code": "DAI-001-E22"
        }
    ]
}

NOTA: Las variantes pueden tener diferentes campos (grao, diametroExt, alturaRoda, encaixe, etc.)
El sistema detecta automáticamente qué tipo de variante es y muestra el selector apropiado.
*/

// Función para crear selector de variantes de productos
function createGrainVariantsSelector(product) {
    // Debug: mostrar información del producto
    console.log('🔧 Creando selector para producto:', product.name);
    console.log('   - ID:', product.id);
    console.log('   - Variantes:', product.variants);
    console.log('   - Número de variantes:', product.variants?.length || 0);
    
    // Verificar si el producto tiene variantes válidas
    if (!product.variants || !Array.isArray(product.variants) || product.variants.length < 2) {
        console.log('❌ Producto sin variantes suficientes:', product.name, 'Variantes:', product.variants?.length || 0);
        return '';
    }
    
    console.log('✅ Criando selector com', product.variants.length, 'variantes');
    
    // Determinar el tipo de variante basado en los campos disponibles
    const variantType = determineVariantType(product.variants);
    
    let variantsHtml = `
        <div class="grain-variants">
            <label class="variants-label">
                <i class="fas fa-cog"></i> ${variantType.label}:
            </label>
            <select class="grain-selector" id="variants-${product.id}" onchange="onVariantChange('${product.id}')">
    `;
    
    product.variants.forEach((variant, index) => {
        const isSelected = index === 0 ? 'selected' : '';
        const stock = variant.currentStock || variant.stock || 0;
        const stockText = stock > 0 ? `(${stock} disponível)` : '(Fora de estoque)';
        const disabled = stock <= 0 ? 'disabled' : '';
        const variantName = getVariantDisplayName(variant, variantType.field);
        const variantPrice = variant.price || product.price || 0;
        const priceText = variantPrice > 0 ? ` - R$ ${variantPrice.toFixed(2)}` : '';
        
        // Debug: mostrar dados da variante
        console.log(`🔍 Variante ${index}:`, {
            grao: variant.grao,
            grain: variant.grain,
            grau: variant.grau,
            name: variant.name,
            code: variant.code,
            variantName: variantName,
            price: variantPrice
        });
        
        variantsHtml += `
            <option value="${index}" ${isSelected} ${disabled} 
                    data-stock="${stock}" 
                    data-price="${variantPrice}" 
                    data-code="${variant.code || variant.gs1Code || ''}"
                    data-name="${variant.name || variantName}">
                ${variantName}${priceText} ${stockText}
            </option>
        `;
    });
    
    // Crear indicador inicial com nome melhorado
    const initialVariantName = getVariantDisplayName(product.variants[0], variantType.field);
    const initialPrice = product.variants[0].price || product.price || 0;
    
    variantsHtml += `
            </select>
            <div id="selected-grain-${product.id}" class="selected-grain-indicator">
                <div class="grain-display">
                    <i class="fas fa-check-circle"></i>
                    <span class="grain-selected">Selecionado: <strong>${initialVariantName}</strong></span>
                    ${initialPrice > 0 ? `<span class="grain-price"> - R$ ${initialPrice.toFixed(2)}</span>` : ''}
                </div>
            </div>
        </div>
    `;
    
    return variantsHtml;
}

// Función para determinar el tipo de variante
function determineVariantType(variants) {
    const firstVariant = variants[0];
    
    // Verificar qué campo de variante está presente
    if (firstVariant.grao !== undefined) {
        return { field: 'grao', label: 'Grão Abrasivo' };
    } else if (firstVariant.diametroExt !== undefined) {
        return { field: 'diametroExt', label: 'Diâmetro' };
    } else if (firstVariant.alturaRoda !== undefined) {
        return { field: 'alturaRoda', label: 'Altura' };
    } else if (firstVariant.encaixe !== undefined) {
        return { field: 'encaixe', label: 'Encaixe' };
    } else if (firstVariant.type !== undefined) {
        return { field: 'type', label: 'Tipo' };
    } else if (firstVariant.name !== undefined) {
        return { field: 'name', label: 'Variante' };
    }
    
    return { field: 'name', label: 'Opções' };
}

// Función para obtener el nombre de display de la variante
function getVariantDisplayName(variant, field) {
    switch (field) {
        case 'grao':
            // Tentar extrair o grão de diferentes campos possíveis
            let grainValue = variant.grao || variant.grain || variant.grau;
            
            // Se não tem valor direto, tentar extrair do nome
            if (!grainValue && variant.name) {
                const grainMatch = variant.name.match(/\b(\d+)\b/);
                grainValue = grainMatch ? grainMatch[1] : '';
            }
            
            // Se ainda não tem valor, tentar extrair do código
            if (!grainValue && (variant.code || variant.gs1Code)) {
                const code = variant.code || variant.gs1Code;
                const grainMatch = code.match(/\b(\d+)\b/);
                grainValue = grainMatch ? grainMatch[1] : '';
            }
            
            return grainValue ? `Grão ${grainValue}` : 'Grão';
        case 'diametroExt':
            return `⌀ ${variant.diametroExt}mm`;
        case 'alturaRoda':
            return `Alt. ${variant.alturaRoda}mm`;
        case 'encaixe':
            return `Encaixe ${variant.encaixe}`;
        case 'type':
            return variant.type;
        case 'name':
            return variant.name;
        default:
            return variant.name || `Variante ${field}`;
    }
}

// Función que se ejecuta cuando cambia la variante del producto
function onVariantChange(productId) {
    const selector = document.getElementById(`variants-${productId}`);
    if (!selector) return;
    
    const selectedOption = selector.options[selector.selectedIndex];
    const stock = parseInt(selectedOption.dataset.stock) || 0;
    const price = parseFloat(selectedOption.dataset.price) || 0;
    const code = selectedOption.dataset.code || '';
    const variantName = selectedOption.dataset.name || '';
    
    // Actualizar indicador de stock
    updateStockDisplay(productId, stock);
    
    // Actualizar precio
    updatePriceDisplay(productId, price);
    
    // Actualizar código del producto si existe
    updateProductCode(productId, code);
    
    // Actualizar indicador de grão selecionado
    updateSelectedGrainDisplay(productId, variantName);
    
    // Actualizar botones de acción
    updateActionButtons(productId, stock, price);
    
    // Guardar la variante seleccionada para el carrito
    const productCard = document.getElementById(`shop-product-${productId}`);
    if (productCard) {
        productCard.setAttribute('data-selected-variant', selectedOption.value);
        productCard.setAttribute('data-variant-name', variantName);
    }
}

// Mantener compatibilidad con función anterior
function onGrainVariantChange(productId) {
    onVariantChange(productId);
}

// Función para actualizar display de stock
function updateStockDisplay(productId, stock) {
    const stockElement = document.getElementById(`shop-stock-${productId}`);
    const stockCountElement = document.getElementById(`stock-count-${productId}`);
    
    if (!stockElement || !stockCountElement) return;
    
    const stockStatus = getStockStatus(stock);
    
    // Actualizar clases
    stockElement.className = `stock-indicator ${stockStatus.class}`;
    
    // Actualizar texto
    const stockText = stockElement.querySelector('.stock-text');
    const stockCount = stockElement.querySelector('.stock-count');
    
    if (stockText) stockText.textContent = stockStatus.text;
    if (stockCount) stockCount.textContent = `(${stock})`;
}

// Función para actualizar display de precio
function updatePriceDisplay(productId, price) {
    const priceElement = document.getElementById(`product-price-${productId}`);
    if (!priceElement) return;
    
    if (price > 0) {
        priceElement.innerHTML = `<span class="current-price">R$ ${formatCurrency(price)}</span>`;
        priceElement.style.display = 'block';
    } else {
        priceElement.style.display = 'none';
    }
}

// Función para actualizar código del producto
function updateProductCode(productId, code) {
    const codeElement = document.querySelector(`#shop-product-${productId} .product-code`);
    if (codeElement && code) {
        codeElement.textContent = `Cód: ${code}`;
    }
}

// Función para actualizar botones de acción
function updateActionButtons(productId, stock, price) {
    const actionsContainer = document.querySelector(`[data-product-id="${productId}"] .product-actions`);
    if (!actionsContainer) return;
    
    const addButton = actionsContainer.querySelector('.btn-add-cart');
    const quantitySelector = actionsContainer.querySelector('.quantity-selector');
    
    if (stock > 0 && price > 0) {
        // Producto disponible
        if (addButton) {
            addButton.disabled = false;
            addButton.classList.remove('disabled');
            addButton.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar';
        }
        
        if (quantitySelector) {
            const quantityInput = quantitySelector.querySelector('input');
            if (quantityInput) {
                quantityInput.max = Math.min(stock, 10);
                quantityInput.disabled = false;
            }
        }
    } else {
        // Producto no disponible
        if (addButton) {
            addButton.disabled = true;
            addButton.classList.add('disabled');
            addButton.innerHTML = '<i class="fas fa-ban"></i> Indisponível';
        }
        
        if (quantitySelector) {
            const quantityInput = quantitySelector.querySelector('input');
            if (quantityInput) {
                quantityInput.disabled = true;
            }
        }
    }
}

// Função para atualizar o indicador de grão selecionado
function updateSelectedGrainDisplay(productId, variantName) {
    // Procurar por um indicador existente
    let grainIndicator = document.getElementById(`selected-grain-${productId}`);
    
    // Obter o preço da variante selecionada
    const selector = document.getElementById(`variants-${productId}`);
    const selectedOption = selector ? selector.options[selector.selectedIndex] : null;
    const variantPrice = selectedOption ? parseFloat(selectedOption.dataset.price) || 0 : 0;
    
    if (!grainIndicator) {
        // Criar o indicador se não existir
        const productCard = document.getElementById(`shop-product-${productId}`);
        const variantsContainer = productCard?.querySelector('.grain-variants');
        
        if (variantsContainer) {
            grainIndicator = document.createElement('div');
            grainIndicator.id = `selected-grain-${productId}`;
            grainIndicator.className = 'selected-grain-indicator';
            variantsContainer.appendChild(grainIndicator);
        }
    }
    
    if (grainIndicator) {
        // Extrair o número do grão de forma mais precisa
        let grainNumber = '';
        
        // Primeiro tentar extrair do nome da variante
        if (variantName && variantName.includes('Grão')) {
            const match = variantName.match(/Grão\s*(\d+)/i);
            grainNumber = match ? match[1] : '';
        }
        
        // Se não encontrou, tentar extrair qualquer número
        if (!grainNumber && variantName) {
            const numberMatch = variantName.match(/\d+/);
            grainNumber = numberMatch ? numberMatch[0] : '';
        }
        
        // Se ainda não tem, usar o nome completo
        const displayName = grainNumber ? `Grão ${grainNumber}` : (variantName || 'Variante');
        const priceDisplay = variantPrice > 0 ? ` - R$ ${variantPrice.toFixed(2)}` : '';
        
        grainIndicator.innerHTML = `
            <div class="grain-display">
                <i class="fas fa-check-circle"></i>
                <span class="grain-selected">Selecionado: <strong>${displayName}</strong></span>
                ${priceDisplay ? `<span class="grain-price">${priceDisplay}</span>` : ''}
            </div>
        `;
        
        // Adicionar animação de destaque
        grainIndicator.classList.add('grain-updated');
        setTimeout(() => {
            grainIndicator.classList.remove('grain-updated');
        }, 500);
    }
}

// Função para tratar erro de carregamento de imagem no carrinho
function handleCartImageError(img) {
    // Definir uma imagem de fallback baseada no nome do produto
    const productName = img.alt.toLowerCase();
    let fallbackImage = 'https://via.placeholder.com/200x200/2c3e50/ffffff?text=Abrasivo';
    
    if (productName.includes('disco') || productName.includes('flap')) {
        fallbackImage = 'https://via.placeholder.com/200x200/e74c3c/ffffff?text=Disco+Flap';
    } else if (productName.includes('escova')) {
        fallbackImage = 'https://via.placeholder.com/200x200/27ae60/ffffff?text=Escova';
    } else if (productName.includes('manta')) {
        fallbackImage = 'https://via.placeholder.com/200x200/3498db/ffffff?text=Manta';
    } else if (productName.includes('lixa')) {
        fallbackImage = 'https://via.placeholder.com/200x200/f39c12/ffffff?text=Lixa';
    } else if (productName.includes('roda')) {
        fallbackImage = 'https://via.placeholder.com/200x200/9b59b6/ffffff?text=Roda';
    }
    
    img.src = fallbackImage;
    img.onerror = null; // Evitar loop infinito
}

// Handler genérico para errores de imagen en productos/carrito
function handleProductImageError(img) {
    try {
        const original = img.dataset.originalSrc || img.src || '';

        // Si el desarrollador habilitó explícitamente un proxy local, intentar primero.
        const useLocal = window.USE_LOCAL_IMAGE_PROXY === true;

        if (useLocal && !img.dataset.triedLocalProxy) {
            img.dataset.triedLocalProxy = '1';
            try {
                const localProxy = `http://localhost:8001/image?url=${encodeURIComponent(original)}`;
                img.src = localProxy;
                return;
            } catch (e) {
                // seguir al siguiente intento
            }
        }

        // Intento 1 (por defecto): proxy público CORS
        if (!img.dataset.triedProxy) {
            img.dataset.triedProxy = '1';
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(original);
            img.src = proxyUrl;
            return;
        }

        // Si ya se intentaron proxies, usar fallback específico
        const name = img.alt || img.getAttribute('data-name') || 'Produto';
        img.src = fallbackImageForProduct({ name }, img.getAttribute('data-size') || '200x200');
        img.onerror = null;
    } catch (e) {
        // En caso de cualquier error, asegurar un placeholder seguro
        try { img.src = 'https://via.placeholder.com/200x200/2c3e50/ffffff?text=Produto'; } catch (e2) {}
        img.onerror = null;
    }
}

// Enviar email de confirmação/aviso de novo pedido
async function sendOrderEmailNotification(orderData, orderNumber) {
    const productsList = orderData.items.map(item => 
        `• ${item.name} ${item.grain ? `(Grão ${item.grain})` : ''} - Qtd: ${item.quantity} - Valor: R$ ${item.price.toFixed(2)}`
    ).join('\n');

    const message = `🛒 NOVO PEDIDO DA LOJA ONLINE

📦 Nº do Pedido/Orçamento: ${orderNumber}

📋 DADOS DO CLIENTE:
Nome: ${orderData.customerName}
Email: ${orderData.customerEmail}
${orderData.customerPhone ? `Telefone: ${orderData.customerPhone}` : ''}
${orderData.customerCompany ? `Empresa: ${orderData.customerCompany}` : ''}

🛍️ PRODUTOS SOLICITADOS:
${productsList}

💰 VALOR TOTAL: R$ ${orderData.total.toFixed(2)}

📝 OBSERVAÇÕES:
${orderData.notes || 'Nenhuma observação adicional'}

⏰ DATA/HORA: ${new Date().toLocaleString('pt-BR')}

—
Este email é uma cópia de notificação automática gerada pelo site.`;

    return window.erpAPI.sendContact({
        name: orderData.customerName,
        email: orderData.customerEmail,
        phone: orderData.customerPhone,
        company: orderData.customerCompany,
        subject: `Novo pedido (Loja Abratecnica) #${orderNumber}`,
        message,
        type: 'order_email',
        toRecipients: (window.ORDER_NOTIFICATION_EMAILS || [])
    });
}

// CALCULADORA DE FRETE
window.selectedShippingCost = 0;
window.selectedShippingService = null;

function formatCEP(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 5) {
        value = value.replace(/^(\d{5})(\d{0,3})$/, '$1-$2');
    }
    input.value = value;
}

async function calculateShipping() {
    const cepInput = document.getElementById('cepInput');
    const resultsDiv = document.getElementById('shippingResults');
    const calculateBtn = document.getElementById('calculateShipping');
    
    const cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        showShippingError('Digite um CEP válido com 8 dígitos');
        return;
    }
    
    // Calcular peso/valor dos produtos no carrinho
    const totalWeight = cart.reduce((sum, item) => sum + (item.weight || 0.5) * item.quantity, 0);
    const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        calculateBtn.disabled = true;
        
        // Tentar API local primeiro, depois fallback
        let response;
        try {
            if (window.erpAPI && window.erpAPI.localApiAvailable) {
                response = await fetch(`${window.location.origin}/api/shipping.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cep: cep,
                        weight: Math.max(totalWeight, 0.5),
                        declared_value: totalValue
                    })
                });
            } else {
                throw new Error('API local not available');
            }
        } catch (localError) {
            // Fallback para cálculo client-side simplificado
            response = await simulateShippingCalculation(cep, totalWeight, totalValue);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayShippingOptions(data);
        } else {
            showShippingError(data.error || 'Erro ao calcular frete');
        }
        
    } catch (error) {
        console.error('Shipping calculation error:', error);
        showShippingError('Erro ao consultar frete. Tente novamente.');
    } finally {
        calculateBtn.innerHTML = '<i class="fas fa-search"></i>';
        calculateBtn.disabled = false;
    }
}

function displayShippingOptions(data) {
    const resultsDiv = document.getElementById('shippingResults');
    
    const addressInfo = data.address ? 
        `<div class="address-info">
            <small><i class="fas fa-map-marker-alt"></i> ${data.address.city}/${data.address.state}</small>
        </div>` : '';
    
    const optionsHTML = data.shipping_options.map(option => `
        <div class="shipping-option" onclick="selectShippingOption('${option.service_code}', ${option.price}, '${option.service_name}')">
            <div class="shipping-service">
                <i class="${option.icon || 'fas fa-truck'}"></i>
                <div class="service-info">
                    <strong>${option.service_name}</strong>
                    <small>${option.delivery_range}</small>
                </div>
            </div>
            <div class="shipping-price">
                <strong>R$ ${parseFloat(option.price).toFixed(2).replace('.', ',')}</strong>
            </div>
        </div>
    `).join('');
    
    resultsDiv.innerHTML = `
        ${addressInfo}
        <div class="shipping-options">
            ${optionsHTML}
        </div>
    `;
    resultsDiv.style.display = 'block';
}

function selectShippingOption(serviceCode, price, serviceName) {
    // Remover seleção anterior
    document.querySelectorAll('.shipping-option').forEach(opt => opt.classList.remove('selected'));
    
    // Marcar nova seleção
    event.currentTarget.classList.add('selected');
    
    // Armazenar seleção
    window.selectedShippingCost = parseFloat(price);
    window.selectedShippingService = {
        code: serviceCode,
        name: serviceName,
        price: parseFloat(price)
    };
    
    // Atualizar UI do carrinho
    updateCartUI();
}

function showShippingError(message) {
    const resultsDiv = document.getElementById('shippingResults');
    resultsDiv.innerHTML = `
        <div class="shipping-error">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        </div>
    `;
    resultsDiv.style.display = 'block';
}

async function simulateShippingCalculation(cep, weight, value) {
    // Simulação client-side para fallback
    const stateFromCEP = getStateFromCEP(cep);
    const regionFactor = getRegionFactorClient(stateFromCEP);
    const weightFactor = Math.max(1.0, weight * 0.5);
    
    const pac_price = 15.00 + (regionFactor * 5) + weightFactor;
    const sedex_price = 25.00 + (regionFactor * 8) + (weightFactor * 1.5);
    const pac_days = 5 + regionFactor;
    const sedex_days = 2 + Math.floor(regionFactor / 2);
    
    return {
        json: () => Promise.resolve({
            success: true,
            shipping_options: [
                {
                    service_code: 'PAC',
                    service_name: 'PAC - Econômico',
                    price: pac_price.toFixed(2),
                    delivery_days: pac_days,
                    delivery_range: `até ${pac_days} dias úteis`,
                    icon: 'fas fa-box'
                },
                {
                    service_code: 'SEDEX',
                    service_name: 'SEDEX - Expresso',
                    price: sedex_price.toFixed(2),
                    delivery_days: sedex_days,
                    delivery_range: `até ${sedex_days} dias úteis`,
                    icon: 'fas fa-shipping-fast'
                }
            ]
        })
    };
}

function getStateFromCEP(cep) {
    // Mapeamento aproximado de CEP para estado (primeiros dígitos)
    const ranges = {
        '01': 'SP', '02': 'SP', '03': 'SP', '04': 'SP', '05': 'SP',
        '06': 'SP', '07': 'SP', '08': 'SP', '09': 'SP', '10': 'SP',
        '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP',
        '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
        '20': 'RJ', '21': 'RJ', '22': 'RJ', '23': 'RJ', '24': 'RJ', '25': 'RJ', '26': 'RJ', '27': 'RJ', '28': 'RJ',
        '29': 'ES', '30': 'MG', '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '36': 'MG', '37': 'MG', '38': 'MG', '39': 'MG',
        '40': 'BA', '41': 'BA', '42': 'BA', '43': 'BA', '44': 'BA', '45': 'BA', '46': 'BA', '47': 'BA', '48': 'BA',
        '49': 'SC', '50': 'PE', '51': 'PE', '52': 'PE', '53': 'PE', '54': 'PE', '55': 'PE', '56': 'PE',
        '57': 'AL', '58': 'PB', '59': 'RN', '60': 'CE', '61': 'CE', '62': 'CE', '63': 'CE',
        '64': 'PI', '65': 'MT', '66': 'MT', '67': 'MS', '68': 'AC', '69': 'RO',
        '70': 'DF', '71': 'DF', '72': 'GO', '73': 'GO', '74': 'GO', '75': 'GO', '76': 'GO', '77': 'GO',
        '78': 'MT', '79': 'MS', '80': 'PR', '81': 'PR', '82': 'PR', '83': 'PR', '84': 'PR', '85': 'PR', '86': 'PR', '87': 'PR',
        '88': 'SC', '89': 'SC', '90': 'RS', '91': 'RS', '92': 'RS', '93': 'RS', '94': 'RS', '95': 'RS', '96': 'RS', '97': 'RS', '98': 'RS', '99': 'RS'
    };
    
    const prefix = cep.substring(0, 2);
    return ranges[prefix] || 'SP';
}

function getRegionFactorClient(state) {
    const regions = {
        'SP': 0, 'RJ': 1, 'MG': 1, 'ES': 2,
        'PR': 2, 'SC': 3, 'RS': 4,
        'GO': 2, 'MT': 3, 'MS': 3, 'DF': 2,
        'BA': 4, 'PE': 5, 'CE': 6, 'RN': 6, 'PB': 6,
        'AL': 5, 'SE': 5, 'PI': 6, 'MA': 7,
        'AM': 8, 'PA': 7, 'AC': 9, 'RO': 8, 'RR': 10,
        'AP': 9, 'TO': 5
    };
    return regions[state] || 5;
}

// VALIDAÇÃO DE DADOS DO CLIENTE
function validateCustomerData(data) {
    if (!data.name) return 'Nome completo é obrigatório';
    if (!data.email) return 'Email é obrigatório';
    if (!data.phone) return 'Telefone é obrigatório';
    if (!data.document) return 'CPF/CNPJ é obrigatório';
    if (!data.cep) return 'CEP é obrigatório';
    if (!data.address) return 'Endereço é obrigatório';
    if (!data.number) return 'Número é obrigatório';
    if (!data.neighborhood) return 'Bairro é obrigatório';
    if (!data.city) return 'Cidade é obrigatória';
    if (!data.state) return 'Estado é obrigatório';
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        return 'Email inválido';
    }
    
    // Validar CPF/CNPJ
    const docClean = data.document.replace(/\D/g, '');
    if (docClean.length === 11) {
        if (!isValidCPF(docClean)) return 'CPF inválido';
    } else if (docClean.length === 14) {
        if (!isValidCNPJ(docClean)) return 'CNPJ inválido';
    } else {
        return 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos';
    }
    
    // Validar CEP
    const cepClean = data.cep.replace(/\D/g, '');
    if (cepClean.length !== 8) {
        return 'CEP deve ter 8 dígitos';
    }
    
    return null; // Sem erros
}

function isValidCPF(cpf) {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf.charAt(10));
}

function isValidCNPJ(cnpj) {
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cnpj.charAt(12))) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    return digit2 === parseInt(cnpj.charAt(13));
}

// FORMATAÇÃO DE DOCUMENTOS E CEP
function formatDocument(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        // CPF: 000.000.000-00
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // CNPJ: 00.000.000/0000-00
        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    input.value = value;
}

function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length <= 10) {
        // Telefone fixo: (11) 1234-5678
        value = value.replace(/^(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
        // Celular: (11) 99999-9999
        value = value.replace(/^(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    input.value = value;
}

async function fillAddressByCEP(cep) {
    const cepClean = cep.replace(/\D/g, '');
    if (cepClean.length !== 8) return;
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
            document.getElementById('customer-address').value = data.logradouro || '';
            document.getElementById('customer-neighborhood').value = data.bairro || '';
            document.getElementById('customer-city').value = data.localidade || '';
            document.getElementById('customer-state').value = data.uf || '';
            
            // Focar no campo número
            document.getElementById('customer-number').focus();
        }
    } catch (error) {
        console.warn('Erro ao buscar CEP:', error);
    }
}

// Event listeners para formatação e validação
document.addEventListener('DOMContentLoaded', function() {
    // CEP do carrinho
    const cepInput = document.getElementById('cepInput');
    if (cepInput) {
        cepInput.addEventListener('input', function() {
            formatCEP(this);
        });
        
        cepInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateShipping();
            }
        });
    }
    
    // Formatação de documentos
    const documentInput = document.getElementById('customer-document');
    if (documentInput) {
        documentInput.addEventListener('input', function() {
            formatDocument(this);
        });
    }
    
    const companyDocInput = document.getElementById('customer-company-document');
    if (companyDocInput) {
        companyDocInput.addEventListener('input', function() {
            formatDocument(this);
        });
    }
    
    // Formatação de telefone
    const phoneInput = document.getElementById('customer-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhone(this);
        });
    }
    
    // CEP do endereço - busca automática
    const customerCepInput = document.getElementById('customer-cep');
    if (customerCepInput) {
        customerCepInput.addEventListener('input', function() {
            formatCEP(this);
        });
        
        customerCepInput.addEventListener('blur', function() {
            fillAddressByCEP(this.value);
        });
    }
    
    // Formas de pagamento
    const paymentOptions = document.querySelectorAll('input[name="payment-method"]');
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            handlePaymentMethodChange(this.value);
        });
    });
    
    const installmentsSelect = document.getElementById('installments-select');
    if (installmentsSelect) {
        installmentsSelect.addEventListener('change', function() {
            updatePaymentSummary();
        });
    }
});

// SISTEMA DE PAGAMENTO
window.paymentConfig = {
    discounts: {
        pix: 0.05,     // 5% desconto
        boleto: 0.03   // 3% desconto
    },
    interestRates: {
        2: 0.0299,   // 2.99% ao mês
        3: 0.0349,   // 3.49% ao mês
        4: 0.0399,   // 3.99% ao mês
        5: 0.0449,   // 4.49% ao mês
        6: 0.0499,   // 4.99% ao mês
        7: 0.0549,   // 5.49% ao mês
        8: 0.0599,   // 5.99% ao mês
        9: 0.0649,   // 6.49% ao mês
        10: 0.0699,  // 6.99% ao mês
        11: 0.0749,  // 7.49% ao mês
        12: 0.0799   // 7.99% ao mês
    }
};

window.selectedPayment = {
    method: null,
    installments: 1,
    discount: 0,
    interest: 0,
    finalTotal: 0
};

function handlePaymentMethodChange(method) {
    window.selectedPayment.method = method;
    
    // Ocultar todas as opções de parcelamento
    document.getElementById('installments-options').style.display = 'none';
    
    if (method === 'card-parcelado') {
        document.getElementById('installments-options').style.display = 'block';
        generateInstallmentOptions();
    } else {
        window.selectedPayment.installments = 1;
    }
    
    updatePaymentSummary();
}

function generateInstallmentOptions() {
    const select = document.getElementById('installments-select');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = parseFloat(window.selectedShippingCost || 0);
    const baseTotal = subtotal + shippingCost;
    
    let optionsHTML = '<option value="">Selecione as parcelas</option>';
    
    // 1x sem juros
    optionsHTML += `<option value="1">1x de R$ ${baseTotal.toFixed(2).replace('.', ',')} sem juros</option>`;
    
    // 2x até 12x com juros
    for (let i = 2; i <= 12; i++) {
        const monthlyRate = window.paymentConfig.interestRates[i];
        const installmentValue = (baseTotal * monthlyRate * Math.pow(1 + monthlyRate, i)) / (Math.pow(1 + monthlyRate, i) - 1);
        const totalWithInterest = installmentValue * i;
        
        optionsHTML += `<option value="${i}">${i}x de R$ ${installmentValue.toFixed(2).replace('.', ',')} (Total: R$ ${totalWithInterest.toFixed(2).replace('.', ',')})</option>`;
    }
    
    select.innerHTML = optionsHTML;
}

function updatePaymentSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = parseFloat(window.selectedShippingCost || 0);
    let finalTotal = subtotal + shippingCost;
    let discount = 0;
    let interest = 0;
    
    // Calcular desconto ou juros
    if (window.selectedPayment.method === 'pix') {
        discount = finalTotal * window.paymentConfig.discounts.pix;
        finalTotal -= discount;
    } else if (window.selectedPayment.method === 'boleto') {
        discount = finalTotal * window.paymentConfig.discounts.boleto;
        finalTotal -= discount;
    } else if (window.selectedPayment.method === 'card-parcelado') {
        const installments = parseInt(document.getElementById('installments-select').value) || 1;
        if (installments > 1) {
            const monthlyRate = window.paymentConfig.interestRates[installments];
            const installmentValue = (finalTotal * monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1);
            const totalWithInterest = installmentValue * installments;
            interest = totalWithInterest - finalTotal;
            finalTotal = totalWithInterest;
            
            // Atualizar info do parcelamento
            document.getElementById('installment-info').innerHTML = 
                `<small>${installments}x de R$ ${installmentValue.toFixed(2).replace('.', ',')} = R$ ${totalWithInterest.toFixed(2).replace('.', ',')}</small>`;
        }
    }
    
    // Atualizar UI
    document.getElementById('payment-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    
    if (shippingCost > 0) {
        document.getElementById('payment-shipping-line').style.display = 'flex';
        document.getElementById('payment-shipping').textContent = `R$ ${shippingCost.toFixed(2).replace('.', ',')}`;
    } else {
        document.getElementById('payment-shipping-line').style.display = 'none';
    }
    
    if (discount > 0) {
        document.getElementById('payment-discount-line').style.display = 'flex';
        document.getElementById('payment-discount').textContent = `-R$ ${discount.toFixed(2).replace('.', ',')}`;
    } else {
        document.getElementById('payment-discount-line').style.display = 'none';
    }
    
    document.getElementById('payment-total').textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
    
    // Salvar valores calculados
    window.selectedPayment.discount = discount;
    window.selectedPayment.interest = interest;
    window.selectedPayment.finalTotal = finalTotal;
}

function validatePaymentForm() {
    if (!window.selectedPayment.method) {
        alert('Selecione uma forma de pagamento');
        return false;
    }
    
    if (window.selectedPayment.method === 'card-parcelado') {
        const installments = document.getElementById('installments-select').value;
        if (!installments) {
            alert('Selecione o número de parcelas');
            return false;
        }
        window.selectedPayment.installments = parseInt(installments);
    }
    
    return true;
}

function updateOrderSummary() {
    // Atualizar resumo do pagamento
    const paymentSummary = document.getElementById('payment-summary');
    let paymentText = '';
    
    switch (window.selectedPayment.method) {
        case 'pix':
            paymentText = `PIX (-5% desconto) - R$ ${window.selectedPayment.finalTotal.toFixed(2).replace('.', ',')}`;
            break;
        case 'boleto':
            paymentText = `Boleto Bancário (-3% desconto) - R$ ${window.selectedPayment.finalTotal.toFixed(2).replace('.', ',')}`;
            break;
        case 'card-vista':
            paymentText = `Cartão à Vista - R$ ${window.selectedPayment.finalTotal.toFixed(2).replace('.', ',')}`;
            break;
        case 'card-parcelado':
            const installmentValue = window.selectedPayment.finalTotal / window.selectedPayment.installments;
            paymentText = `Cartão ${window.selectedPayment.installments}x de R$ ${installmentValue.toFixed(2).replace('.', ',')} = R$ ${window.selectedPayment.finalTotal.toFixed(2).replace('.', ',')}`;
            break;
    }
    
    paymentSummary.innerHTML = `<p>${paymentText}</p>`;
    
    // Atualizar total final
    document.getElementById('final-total').textContent = window.selectedPayment.finalTotal.toFixed(2).replace('.', ',');
}

function getPaymentTermsText() {
    switch (window.selectedPayment.method) {
        case 'pix':
            return 'PIX - Pagamento à vista com 5% de desconto';
        case 'boleto':
            return 'Boleto Bancário - Vencimento em 3 dias úteis com 3% de desconto';
        case 'card-vista':
            return 'Cartão de Crédito/Débito à Vista';
        case 'card-parcelado':
            const installmentValue = window.selectedPayment.finalTotal / window.selectedPayment.installments;
            return `Cartão de Crédito - ${window.selectedPayment.installments}x de R$ ${installmentValue.toFixed(2).replace('.', ',')}`;
        default:
            return 'A combinar';
    }
}

// Fallback placeholder generator para productos
function fallbackImageForProduct(product, size = '350x250') {
    const name = (product && product.name) ? product.name : 'Produto';
    const type = (product && product.type) ? product.type.toLowerCase() : 'outros';
    // Elegir color según tipo
    const colorMap = {
        'ferramenta': '2c3e50',
        'equipamentos': '9b59b6',
        'componentes': 'f39c12',
        'revenda': 'e74c3c',
        'indústria': '3498db',
        'industria': '3498db',
        'indústria': '3498db'
    };
    const color = colorMap[type] || '95a5a6';
    const text = encodeURIComponent(name.replace(/\s+/g, '+'));
    return `https://via.placeholder.com/${size}/${color}/ffffff?text=${text}`;
}

// Intentar asegurar que el icono del carrito siempre sea visible (fallback SVG)
function ensureCartIconVisible() {
    const cartIcon = document.querySelector('.cart-icon');
    if (!cartIcon) return;
    // Limpieza: remover cualquier SVG fallback previamente inyectado.
    // No inyectamos nuevos SVGs aquí porque los iconos ahora se sirven correctamente via FontAwesome.
    const existing = cartIcon.querySelector('svg.cart-fallback');
    if (existing && existing.parentElement) {
        existing.parentElement.removeChild(existing);
    }
}

// Verificar si una URL de imagen carga correctamente
function checkImageUrl(url, timeout = 4000) {
    return new Promise((resolve) => {
        if (!url) return resolve(false);
        try {
            const img = new Image();
            let settled = false;
            const timer = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    img.src = '';
                    resolve(false);
                }
            }, timeout);

            img.onload = function() {
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    resolve(true);
                }
            };
            img.onerror = function() {
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    resolve(false);
                }
            };
            // Forzar uso de https si la URL empieza con //
            if (url.startsWith('//')) url = window.location.protocol + url;
            img.src = url;
        } catch (e) {
            resolve(false);
        }
    });
}

// Validar y arreglar imágenes de productos (reemplaza URLs no válidas por placeholder)
async function validateAndFixProductImages(products) {
    if (!Array.isArray(products)) return;
    const checks = products.map(async (product) => {
        try {
            // Comprobar imagen principal
            const candidate = product.imageUrl || product.image || '';
            const ok = await checkImageUrl(candidate, 3500);
            if (!ok) {
                // Reemplazar por fallback generado
                product.imageUrl = fallbackImageForProduct(product, '350x250');
            } else {
                // Asegurar que usamos imageUrl campo
                product.imageUrl = candidate;
            }
        } catch (e) {
            product.imageUrl = fallbackImageForProduct(product, '350x250');
        }
        return product;
    });

    await Promise.all(checks);
}