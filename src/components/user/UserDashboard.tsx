import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Image, MessageCircle, LogOut, User, Shield, ArrowLeft, Edit, Check, X, Database, Package, CreditCard, FileText } from 'lucide-react';
import { userService } from '../../services/userService';
import PublicReferenceManagement from '../admin/PublicReferenceManagement';
import { ProductCatalogManager } from '../catalog/ProductCatalogManager';
import { RechargePage } from '../payment/RechargePage';
import { OrderManagement } from '../payment/OrderManagement';

interface UserDashboardProps {
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  onBack?: () => void;
}

export default function UserDashboard({ onLogout, onNavigateToAdmin, onBack }: UserDashboardProps) {
  const { user, refreshUserData } = useAuth();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [showPublicReferenceManagement, setShowPublicReferenceManagement] = useState(false);
  const [showProductCatalog, setShowProductCatalog] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  if (!user) return null;

  const { permissions } = user;
  const drawsPercentage = (permissions.remaining_draws / permissions.draw_limit) * 100;

  if (showPublicReferenceManagement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPublicReferenceManagement(false)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="返回用户中心"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">公共参考图管理</h2>
                  <p className="text-gray-600 text-sm">管理和编辑公共参考图库</p>
                </div>
              </div>
            </div>
          </div>
          <PublicReferenceManagement />
        </div>
      </div>
    );
  }

  if (showProductCatalog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowProductCatalog(false)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="返回用户中心"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">产品目录</h2>
                  <p className="text-gray-600 text-sm">浏览和管理产品目录</p>
                </div>
              </div>
            </div>
          </div>
          <ProductCatalogManager />
        </div>
      </div>
    );
  }

  if (showRecharge) {
    return <RechargePage />;
  }

  if (showOrders) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowOrders(false)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="返回用户中心"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">订单记录</h2>
                  <p className="text-gray-600 text-sm">查看我的充值订单</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <OrderManagement />
          </div>
        </div>
      </div>
    );
  }

  const handleStartEdit = () => {
    setNewUsername(user.username);
    setIsEditingUsername(true);
    setError('');
  };

  const handleCancelEdit = () => {
    setIsEditingUsername(false);
    setNewUsername('');
    setError('');
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim() || newUsername === user.username) {
      handleCancelEdit();
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      await userService.updateUsername(user.id, newUsername);
      await refreshUserData();
      setIsEditingUsername(false);
      setNewUsername('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setIsUpdating(false);
    }
  };

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
              <div className="flex-1">
                {isEditingUsername ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveUsername();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入新用户名"
                        maxLength={20}
                        autoFocus
                        disabled={isUpdating}
                      />
                      <button
                        onClick={handleSaveUsername}
                        disabled={isUpdating || !newUsername.trim()}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="保存"
                      >
                        {isUpdating ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="取消"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}
                    <p className="text-xs text-gray-500">2-20个字符，按Enter保存，Esc取消</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                      <button
                        onClick={handleStartEdit}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
                        title="编辑用户名"
                      >
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </button>
                    </div>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {permissions.can_manage_catalog && (
                <button
                  onClick={() => setShowProductCatalog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-colors shadow-md"
                >
                  <Package className="w-5 h-5" />
                  产品目录
                </button>
              )}
              <button
                onClick={() => setShowRecharge(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors shadow-md"
              >
                <CreditCard className="w-5 h-5" />
                充值
              </button>
              <button
                onClick={() => setShowOrders(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-colors shadow-md"
              >
                <FileText className="w-5 h-5" />
                订单
              </button>
              {permissions.can_edit_public_database && (
                <button
                  onClick={() => setShowPublicReferenceManagement(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-colors shadow-md"
                >
                  <Database className="w-5 h-5" />
                  公共图库管理
                </button>
              )}
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">公共数据库编辑</span>
              <span
                className={`px-4 py-2 rounded-lg font-medium ${
                  permissions.can_edit_public_database
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {permissions.can_edit_public_database ? '允许' : '禁止'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">产品目录管理</span>
              <span
                className={`px-4 py-2 rounded-lg font-medium ${
                  permissions.can_manage_catalog
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {permissions.can_manage_catalog ? '允许' : '禁止'}
              </span>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                {permissions.app_access_level === 'full'
                  ? '您可以访问所有应用功能和模块'
                  : '您当前只能访问"图1部分应用"，升级权限以获取更多功能'}
              </p>
              {permissions.can_edit_public_database && (
                <p className="text-sm text-gray-700 mt-2">
                  您拥有公共图库编辑权限，可以上传和管理公共参考图片
                </p>
              )}
              {permissions.can_manage_catalog && (
                <p className="text-sm text-gray-700 mt-2">
                  您拥有产品目录管理权限，可以浏览和管理产品目录
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
