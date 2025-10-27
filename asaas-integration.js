// ===== INTEGRAÇÃO ASAAS SEGURA - ABRATÉCNICA =====
// Sistema completo para pagamentos usando proxy seguro
// Substitui calls diretas por comunicação via api/asaas-proxy.php

// ===== ASAAS PAYMENT MANAGER =====
class AsaasPaymentManager {
    constructor() {
        this.proxyUrl = '/api/asaas-proxy.php';
        this.pendingPayments = new Map();
        this.paymentStatusInterval = null;
    }
    
    // Criar cliente Asaas
    async createCustomer(customerData) {
        const sanitizedData = this.sanitizeCustomerData(customerData);
        
        try {
            const response = await this.makeSecureRequest('create_customer', {
                name: sanitizedData.name,
                email: sanitizedData.email,
                phone: sanitizedData.phone,
                cpfCnpj: sanitizedData.document,
                postalCode: sanitizedData.cep,
                address: sanitizedData.address,
                addressNumber: sanitizedData.number,
                complement: sanitizedData.complement,
                province: sanitizedData.neighborhood,
                city: sanitizedData.city,
                state: sanitizedData.state,
                externalReference: `CUSTOMER_${Date.now()}`
            });
            
            if (!response.success) {
                throw new Error(response.error || 'Erro ao criar cliente');
            }
            
            SecurityLogger.logInfo('Cliente Asaas criado', {
                customerId: response.data.id,
                email: sanitizedData.email
            });
            
            return response.data;
            
        } catch (error) {
            SecurityLogger.logError('Erro ao criar cliente Asaas', {
                error: error.message,
                email: sanitizedData.email
            });
            throw error;
        }
    }
    
    // Criar cobrança
    async createPayment(customerData, paymentData) {
        try {
            // Primeiro criar cliente se necessário
            let customer;
            
            // Tentar usar cliente existente ou criar novo
            try {
                customer = await this.createCustomer(customerData);
            } catch (error) {
                if (error.message.includes('já cadastrado')) {
                    // Cliente já existe, usar ID do erro ou buscar
                    customer = { id: this.extractCustomerIdFromError(error.message) };
                } else {
                    throw error;
                }
            }
            
            const paymentRequest = {
                customer: customer.id,
                billingType: paymentData.method === 'pix' ? 'PIX' : 'BOLETO',
                value: paymentData.amount,
                dueDate: paymentData.dueDate || this.getDefaultDueDate(),
                description: paymentData.description || 'Pedido Abratécnica',
                externalReference: paymentData.orderId,
                // Dados adicionais
                discount: {
                    value: paymentData.discount || 0,
                    dueDateLimitDays: 0
                },
                fine: {
                    value: 2.00,
                    type: 'PERCENTAGE'
                },
                interest: {
                    value: 1.00,
                    type: 'PERCENTAGE'
                },
                // Notificações
                postalService: false // Não enviar por correio
            };
            
            const response = await this.makeSecureRequest('create_payment', paymentRequest);
            
            if (!response.success) {
                throw new Error(response.error || 'Erro ao criar cobrança');
            }
            
            // Salvar pagamento pendente para monitoramento
            this.pendingPayments.set(response.data.id, {
                orderId: paymentData.orderId,
                amount: paymentData.amount,
                createdAt: Date.now()
            });
            
            SecurityLogger.logInfo('Cobrança Asaas criada', {
                paymentId: response.data.id,
                amount: paymentData.amount,
                method: paymentData.method
            });
            
            return response.data;
            
        } catch (error) {
            SecurityLogger.logError('Erro ao criar cobrança Asaas', {
                error: error.message,
                amount: paymentData.amount
            });
            throw error;
        }
    }
    
    // Consultar status do pagamento
    async getPaymentStatus(paymentId) {
        try {
            const response = await this.makeSecureRequest('get_payment', { id: paymentId });
            
            if (!response.success) {
                throw new Error(response.error || 'Erro ao consultar pagamento');
            }
            
            return response.data;
            
        } catch (error) {
            SecurityLogger.logError('Erro ao consultar pagamento', {
                error: error.message,
                paymentId
            });
            throw error;
        }
    }
    
