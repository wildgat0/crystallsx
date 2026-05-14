# Crystallsx — Tienda de Moda de Lujo

Plataforma de e-commerce para tienda de moda, construida con Next.js 15, Prisma y PostgreSQL. Incluye catálogo de productos con carrusel de imágenes, carrito de compras, checkout por transferencia bancaria y panel de administración completo.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Base de datos | PostgreSQL 16 + Prisma ORM |
| Autenticación | NextAuth v4 |
| Imágenes | Cloudinary |
| Estilos | Tailwind CSS |
| Contenedores | Docker + Docker Compose |
| Lenguaje | TypeScript |

---

## Funcionalidades

### Tienda
- Catálogo completo de productos con filtro por categoría
- Carrusel de imágenes por producto con navegación de flechas
- Selector de color con círculos de color y tooltip (Negro, Blanco, Rojo, etc.)
- Carrito de compras lateral con persistencia
- Checkout con resumen de pedido y pago por transferencia bancaria
- Portal de clientes (registro, login, historial de pedidos)

### Panel de Administración (`/admin`)
- Gestión de productos: crear, editar, ocultar/mostrar, eliminar
- Subida de múltiples imágenes por producto (upload directo o desde biblioteca Cloudinary)
- Asignación de color por imagen con paleta predefinida
- Gestión de órdenes con flujo de estados (Pendiente → Confirmado → Enviado → Entregado)
- Gestión de cuentas bancarias para recepción de pagos
- Rotación automática de cuentas bancarias activas
- Configuración general de la aplicación

---

## Estructura del Proyecto

```
crystallsx/
├── prisma/
│   ├── schema.prisma          # Modelos de base de datos
│   └── seed.ts                # Datos iniciales
├── src/
│   ├── app/
│   │   ├── page.tsx           # Página de inicio (tienda)
│   │   ├── checkout/          # Proceso de compra
│   │   ├── order/[id]/        # Detalle de pedido
│   │   ├── cuenta/            # Portal de clientes
│   │   ├── admin/             # Panel de administración
│   │   └── api/               # Rutas API REST
│   ├── components/
│   │   ├── store/             # Componentes de la tienda
│   │   └── admin/             # Componentes del panel admin
│   └── lib/
│       ├── auth.ts            # Configuración NextAuth
│       ├── cart-context.tsx   # Estado global del carrito
│       ├── colors.ts          # Paleta de colores para productos
│       └── prisma.ts          # Instancia de Prisma Client
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## Variables de Entorno

Copia `.env.example` a `.env` y completa los valores:

```env
# Base de datos
DATABASE_URL=postgresql://crystallsx:crystallsx_pass@db:5432/crystallsx

# NextAuth
NEXTAUTH_SECRET=cambia_esto_en_produccion
NEXTAUTH_URL=http://localhost:3000

# Cloudinary (para subida de imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

---

## Instalación y Ejecución

### Con Docker (recomendado)

```bash
# Clonar el repositorio
git clone <repo-url>
cd crystallsx

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Levantar los servicios
docker compose up --build
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).  
La base de datos se inicializa automáticamente con `prisma db push` y `prisma db seed`.

### Sin Docker (desarrollo local)

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npx prisma generate
npx prisma db push
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # Compilar para producción
npm start            # Servidor de producción

# Base de datos
npx prisma studio    # Explorador visual de la BD
npx prisma db push   # Aplicar cambios del schema
npx prisma db seed   # Sembrar datos iniciales (solo si la BD está vacía)

# Docker
docker compose up -d            # Levantar en segundo plano
docker compose down             # Detener servicios
docker compose logs -f app      # Ver logs de la aplicación
docker compose exec app sh      # Shell dentro del contenedor
```

---

## Modelos de Base de Datos

```
Product         — Catálogo de productos
ProductImage    — Imágenes de cada producto (con color opcional)
Order           — Pedidos de clientes
OrderItem       — Líneas de cada pedido
BankAccount     — Cuentas bancarias para recibir pagos
AppConfig       — Configuración general de la app
AdminUser       — Usuarios del panel de administración
Customer        — Clientes registrados en la tienda
```

### Estados de un Pedido

```
PENDING_PAYMENT → PAYMENT_SUBMITTED → PAYMENT_CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                                                                              ↘ CANCELLED
```

---

## API REST

### Pública
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/customers/register` | Registro de cliente |
| POST | `/api/orders` | Crear pedido |
| GET | `/api/orders` | Consultar pedidos del cliente |

### Admin (requiere sesión de administrador)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/admin/products` | Listar / crear productos |
| PATCH/DELETE | `/api/admin/products/[id]` | Editar / eliminar producto |
| POST | `/api/admin/upload` | Subir imagen a Cloudinary |
| GET/PATCH | `/api/admin/orders/[id]` | Ver / actualizar estado de orden |
| GET/POST | `/api/admin/bank-accounts` | Gestión de cuentas bancarias |
| POST | `/api/admin/rotate` | Rotar cuenta bancaria activa |
| GET/PUT | `/api/admin/settings` | Configuración de la aplicación |

---

## Primer Acceso al Panel Admin

El seed crea un usuario administrador por defecto:

```
Email:    admin@crystallsx.com
Password: admin123
```

> Cambia la contraseña desde el panel después del primer ingreso.

---

## Licencia

Proyecto privado — Crystallsx. Todos los derechos reservados.
