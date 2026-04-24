import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'

export function Login() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Mi Negocio</h1>
          <p className="text-slate-500 mt-2">Ingresá a tu cuenta</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#a78bfa',
                  brandAccent: '#7c3aed',
                },
              },
            },
          }}
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Contraseña',
                button_label: 'Ingresar',
                link_text: '¿Ya tenés cuenta? Ingresá',
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Contraseña',
                button_label: 'Crear cuenta',
                link_text: '¿No tenés cuenta? Registrate',
              },
            },
          }}
        />
      </div>
    </div>
  )
}
