# ===== GUIA DE CONFIGURAÇÃO ASAAS - ABRATÉCNICA =====

## 🔧 PASSO A PASSO DA CONFIGURAÇÃO

### 1. **Configurar Credenciais Asaas**

#### A. Obter API Key:
1. Acesse: https://www.asaas.com/
2. Faça login na sua conta
3. Vá em: **Configurações → Integrações → API**
4. Copie sua **API Key**

#### B. Para SANDBOX (Testes):
- URL Base: `https://sandbox.asaas.com/api/v3/`
- API Key de teste (prefixo: `$aact_`)

#### C. Para PRODUCTION:
- URL Base: `https://www.asaas.com/api/v3/`  
- API Key real (prefixo: `$aact_`)

### 2. **Configurar Variables de Entorno**

#### Opção A: Arquivo .env (Recomendado)
```bash
# Copiar arquivo exemplo
cp .env.example .env

# Editar com suas credenciais
ASAAS_API_KEY=sua_api_key_aqui
ASAAS_WEBHOOK_SECRET=seu_webhook_secret
ASAAS_ENVIRONMENT=sandbox  # ou production
```

#### Opção B: Servidor Apache (.htaccess)
```bash
# Usar .htaccess.asaas como base
cp .htaccess.asaas .htaccess

# Editar variáveis SetEnv com valores reais
```

### 3. **Configurar Webhooks no Painel Asaas**

1. **Acesse o painel Asaas:**
   - Sandbox: https://sandbox.asaas.com/
   - Production: https://www.asaas.com/

2. **Configure Webhook:**
   - Vá em: **Configurações → Webhooks**
   - URL: `https://seudominio.com.br/api/asaas-webhook.php`
   - Eventos: Marque todos relacionados a pagamentos
   - Método: **POST**
   - Formato: **JSON**

3. **Gerar Webhook Secret:**
   ```bash
   # Gerar secret seguro
   openssl rand -hex 32
   ```

### 4. **Testar Configuração**

#### A. Verificar Proxy:
```bash
curl -X POST https://seudominio.com.br/api/asaas-proxy.php \
  -H "Content-Type: application/json" \
  -d '{"action":"test"}'
```

#### B. Verificar Webhook:
```bash
curl -X POST https://seudominio.com.br/api/asaas-webhook.php \
  -H "Content-Type: application/json" \
  -H "Asaas-Signature: test"
```

### 5. **Configurações de Segurança**

#### A. Permissões de Arquivo:
```bash
# Proteger arquivos sensíveis
chmod 600 .env
chmod 644 .htaccess
chmod 755 api/
chmod 644 api/*.php
```

#### B. Criar pasta de logs:
```bash
mkdir logs
chmod 755 logs
touch logs/security.log
chmod 644 logs/security.log
```

### 6. **Configuração por Ambiente**

#### DESENVOLVIMENTO (Sandbox):
```env
ASAAS_API_KEY=$aact_YTU5YTE0M2M2N2I4MTliNzk0YTNlN2JiZTExYzAzNzQ6OjAwMDAwMDAwMDAwMDAwMDAwMDA
ASAAS_ENVIRONMENT=sandbox
ASAAS_WEBHOOK_URL=https://localhost/api/asaas-webhook.php
LOG_LEVEL=debug
```

#### PRODUÇÃO:
```env
ASAAS_API_KEY=sua_chave_producao
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_URL=https://abratecnica.com.br/api/asaas-webhook.php
LOG_LEVEL=error
```

---

## 🔒 CHECKLIST DE SEGURANÇA

- [ ] ✅ API Key protegida em variável de ambiente
- [ ] ✅ Webhook Secret configurado
- [ ] ✅ HTTPS habilitado
- [ ] ✅ Headers de segurança configurados
- [ ] ✅ Rate limiting ativo (60 req/min)
- [ ] ✅ Logs de segurança habilitados
- [ ] ✅ Validação de inputs implementada
- [ ] ✅ Sanitização de dados ativa

---

## 🚨 TROUBLESHOOTING

### Erro: "Invalid API Key"
```bash
# Verificar se API key está correta
echo $ASAAS_API_KEY

# Testar conexão
curl -H "access_token: $ASAAS_API_KEY" \
     https://sandbox.asaas.com/api/v3/customers
```

### Erro: "Webhook signature invalid"
```bash
# Verificar secret
echo $ASAAS_WEBHOOK_SECRET

# Ver logs de webhook
tail -f logs/security.log | grep webhook
```

### Erro: "Rate limit exceeded"
```bash
# Ver logs de rate limiting
tail -f logs/security.log | grep "rate_limit"

# Ajustar limite em .env
RATE_LIMIT_PER_MINUTE=120
```

---

## 📞 SUPORTE

**Em caso de problemas:**
1. Verificar logs: `logs/security.log`
2. Testar em sandbox primeiro
3. Conferir documentação Asaas: https://docs.asaas.com/
4. Contato: contato@abratecnica.com.br