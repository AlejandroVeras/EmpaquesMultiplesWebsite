import React from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'

function AuthPage() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <img 
              src="./logo.png" 
              alt="Empaques Múltiples" 
              className="logo"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <h1 className="app-title">Sistema de Registro de Almuerzos</h1>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <div style={{ 
          maxWidth: '400px', 
          margin: '2rem auto',
          padding: '2rem',
          background: 'var(--blanco)',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(17, 104, 53, 0.08)',
          border: '1px solid var(--borde-verde)'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            color: 'var(--verde)', 
            marginBottom: '2rem',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Iniciar Sesión
          </h2>
          
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#116835',
                    brandAccent: '#0c4725',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#f7f7f7',
                    defaultButtonBackgroundHover: '#e0e0e0',
                    inputBackground: 'white',
                    inputBorder: '#cfe6da',
                    inputBorderHover: '#116835',
                    inputBorderFocus: '#116835',
                  },
                  borderWidths: {
                    buttonBorderWidth: '2px',
                    inputBorderWidth: '2px',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    buttonBorderRadius: '8px',
                    inputBorderRadius: '8px',
                  },
                },
              },
              className: {
                anchor: 'text-verde hover:text-verde-oscuro',
                button: 'font-semibold',
                input: 'font-normal',
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Correo electrónico',
                  password_label: 'Contraseña',
                  email_input_placeholder: 'Tu correo electrónico',
                  password_input_placeholder: 'Tu contraseña',
                  button_label: 'Iniciar sesión',
                  loading_button_label: 'Iniciando sesión...',
                  social_provider_text: 'Iniciar sesión con {{provider}}',
                  link_text: '¿Ya tienes una cuenta? Inicia sesión',
                },
                sign_up: {
                  email_label: 'Correo electrónico',
                  password_label: 'Contraseña',
                  email_input_placeholder: 'Tu correo electrónico',
                  password_input_placeholder: 'Tu contraseña',
                  button_label: 'Registrarse',
                  loading_button_label: 'Registrándose...',
                  social_provider_text: 'Registrarse con {{provider}}',
                  link_text: '¿No tienes una cuenta? Regístrate',
                  confirmation_text: 'Revisa tu correo para confirmar tu cuenta',
                },
                magic_link: {
                  email_input_label: 'Correo electrónico',
                  email_input_placeholder: 'Tu correo electrónico',
                  button_label: 'Enviar enlace mágico',
                  loading_button_label: 'Enviando enlace mágico...',
                  link_text: 'Enviar un enlace mágico por correo',
                  confirmation_text: 'Revisa tu correo para el enlace mágico',
                },
                forgotten_password: {
                  email_label: 'Correo electrónico',
                  password_label: 'Contraseña',
                  email_input_placeholder: 'Tu correo electrónico',
                  button_label: 'Enviar instrucciones',
                  loading_button_label: 'Enviando instrucciones...',
                  link_text: '¿Olvidaste tu contraseña?',
                  confirmation_text: 'Revisa tu correo para las instrucciones de restablecimiento',
                },
              },
            }}
            theme="default"
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>
      </main>
    </div>
  )
}

export default AuthPage