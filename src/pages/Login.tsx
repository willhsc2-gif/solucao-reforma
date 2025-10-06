"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-black dark:text-white">Solução Reformas</h1>
        <p className="text-center text-gray-600 dark:text-gray-300">Faça login para continuar</p>
        <Auth
          supabaseClient={supabase}
          providers={[]} // No third-party providers unless specified
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(25 95% 53%)', // Orange-500
                  brandAccent: 'hsl(25 95% 43%)', // Darker orange for hover
                },
              },
            },
          }}
          theme="light" // Use light theme by default
          redirectTo={window.location.origin + '/'}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;