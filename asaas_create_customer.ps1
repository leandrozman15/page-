# Script para crear cliente en Asaas Sandbox
# Uso: editar la variable $ACCESS_TOKEN con tu token de sandbox y ejecutar en PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\asaas_create_customer.ps1

$ACCESS_TOKEN = "REPLACE_WITH_YOUR_SANDBOX_TOKEN"
$apiUrl = 'https://api-sandbox.asaas.com/v3/customers'

# Body de ejemplo, edita los campos según necesites (¡no uses emails/phones reales en sandbox si no quieres recibir notificaciones!).
$body = @{ 
    name = 'John Doe'
    cpfCnpj = '24971563792'
    email = 'john.doe@example.com'
    phone = '4738010919'
    mobilePhone = '4799376637'
    address = 'Av. Paulista'
    addressNumber = '150'
    complement = 'Sala 201'
    province = 'Centro'
    postalCode = '01310-000'
    externalReference = '12987382'
    notificationDisabled = $false
    additionalEmails = 'john.doe@example.com'
    municipalInscription = ''
    stateInscription = ''
    observations = 'Teste sandbox'
    groupName = $null
    company = $null
    foreignCustomer = $false
} | ConvertTo-Json -Depth 5

if ($ACCESS_TOKEN -eq 'REPLACE_WITH_YOUR_SANDBOX_TOKEN') {
    Write-Host 'ERROR: Por favor, edita el archivo y coloca tu ACCESS_TOKEN de sandbox antes de ejecutar.' -ForegroundColor Red
    exit 1
}

try {
    $headers = @{
        'Content-Type' = 'application/json'
        'access_token' = $ACCESS_TOKEN
    }
    Write-Host "POST $apiUrl" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "Respuesta recibida:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host 'ERROR en la petición:' -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $respBody = $reader.ReadToEnd()
        Write-Host 'Response body:' -ForegroundColor Yellow
        Write-Host $respBody
    }
}
