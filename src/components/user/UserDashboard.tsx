import { useAuth } from '../../contexts/AuthContext';
import { Image, MessageCircle, LogOut, User, Shield, ArrowLeft } from 'lucide-react';

interface UserDashboardProps {
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  onBack?: () => void;
}

export default function UserDashboard({ onLogout, onNavigateToAdmin, onBack }: UserDashboardProps) {
  const { user } = useAuth();

  if (!user) return null;

  const { permissions } = user;
  const drawsPercentage = (permissions.remaining_draws / permissions.draw_limit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="返回主界面"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user.is_admin && onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  管理后台
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                退出登录
              </button>
            </div>
          </div>

          {!user.is_active && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">您的账户已被停用，请联系管理员</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">绘图次数</h3>
                <p className="text-sm text-gray-600">剩余 / 总计</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-blue-600">
                  {permissions.remaining_draws}
                </span>
                <span className="text-xl text-gray-400">/ {permissions.draw_limit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${drawsPercentage}%` }}
                />
              </div>
              {permissions.remaining_draws === 0 && (
                <p className="text-sm text-red-600 font-medium">
                  绘图次数已用完，请联系管理员增加配额
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">客服助手</h3>
                <p className="text-sm text-gray-600">功能状态</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`px-4 py-2 rounded-lg font-medium ${
                  permissions.chat_assistant_enabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {permissions.chat_assistant_enabled ? '已开启' : '未开启'}
              </span>
            </div>
            {!permissions.chat_assistant_enabled && (
              <p className="text-sm text-gray-600 mt-3">
                联系管理员以开启客服助手功能
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">应用访问权限</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">访问级别</span>
              <span
                className={`px-4 py-2 rounded-lg font-medium ${
                  permissions.app_access_level === 'full'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {permissions.app_access_level === 'full' ? '完整访问' : '基础访问'}
              </span>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                {permissions.app_access_level === 'full'
                  ? '您可以访问所有应用功能和模块'
                  : '您当前只能访问"图1部分应用"，升级权限以获取更多功能'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
