import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Activity, Plus, Minus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile, Transaction } from '../types/user';
import { useAuthStore } from '../stores/authStore';

export default function AdminPanel() {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'stats'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalCreditsIssued: 0,
    activeMembers: 0
  });

  useEffect(() => {
    if (profile?.is_admin) {
      loadData();
    }
  }, [profile, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'transactions') {
        await loadTransactions();
      } else if (activeTab === 'stats') {
        await loadStats();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setUsers(data || []);
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setTransactions(data || []);
  };

  const loadStats = async () => {
    const { data: usersData } = await supabase
      .from('user_profiles')
      .select('*');

    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_status', 'completed');

    const totalUsers = usersData?.length || 0;
    const totalRevenue = transactionsData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
    const totalCreditsIssued = transactionsData?.reduce((sum, tx) => sum + tx.credits_awarded, 0) || 0;
    const activeMembers = usersData?.filter(u => u.membership_tier !== 'free').length || 0;

    setStats({
      totalUsers,
      totalRevenue,
      totalCreditsIssued,
      activeMembers
    });
  };

  const handleAdjustCredits = async (userId: string, amount: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const description = amount > 0 ? '管理员增加积分' : '管理员扣减积分';
    const newBalance = user.credits_balance + amount;

    if (newBalance < 0) {
      alert('调整后积分不能为负数');
      return;
    }

    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ credits_balance: newBalance })
        .eq('id', userId);

      if (profileError) throw profileError;

      const { error: historyError } = await supabase
        .from('credits_history')
        .insert({
          user_id: userId,
          amount,
          type: 'admin_adjust',
          description,
          balance_after: newBalance
        });

      if (historyError) throw historyError;

      alert('积分调整成功');
      loadUsers();
    } catch (error: any) {
      alert('调整失败: ' + error.message);
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">你没有管理员权限</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
          <h1 className="text-3xl font-bold">管理员控制台</h1>
          <p className="text-red-100 mt-1">系统管理与数据分析</p>
        </div>

        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              用户管理
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Activity className="w-5 h-5 inline mr-2" />
              交易记录
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              统计报表
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : (
            <>
              {activeTab === 'users' && (
                <div>
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="搜索用户（邮箱或用户名）"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">用户</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">会员等级</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">积分余额</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">累计消费</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">注册时间</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800">{user.username || '未设置'}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.membership_tier === 'premium' ? 'bg-yellow-100 text-yellow-700' :
                                user.membership_tier === 'advanced' ? 'bg-green-100 text-green-700' :
                                user.membership_tier === 'basic' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {user.membership_tier}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium">{user.credits_balance}</td>
                            <td className="px-4 py-3">¥{user.total_spent.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(user.created_at).toLocaleDateString('zh-CN')}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const amount = prompt('增加积分数量:');
                                    if (amount) handleAdjustCredits(user.id, parseInt(amount));
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="增加积分"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const amount = prompt('扣减积分数量:');
                                    if (amount) handleAdjustCredits(user.id, -parseInt(amount));
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="扣减积分"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">交易号</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">用户ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">金额</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">积分</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">支付方式</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono">{tx.transaction_no || '-'}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">
                            {tx.user_id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 font-medium">¥{tx.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-green-600 font-medium">+{tx.credits_awarded}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              tx.payment_status === 'completed' ? 'bg-green-100 text-green-700' :
                              tx.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              tx.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {tx.payment_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{tx.payment_method}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(tx.created_at).toLocaleString('zh-CN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'stats' && (
                <div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="text-3xl font-bold text-blue-900">{stats.totalUsers}</div>
                      <div className="text-sm text-blue-700 mt-1">总用户数</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="text-3xl font-bold text-green-900">
                        ¥{stats.totalRevenue.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-700 mt-1">总收入</div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 text-yellow-600" />
                      </div>
                      <div className="text-3xl font-bold text-yellow-900">
                        {stats.totalCreditsIssued}
                      </div>
                      <div className="text-sm text-yellow-700 mt-1">已发放积分</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="text-3xl font-bold text-purple-900">{stats.activeMembers}</div>
                      <div className="text-sm text-purple-700 mt-1">付费会员</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">关键指标</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">付费转化率</span>
                        <span className="font-bold text-gray-800">
                          {stats.totalUsers > 0
                            ? ((stats.activeMembers / stats.totalUsers) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">平均客单价</span>
                        <span className="font-bold text-gray-800">
                          ¥{stats.activeMembers > 0
                            ? (stats.totalRevenue / stats.activeMembers).toFixed(2)
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">积分发放率</span>
                        <span className="font-bold text-gray-800">
                          {stats.totalRevenue > 0
                            ? (stats.totalCreditsIssued / stats.totalRevenue).toFixed(1)
                            : 0} 积分/元
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
