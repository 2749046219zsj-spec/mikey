import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useAuth } from '../../contexts/AuthContext';

type AuthView = 'login' | 'register' | 'forgot-password';

export default function AuthPage() {
  const [view, setView] = useState<AuthView>('login');
  const { login, register } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center p-6">
      {view === 'login' && (
        <LoginForm
          onLogin={login}
          onSwitchToRegister={() => setView('register')}
          onForgotPassword={() => setView('forgot-password')}
        />
      )}
      {view === 'register' && (
        <RegisterForm onRegister={register} onSwitchToLogin={() => setView('login')} />
      )}
      {view === 'forgot-password' && (
        <ForgotPasswordForm onBack={() => setView('login')} />
      )}
    </div>
  );
}
