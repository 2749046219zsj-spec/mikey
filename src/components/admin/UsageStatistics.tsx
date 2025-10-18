import { useState, useEffect } from 'react';
import { UserProfile, UsageLog } from '../../types/user';
import { adminService } from '../../services/userService';
import { TrendingUp, Users, Image, MessageCircle } from 'lucide-react';

interface UsageStatisticsProps {
  users: UserProfile[];
}

interface UserStats {
  userId: string;
  username: string;
  stats: {
    totalActions: number;
    drawCount: number;
    chatCount: number;
    loginCount: number;
    lastActivity: string | null;
  };
}

export default function UsageStatistics({ users }: UsageStatisticsProps) {
  const [allLogs, setAllLogs] = useState<UsageLog[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [users]);

  const loadStatistics = async () => {
    try {
      const logs = await adminService.getAllUsageLogs(1000);
      setAllLogs(logs);

      const stats = await Promise.all(
        users.map(async (user) => ({
          userId: user.id,
          username: user.username,
          stats: await adminService.getUserStats(user.id),
        }))
      );
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDraws = allLogs.filter((log) => log.action_type === 'draw').length;
  const totalChats = allLogs.filter((log) => log.action_type === 'chat').length;
  const totalLogins = allLogs.filter((log) => log.action_type === 'login').length;
  const activeUsers = new Set(allLogs.map((log) => log.user_id)).size;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600">加载统计数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-gray-600">活跃用户</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{activeUsers}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm text-gray-600">总绘图次数</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalDraws}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm text-gray-600">对话次数</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalChats}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-sm text-gray-600">登录次数</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalLogins}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">用户活动统计</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">用户名</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">总活动</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">绘图</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">对话</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">登录</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  最后活动
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {userStats.map((item) => (
                <tr key={item.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{item.stats.totalActions}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-green-600" />
                      <span className="text-gray-900">{item.stats.drawCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-900">{item.stats.chatCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-900">{item.stats.loginCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600 text-sm">
                      {item.stats.lastActivity
                        ? new Date(item.stats.lastActivity).toLocaleString('zh-CN')
                        : '无活动'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
