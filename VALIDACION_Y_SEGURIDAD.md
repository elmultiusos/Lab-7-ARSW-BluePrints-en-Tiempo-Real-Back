# 🔒 Validación y Seguridad - Guía Completa

## 📋 Contenido

1. [Restricción de Orígenes (CORS)](#restricción-de-orígenes-cors)
2. [Validación de Payloads con Zod](#validación-de-payloads-con-zod)
3. [Configuración por Ambiente](#configuración-por-ambiente)
4. [Ejemplos de Validación](#ejemplos-de-validación)
5. [Manejo de Errores](#manejo-de-errores)

---

## 🌐 Restricción de Orígenes (CORS)

### ¿Qué es CORS?

**CORS (Cross-Origin Resource Sharing)** es un mecanismo de seguridad del navegador que controla qué dominios pueden acceder a tu API.

### 🔴 Problema: Sin Restricción (INSEGURO)

```javascript
// ❌ ANTES - Cualquier sitio puede acceder
app.use(cors({ origin: "*" }));
```

**Vulnerabilidades:**

- ✗ **Sitio malicioso** `https://hacker.com` puede llamar tu API
- ✗ Robo de datos de usuarios
- ✗ Ataques CSRF (Cross-Site Request Forgery)
- ✗ Uso no autorizado de recursos

**Ejemplo de Ataque:**

```javascript
// En https://sitio-malicioso.com
fetch("https://tu-api.com/api/blueprints/juan")
  .then((r) => r.json())
  .then((data) => {
    // ❌ Roban los datos del usuario
    sendToHacker(data);
  });
```

### ✅ Solución: Restricción por Ambiente

```javascript
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

// Lista blanca de orígenes permitidos
const allowedOrigins = IS_PRODUCTION
  ? [
      "https://tuapp.com", // ✅ Dominio de producción
      "https://www.tuapp.com", // ✅ Con www
      "https://app.tuapp.com", // ✅ Subdominio
    ]
  : ["http://localhost:5173", "http://localhost:3000"]; // Desarrollo

app.use(
  cors({
    origin: IS_PRODUCTION ? allowedOrigins : "*",
    credentials: true, // Permite enviar cookies
  })
);
```

### 📊 Comparación

| Aspecto          | Desarrollo    | Producción       |
| ---------------- | ------------- | ---------------- |
| **CORS**         | `*` (todos)   | Lista específica |
| **Seguridad**    | 🟡 Baja       | 🟢 Alta          |
| **Flexibilidad** | 🟢 Alta       | 🟡 Media         |
| **Uso**          | Testing local | Usuarios reales  |

### 🎯 Cómo Funciona en Navegador

```
1. Usuario visita: https://tuapp.com
2. JavaScript hace: fetch('https://api.tuapp.com/data')
3. Navegador envía header: Origin: https://tuapp.com
4. Servidor verifica: ¿está en allowedOrigins?
5. Si SÍ → Responde con: Access-Control-Allow-Origin: https://tuapp.com
6. Si NO → Navegador bloquea la respuesta
```

### 🛠️ Configuración para Despliegue

#### Opción 1: Variable de entorno

```bash
# En servidor de producción
export NODE_ENV=production
export ALLOWED_ORIGINS="https://tuapp.com,https://www.tuapp.com"
```

```javascript
// En server.js
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173"];
```

#### Opción 2: Archivo de configuración

```javascript
// config/cors.js
export const corsConfig = {
  development: ["http://localhost:5173", "http://localhost:3000"],
  production: ["https://tuapp.com", "https://www.tuapp.com"],
  staging: ["https://staging.tuapp.com"],
};
```

---

## ✅ Validación de Payloads con Zod

### ¿Qué es Zod?

**Zod** es una biblioteca de validación de datos con TypeScript-first que asegura que los datos recibidos cumplan con el formato esperado.

### 🔴 Problema: Sin Validación

```javascript
// ❌ ANTES - Sin validación
app.post("/api/blueprints", (req, res) => {
  const { author, name, points } = req.body;
  // ¿Qué pasa si...?
  // - author es undefined?
  // - name contiene caracteres SQL maliciosos?
  // - points no es un array?
  // - points tiene 1 millón de elementos?

  blueprints.set(key, { author, name, points });
});
```

**Vulnerabilidades:**

- ✗ **Inyección SQL/NoSQL** si se usa base de datos
- ✗ **Buffer overflow** con payloads gigantes
- ✗ **Tipo incorrecto** causa crashes
- ✗ **XSS** si se renderizan nombres maliciosos

### ✅ Solución: Schemas de Validación

#### 1. Definir Schemas

```javascript
import { z } from "zod";

// Schema para un punto en el canvas
const PointSchema = z.object({
  x: z.number().int().min(0).max(600), // Entero entre 0-600
  y: z.number().int().min(0).max(400), // Entero entre 0-400
});

// Schema para crear blueprint
const CreateBlueprintSchema = z.object({
  author: z
    .string()
    .min(1, "Author is required")
    .max(50, "Author too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only alphanumeric, _ and -"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only alphanumeric, _ and -"),
  points: z.array(PointSchema).optional().default([]),
});

// Schema para actualizar blueprint
const UpdateBlueprintSchema = z.object({
  points: z.array(PointSchema).max(1000, "Maximum 1000 points allowed"),
});
```

#### 2. Middleware de Validación

```javascript
const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse(req.body);
    req.body = validated; // Reemplaza con datos validados
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};
```

#### 3. Aplicar en Rutas

```javascript
// ✅ AHORA - Con validación automática
app.post(
  "/api/blueprints",
  validate(CreateBlueprintSchema), // ← Middleware de validación
  (req, res) => {
    // req.body ya está validado y limpio
    const { author, name, points } = req.body;
    // ... lógica segura
  }
);
```

### 📊 Validaciones Implementadas

| Campo     | Validación                          | Razón                    |
| --------- | ----------------------------------- | ------------------------ |
| `author`  | `string`, 1-50 chars, alphanumeric  | Prevenir inyección y XSS |
| `name`    | `string`, 1-100 chars, alphanumeric | Prevenir inyección y XSS |
| `points`  | Array de objetos válidos, max 1000  | Prevenir DoS por memoria |
| `point.x` | Entero 0-600                        | Canvas width = 600       |
| `point.y` | Entero 0-400                        | Canvas height = 400      |

### 🛡️ Beneficios de Validación

1. **Seguridad**: Bloquea datos maliciosos antes de procesarlos
2. **Consistencia**: Garantiza formato correcto en toda la app
3. **Errores Claros**: Mensajes descriptivos para frontend
4. **Documentación**: Los schemas documentan el API
5. **TypeScript**: Inferencia automática de tipos

---

## 🔧 Configuración por Ambiente

### Variables de Entorno

```bash
# .env.development
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=*

# .env.production
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://tuapp.com,https://www.tuapp.com
```

### Cargar Configuración

```javascript
import dotenv from "dotenv";

// Cargar según ambiente
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT) || 3001,
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["*"],
  isProd: process.env.NODE_ENV === "production",
};
```

### Comportamiento por Ambiente

| Característica | Desarrollo    | Producción       |
| -------------- | ------------- | ---------------- |
| CORS           | `*` (todos)   | Lista específica |
| Logs           | Detallados    | Solo errores     |
| Validación     | Activa        | Activa           |
| Stack traces   | Completos     | Ocultos          |
| Rate limiting  | Deshabilitado | Habilitado       |

---

## 📝 Ejemplos de Validación

### Ejemplo 1: Payload Válido ✅

```javascript
// Request
POST /api/blueprints
{
  "author": "juan",
  "name": "plano-1",
  "points": [
    { "x": 100, "y": 200 },
    { "x": 150, "y": 250 }
  ]
}

// Response: 201 Created
{
  "author": "juan",
  "name": "plano-1",
  "points": [...]
}
```

### Ejemplo 2: Autor Inválido ❌

```javascript
// Request
POST /api/blueprints
{
  "author": "juan@email.com",  // ❌ Contiene @
  "name": "plano-1",
  "points": []
}

// Response: 400 Bad Request
{
  "error": "Validation failed",
  "details": [
    {
      "field": "author",
      "message": "Only alphanumeric, _ and -"
    }
  ]
}
```

### Ejemplo 3: Punto Fuera de Rango ❌

```javascript
// Request
PUT /api/blueprints/juan/plano-1
{
  "points": [
    { "x": 700, "y": 200 }  // ❌ x > 600
  ]
}

// Response: 400 Bad Request
{
  "error": "Validation failed",
  "details": [
    {
      "field": "points.0.x",
      "message": "Number must be less than or equal to 600"
    }
  ]
}
```

### Ejemplo 4: Demasiados Puntos ❌

```javascript
// Request
PUT /api/blueprints/juan/plano-1
{
  "points": [ /* 1500 puntos */ ]  // ❌ > 1000
}

// Response: 400 Bad Request
{
  "error": "Validation failed",
  "details": [
    {
      "field": "points",
      "message": "Maximum 1000 points allowed"
    }
  ]
}
```

---

## ⚠️ Manejo de Errores

### Errores de Validación HTTP

```javascript
try {
  const validated = CreateBlueprintSchema.parse(req.body);
  // ... proceso
} catch (error) {
  if (error instanceof z.ZodError) {
    // Error de validación Zod
    log.warn("Validation failed", { errors: error.errors });
    return res.status(400).json({
      error: "Validation failed",
      details: error.errors,
    });
  }
  // Otro tipo de error
  log.error("Unexpected error", error);
  res.status(500).json({ error: "Internal server error" });
}
```

### Errores de Validación WebSocket

```javascript
socket.on("draw-event", (data) => {
  try {
    const validated = DrawEventSchema.parse(data);
    // ... proceso
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warn("Invalid draw-event data", { errors: error.errors });
      socket.emit("error", {
        message: "Invalid draw event data",
        details: error.errors,
      });
    }
  }
});
```

---

## 🧪 Pruebas de Validación

### Test 1: Autor Válido

```powershell
$body = '{"author":"juan","name":"test","points":[]}'
Invoke-RestMethod -Uri http://localhost:3001/api/blueprints -Method POST -Body $body -ContentType "application/json"
# ✅ Debe funcionar
```

### Test 2: Autor con Caracteres Especiales

```powershell
$body = '{"author":"juan@email","name":"test","points":[]}'
Invoke-RestMethod -Uri http://localhost:3001/api/blueprints -Method POST -Body $body -ContentType "application/json"
# ❌ Debe fallar con error de validación
```

### Test 3: Punto Fuera de Rango

```powershell
$body = '{"points":[{"x":700,"y":200}]}'
Invoke-RestMethod -Uri http://localhost:3001/api/blueprints/juan/plano-1 -Method PUT -Body $body -ContentType "application/json"
# ❌ Debe fallar: x > 600
```

### Test 4: Nombre Demasiado Largo

```powershell
$longName = "a" * 150  # 150 caracteres
$body = "{`"author`":`"juan`",`"name`":`"$longName`",`"points`":[]}"
Invoke-RestMethod -Uri http://localhost:3001/api/blueprints -Method POST -Body $body -ContentType "application/json"
# ❌ Debe fallar: name > 100 chars
```

---

## 🚀 Despliegue en Producción

### Checklist Pre-Despliegue

- [ ] Variable `NODE_ENV=production` configurada
- [ ] Lista `ALLOWED_ORIGINS` definida con dominios reales
- [ ] Certificado SSL/TLS instalado (HTTPS)
- [ ] Validación Zod activa en todos los endpoints
- [ ] Rate limiting configurado
- [ ] Logs de producción configurados
- [ ] Health checks funcionando
- [ ] Pruebas de seguridad realizadas

### Comando de Inicio Producción

```bash
# Servidor de producción
export NODE_ENV=production
export ALLOWED_ORIGINS="https://tuapp.com,https://www.tuapp.com"
npm start
```

### Verificar Configuración

```bash
# Debe mostrar: CORS: RESTRICTED
curl http://localhost:3001/health
```

---

## 📚 Referencias

- [Zod Documentation](https://zod.dev/)
- [CORS MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 💡 Tips de Seguridad Adicionales

1. **Rate Limiting**: Limita peticiones por IP (usa `express-rate-limit`)
2. **Helmet**: Agrega headers de seguridad (usa `helmet`)
3. **HTTPS Only**: Fuerza conexiones seguras en producción
4. **Input Sanitization**: Limpia datos HTML (usa `DOMPurify`)
5. **Authentication**: Implementa JWT o OAuth para usuarios
6. **Database**: Usa prepared statements o ORMs
7. **Secrets**: Nunca commits credenciales en Git
8. **Monitoring**: Implementa alertas de seguridad

---

**Última actualización:** Noviembre 2025  
**Autor:** Sistema de Validación y Seguridad
