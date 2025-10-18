import { useState, useEffect } from 'react';
import { UserProfile, UserPermissions } from '../../types/user';
import { adminService } from '../../services/userService';
import { Edit, CheckCircle, XCircle, Save, X } from 'lucide-react';

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

  return (
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
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSavePermissions(user.id)}
                            disabled={loading === user.id}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditPermissions(user.id)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            disabled={loading === user.id || user.is_admin}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                              user.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
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
  );
}
