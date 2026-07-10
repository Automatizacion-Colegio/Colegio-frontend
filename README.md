<div align="center">

# 🎓 ERP Escolar AI - Frontend

**Interfaz moderna y reactiva para el sistema de gestión escolar impulsado por IA**

[![Build Status](https://github.com/tu-usuario/erp_escolar_ai/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/tu-usuario/erp_escolar_ai/actions)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-orange)](https://zustand-demo.pmnd.rs/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)](https://vercel.com/)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Seguridad y Autenticación](#-seguridad-y-autenticación)
- [Variables de Entorno](#-variables-de-entorno)
- [Instalación y Ejecución Local](#-instalación-y-ejecución-local)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Estructura del Proyecto](#-estructura-del-proyecto)

---

## 📖 Descripción

**ERP Escolar AI Frontend** es la interfaz de usuario para el sistema de gestión del I.E.P. José María Arguedas. Construida como una Single Page Application (SPA) ultra rápida con **React 19** y **Vite**, se conecta directamente al backend de FastAPI y proporciona una experiencia interactiva fluida tanto para administradores como para docentes, estudiantes y padres. Su diseño está potenciado por Tailwind CSS para garantizar que sea completamente *responsive*.

---

## 🏗️ Arquitectura

```text
┌─────────────────────────────────────────────────────────────┐
│                 Vercel (Hosting Global CDN)                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ERP Escolar AI (Frontend)              │    │
│  │                                                     │    │
│  │  Páginas (React Router) ←→  Store Global (Zustand)  │    │
│  │           │                          │              │    │
│  │  Componentes UI (Tailwind + Lucide React)           │    │
│  └───────────┼──────────────────────────┼──────────────┘    │
└──────────────┼──────────────────────────┼───────────────────┘
               │                          │
               ▼                          ▼
       [Axios Interceptors]       [Auth & JWT Storage]
               │                          │
               └────────────┬─────────────┘
                            │ HTTPS / API REST
                            ▼
               ┌───────────────────────────┐
               │    Backend (Cloud Run)    │
               └───────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| **Librería UI** | React | 19.2.6 |
| **Bundler / Build Tool** | Vite | 8.0.12 |
| **Estilos** | Tailwind CSS | 4.3.0 |
| **Enrutamiento** | React Router DOM | 7.15.1 |
| **Estado Global** | Zustand | 5.0.13 |
| **Peticiones HTTP** | Axios | 1.16.1 |
| **Iconografía** | Lucide React | 1.23.0 |
| **Linting** | ESLint | 10.3.0 |
| **Despliegue** | Vercel | — |

---

## 📦 Módulos del Sistema

### 🔐 Autenticación (Login & Sesión)
Módulo encargado de interactuar con el endpoint `/token` del backend, almacenar de forma segura el JWT y determinar la redirección inicial basándose en el rol (`ADMIN`, `DOCENTE`, `ALUMNO_PADRE`, etc.).

### 📊 Dashboards y Vistas por Rol (`src/pages/`)
Páginas dinámicas construidas con React Router. Cada usuario recibe un menú y un dashboard diferente según sus permisos:
- **Administrador / Secretaría**: Gestión de estudiantes, matrículas y personal.
- **Docente**: Ingreso de notas y reportes asistidos por IA.
- **Padres/Alumnos**: Visualización del rendimiento académico y alertas automáticas de IA.

### 🧩 Componentes Reutilizables (`src/components/`)
Botones, modales, tablas de datos, tarjetas (cards) y formularios que utilizan clases de Tailwind CSS estandarizadas para mantener coherencia visual en toda la aplicación.

### 🗄️ Gestión de Estado Global (`src/store/`)
Uso de **Zustand** para manejar estados que se necesitan en diferentes partes de la aplicación (como la sesión del usuario activo, notificaciones en tiempo real, o carritos/vistas pendientes) sin prop-drilling complejo.

---

## 🛡️ Seguridad y Autenticación

### Interceptores de Axios
Todas las llamadas al servidor están envueltas en interceptores de Axios. 
- **Request**: Adjuntan automáticamente el header `Authorization: Bearer <token>` si hay una sesión activa.
- **Response**: Si el backend devuelve un `401 Unauthorized` (token expirado o inválido), la aplicación limpia el estado local con Zustand y redirige inmediatamente al usuario a la pantalla de Login.

### Protección de Rutas (Private Routes)
React Router está configurado con validadores lógicos que impiden acceder a URLs restringidas si el estado global de autenticación es falso o si el rol del usuario no tiene los privilegios adecuados.

---

## ⚙️ Variables de Entorno

Crear un archivo `.env` en la raíz del frontend. En desarrollo, Vite procesará estas variables automáticamente.

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend (Ej: `http://localhost:8000` o la URL de Cloud Run) |

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/erp_escolar_ai.git
cd erp_escolar_ai/frontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar `.env`
Crea tu archivo de variables de entorno:
```bash
echo "VITE_API_URL=http://localhost:8000" > .env
```

### 4. Iniciar servidor de desarrollo
Vite proporciona HMR (Hot Module Replacement) ultrarrápido.
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 5. Compilar para producción (Local)
Para previsualizar cómo se construirá y optimizará el bundle:
```bash
npm run build
npm run preview
```

---

## 🔄 CI/CD Pipeline

El despliegue está pensado nativamente para plataformas como **Vercel** o **Cloudflare Pages**. 

Con **Vercel**:
1. El repositorio está conectado a Vercel.
2. Ante cada `push` a la rama `main`, Vercel ejecuta `npm run build`.
3. Inyecta la variable de entorno `VITE_API_URL` apuntando a tu backend en Cloud Run.
4. Distribuye la aplicación estática a través de su CDN global en segundos.

Alternativamente, el repositorio cuenta con flujos de **GitHub Actions** listos para correr el linter (`npm run lint`) antes de permitir un PR.

---

## 📁 Estructura del Proyecto

```text
frontend/
├── public/                # Archivos estáticos crudos (íconos, manifest)
├── src/
│   ├── assets/            # Imágenes, SVGs, etc. procesados por Vite
│   ├── components/        # Componentes UI reutilizables (Botones, Tablas)
│   ├── pages/             # Vistas completas que son mapeadas en el Router
│   ├── store/             # Lógica de Zustand para el estado global (sesión)
│   ├── App.jsx            # Configuración base del Router y Layouts
│   ├── index.css          # Directivas principales de Tailwind CSS
│   └── main.jsx           # Punto de entrada de React (createRoot)
├── .env                   # Variables de entorno
├── eslint.config.js       # Reglas estandarizadas de ESLint
├── package.json           # Scripts NPM y dependencias
├── vite.config.js         # Configuración del bundler de Vite
└── README.md
```

---

<div align="center">

Desarrollado con ❤️ para el ecosistema educativo

</div>
