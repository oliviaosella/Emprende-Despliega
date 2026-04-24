# LOGIN & AUTENTICACIÓN: Guía Completa con Supabase

## 🔐 La pregunta: "¿Cómo administro el login?"

Respuesta corta: **Supabase lo hace automáticamente. Tú solo mostrar un form.**

---

## 📌 CONCEPTO CLAVE: JWT (JSON Web Token)

### Sin Supabase (lo que pasaría):
```
1. Usuario entra email/contraseña
2. TÚ validas contra BD
3. TÚ creas un token (difícil de hacer bien)
4. TÚ lo guardas en sesión/localStorage
5. TÚ lo validas en cada request
6. Seguridad: ¿encripción? ¿expiración? ¿refresh?
   → 100 cosas que pueden salir mal
```

### Con Supabase (lo real):
```
1. Usuario entra email/contraseña
2. SUPABASE valida contra su BD
3. SUPABASE crea JWT token
4. SUPABASE lo devuelve
5. TÚ lo guardas (automático)
6. SUPABASE lo valida automáticamente en requests
7. Seguridad: ✅ Ya resuelto (encripción, refresh, expiración)
```

---

## 🔄 FLUJO COMPLETO DE LOGIN (paso a paso)

### Escena: Usuario abre Mi Negocio por primera vez

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO ENTRA                         │
└──────────────┬──────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────┐
│  App.tsx → useEffect → supabase.auth.getSession()       │
│  ¿Hay token guardado?                                    │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
      NO             SÍ
        │             │
        ↓             ↓
    ┌────────┐   ┌──────────┐
    │ LOGIN  │   │ DASHBOARD│
    │ SCREEN │   │ (Apps)   │
    └────┬───┘   └──────────┘
         │
         ↓ (Usuario escribe email/pass)
    ┌──────────────────────┐
    │ supabase.auth        │
    │ .signInWithPassword( │
    │   email, password    │
    │ )                    │
    └──────┬───────────────┘
           │
           ↓
    ┌────────────────────┐
    │ ¿Credenciales OK?  │
    └──────┬────────────┬─┘
           │            │
          SÍ           NO
           │            │
           ↓            ↓
    ┌────────────┐  ┌──────────┐
    │JWT Token   │  │Error msg │
    │Refresh T.  │  │Intenta   │
    │User info   │  │de nuevo  │
    └──────┬─────┘  └──────────┘
           │
           ↓
    ┌──────────────────────┐
    │Guarda en localStorage│
    │(Supabase lo hace)    │
    └──────┬───────────────┘
           │
           ↓
    ┌──────────────────────┐
    │DASHBOARD visible     │
    │User id en AppContext │
    │Filtra datos por user │
    └──────────────────────┘
```

---

## 💾 DÓNDE VIVE EL TOKEN (y por qué)

### localStorage (Supabase usa por defecto)
```javascript
// Automático al hacer signIn:
localStorage.setItem('supabase.auth.token', 'eyJhbGc...')
localStorage.setItem('supabase.auth.refresh', 'eyJhbGc...')

// El app lo lee automáticamente:
const { data: { session } } = await supabase.auth.getSession()
// session.access_token = 'eyJhbGc...'
// session.user = { id: 'uuid-123', email: '...' }
```

### ¿Es seguro guardar en localStorage?
**Respuesta matizada:**
- ✅ Token se envía automáticamente en cada request (header Authorization)
- ✅ No accesible desde JavaScript externo (si HTTPS)
- ⚠️ Vulnerable a XSS si tu app tiene bug de seguridad
- ✅ Para MVP está bien. Producción: sessionStorage + CSRF tokens

**Para ti ahora:** Usa lo que Supabase propone (localStorage). Suficiente para MVP.

---

## 🔑 CÓDIGO: Manejar autenticación en App.tsx

```typescript
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Login } from './pages/Login'
import { AppContent } from './App'

