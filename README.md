# Empaques Múltiples Website

Este proyecto combina el sitio web estático de Empaques Múltiples con el sistema de registro de almuerzos en una aplicación React unificada.

## Estructura del Proyecto

```
/
├── src/
│   ├── components/
│   │   ├── StaticWebsite/         # Componentes del sitio estático
│   │   │   ├── MainPage.jsx       # Página principal
│   │   │   └── index.jsx          # Exportación principal
│   │   ├── LunchSystem/           # Componentes del sistema de almuerzos
│   │   │   ├── pages/             # Páginas del sistema
│   │   │   ├── Header.jsx         # Header del sistema
│   │   │   ├── Navigation.jsx     # Navegación
│   │   │   └── index.jsx          # Componente principal
│   │   └── NotFound.jsx           # Página 404
│   ├── hooks/
│   │   └── useAuth.js             # Hook de autenticación
│   ├── lib/
│   │   ├── supabase.js            # Configuración de Supabase
│   │   └── offline.js             # Funcionalidad offline
│   ├── App.jsx                    # Aplicación principal con rutas
│   ├── main.jsx                   # Punto de entrada
│   └── styles.css                 # Estilos del sistema de almuerzos
├── public/                        # Archivos públicos
├── index-static.html              # Sitio web estático original
├── vercel.json                    # Configuración de Vercel
└── package.json                   # Dependencias del proyecto
```

## Rutas

- `/` - Página principal que proporciona acceso tanto al sitio estático como al sistema de almuerzos
- `/lunch-system/*` - Sistema de registro de almuerzos (React SPA)
- `/index-static.html` - Sitio web estático original
- Cualquier otra ruta - Página 404

## Configuración de Desarrollo

### Prerrequisitos
- Node.js 18+
- npm

### Instalación
```bash
npm install
```

### Variables de Entorno
Crear un archivo `.env` en la raíz con:
```
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### Desarrollo
```bash
npm run dev
```

### Construcción
```bash
npm run build
```

## Configuración de Vercel

### Variables de Entorno en Vercel
Configurar en Vercel Dashboard > Settings > Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Configuración de Rutas
El archivo `vercel.json` está configurado para:
1. Dirigir `/lunch-system/*` a la aplicación React
2. Mantener el acceso a archivos estáticos (CSS, JS, imágenes)
3. Dirigir otras rutas React a la aplicación principal

## Funcionalidades

### Sitio Principal (/)
- Página de bienvenida con enlaces a:
  - Sitio web estático original
  - Sistema de registro de almuerzos
- Información sobre ambos sistemas

### Sistema de Almuerzos (/lunch-system/*)
- Autenticación de usuarios
- Registro de almuerzos
- Dashboard personal
- Panel de administración
- Funcionalidad offline

### Características Técnicas
- React 18 con React Router
- Integración con Supabase para autenticación y base de datos
- Componentes reutilizables
- Diseño responsivo
- Manejo de errores 404
- Build optimizado con Vite

## Despliegue

El proyecto está configurado para desplegarse automáticamente en Vercel:
1. Las variables de entorno deben configurarse en Vercel
2. El proyecto se construye automáticamente con `npm run build`
3. Las rutas se manejan según la configuración en `vercel.json`

## Migración

Este proyecto mantiene compatibilidad completa con:
- El sitio web estático existente
- Toda la funcionalidad del sistema de almuerzos
- La base de datos Supabase existente
- Los assets y recursos actuales