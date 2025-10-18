import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Shield, Crown, User, AlertCircle, CheckCircle } from 'lucide-react';
import { UserRole } from '../types/auth';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setError('');
      setSuccess('');

      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateProfileError) throw updateProfileError;

      const { error: updateRoleError } = await supabase
        .from('user_roles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateRoleError) throw updateRoleError;

      setSuccess('User role updated successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'vip':
        return <Crown className="w-5 h-5 text-yellow-600" />;
      default:
        return <User className="w-5 h-5 text-blue-600" />;
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      vip: 'bg-yellow-100 text-yellow-800',
      user: 'bg-blue-100 text-blue-800',
    };
    return badges[role];
  };

  if (user?.role !== 'admin') {
    navigate('/unauthorized');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-red-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
              <p className="text-slate-600">Manage user roles and permissions</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-900">User</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-900">Email</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-900">Current Role</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userProfile) => (
                    <tr key={userProfile.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            {getRoleIcon(userProfile.role)}
                          </div>
                          <span className="font-medium text-slate-900">
                            {userProfile.full_name || 'Unknown User'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{userProfile.email}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(userProfile.role)}`}>
                          {userProfile.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={userProfile.role}
                          onChange={(e) => updateUserRole(userProfile.id, e.target.value as UserRole)}
                          disabled={userProfile.id === user?.id}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="user">User</option>
                          <option value="vip">VIP</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
