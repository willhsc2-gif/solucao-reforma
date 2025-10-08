"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
          Bem-vindo(a) ao Solução Reformas
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Faça login ou crie uma conta para gerenciar seus orçamentos e portfólio.
        </p>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]} // Removendo provedores de terceiros para simplificar
          redirectTo={window.location.origin}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Digite sua senha',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entrar',
              },
              sign_up: {
                email_label: 'Seu e-mail',
                password_label: 'Crie uma senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Crie sua senha',
                button_label: 'Registrar',
                social_provider_text: 'Registrar com {{provider}}',
                link_text: 'Não tem uma conta? Registrar',
              },
              forgotten_password: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'Digite seu e-mail',
                button_label: 'Enviar instruções de redefinição',
                link_text: 'Esqueceu sua senha?',
              },
              magic_link: {
                email_input_placeholder: 'Digite seu e-mail',
                button_label: 'Enviar link mágico',
                link_text: 'Enviar um link mágico',
                email_label: 'Seu e-mail',
              },
              update_password: {
                password_label: 'Nova senha',
                password_input_placeholder: 'Digite sua nova senha',
                button_label: 'Atualizar senha',
              },
            },
          }}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;