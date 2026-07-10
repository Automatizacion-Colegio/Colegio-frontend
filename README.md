# Frontend - I.E.P. José María Arguedas ERP

Este directorio contiene la interfaz de usuario (Frontend) del Sistema ERP Escolar de la **I.E.P. José María Arguedas**. Está construido con tecnologías modernas para garantizar una experiencia rápida, fluida y de aspecto premium.

## 🎨 Identidad Visual (Cinematic Dark Mode & Gold)

El diseño de la plataforma se rige por pautas estrictas para asegurar un entorno profesional:
- **Fondos profundos**: Uso principal de `bg-slate-950` y `bg-slate-900` para reducir la fatiga visual.
- **Acentos Premium**: Detalles sutiles en tonos dorados (`yellow-600` y `yellow-500`) que reemplazan a los colores neón para denotar prestigio institucional.
- **Iconografía**: Limpia y corporativa, eliminando por completo el uso de emojis (🤖, 🧠, etc.) o estéticas "robóticas" y sustituyéndolos por iconos vectoriales de Lucide React.
- **Lenguaje**: Profesional y enfocado al área educativa (ej. "Asignación Automática", "Expediente Psicológico"), dejando de lado jergas técnicas de IA.

## 🛠️ Stack Tecnológico

- **React 18**: Librería principal para la construcción de interfaces interactivas.
- **Vite**: Empaquetador de módulos y servidor de desarrollo ultrarrápido.
- **Tailwind CSS**: Framework de CSS para aplicar los estilos de la identidad institucional directamente en los componentes.
- **Zustand** (o Context API): Para el manejo de estados globales (ej. `useAuthStore` para sesiones).
- **React Router DOM**: Para la navegación entre los distintos portales (Login, Admisión, Dashboards).

## 📂 Estructura de Vistas (Pages)

La carpeta `src/pages/` contiene los portales principales del colegio:
1. `Landing.jsx`: Página de presentación pública de la institución (intocable en refactorizaciones internas).
2. `Login.jsx`: Portal de acceso seguro para todos los usuarios.
3. `AdmisionPortal.jsx`: Interfaz paso a paso (wizard) para que los nuevos padres postulen a sus hijos.
4. `AdminDashboard.jsx`: Portal del Director. Gestión de cursos, asignaciones automáticas y métricas.
5. `DocenteDashboard.jsx`: Portal para profesores. Asistencia, notas y generador de exámenes.
6. `PsicologoDashboard.jsx`: Portal para el departamento de orientación y seguimiento conductual.
7. `PadreDashboard.jsx`: Portal para seguimiento de notas, proyecciones y comunicaciones.
8. `SecretarioDashboard.jsx`: Portal para matrículas, validación de vouchers y atención al cliente.

## 🚀 Instalación y Ejecución

Para correr este proyecto en tu entorno local, asegúrate de tener Node.js instalado (v18+).

```bash
# 1. Instalar las dependencias
npm install

# 2. Iniciar el servidor de desarrollo local
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`. Recuerda tener el servidor Backend (FastAPI) corriendo en paralelo en el puerto `8000` para que los datos carguen correctamente.
