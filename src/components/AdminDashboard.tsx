import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, Settings, LogOut, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
  approval_status: string;
  created_at: string;
  total_credits: number;
  total_usage: number;
}

export const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('admin_user_stats').select('*');

      if (activeTab === 'pending') {
        query = query.eq('approval_status', 'pending');
      } else if (activeTab === 'approved') {
        query = query.eq('approval_status', 'approved');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: true,
          approval_status: 'approved'
        })
        .eq('id', userId);

      if (error) throw error;
      alert('用户已批准');
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('批准失败');
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: false,
          approval_status: 'rejected'
        })
        .eq('id', userId);

      if (error) throw error;
      alert('用户已拒绝');
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('拒绝失败');
    }
  };

  const updateUserCredits = async (userId: string) => {
    const credits = prompt('请输入要设置的额度数量：');
    if (!credits || isNaN(Number(credits))) return;

    try {
      const { data: latestSub } = await supabase
        .from('user_subscriptions')
        .select('id, image_credits_purchased')
        .eq('user_id', userId)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSub) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            image_credits_remaining: Number(credits)
          })
          .eq('id', latestSub.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert([{
            user_id: userId,
            plan_id: (await supabase.from('pricing_plans').select('id').limit(1).single()).data?.id,
            payment_status: 'completed',
            payment_amount: 0,
            image_credits_purchased: Number(credits),
            image_credits_remaining: Number(credits),
            transaction_id: `ADMIN_GRANT_${Date.now()}`,
            purchased_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      alert('额度更新成功');
      fetchUsers();
    } catch (error) {
      console.error('Error updating credits:', error);
      alert('更新失败');
    }
  };

  const deactivateUser = async (userId: string) => {
    if (!confirm('确定要注销此用户吗？此操作将清空用户所有额度。')) return;

    try {
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .update({ image_credits_remaining: 0 })
        .eq('user_id', userId);

      if (subError) throw subError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_approved: false,
          approval_status: 'rejected'
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      alert('用户已注销');
      fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('注销失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={32} />
            <div>
              <h1 className="text-2xl font-bold">管理员控制台</h1>
              <p className="text-red-100 text-sm">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>退出登录</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === 'pending'
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                待审批用户
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === 'approved'
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                已批准用户
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === 'all'
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                所有用户
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">暂无用户</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.full_name || '未设置姓名'}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.approval_status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : user.approval_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {user.approval_status === 'approved'
                              ? '已批准'
                              : user.approval_status === 'rejected'
                              ? '已拒绝'
                              : '待审批'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">{user.email}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span>剩余额度: {user.total_credits} 次</span>
                          <span>已使用: {user.total_usage} 次</span>
                          <span>
                            注册时间: {new Date(user.created_at).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveUser(user.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                              title="批准用户"
                            >
                              <CheckCircle size={16} />
                              <span>批准</span>
                            </button>
                            <button
                              onClick={() => rejectUser(user.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                              title="拒绝用户"
                            >
                              <XCircle size={16} />
                              <span>拒绝</span>
                            </button>
                          </>
                        )}
                        {user.approval_status === 'approved' && (
                          <>
                            <button
                              onClick={() => updateUserCredits(user.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                              title="设置额度"
                            >
                              <Settings size={16} />
                              <span>设置额度</span>
                            </button>
                            <button
                              onClick={() => deactivateUser(user.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                              title="注销用户"
                            >
                              <XCircle size={16} />
                              <span>注销</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
