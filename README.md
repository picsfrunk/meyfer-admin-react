# MeyFer - Panel de Administración (React)

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5.12-0170FE?logo=antdesign&logoColor=white)
![License](https://img.shields.io/badge/License-GPL--3.0-blue.svg)

Panel de administración B2B para la plataforma de comercio electrónico **MeyFer** (distribución de ferretería). Este proyecto está construido con React 18 y Ant Design, ofreciendo una interfaz robusta, responsiva y profesional para la gestión integral del negocio.

Forma parte del ecosistema MeyFer, conectándose directamente con la API REST `meyfer-backend-expressjs` (uno de los 4 microservicios que componen la plataforma).

---

## 🛠️ Stack Tecnológico

- **Core:** React 18.2
- **Build Tool:** Vite 8.0 (ES Modules)
- **UI Framework:** Ant Design 5.12 (Locale: `es_ES`, Color Principal: `#1677ff`)
- **Enrutamiento:** React Router DOM 6.18
- **Cliente HTTP:** Axios con interceptores JWT (Timeout: 10s)
- **Gestión de Estado:** React Context API (para Auth) + `useState` local
- **Despliegue:** Firebase Hosting
- **CI/CD:** GitHub Actions

## ✨ Funcionalidades Principales

### 🔐 Autenticación y Seguridad
- Autenticación mediante token JWT Bearer.
- Protección de rutas a través del componente `ProtectedRoute`.
- Auto-logout ante respuestas HTTP 401.
- Persistencia de sesión en `localStorage`.

### 📦 Pedidos (Orders)
- Dashboard con filtros por estado mediante *status pills* (Pendiente, Confirmado, En proceso, Enviado, Entregado, Cancelado, Eliminado).
- Tabla responsiva (vista de tabla en desktop, tarjetas en mobile).
- Modal detallado con 5 pestañas: Detalle, Entrega, Productos (con edición de precios en vivo), Bitácora (registro de auditoría) y Acciones.
- Borrado lógico (Soft delete).
- Reenvío de correos de confirmación (Admin/Cliente/Ambos).

### 👥 Clientes (Customers)
- CRUD completo de clientes B2B.
- Generación automática de `customerCode` único (6 caracteres) y botón de copiado rápido.
- Gestión de datos fiscales (Razón Social, CUIT) e información de contacto.
- Drawer integrado para ver el historial de pedidos del cliente.

### 🏷️ Productos (Products)
- Tabla paginada (50 ítems por página) con búsqueda optimizada (*debounced* 400ms).
- Filtros avanzados por categoría y marca.
- Creación manual con subida de imágenes a Cloudinary.
- Modal de actualización rápida de precios con cálculo automático de diferencia porcentual (%).

### 🔄 Sincronización de Catálogo
- Disparador de *scraping* completo del catálogo.
- Sincronización selectiva multi-categoría con contador de productos en tiempo real.
- Importación de listas de precios (desde URL configurada o subida manual de archivos XLSX/CSV).

### ⚙️ Procesos y Tareas en Segundo Plano (Jobs)
- Monitor de cola de procesos en tiempo real con auto-polling cada 10s.
- Cancelación de tareas (individual o global).
- Historial de ejecución con duración, estado y resultados.
- Comprobación de precios contra el sistema *upstream* (Odoo).

### 🔧 Configuración Global
- Ajuste del margen de ganancia global con visualización de multiplicador en vivo.
- Gestión de correos electrónicos para notificaciones administrativas (roles Admin y Vendedor).

### 🆘 Modo Ayuda y Desarrollador
- **Página de Ayuda:** Manual de operaciones no técnico para usuarios finales.
- **Modo Desarrollador (Dev Mode):** Modo oculto activable mediante `Ctrl+Shift+D` o 5 clics en el logo. Sincronizado entre pestañas vía `localStorage` y `CustomEvent`.

### 📱 Diseño Responsivo
- Interfaz fluida que adapta todas las tablas a vistas de tarjeta en dispositivos móviles (< 768px).

---

## 📋 Requisitos Previos

- Node.js 18 o superior.
- npm (Node Package Manager).
- API Backend de MeyFer (`meyfer-backend-expressjs`) ejecutándose localmente (por defecto en el puerto `3000`).

---

## 🚀 Instalación y Ejecución

1. Clonar el repositorio.
2. Instalar las dependencias:

```bash
npm install
```

3. Iniciar el servidor de desarrollo:

```bash
npm run dev
```
*La aplicación estará disponible en `http://localhost:5271`.*

### Otros scripts disponibles:

- `npm run build`: Genera la versión de producción optimizada.
- `npm run lint`: Ejecuta ESLint 9 para análisis estático del código.
- `npm run preview`: Sirve localmente la build de producción para pruebas.

---

## ⚙️ Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto basándose en el entorno necesario. La única variable requerida para el funcionamiento básico es:

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_BASE_URL` | URL de la API del backend | `http://localhost:3000/api` |

---

## 🏗️ Estructura del Proyecto

```text
src/
├── App.jsx                    # Raíz + ConfigProvider (AntD) + Rutas
├── main.jsx                   # React 18 createRoot
├── index.css                  # Estilos globales
├── components/
│   ├── DashboardLayout.jsx    # Sidebar, Header y badge de DevMode
│   ├── ProtectedRoute.jsx     # Guardia de autenticación
│   └── common/HelpPanel.jsx   # Widget de ayuda colapsable
├── context/
│   ├── AuthContext.jsx        # Proveedor de autenticación
│   ├── authContextValue.js    # Instancia del contexto
│   └── useAuth.js             # Hook de autenticación personalizado
├── hooks/
│   └── useAdminDevMode.js     # Lógica del modo desarrollador secreto
├── models/
│   └── orderModel.js          # Normalizadores y helpers para pedidos
├── pages/
│   ├── Login.jsx              # Pantalla de inicio de sesión
│   ├── Catalog.jsx            # Gestión y sincronización de catálogos
│   ├── Config.jsx             # Ajustes del sistema
│   ├── CustomersPage.jsx      # Gestión de clientes
│   ├── HelpPage.jsx           # Manual de usuario
│   ├── JobsPage.jsx           # Monitor de tareas asíncronas
│   ├── Orders/                # Módulo de Pedidos (4 archivos)
│   └── Products/              # Módulo de Productos (5 archivos)
├── services/
│   ├── api.js                 # Endpoints Auth, Config, Productos, Clientes, Pedidos
│   ├── scraperAPI.js          # Endpoints para Scraper, procesos e historial
│   └── priceListImportService.js # Servicio de importación de listas de precios
└── utils/
    └── apiError.js            # Manejador de errores HTTP
```

---

## 🗺️ Mapa de Rutas

| Ruta | Componente | ¿Protegida? | Descripción |
|---|---|:---:|---|
| `/login` | `Login` | No | Pantalla de inicio de sesión |
| `/orders` | `Orders` | **Sí** | Gestión principal de pedidos |
| `/customers` | `CustomersPage` | **Sí** | Listado y CRUD de clientes B2B |
| `/products` | `Products` | **Sí** | Catálogo de productos y gestión rápida de precios |
| `/catalog` | `Catalog` | **Sí** | Scraper, importaciones e integraciones |
| `/config` | `Config` | **Sí** | Configuración general del sistema |
| `/procesos` | `JobsPage` | **Sí** | Panel de monitoreo de trabajos en segundo plano |
| `/help` | `HelpPage` | **Sí** | Manual de operaciones para el administrador |
| `*` | - | - | Redirección por defecto a `/orders` |

---

## ☁️ Despliegue (Deployment)

El proyecto está configurado para desplegarse automáticamente a través de **GitHub Actions** hacia **Firebase Hosting**.

- **Proyecto en Firebase:** `admin-meyfer`
- **Target:** `meyferadmin`
- **Workflows:** 
  - `firebase-hosting-merge.yml` (Despliegue a producción en merge a main)
  - `firebase-hosting-pull-request.yml` (Canales de preview para PRs)

---

## 📄 Licencia

Este proyecto está bajo la Licencia **GPL-3.0**.
