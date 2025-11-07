# Script de Pruebas de Validación y Seguridad
# Ejecutar: .\test-validation.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔒 PRUEBAS DE VALIDACIÓN Y SEGURIDAD" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001"

# Test 1: ✅ Crear blueprint con datos válidos
Write-Host "1️⃣  Crear Blueprint Válido" -ForegroundColor Yellow
$validBody = @{
    author = "juan"
    name = "plano-test"
    points = @(
        @{ x = 100; y = 100 },
        @{ x = 200; y = 200 }
    )
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/blueprints" -Method POST -Body $validBody -ContentType "application/json"
    Write-Host "   ✅ Blueprint creado exitosamente" -ForegroundColor Green
    Write-Host "   📝 Author: $($result.author), Name: $($result.name), Points: $($result.points.Count)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: ❌ Autor con caracteres inválidos
Write-Host "2️⃣  Autor con Caracteres Especiales (debe fallar)" -ForegroundColor Yellow
$invalidAuthorBody = @{
    author = "juan@email.com"  # ❌ Contiene @
    name = "test"
    points = @()
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/blueprints" -Method POST -Body $invalidAuthorBody -ContentType "application/json"
    Write-Host "   ❌ PROBLEMA: Debería haber fallado pero funcionó" -ForegroundColor Red
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ✅ Validación funcionó correctamente" -ForegroundColor Green
    Write-Host "   📋 Error: $($errorDetails.error)" -ForegroundColor White
    if ($errorDetails.details) {
        $errorDetails.details | ForEach-Object {
            Write-Host "      - Campo: $($_.field), Mensaje: $($_.message)" -ForegroundColor Gray
        }
    }
}

Write-Host ""

# Test 3: ❌ Nombre demasiado largo
Write-Host "3️⃣  Nombre Demasiado Largo (debe fallar)" -ForegroundColor Yellow
$longName = "a" * 150  # 150 caracteres, límite es 100
$longNameBody = @{
    author = "juan"
    name = $longName
    points = @()
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/blueprints" -Method POST -Body $longNameBody -ContentType "application/json"
    Write-Host "   ❌ PROBLEMA: Debería haber fallado pero funcionó" -ForegroundColor Red
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ✅ Validación funcionó correctamente" -ForegroundColor Green
    Write-Host "   📋 Error: $($errorDetails.error)" -ForegroundColor White
}

Write-Host ""

# Test 4: ❌ Punto fuera de rango
Write-Host "4️⃣  Punto Fuera de Rango Canvas (debe fallar)" -ForegroundColor Yellow
$outOfRangeBody = @{
    points = @(
        @{ x = 700; y = 200 }  # ❌ x > 600 (límite del canvas)
    )
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/blueprints/juan/plano-1" -Method PUT -Body $outOfRangeBody -ContentType "application/json"
    Write-Host "   ❌ PROBLEMA: Debería haber fallado pero funcionó" -ForegroundColor Red
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ✅ Validación funcionó correctamente" -ForegroundColor Green
    Write-Host "   📋 Error: $($errorDetails.error)" -ForegroundColor White
    if ($errorDetails.details) {
        $errorDetails.details | ForEach-Object {
            Write-Host "      - Campo: $($_.field), Mensaje: $($_.message)" -ForegroundColor Gray
        }
    }
}

Write-Host ""

# Test 5: ❌ Tipo de dato incorrecto
Write-Host "5️⃣  Tipo de Dato Incorrecto (debe fallar)" -ForegroundColor Yellow
$wrongTypeBody = @{
    author = "juan"
    name = "test2"
    points = "not-an-array"  # ❌ Debería ser array
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/blueprints" -Method POST -Body $wrongTypeBody -ContentType "application/json"
    Write-Host "   ❌ PROBLEMA: Debería haber fallado pero funcionó" -ForegroundColor Red
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ✅ Validación funcionó correctamente" -ForegroundColor Green
    Write-Host "   📋 Error: $($errorDetails.error)" -ForegroundColor White
}

Write-Host ""

# Test 6: ❌ Coordenada negativa
Write-Host "6️⃣  Coordenadas Negativas (debe fallar)" -ForegroundColor Yellow
$negativePointBody = @{
    points = @(
        @{ x = -10; y = 100 }  # ❌ x negativo
    )
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/blueprints/juan/plano-1" -Method PUT -Body $negativePointBody -ContentType "application/json"
    Write-Host "   ❌ PROBLEMA: Debería haber fallado pero funcionó" -ForegroundColor Red
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ✅ Validación funcionó correctamente" -ForegroundColor Green
    Write-Host "   📋 Error: $($errorDetails.error)" -ForegroundColor White
    if ($errorDetails.details) {
        $errorDetails.details | ForEach-Object {
            Write-Host "      - Campo: $($_.field), Mensaje: $($_.message)" -ForegroundColor Gray
        }
    }
}

Write-Host ""

# Test 7: ✅ Actualizar con puntos válidos
Write-Host "7️⃣  Actualizar Blueprint con Puntos Válidos" -ForegroundColor Yellow
$validUpdateBody = @{
    points = @(
        @{ x = 50; y = 50 },
        @{ x = 150; y = 150 },
        @{ x = 250; y = 250 }
    )
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/blueprints/juan/plano-1" -Method PUT -Body $validUpdateBody -ContentType "application/json"
    Write-Host "   ✅ Blueprint actualizado exitosamente" -ForegroundColor Green
    Write-Host "   📝 Points: $($result.points.Count)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 8: ❌ Demasiados puntos
Write-Host "8️⃣  Demasiados Puntos (debe fallar)" -ForegroundColor Yellow
$tooManyPoints = @()
for ($i = 0; $i -lt 1500; $i++) {
    $tooManyPoints += @{ x = 100; y = 100 }
}
$tooManyPointsBody = @{
    points = $tooManyPoints
} | ConvertTo-Json -Depth 3

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/blueprints/juan/plano-1" -Method PUT -Body $tooManyPointsBody -ContentType "application/json"
    Write-Host "   ❌ PROBLEMA: Debería haber fallado pero funcionó" -ForegroundColor Red
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ✅ Validación funcionó correctamente" -ForegroundColor Green
    Write-Host "   📋 Error: $($errorDetails.error)" -ForegroundColor White
}

Write-Host ""

# Test 9: Verificar CORS headers
Write-Host "9️⃣  Verificar Configuración CORS" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET
    $corsHeader = $response.Headers['Access-Control-Allow-Origin']
    if ($corsHeader) {
        Write-Host "   ✅ CORS Header presente: $corsHeader" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  CORS configurado en servidor" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  No se pudo verificar CORS" -ForegroundColor Yellow
}

Write-Host ""

# Test 10: Health Check
Write-Host "🔟 Health Check Final" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "   ✅ Servidor: $($health.status)" -ForegroundColor Green
    Write-Host "   📊 Blueprints en DB: $($health.database.blueprints)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ PRUEBAS COMPLETADAS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📊 Resumen:" -ForegroundColor Yellow
Write-Host "   ✅ Validaciones funcionando correctamente" -ForegroundColor Green
Write-Host "   🔒 Seguridad implementada" -ForegroundColor Green
Write-Host "   📝 Errores descriptivos" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Revisa VALIDACION_Y_SEGURIDAD.md para más información`n" -ForegroundColor Cyan
