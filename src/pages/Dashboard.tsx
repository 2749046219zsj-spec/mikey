import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, Crown } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return <Shield className="w-6 h-6 text-red-600" />;
      case 'vip':
        return <Crown className="w-6 h-6 text-yellow-600" />;
      default:
        return <User className="w-6 h-6 text-blue-600" />;
    }
  };

  const getRoleBadge = () => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      vip: 'bg-yellow-100 text-yellow-800',
      user: 'bg-blue-100 text-blue-800',
    };

    return badges[user?.role || 'user'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-slate-100 rounded-xl">
              {getRoleIcon()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome back{user?.full_name ? `, ${user.full_name}` : ''}!
              </h2>
              <p className="text-slate-600 mb-4">{user?.email}</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge()}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition text-left"
            >
              <Shield className="w-8 h-8 text-red-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Admin Panel</h3>
              <p className="text-sm text-slate-600">Manage users and system settings</p>
            </button>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <User className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Profile</h3>
            <p className="text-sm text-slate-600">View and edit your profile information</p>
          </div>

          {(user?.role === 'vip' || user?.role === 'admin') && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <Crown className="w-8 h-8 text-yellow-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">VIP Features</h3>
              <p className="text-sm text-slate-600">Access exclusive VIP content and features</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
