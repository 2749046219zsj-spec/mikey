import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import UserDashboard from './components/user/UserDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import AppContent from './AppContent';

type ViewMode = 'app' | 'dashboard' | 'admin';

function App() {
  const { user, loading, logout } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('app');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!user.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">账户已停用</h2>
          <p className="text-gray-600 mb-6">您的账户已被管理员停用，请联系管理员以恢复访问权限。</p>
          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'dashboard') {
    return (
      <UserDashboard
        onLogout={() => {
          logout();
          setViewMode('app');
        }}
        onNavigateToAdmin={user.is_admin ? () => setViewMode('admin') : undefined}
        onBack={() => setViewMode('app')}
      />
    );
  }

  if (viewMode === 'admin' && user.is_admin) {
    return <AdminDashboard onBack={() => setViewMode('dashboard')} />;
  }

  return (
    <div>
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4 bg-white rounded-lg shadow-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">剩余绘图次数:</span>
          <span className="text-lg font-bold text-blue-600">
            {user.permissions.remaining_draws}
          </span>
        </div>
        <button
          onClick={() => setViewMode('dashboard')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          我的账户
        </button>
      </div>
      <AppContent />
    </div>
  );
}

export default App;