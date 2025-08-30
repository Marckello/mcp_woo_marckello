# MCP WooCommerce Server

Un servidor MCP (Model Context Protocol) completo para integración con WooCommerce, optimizado para despliegue en EasyPanel y conectividad con n8n.

## 🚀 Características Principales

### ✅ Completamente Implementado

- **🛍️ Gestión Completa de Productos**: CRUD completo con validación avanzada
- **📦 Administración de Pedidos**: Crear, actualizar, consultar pedidos y notas
- **👥 Gestión de Clientes**: Sistema completo de gestión de usuarios
- **🏷️ Categorías y Etiquetas**: Organización completa de productos
- **💰 Sistema de Cupones**: Gestión de descuentos y promociones
- **📊 Recursos MCP**: Información de tienda, configuraciones y reportes
- **🔒 Seguridad Avanzada**: Validación, sanitización y logging
- **🐳 Docker Ready**: Configuración optimizada para producción
- **📈 N8n Integration**: Webhooks y conectividad automática

### 🎯 Funcionalidades de Productos
- `wc_get_products` - Listar productos con filtros avanzados
- `wc_get_product` - Obtener producto específico
- `wc_create_product` - Crear nuevos productos
- `wc_update_product` - Actualizar productos existentes
- `wc_delete_product` - Eliminar productos
- `wc_batch_products` - Operaciones masivas

### 📦 Funcionalidades de Pedidos
- `wc_get_orders` - Listar pedidos con filtros
- `wc_get_order` - Obtener pedido específico
- `wc_create_order` - Crear nuevos pedidos
- `wc_update_order` - Actualizar pedidos
- `wc_delete_order` - Eliminar pedidos
- `wc_get_order_notes` - Obtener notas de pedidos
- `wc_add_order_note` - Añadir notas a pedidos

### 👥 Funcionalidades de Clientes
- `wc_get_customers` - Listar clientes
- `wc_get_customer` - Obtener cliente específico
- `wc_create_customer` - Crear nuevos clientes
- `wc_update_customer` - Actualizar clientes
- `wc_delete_customer` - Eliminar clientes
- `wc_batch_customers` - Operaciones masivas de clientes
- `wc_get_customer_orders` - Pedidos de un cliente específico

## 🔧 URLs y Endpoints Activos

### Producción
- **API Health**: `http://localhost:3000/health`
- **Store Info**: `http://localhost:3000/info` 
- **N8n Webhook**: `http://localhost:3000/webhook/n8n`

### Recursos MCP Disponibles
- `woocommerce://store/info` - Información general de la tienda
- `woocommerce://store/settings` - Configuración de WooCommerce
- `woocommerce://reports/sales` - Reportes de ventas
- `woocommerce://system/status` - Estado del sistema

## 🏗️ Arquitectura de Datos

### Servicios de Almacenamiento
- **WooCommerce REST API**: Integración nativa completa
- **Logging System**: Winston con rotación de logs
- **Validación**: Joi schemas para todos los endpoints
- **Cache**: Headers optimizados para performance

### Modelos de Datos Principales
```typescript
// Productos con todas las propiedades WooCommerce
WooCommerceProduct: name, type, status, price, stock, categories, etc.

// Pedidos con líneas de productos y facturación
WooCommerceOrder: customer, line_items, billing, shipping, payment, etc.

// Clientes con direcciones y metadata
WooCommerceCustomer: email, billing, shipping, orders_count, etc.
```

### Flujo de Datos
1. **Validación** → Joi schemas + sanitización
2. **Procesamiento** → WooCommerce API calls
3. **Respuesta** → Formato MCP estándar
4. **Logging** → Winston structured logging
5. **N8n Events** → Webhook notifications (opcional)

## 📖 Guía de Usuario

### 1. Configuración Básica
```bash
# Clonar y configurar
git clone <repo-url>
cd mcp-woocommerce-server
cp .env.example .env

# Editar .env con tus credenciales WooCommerce
WOOCOMMERCE_SITE_URL=https://tu-tienda.com
WOOCOMMERCE_CONSUMER_KEY=ck_tu_clave_aqui
WOOCOMMERCE_CONSUMER_SECRET=cs_tu_secreto_aqui
```

