# VendedorAI — Guía de Despliegue

## Arquitectura
- Frontend: Next.js → Vercel
- Backend: Node.js/Express → Railway
- Base de datos: PostgreSQL → Railway

---

## 1. Base de datos (Railway)

1. Crea cuenta en https://railway.app
2. New Project → Add Database → PostgreSQL
3. Copia la variable `DATABASE_URL` del panel de Railway
4. Abre el Query Editor de Railway y ejecuta el archivo `database/schema.sql`

---

## 2. Backend (Railway)

1. En el mismo proyecto de Railway: New Service → Deploy from GitHub
2. Selecciona el repo, apunta al folder `backend/`
3. Variables de entorno en Railway:
   ```
   DATABASE_URL=<copiada del paso anterior>
   FRONTEND_URL=https://tu-app.vercel.app
   PORT=3001
   ```
4. Railway detectará automáticamente `npm start`
5. Copia la URL pública del servicio (ej: `https://vendedorai-api.up.railway.app`)

---

## 3. Frontend (Vercel)

1. Crea cuenta en https://vercel.com
2. Import Project → selecciona el repo → carpeta `frontend/`
3. Variables de entorno en Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://vendedorai-api.up.railway.app
   ```
4. Deploy → Vercel entrega la URL pública

---

## Verificación

- Frontend: `https://tu-app.vercel.app` — aparece la pantalla de encuesta
- API health: `https://vendedorai-api.up.railway.app/health` — responde `{"ok":true}`
- Dashboard: `https://tu-app.vercel.app/dashboard`
- Muestreo: `https://tu-app.vercel.app/muestreo`

---

## Modo offline

La app guarda encuestas en `localStorage` si falla la conexión.  
Al recuperar conexión, sincroniza automáticamente en la próxima encuesta completada.

---

## Comandos de desarrollo local

```bash
# Backend
cd backend
npm install
cp .env.example .env  # edita DATABASE_URL
npm run dev           # inicia en :3001

# Frontend
cd frontend
npm install
cp .env.example .env.local  # edita NEXT_PUBLIC_API_URL
npm run dev                  # inicia en :3000
```

## Estructura del proyecto

```
vendedorai/
├── database/
│   └── schema.sql          # Esquema PostgreSQL + datos de ejemplo
├── backend/
│   ├── server.js           # Express API
│   └── package.json
└── frontend/
    ├── app/
    │   ├── page.tsx         # Encuesta (pantalla principal)
    │   ├── dashboard/page.tsx
    │   ├── muestreo/page.tsx
    │   ├── layout.tsx
    │   └── globals.css
    └── lib/
        ├── api.ts           # Cliente HTTP
        └── constants.ts     # Zonas, rubros, preguntas
```
