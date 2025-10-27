// Node.js script to create a customer in Asaas Sandbox
// Usage: set ACCESS_TOKEN env var and run: node asaas_create_customer.js
// Example: ACCESS_TOKEN=sk_test_xxx node asaas_create_customer.js

const https = require('https');

const ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'REPLACE_WITH_YOUR_SANDBOX_TOKEN';
if (ACCESS_TOKEN === 'REPLACE_WITH_YOUR_SANDBOX_TOKEN') {
  console.error('Please set ACCESS_TOKEN environment variable before running.');
  process.exit(1);
}

const data = JSON.stringify({
  name: 'John Doe',
  cpfCnpj: '24971563792',
  email: 'john.doe@example.com',
  phone: '4738010919',
  mobilePhone: '4799376637',
  address: 'Av. Paulista',
  addressNumber: '150',
  complement: 'Sala 201',
  province: 'Centro',
  postalCode: '01310-000',
  externalReference: '12987382',
  notificationDisabled: false,
  additionalEmails: 'john.doe@example.com',
  observations: 'Teste sandbox',
  foreignCustomer: false
});

const options = {
  hostname: 'api-sandbox.asaas.com',
  path: '/v3/customers',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'access_token': ACCESS_TOKEN
  }
};

const req = https.request(options, (res) => {
  let body = '';
  console.log('Status:', res.statusCode);
  res.on('data', (d) => body += d);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log('Response JSON:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Response body:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(data);
req.end();
