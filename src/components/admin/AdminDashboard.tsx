import { useState, useEffect } from 'react';
import { Users, Settings, Image, LogOut, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface UserData {
  id: string;
  email: string;
  username: string | null;
  membership_tier: string;
  credits_balance: number;
  total_spent: number;
  is_admin: boolean;
  created_at: string;
}

interface Package {
  id: string;
  name: string;
  price: number;
  credits: number;
  tier: string;
}

export function AdminDashboard({ onNavigateToApp }: { onNavigateToApp: () => void }) {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'packages'>('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingCredits, setEditingCredits] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } else {
        const { data, error } = await supabase
          .from('packages')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setPackages(data || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ credits_balance: editingCredits })
        .eq('id', userId);

      if (error) throw error;

      await supabase.from('credits_history').insert({
        user_id: userId,
        amount: editingCredits,
        type: 'admin_adjust',
        description: '管理员调整额度',
        balance_after: editingCredits,
      });

      setEditingUserId(null);
      loadData();
    } catch (error) {
      console.error('更新积分失败:', error);
      alert('更新积分失败');
    }
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !currentIsAdmin })
        .eq('id', userId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('更新管理员状态失败:', error);
      alert('更新失败');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？此操作不可恢复。')) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('删除用户失败:', error);
      alert('删除用户失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">管理后台</h1>
              <nav className="flex gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'users'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  用户管理
                </button>
                <button
                  onClick={() => setActiveTab('packages')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'packages'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  套餐管理
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {profile?.email} {profile?.is_admin && '(管理员)'}
              </span>
              <button
                onClick={onNavigateToApp}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                绘图界面
              </button>
              <button
                onClick={signOut}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'users' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      会员等级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      剩余次数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      总消费
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{user.username || '未设置'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.membership_tier === 'premium'
                            ? 'bg-purple-100 text-purple-800'
                            : user.membership_tier === 'advanced'
                            ? 'bg-blue-100 text-blue-800'
                            : user.membership_tier === 'basic'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.membership_tier === 'premium' ? '尊享' :
                           user.membership_tier === 'advanced' ? '进阶' :
                           user.membership_tier === 'basic' ? '基础' : '免费'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editingCredits}
                              onChange={(e) => setEditingCredits(parseInt(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded"
                              min="0"
                            />
                            <button
                              onClick={() => handleUpdateCredits(user.id)}
                              className="p-1 text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1 text-gray-600 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{user.credits_balance}</span>
                            <button
                              onClick={() => {
                                setEditingUserId(user.id);
                                setEditingCredits(user.credits_balance);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        ¥{user.total_spent}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                            user.is_admin
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {user.is_admin ? '管理员' : '普通用户'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold text-blue-600 mb-4">
                  ¥{pkg.price}
                </div>
                <div className="text-gray-600 mb-4">
                  {pkg.credits} 张图片
                </div>
                <div className="text-sm text-gray-500">
                  每张 ¥{(pkg.price / pkg.credits).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
