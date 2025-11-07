# ¿Cómo Probar los Endpoints del Servidor?

## Requisitos

1. Servidor corriendo en una terminal:

   ```
   cd .\example-backend-socketio-node-\
   npm i
   npm run dev
   ```

2. El servidor debe estar en `http://localhost:3001`

---

### Usando Postman o Thunder Client (VS Code Extension)

Crea requests para cada endpoint:

#### GET - Lista de blueprints

- **Method**: GET
- **URL**: `http://localhost:3001/api/blueprints/juan`

#### GET - Blueprint específico

- **Method**: GET
- **URL**: `http://localhost:3001/api/blueprints/juan/plano-1`

#### POST - Crear blueprint

- **Method**: POST
- **URL**: `http://localhost:3001/api/blueprints`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):

```json
{
  "author": "juan",
  "name": "plano-test",
  "points": [
    { "x": 50, "y": 50 },
    { "x": 150, "y": 100 },
    { "x": 200, "y": 200 }
  ]
}
```

#### PUT - Actualizar blueprint

- **Method**: PUT
- **URL**: `http://localhost:3001/api/blueprints/juan/plano-test`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):

```json
{
  "points": [
    { "x": 10, "y": 10 },
    { "x": 50, "y": 50 },
    { "x": 100, "y": 100 },
    { "x": 150, "y": 150 }
  ]
}
```

#### DELETE - Eliminar blueprint

- **Method**: DELETE
- **URL**: `http://localhost:3001/api/blueprints/juan/plano-test`

---

## Flujo de Prueba Completo

1. **Inicia el servidor**: `node server.js`
2. **Obtén la lista inicial**: GET `/api/blueprints/juan` → Deberías ver "plano-1"
3. **Crea un nuevo plano**: POST `/api/blueprints` con datos de "plano-test"
4. **Verifica la creación**: GET `/api/blueprints/juan` → Deberías ver 2 planos
5. **Actualiza el plano**: PUT `/api/blueprints/juan/plano-test` con nuevos puntos
6. **Verifica la actualización**: GET `/api/blueprints/juan/plano-test` → Deberías ver los nuevos puntos
7. **Elimina el plano**: DELETE `/api/blueprints/juan/plano-test`
8. **Verifica la eliminación**: GET `/api/blueprints/juan` → Solo debería quedar "plano-1"

---

## Importante

- El servidor almacena datos en memoria (se pierden al reiniciar)
- CORS está habilitado para todos los orígenes (`*`)
- El servidor notifica cambios en tiempo real vía Socket.IO
- Los eventos `blueprint-update` y `blueprints-list-update` mantienen sincronizadas todas las pestañas abiertas

---

## Recomendación

**La forma más fácil de probar todo es usar el frontend:**

1. Servidor: `node server.js` en una terminal
2. Frontend: `npm run dev` en otra terminal
3. Abrir `http://localhost:5173` en el navegador
4. ¡Prueba todas las funciones visualmente!
