import React from 'react';
import { Image as ImageIcon, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UnifiedNavbarProps {
  currentPage?: 'home' | 'prompt-library' | 'generate' | 'batch' | 'comic' | 'video' | 'tax-year' | 'works' | 'about';
  onNavigate?: (page: string) => void;
  onShowAuth?: (mode: 'login' | 'register') => void;
}

export const UnifiedNavbar: React.FC<UnifiedNavbarProps> = ({
  currentPage = 'home',
  onNavigate,
  onShowAuth
}) => {
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'home', label: '首页' },
    { id: 'prompt-library', label: '提示词库' },
    { id: 'generate', label: '生成图片' },
    { id: 'batch', label: '批量生成' },
    { id: 'comic', label: '漫画生成' },
    { id: 'video', label: '视频生成' },
    { id: 'tax-year', label: '税收年报' },
    { id: 'works', label: '我的作品' },
    { id: 'about', label: '关于' }
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate?.(pageId);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo区域 */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <ImageIcon size={18} className="text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              画镜AI
            </span>
          </div>

          {/* 中间导航链接 */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === item.id
                    ? 'text-orange-500 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button className="px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-sm">
                  设立研
                </button>
                <button className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm">
                  设研群
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>剩余 20 次</span>
                </div>
                <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                  <User size={20} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{user.username || user.email}</span>
                  <button
                    onClick={signOut}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="退出登录"
                  >
                    <LogOut size={16} className="text-gray-600" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => onShowAuth?.('login')}
                  className="px-5 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  登录
                </button>
                <button
                  onClick={() => onShowAuth?.('register')}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-sm"
                >
                  注册
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