    // Listar pagamentos do cliente
    async listPayments(customerId, limit = 20) {
        try {
            const response = await this.makeSecureRequest('list_payments', {
                customer: customerId,
                limit
            });
            
            if (!response.success) {
                throw new Error(response.error || 'Erro ao listar pagamentos');
            }
            
            return response.data;
            
        } catch (error) {
            SecurityLogger.logError('Erro ao listar pagamentos', {
                error: error.message,
                customerId
            });
            throw error;
        }
    }
    
    // Fazer request seguro via proxy
    async makeSecureRequest(action, data = {}) {
        const requestData = {
            action,
            data: this.sanitizeRequestData(data)
        };
        
        const response = await fetch(this.proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        return result;
    }
    
    // Sanitizar dados do cliente
    sanitizeCustomerData(data) {
        return {
            name: sanitizeHTML(data.name || '').substring(0, 100),
            email: validateInput(data.email || '', 'email') ? data.email : '',
            phone: this.formatPhone(data.phone || ''),
            document: this.formatDocument(data.document || ''),
            cep: this.formatCEP(data.cep || ''),
            address: sanitizeHTML(data.address || '').substring(0, 200),
            number: sanitizeHTML(data.number || '').substring(0, 10),
            complement: sanitizeHTML(data.complement || '').substring(0, 100),
            neighborhood: sanitizeHTML(data.neighborhood || '').substring(0, 100),
            city: sanitizeHTML(data.city || '').substring(0, 100),
            state: sanitizeHTML(data.state || '').substring(0, 2)
        };
    }
    
    // Sanitizar dados da request
    sanitizeRequestData(data) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeHTML(value);
            } else if (typeof value === 'number') {
                sanitized[key] = isFinite(value) ? value : 0;
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeRequestData(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }
    
    // Utilitários de formatação
    formatPhone(phone) {
        return phone.replace(/\D/g, '').substring(0, 11);
    }
    
    formatDocument(doc) {
        return doc.replace(/\D/g, '');
    }
    
    formatCEP(cep) {
        return cep.replace(/\D/g, '').substring(0, 8);
    }
    
    getDefaultDueDate() {
        const date = new Date();
        date.setDate(date.getDate() + 3); // 3 dias úteis
        return date.toISOString().split('T')[0];
    }
    
    extractCustomerIdFromError(errorMessage) {
        // Extrair ID do cliente de mensagem de erro da Asaas
        const match = errorMessage.match(/id[:\s]+([a-zA-Z0-9_-]+)/i);
        return match ? match[1] : null;
    }
    
    // Monitorar pagamentos pendentes
    startPaymentMonitoring() {
        if (this.paymentStatusInterval) return;
        
        this.paymentStatusInterval = setInterval(async () => {
            for (const [paymentId, paymentInfo] of this.pendingPayments.entries()) {
                try {
                    const status = await this.getPaymentStatus(paymentId);
                    
                    if (status.status === 'RECEIVED' || status.status === 'CONFIRMED') {
                        // Pagamento confirmado
                        this.handlePaymentSuccess(paymentId, status);
                        this.pendingPayments.delete(paymentId);
                    }
                    
                    // Remover pagamentos muito antigos (7 dias)
                    const age = Date.now() - paymentInfo.createdAt;
                    if (age > 7 * 24 * 60 * 60 * 1000) {
                        this.pendingPayments.delete(paymentId);
                    }
                    
                } catch (error) {
                    console.warn('Erro ao verificar status do pagamento:', paymentId, error);
                }
            }
        }, 30000); // Verificar a cada 30 segundos
    }
    
    stopPaymentMonitoring() {
        if (this.paymentStatusInterval) {
            clearInterval(this.paymentStatusInterval);
            this.paymentStatusInterval = null;
        }
    }
    
    handlePaymentSuccess(paymentId, paymentData) {
        SecurityLogger.logInfo('Pagamento confirmado', {
            paymentId,
            amount: paymentData.value,
            status: paymentData.status
        });
        
        // Disparar evento customizado
        window.dispatchEvent(new CustomEvent('asaasPaymentConfirmed', {
            detail: { paymentId, paymentData }
        }));
        
        // Mostrar notificação para o usuário
        this.showPaymentSuccessNotification(paymentData);
    }
    
    showPaymentSuccessNotification(paymentData) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pagamento Confirmado!', {
                body: `Seu pagamento de R$ ${paymentData.value} foi confirmado.`,
                icon: '/favicon.ico'
            });
        }
    }
}

