# Mi Agenda — Guía para Claude

## Qué es este proyecto
App de agenda personal PWA en JavaScript puro (sin framework). Se vende como SaaS con versión gratuita y versión Pro con funciones de IA.

## URLs importantes
- **App pública:** https://mi-agenda-mauve.vercel.app
- **GitHub:** https://github.com/Anamolsan/mi-agenda
- **Supabase:** https://nrizmageyrasdcadpvpl.supabase.co
- **Local (XAMPP):** C:\xampp\htdocs\mi-agenda

## Stack técnico
- Frontend: Vanilla JS + CSS puro (sin framework, sin bundler)
- Auth + BD: Supabase (PostgreSQL + Supabase Auth)
- Hosting: Vercel (auto-deploy desde GitHub en cada push)
- Pagos: Stripe (pendiente de implementar)
- IA: Claude API de Anthropic (pendiente de implementar)

## Archivos principales
- `index.html` — HTML completo de la app + pantalla de login
- `app.js` — Toda la lógica de la app (IIFE vanilla JS)
- `style.css` — Estilos completos (tema claro/oscuro, responsive)
- `supabase-client.js` — Inicializa `_sb` (cliente Supabase global)
- `auth.js` — Login, registro, logout. Llama a `window.loadData(userId)` al entrar
- `manifest.json` — PWA manifest

## Cómo subir cambios
Desde PowerShell con git en PATH:
```
$env:PATH += ";C:\Program Files\Git\bin"
cd C:\xampp\htdocs\mi-agenda
git add .
git commit -m "descripción"
git push
```
Vercel publica automáticamente en 1-2 minutos tras el push.

## Base de datos Supabase — tablas creadas
Todas tienen `user_id` + Row Level Security (cada usuario solo ve sus datos).

- `tasks` — id, user_id, title, description, priority, category, due_date, due_time, completed, created_at
- `notes` — id, user_id, title, content, color, pinned, created_at, updated_at
- `events` — id, user_id, title, date, start_time, end_time, notes, color, created_at
- `contacts` — id, user_id, name, phone, email, address, notes, created_at
- `reminders` — id, user_id, title, date, time, repeat, notes, completed, created_at
- `diary_entries` — id, user_id, date, mood, energy, sleep, anxiety, stress, motivation, tags[], notes, created_at, updated_at. UNIQUE(user_id, date)

## Mapeo BD → app (snake_case → camelCase)
- `due_date` → `dueDate`
- `due_time` → `dueTime`
- `start_time` → `startTime`
- `end_time` → `endTime`
- `created_at` → `createdAt` (convertido a timestamp ms)
- `updated_at` → `updatedAt`

## Cómo funciona el flujo de datos
1. Usuario entra → `auth.js` detecta sesión → llama `window.loadData(userId)`
2. `window.loadData` (en `app.js`) hace 6 queries a Supabase en paralelo → llena `state`
3. Cada CRUD llama directamente a `_sb.from('tabla').insert/update/delete` → actualiza `state` → re-renderiza
4. Tema y color de acento siguen en localStorage (preferencias de UI, no datos)

## Plan gratuito vs Pro
- **Gratis:** App completa (tareas, notas, calendario, contactos, recordatorios, diario)
- **Pro (pago mensual):** Funciones de IA con Claude:
  - Comandos de voz ("Agenda, añade tarea...")
  - Asistente de productividad (organiza y prioriza tareas)
  - Análisis del diario de bienestar
  - Resumen semanal en PDF

## Fases completadas
- ✅ Fase 1: Sistema de login/registro con Supabase Auth
- ✅ Fase 2: Datos en la nube (Supabase PostgreSQL, sustituye localStorage)
- ✅ Fase 5: Desplegada en Vercel

## Fases pendientes — SEGUIR POR AQUÍ

### Fase 3: Stripe — Subscripción Pro
1. Ana crea cuenta en stripe.com
2. Crear producto "Mi Agenda Pro" con precio mensual
3. Crear carpeta `api/` con funciones serverless de Vercel:
   - `api/create-checkout.js` — genera sesión de pago Stripe
   - `api/stripe-webhook.js` — cuando pago OK → marca usuario como Pro en Supabase
4. Añadir tabla `profiles` en Supabase: `id (= auth.users.id), is_pro boolean, stripe_customer_id`
5. En la app: badge "Pro" y bloquear funciones IA si no es Pro
6. Añadir `vercel.json` para configurar variables de entorno

### Fase 4: IA con Claude (solo Pro)
Requiere cuenta en console.anthropic.com y API key.

**A. Comandos de voz**
- Botón micrófono flotante en la app
- Web Speech API captura voz → envía texto a `/api/claude`
- Claude devuelve JSON `{action, title, date, time, section}` → app crea el elemento
- Ejemplo: "añade tarea llamar al médico el jueves a las 10"

**B. Asistente de productividad**
- Botón "Organizar mi día" en sección Tareas
- Envía tareas pendientes a Claude → devuelve orden priorizado + sugerencia horario

**C. Análisis del diario**
- Botón "Analizar mi semana" en sección Diario
- Envía últimas 7 entradas → Claude devuelve patrones y recomendaciones

**D. Resumen semanal PDF**
- Botón "Generar informe"
- Claude genera texto → jsPDF lo convierte a PDF descargable

**Proxy Claude (necesario para no exponer API key):**
- `api/claude.js` — recibe petición del frontend, añade API key (variable de entorno Vercel), llama a api.anthropic.com

## Variables de entorno necesarias en Vercel
Añadir en Vercel dashboard → Settings → Environment Variables:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY`
(SUPABASE_URL y SUPABASE_ANON_KEY están hardcodeadas en supabase-client.js — moverlas a env vars es opcional)

## Notas técnicas importantes
- La app es un IIFE en vanilla JS — no hay módulos ni bundler
- `_sb` es el cliente Supabase global (definido en supabase-client.js)
- `window.loadData(userId)` es el punto de entrada de datos (llamado por auth.js)
- `currentUserId` se guarda en el IIFE de app.js
- Para las funciones serverless de Vercel usar Node.js (archivo en `/api/*.js`)
- Las funciones serverless reciben `req, res` estilo Express