export function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Al montar el componente, verificar si hay sesión
  useEffect(() => {
    // 1. Buscar token guardado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Escuchar cambios de autenticación
    // (login, logout, refresh token expirado, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setLoading(false)
        
        // Eventos posibles:
        // - SIGNED_IN: Usuario hizo login
        // - SIGNED_OUT: Usuario hizo logout
        // - TOKEN_REFRESHED: Token expiró y se renovó
        // - USER_UPDATED: Cambió email/contraseña
      }
    )

    // 3. Cleanup: detener de escuchar
    return () => subscription?.unsubscribe()
  }, [])

  // Mientras carga, mostrar spinner
  if (loading) {
    return <div>Cargando...</div>
  }

  // Si no hay sesión, mostrar login
  if (!session) {
    return <Login />
  }

  // Si hay sesión, mostrar app
  return <AppContent session={session} />
}
```

---

## 🎨 CÓDIGO: Página de Login con Supabase UI

```typescript
// src/pages/Login.tsx
import { useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'

export const Login = () => {
  // Esta es la forma más simple: Supabase proporciona componente UI lista
  // No escribes HTML ni JS, solo montas el componente
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Mi Negocio</h1>
        <p className="text-center text-gray-600 mb-8">Gestión de papelería y arte</p>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={[]} // Sin OAuth (GitHub, Google, etc.)
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  )
}
```

**¿Qué hace el componente `<Auth>`?**
- Muestra form: email + password
- Botón "Sign Up" y "Sign In"
- "Forgot password?"
- Validación cliente (email válido, pass >6 caracteres)
- Cuando envía → llama a supabase.auth.signInWithPassword()
- Si OK → guarda token → dispara onAuthStateChange()

---

## 🚪 LOGOUT

```typescript
const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) console.error('Error al logout:', error)
  // Si OK, onAuthStateChange() se dispara con session=null
  // App.tsx ve null → muestra Login nuevamente
}

// En cualquier componente:
<button onClick={handleLogout}>Logout</button>
```

---

## 🔄 CICLO DE VIDA DE UN TOKEN

### JWT tiene 3 partes: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiaWF0IjoxNjE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 └─────────── header ──────────────┘└─────────── payload ──────────────┘└──── signature ────┘
 
 Payload contiene:
 {
   sub: "user-id-uuid",
   iat: 1616239022,      // issued at
   exp: 1616239322,      // expira en 5 minutos
   email: "user@example.com"
 }
```

### Timeline:
```
T=0min    → Usuario hace login
          → Supabase devuelve token con exp=T+5min
          → Token guardado en localStorage

T=4min    → Usuario usa app normalmente
          → Token sigue válido

T=5min    → Token EXPIRADO
          → Siguiente request falla
          → Supabase automáticamente:
            1. Intenta refresh (usa refresh token)
            2. Obtiene nuevo token
            3. Guarda nuevo token
            4. Retry el request

T=90min   → Refresh token expirado
          → Usuario debe login de nuevo
          → onAuthStateChange() dispara SIGNED_OUT
          → App muestra Login screen
```

**Para ti:** Supabase maneja esto automáticamente. No haces nada.

---

## 🛡️ ROW LEVEL SECURITY (RLS): El "otro lado" de login

Login + RLS = Seguridad completa

### ¿Qué es?
Reglas en la BD que dicen: "Este usuario SOLO puede ver/modificar sus datos"

### Ejemplo SIN RLS (inseguro):
```sql
-- Mi app hace:
SELECT * FROM products WHERE user_id = 'user-123'

-- Pero un hacker podría hacer:
SELECT * FROM products WHERE user_id = 'user-456'  -- ¡VE LOS DATOS DE OTRO!
```

### Ejemplo CON RLS (seguro):
```sql
-- Supabase verifica ANTES de ejecutar:
CREATE POLICY "users_select_own" ON products
  FOR SELECT USING (auth.uid() = user_id);

-- Cuando usuario-456 intenta:
SELECT * FROM products WHERE user_id = 'user-123'

-- Supabase lo bloquea:
ERROR: new row violates row-level security policy
```

