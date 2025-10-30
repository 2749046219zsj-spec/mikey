import { useState, useEffect } from 'react';
import { UserProfile, UserPermissions } from '../../types/user';
import { adminService } from '../../services/userService';
import { Edit, CheckCircle, XCircle, Save, X, Key } from 'lucide-react';

interface UserManagementPanelProps {
  users: UserProfile[];
  onUsersChange: () => void;
}

export default function UserManagementPanel({ users, onUsersChange }: UserManagementPanelProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, UserPermissions>>({});
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UserPermissions>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    users.forEach((user) => {
      loadUserPermissions(user.id);
    });
  }, [users]);

  const loadUserPermissions = async (userId: string) => {
    try {
      const permissions = await adminService.getUserPermissions(userId);
      if (permissions) {
        setUserPermissions((prev) => ({ ...prev, [userId]: permissions }));
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(userId);
    try {
      await adminService.toggleUserStatus(userId, !currentStatus);
      onUsersChange();
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleEditPermissions = (userId: string) => {
    setEditingUser(userId);
    setEditData(userPermissions[userId] || {});
  };

  const handleSavePermissions = async (userId: string) => {
    setLoading(userId);
    try {
      await adminService.updateUserPermissions(userId, editData);
      await loadUserPermissions(userId);
      setEditingUser(null);
      setEditData({});
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditData({});
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('密码至少需要 6 个字符');
      return;
    }

    setLoading(userId);
    try {
      await adminService.resetUserPassword(userId, newPassword);
      alert('密码重置成功');
      setShowPasswordModal(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('密码重置失败，请重试');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">用户列表</h2>
          <p className="text-gray-600 mt-1">共 {users.length} 个用户</p>
        </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">用户名</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">邮箱</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">状态</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">角色</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">绘图次数</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">客服助手</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">访问级别</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">公共库编辑</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">产品目录</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => {
              const permissions = userPermissions[user.id];
              const isEditing = editingUser === user.id;

              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        启用
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        停用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.is_admin
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.is_admin ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {permissions && (
                      <div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              value={editData.draw_limit ?? permissions.draw_limit}
                              onChange={(e) =>
                                setEditData({ ...editData, draw_limit: parseInt(e.target.value) })
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="总数"
                            />
                            <input
                              type="number"
                              value={editData.remaining_draws ?? permissions.remaining_draws}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  remaining_draws: parseInt(e.target.value),
                                })
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="剩余"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-900">
                            {permissions.remaining_draws} / {permissions.draw_limit}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {permissions && (
                      <div>
                        {isEditing ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                editData.chat_assistant_enabled ??
                                permissions.chat_assistant_enabled
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  chat_assistant_enabled: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm">开启</span>
                          </label>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              permissions.chat_assistant_enabled
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {permissions.chat_assistant_enabled ? '已开启' : '未开启'}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {permissions && (
                      <div>
                        {isEditing ? (
                          <select
                            value={editData.app_access_level ?? permissions.app_access_level}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                app_access_level: e.target.value as 'basic' | 'full',
                              })
                            }
                            className="px-3 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="basic">基础</option>
                            <option value="full">完整</option>
                          </select>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              permissions.app_access_level === 'full'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {permissions.app_access_level === 'full' ? '完整' : '基础'}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {permissions && (
                      <div>
                        {isEditing ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                editData.can_edit_public_database ??
                                permissions.can_edit_public_database
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  can_edit_public_database: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm">允许</span>
                          </label>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              permissions.can_edit_public_database
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {permissions.can_edit_public_database ? '允许' : '禁止'}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {permissions && (
                      <div>
                        {isEditing ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                editData.can_manage_catalog ??
                                permissions.can_manage_catalog
                              }
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  can_manage_catalog: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm">允许</span>
                          </label>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              permissions.can_manage_catalog
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {permissions.can_manage_catalog ? '允许' : '禁止'}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSavePermissions(user.id)}
                            disabled={loading === user.id}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            title="保存"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            title="取消"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditPermissions(user.id)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            title="编辑权限"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowPasswordModal(user.id)}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                            title="重置密码"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            disabled={loading === user.id || user.is_admin}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                              user.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={user.is_active ? '停用账户' : '启用账户'}
                          >
                            {user.is_active ? '停用' : '启用'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Key className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">重置用户密码</h3>
                <p className="text-sm text-gray-600">
                  {users.find(u => u.id === showPasswordModal)?.email}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新密码
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 个字符"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                autoFocus
              />
              <p className="mt-2 text-sm text-gray-500">
                设置新密码后，用户可以使用新密码登录
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleResetPassword(showPasswordModal)}
                disabled={loading === showPasswordModal || !newPassword || newPassword.length < 6}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === showPasswordModal ? '重置中...' : '确认重置'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(null);
                  setNewPassword('');
                }}
                disabled={loading === showPasswordModal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
