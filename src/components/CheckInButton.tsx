import { useState, useEffect } from 'react';
import { Gift, CheckCircle } from 'lucide-react';
import { creditsService } from '../services/creditsService';
import { useAuthStore } from '../stores/authStore';

export default function CheckInButton() {
  const { user } = useAuthStore();
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCheckinStatus();
    }
  }, [user]);

  const loadCheckinStatus = async () => {
    if (!user) return;
    try {
      const status = await creditsService.getCheckinStatus(user.id);
      setHasCheckedIn(status.hasCheckedInToday);
      setStreakDays(status.streakDays);
    } catch (error) {
      console.error('Error loading checkin status:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!user || hasCheckedIn || loading) return;

    setLoading(true);
    try {
      const result = await creditsService.checkIn(user.id);
      setHasCheckedIn(true);
      setStreakDays(result.streakDays);
      alert(`签到成功！获得 ${result.creditsAwarded} 积分 (连续${result.streakDays}天)`);
    } catch (error: any) {
      alert(error.message || '签到失败');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={handleCheckIn}
      disabled={hasCheckedIn || loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        hasCheckedIn
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
      }`}
    >
      {hasCheckedIn ? (
        <>
          <CheckCircle className="w-5 h-5" />
          <span>已签到</span>
        </>
      ) : (
        <>
          <Gift className="w-5 h-5" />
          <span>{loading ? '签到中...' : '每日签到'}</span>
        </>
      )}
      {streakDays > 0 && (
        <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
          {streakDays}天
        </span>
      )}
    </button>
  );
}