// ===== NOVA FUNÇÃO DE CHECKOUT COM ASAAS =====
async function submitOrderWithAsaas() {
    showCheckoutLoading();
    
    try {
        // Preparar dados do cliente
        const customerData = {
            name: document.getElementById('customer-name').value.trim(),
            email: document.getElementById('customer-email').value.trim(),
            phone: document.getElementById('customer-phone').value.trim(),
            document: document.getElementById('customer-document').value.trim(),
            company: document.getElementById('customer-company').value.trim(),
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
        
        // Calcular total do pedido
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = parseFloat(window.selectedShippingCost || 0);
        const total = subtotal + shippingCost;
        
        // Gerar ID único do pedido
        const orderId = `ABR_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        
        // Preparar dados do pagamento
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'boleto';
        const paymentData = {
            orderId,
            amount: total,
            method: paymentMethod,
            description: `Pedido Abratécnica #${orderId} - ${cart.length} item(s)`,
            dueDate: asaasManager.getDefaultDueDate()
        };
        
        // Inicializar gerenciador Asaas
        if (!window.asaasManager) {
            window.asaasManager = new AsaasPaymentManager();
        }
        
        // Criar cobrança Asaas
        console.log('🔄 Criando cobrança Asaas...');
        const payment = await window.asaasManager.createPayment(customerData, paymentData);
        
        // Preparar dados do pedido para ERP
        const orderData = {
            orderId,
            customerName: customerData.name,
            customerEmail: customerData.email,
            customerPhone: customerData.phone,
            customerDocument: customerData.document,
            asaasPaymentId: payment.id,
            asaasInvoiceUrl: payment.invoiceUrl,
            asaasPaymentUrl: payment.bankSlipUrl || payment.qrCodeImage,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                grain: item.selectedGrain || '',
                notes: item.notes || ''
            })),
            subtotal,
            shippingCost,
            total,
            paymentMethod,
            paymentStatus: 'pending',
            type: 'pedido',
            notes: customerData.notes
        };
        
        // Salvar pedido no ERP (se disponível)
        try {
            await window.erpAPI.sendOrder(orderData);
            console.log('✅ Pedido salvo no ERP');
        } catch (erpError) {
            console.warn('⚠️ Erro ao salvar no ERP, continuando...', erpError);
        }
        
        // Limpar carrinho
        cart = [];
        updateCartUI();
        saveCart();
        
        // Mostrar sucesso com opções de pagamento
        showAsaasPaymentSuccess(orderId, payment);
        
        // Iniciar monitoramento do pagamento
        window.asaasManager.startPaymentMonitoring();
        
    } catch (error) {
        console.error('❌ Erro ao processar pedido com Asaas:', error);
        
        SecurityLogger.logError('Erro checkout Asaas', {
            error: error.message,
            customerEmail: document.getElementById('customer-email').value
        });
        
        showCheckoutError(error.message || 'Erro ao processar pagamento. Tente novamente.');
    }
}

