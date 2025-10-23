import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useAuth } from '../../contexts/AuthContext';

type AuthView = 'login' | 'register' | 'forgot-password';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBack?: () => void;
}

export default function AuthPage({ initialMode = 'login', onBack }: AuthPageProps) {
  const [view, setView] = useState<AuthView>(initialMode);
  const { login, register } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center p-6 relative">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors shadow-md"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">返回画廊</span>
        </button>
      )}
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