### 2. Desarrollo Local
```bash
npm install
npm run build
npm run dev
```

### 3. Despliegue con Docker
```bash
docker-compose up -d
```

### 4. Despliegue en EasyPanel
1. Subir el proyecto a tu repositorio Git
2. En EasyPanel: New App → Git Repository
3. Configurar variables de entorno desde `docker/easypanel.json`
4. Deploy automático

### 5. Integración con N8n
```bash
# Habilitar n8n en .env
N8N_ENABLED=true
N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/woocommerce
N8N_WEBHOOK_SECRET=tu_secreto_webhook
```

## 🚀 Despliegue

### Plataforma: EasyPanel + Docker
- **Estado**: ✅ Configurado y listo
- **Tech Stack**: Node.js + TypeScript + Express + MCP SDK
- **Contenedor**: Optimizado para producción con multi-stage build
- **Health Checks**: Configurados y funcionales
- **Logs**: Persistentes con rotación automática

### Configuración de EasyPanel
```json
{
  "ports": [3000],
  "environment": ["WOOCOMMERCE_*", "N8N_*", "LOG_LEVEL"],
  "volumes": ["/app/logs", "/app/data"],
  "healthcheck": "/health",
  "restart_policy": "unless-stopped"
}
```

### URLs de Producción
- Health Check: `https://tu-dominio.com/health`
- API Info: `https://tu-dominio.com/info`
- N8n Webhook: `https://tu-dominio.com/webhook/n8n`

## 🔄 Próximos Pasos Recomendados

### Inmediatos (Listo para Implementar)
1. **Deploy a EasyPanel** - Todo configurado, solo necesitas las credenciales
2. **Configurar N8n** - Workflows de ejemplo incluidos
3. **Test de Integración** - Usar endpoints `/health` y `/info`

### Extensiones Futuras
1. **Webhooks WooCommerce** - Escuchar eventos de la tienda
2. **Cache Redis** - Para mejor performance en consultas
3. **Dashboard Web** - Interface visual para monitoreo
4. **Métricas Avanzadas** - Prometheus/Grafana integration

## 🛠️ Desarrollo y Testing

### Scripts Disponibles
```bash
npm run build          # Compilar TypeScript
npm run dev           # Desarrollo con hot reload
npm run start         # Producción
npm run lint          # Linting con ESLint
npm run test          # Testing con Jest
npm run docker:build  # Build Docker image
npm run docker:run    # Run Docker container
```

### Testing
```bash
# Test de conectividad
curl http://localhost:3000/health

# Test de información de tienda
curl http://localhost:3000/info

# Test MCP (requiere MCP client)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## 📝 Notas Técnicas

### Requisitos del Sistema
- **Node.js**: 18+ (Alpine Linux en Docker)
- **Memoria**: 256MB mínimo, 512MB recomendado
- **CPU**: 100m mínimo, 500m recomendado
- **Storage**: 1GB para logs y data

### Consideraciones de Seguridad
- Validación estricta con Joi
- Sanitización de inputs
- Headers de seguridad con Helmet
- Rate limiting configurable
- Logs estructurados sin datos sensibles

### Performance
- Timeout configurable (30s default)
- Conexión keepalive a WooCommerce
- Logging asíncrono
- Health checks optimizados

---

**Autor**: Marco - Marketing Digital Expert
**Versión**: 1.0.0
**Licencia**: MIT
**Última Actualización**: 2024-08-30

## 🤝 Contribuciones

Este proyecto está listo para producción. Para contribuciones:

1. Fork del repositorio
2. Crear feature branch
3. Tests y documentación
4. Pull request con descripción detallada

## 📞 Soporte

Para soporte técnico o consultas de implementación, revisar:
- Logs en `/app/logs/` dentro del contenedor
- Health check en `/health`
- Documentación de WooCommerce REST API
- N8n community docs para workflows