// ===== INTERFACE DE SUCESSO ASAAS =====
function showAsaasPaymentSuccess(orderId, paymentData) {
    document.getElementById('checkout-form').style.display = 'none';
    document.getElementById('checkout-loading').style.display = 'none';
    document.getElementById('checkout-error').style.display = 'none';
    
    // Criar interface customizada para Asaas
    const successDiv = document.getElementById('checkout-success');
    successDiv.style.display = 'block';
    
    const paymentMethod = paymentData.billingType === 'PIX' ? 'PIX' : 'Boleto';
    const paymentUrl = paymentData.bankSlipUrl || paymentData.qrCodeImage;
    
    successDiv.innerHTML = `
        <div class="asaas-success-container">
            <div class="success-header">
                <h3>✅ Pedido Criado com Sucesso!</h3>
                <p><strong>Número do Pedido:</strong> ${orderId}</p>
                <p><strong>Valor:</strong> R$ ${paymentData.value.toFixed(2)}</p>
                <p><strong>Vencimento:</strong> ${new Date(paymentData.dueDate).toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div class="payment-options">
                <h4>💳 Opções de Pagamento (${paymentMethod})</h4>
                
                ${paymentData.billingType === 'PIX' ? `
                    <div class="pix-option">
                        <p><strong>🔸 PIX Copia e Cola:</strong></p>
                        <div class="pix-code">
                            <input type="text" id="pix-code" value="${paymentData.pixCode}" readonly>
                            <button onclick="copyPixCode()">📋 Copiar</button>
                        </div>
                        ${paymentData.qrCodeImage ? `
                            <p><strong>📱 QR Code:</strong></p>
                            <img src="${paymentData.qrCodeImage}" alt="QR Code PIX" style="max-width: 200px;">
                        ` : ''}
                    </div>
                ` : `
                    <div class="boleto-option">
                        <p><strong>🧾 Boleto Bancário:</strong></p>
                        <a href="${paymentUrl}" target="_blank" class="btn btn-primary">
                            📄 Visualizar/Imprimir Boleto
                        </a>
                    </div>
                `}
                
                <div class="payment-instructions">
                    <h5>📋 Instruções:</h5>
                    <ul>
                        <li>✅ Seu pedido foi registrado e está aguardando o pagamento</li>
                        <li>📧 Você receberá um email com os detalhes</li>
                        <li>🔔 Notificaremos você assim que o pagamento for confirmado</li>
                        <li>⏰ O pagamento pode levar até 24h para ser processado</li>
                    </ul>
                </div>
                
                <div class="contact-info">
                    <p><strong>❓ Dúvidas?</strong> Entre em contato: <a href="mailto:contato@abratecnica.com.br">contato@abratecnica.com.br</a></p>
                </div>
            </div>
            
            <div class="success-actions">
                <button onclick="closeCheckoutModal()" class="btn btn-secondary">Fechar</button>
                <button onclick="location.reload()" class="btn btn-primary">Nova Compra</button>
            </div>
        </div>
    `;
}

// ===== UTILITÁRIOS =====
function copyPixCode() {
    const pixInput = document.getElementById('pix-code');
    if (pixInput) {
        pixInput.select();
        document.execCommand('copy');
        
        // Feedback visual
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '✅ Copiado!';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }
}

// ===== LISTENERS DE PAGAMENTO =====
document.addEventListener('DOMContentLoaded', function() {
    // Listener para confirmação de pagamento via webhook
    window.addEventListener('asaasPaymentConfirmed', function(event) {
        const { paymentId, paymentData } = event.detail;
        
        // Mostrar notificação de sucesso
        if (document.getElementById('checkoutModal').style.display === 'block') {
            const successDiv = document.querySelector('.asaas-success-container');
            if (successDiv) {
                const confirmationBanner = document.createElement('div');
                confirmationBanner.className = 'payment-confirmed-banner';
                confirmationBanner.innerHTML = `
                    <h4 style="color: #28a745;">🎉 Pagamento Confirmado!</h4>
                    <p>Seu pagamento foi processado com sucesso. Obrigado!</p>
                `;
                successDiv.prepend(confirmationBanner);
            }
        }
    });
    
    // Configurar botão de submit para usar Asaas
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        const submitButton = checkoutForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Verificar se deve usar Asaas ou método alternativo
                const useAsaas = document.getElementById('enable-asaas-payment')?.checked !== false;
                
                if (useAsaas) {
                    submitOrderWithAsaas();
                } else {
                    submitOrder(); // Método original
                }
            });
        }
    }
});

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar gerenciador Asaas
    if (typeof AsaasPaymentManager !== 'undefined') {
        window.asaasManager = new AsaasPaymentManager();
        console.log('🔐 Asaas Payment Manager inicializado');
    }
});