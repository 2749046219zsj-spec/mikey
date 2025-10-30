import { useState, useEffect } from 'react';
import { Shield, Users, Activity, ArrowLeft, Package, FileText, Database, ShoppingBag } from 'lucide-react';
import { adminService } from '../../services/userService';
import { UserProfile } from '../../types/user';
import UserManagementPanel from './UserManagementPanel';
import UsageStatistics from './UsageStatistics';
import { ProductManagement } from './ProductManagement';
import { PromptTemplateManagement } from './PromptTemplateManagement';
import PublicReferenceManagement from './PublicReferenceManagement';
import { ProductCatalogManagement } from './ProductCatalogManagement';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'stats' | 'products' | 'prompts' | 'references' | 'catalog'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">管理员控制台</h1>
                <p className="text-gray-600">用户管理与权限配置</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回用户端
            </button>
          </div>

          <div className="flex gap-4 mt-6 flex-wrap">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-5 h-5" />
              用户管理
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-5 h-5" />
              使用统计
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package className="w-5 h-5" />
              产品管理
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'prompts'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-5 h-5" />
              提示词管理
            </button>
            <button
              onClick={() => setActiveTab('references')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'references'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Database className="w-5 h-5" />
              公共参考图
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              产品目录
            </button>
          </div>
        </div>

        {loading && (activeTab === 'users' || activeTab === 'stats') ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <UserManagementPanel users={users} onUsersChange={loadUsers} />
            )}
            {activeTab === 'stats' && <UsageStatistics users={users} />}
            {activeTab === 'products' && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <ProductManagement />
              </div>
            )}
            {activeTab === 'prompts' && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <PromptTemplateManagement />
              </div>
            )}
            {activeTab === 'references' && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <PublicReferenceManagement />
              </div>
            )}
            {activeTab === 'catalog' && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <ProductCatalogManagement />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
