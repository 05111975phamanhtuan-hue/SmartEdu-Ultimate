// src/pages/UserDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const UserDashboard = () => {
  const { user, api } = useAuth();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [activity, setActivity] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, achievementsRes, activityRes, pathRes] = await Promise.all([
        api.get('/user/stats'),
        api.get('/user/achievements'),
        api.get('/user/activity'),
        api.post('/user/learning-path', { studyHoursPerWeek: 10, targetScore: 8 })
      ]);
      
      setStats(statsRes.data);
      setAchievements(achievementsRes.data);
      setActivity(activityRes.data);
      setLearningPath(pathRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">🚀 Đang tải...</div>
      </div>
    );
  }

  const xpProgress = (stats.xp % 1000) / 10;
  const levelProgress = stats.xp % 1000;

  // Activity chart data
  const activityChartData = {
    labels: activity?.activity.map(a => a.date.substring(0, 10)) || [],
    datasets: [
      {
        label: 'Bài học hoàn thành',
        data: activity?.activity.map(a => a.lessons) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Bài kiểm tra',
        data: activity?.activity.map(a => a.quizzes) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Heatmap data for activity calendar
  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-green-200';
    if (count === 2) return 'bg-green-300';
    if (count === 3) return 'bg-green-400';
    return 'bg-green-500';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Chào mừng trở lại, {user?.name}!</h1>
            <p className="opacity-90 mt-1">Tiếp tục hành trình chinh phục tri thức</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats?.streak} 🔥</div>
            <div className="text-sm opacity-90">Ngày liên tiếp</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="text-gray-500 text-sm">Tổng XP</div>
          <div className="text-2xl font-bold text-green-600">{stats?.totalXP}</div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${xpProgress}%` }}></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">Cấp {stats?.level} • {levelProgress}/1000 XP</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="text-gray-500 text-sm">Kim cương</div>
          <div className="text-2xl font-bold text-purple-600">{stats?.diamonds} 💎</div>
          <div className="text-xs text-gray-500 mt-1">100💎 = 50,000 VNĐ</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="text-gray-500 text-sm">Năng lượng</div>
          <div className="text-2xl font-bold text-orange-600">{stats?.energy}/25 ⚡</div>
          <div className="text-xs text-gray-500 mt-1">Hồi 3/5h hoặc xem QC</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="text-gray-500 text-sm">Xếp hạng</div>
          <div className="text-2xl font-bold text-blue-600">#{stats?.rank}</div>
          <div className="text-xs text-gray-500 mt-1">Trong số {stats?.totalUsers || 1000}+ học sinh</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'achievements', 'activity', 'learning-path'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' && 'Tổng quan'}
              {tab === 'achievements' && 'Thành tựu'}
              {tab === 'activity' && 'Hoạt động'}
              {tab === 'learning-path' && 'Lộ trình học'}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Weekly Progress */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">📊 Tiến độ tuần này</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats?.weeklyProgress || 0}</div>
                <div className="text-sm text-gray-600">Bài học</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats?.monthlyProgress || 0}</div>
                <div className="text-sm text-gray-600">Bài học/tháng</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats?.averageScore}%</div>
                <div className="text-sm text-gray-600">Điểm TB</div>
              </div>
            </div>
            <Line data={activityChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>

          {/* Next Milestone */}
          {learningPath?.nextMilestone && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200">
              <h3 className="font-bold text-lg mb-2">🎯 Mục tiêu tiếp theo</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p>Cần {learningPath.nextMilestone.xpToNextLevel} XP để lên cấp tiếp theo</p>
                  <p>Cần {learningPath.nextMilestone.lessonsToNextBadge} bài học để nhận huy hiệu mới</p>
                </div>
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  Học ngay
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">🏆 Thành tựu đạt được</h2>
            <div className="text-sm text-gray-500">
              {achievements?.summary.achieved}/{achievements?.summary.total} đã đạt
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all" 
              style={{ width: `${achievements?.summary.percentage}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements?.achievements.map(ach => (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border-2 transition ${
                  ach.achieved ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="text-3xl mb-2">{ach.icon}</div>
                <div className="font-semibold">{ach.name}</div>
                <div className="text-xs text-gray-500 mt-1">{ach.description}</div>
                {!ach.achieved && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-green-500 h-1 rounded-full" style={{ width: `${ach.progress}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{Math.round(ach.progress)}%</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">📅 Lịch hoạt động</h2>
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">Hoạt động 365 ngày qua</div>
            <div className="grid grid-cols-53 gap-1 overflow-x-auto">
              {activity?.heatmapData?.slice(0, 365).map((day, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.count)}`}
                  title={`${day.date}: ${day.count} bài học`}
                ></div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gray-100"></div> <span>0</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-200"></div> <span>1-2</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-300"></div> <span>3-4</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-400"></div> <span>5-6</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-500"></div> <span>7+</span></div>
          </div>
        </div>
      )}

      {/* Learning Path Tab */}
      {activeTab === 'learning-path' && (
        <div className="space-y-6">
          {/* Recommended Subjects */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">📚 Môn học cần cải thiện</h2>
            <div className="space-y-3">
              {learningPath?.recommendedSubjects?.map(subj => (
                <div key={subj} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {subj === 'toan' && '📘'}
                      {subj === 'van' && '📖'}
                      {subj === 'anh' && '🇬🇧'}
                      {subj === 'ly' && '⚛️'}
                      {subj === 'hoa' && '🧪'}
                      {subj === 'sinh' && '🧬'}
                      {subj === 'su' && '🏛️'}
                      {subj === 'dia' && '🌍'}
                    </span>
                    <span className="font-medium">
                      {subj === 'toan' && 'Toán'}
                      {subj === 'van' && 'Văn'}
                      {subj === 'anh' && 'Anh'}
                      {subj === 'ly' && 'Lý'}
                      {subj === 'hoa' && 'Hóa'}
                      {subj === 'sinh' && 'Sinh'}
                      {subj === 'su' && 'Sử'}
                      {subj === 'dia' && 'Địa'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-orange-500">Điểm TB: {Math.round(learningPath.subjectPerformance[subj])}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Plan */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">📅 Kế hoạch học tập tuần này</h2>
            <div className="space-y-3">
              {learningPath?.dailyPlan?.map(day => (
                <div key={day.day} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="font-medium">Ngày {day.day}</div>
                  <div className="text-sm text-gray-600">
                    {day.subjects.map(s => 
                      `${s.subject === 'toan' ? 'Toán' : s.subject === 'van' ? 'Văn' : s.subject === 'anh' ? 'Anh' : s.subject} (${s.lessons} bài)`
                    ).join(' • ')}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">⏱️ {day.totalHours.toFixed(1)} giờ</div>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Plan */}
          {learningPath?.examPlan && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h2 className="text-lg font-bold mb-3">🎓 {learningPath.examPlan.name}</h2>
              <p className="text-sm text-gray-600 mb-4">Thời gian: {learningPath.examPlan.duration}</p>
              <div className="space-y-3">
                {learningPath.examPlan.phases.map((phase, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{phase.name}</div>
                      <div className="text-xs text-gray-500">{phase.weeks} tuần • Trọng tâm: {phase.focus.map(f => f === 'toan' ? 'Toán' : f === 'van' ? 'Văn' : f === 'anh' ? 'Anh' : f === 'ly' ? 'Lý' : f === 'hoa' ? 'Hóa' : '').join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;