### Cómo activarlo (en Supabase Console):
```sql
-- 1. Habilitar RLS en tabla
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Crear política SELECT
CREATE POLICY "users_select_own" ON products
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Crear política INSERT
CREATE POLICY "users_insert_own" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Crear política UPDATE
CREATE POLICY "users_update_own" ON products
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Crear política DELETE
CREATE POLICY "users_delete_own" ON products
  FOR DELETE USING (auth.uid() = user_id);
```

**Resultado:** Usuario 123 ve SOLO sus productos, incluso si intenta hacer SQL manual.

---

## ❌ ERRORES COMUNES Y CÓMO EVITARLOS

### Error 1: "Error: JWT malformed"
**Causa:** Token expiró y refresh_token también
**Solución:** Usuario hace logout y login nuevamente

### Error 2: "Error: permission denied" (RLS)
**Causa:** Olvidaste hacer INSERT con `user_id = auth.uid()`
**Solución:**
```typescript
// ❌ MALO:
await supabase.from('products').insert({ name: 'Cuaderno' })

// ✅ BUENO:
const { data: { session } } = await supabase.auth.getSession()
await supabase.from('products').insert({
  name: 'Cuaderno',
  user_id: session.user.id  // ← Supabase lo valida vs RLS
})
```

### Error 3: "undefined is not a function" (session nula)
**Causa:** Usas `session.user.id` antes que cargue
**Solución:**
```typescript
// ❌ MALO:
const userId = session.user.id  // ← session podría ser null

// ✅ BUENO:
const userId = session?.user?.id
// O mejor:
if (!session) return <Login />
const userId = session.user.id  // ← seguro que existe
```

---

## 📊 TABLA: Auth vs Sin Auth

| Aspecto | Sin Supabase | Con Supabase |
|---------|---|---|
| Crear token | Tú (difícil, inseguro) | Supabase (✅) |
| Guardar token | Tú (localStorage?) | Supabase (automático) |
| Validar token | Tú en cada request | Supabase (automático) |
| Refresh expirado | Tú (complicado) | Supabase (automático) |
| Aislar datos | Tú en cada query | RLS en BD (✅) |
| Seguridad | ⚠️ Riesgos | ✅ Enterprise-grade |
| Tiempo implementar | ~20 horas | ~2 horas |

---

## 🎯 PARA TI: Checklist Login

- [ ] Crear proyecto en Supabase
- [ ] Copiar SUPABASE_URL y SUPABASE_ANON_KEY
- [ ] Crear `src/lib/supabase.ts` con createClient()
- [ ] Crear `src/pages/Login.tsx` con Auth UI
- [ ] Modificar `src/App.tsx` para mostrar Login o Dashboard
- [ ] Crear tabla `users` (con user_id foreign key a auth.users)
- [ ] Habilitar RLS en todas las tablas
- [ ] Crear políticas RLS para cada tabla
- [ ] Probar: login → ver datos propios → logout → login otro usuario
- [ ] Verificar: usuario A NO ve datos de usuario B

---

## 💡 LA CLAVE PARA ENTENDER LOGIN + SUPABASE

**Mentalidad:**
- Sin Supabase: "Yo soy quien valida, guarda, renueva tokens"
- Con Supabase: "Supabase valida, guarda, renueva. Yo solo muestro UI y confío en RLS"

**Resultado:**
- Código más simple (~50% menos líneas)
- Más seguro (no puedes cometer errores de auth)
- Mantenible (cambios en Supabase, no en tu código)

---

## 📚 RECURSOS

- Docs Supabase Auth: https://supabase.com/docs/guides/auth
- JWT explicado: https://jwt.io/
- RLS en Supabase: https://supabase.com/docs/guides/auth/row-level-security

---

**Siguiente:** Lee el ROADMAP_SUPABASE.md y comienza DÍA 1.

¿Preguntas sobre login o JWT?
