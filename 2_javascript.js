// server.js - Add to existing file (Module 2: User System)

// ============= USER STATS & GAMIFICATION =============

// Update user stats after lesson completion
app.post('/api/user/update-stats', authenticateJWT, async (req, res) => {
  try {
    const { xpGained, lessonId, score } = req.body;
    const user = await User.findById(req.userId);
    
    // Update XP and level
    user.xp += xpGained;
    const newLevel = Math.floor(user.xp / 1000) + 1;
    
    // Check for level up
    let levelUpBadge = null;
    if (newLevel > user.level) {
      user.level = newLevel;
      levelUpBadge = `level_${newLevel}`;
      user.badges.push(levelUpBadge);
      
      // Reward diamonds for level up
      const levelUpReward = newLevel * 10;
      user.diamonds += levelUpReward;
    }
    
    // Update streak
    const today = new Date().toDateString();
    const lastActive = new Date(user.lastActive).toDateString();
    
    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastActive === yesterday) {
        user.streak += 1;
        
        // Streak badges
        if (user.streak === 7) {
          user.badges.push('streak_7');
        } else if (user.streak === 30) {
          user.badges.push('streak_30');
        } else if (user.streak === 100) {
          user.badges.push('streak_100');
        } else if (user.streak === 365) {
          user.badges.push('streak_365');
        }
      } else {
        user.streak = 1;
      }
      user.lastActive = new Date();
    }
    
    // Record quiz score
    if (lessonId && score !== undefined) {
      user.quizScores.push({ lessonId, score, completedAt: new Date() });
    }
    
    await user.save();
    
    res.json({
      success: true,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      diamonds: user.diamonds,
      levelUpBadge,
      newBadges: user.badges.slice(-3)
    });
  } catch (err) {
    console.error('Update stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user badges
app.get('/api/user/badges', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('badges');
    
    const badgeDefinitions = {
      level_1: { name: 'Người mới bắt đầu', icon: '🌱', description: 'Đạt cấp độ 1' },
      level_5: { name: 'Học viên chăm chỉ', icon: '📚', description: 'Đạt cấp độ 5' },
      level_10: { name: 'Người học xuất sắc', icon: '⭐', description: 'Đạt cấp độ 10' },
      level_20: { name: 'Bậc thầy', icon: '🏆', description: 'Đạt cấp độ 20' },
      level_50: { name: 'Huyền thoại', icon: '👑', description: 'Đạt cấp độ 50' },
      streak_7: { name: 'Tuần học tập', icon: '🔥', description: 'Duy trì streak 7 ngày' },
      streak_30: { name: 'Tháng học tập', icon: '💪', description: 'Duy trì streak 30 ngày' },
      streak_100: { name: 'Kiên trì', icon: '🏅', description: 'Duy trì streak 100 ngày' },
      streak_365: { name: 'Một năm học tập', icon: '🎉', description: 'Duy trì streak 365 ngày' },
      perfect_score: { name: 'Hoàn hảo', icon: '💯', description: 'Đạt điểm tuyệt đối' },
      top_10: { name: 'Top 10', icon: '🏆', description: 'Lọt top 10 bảng xếp hạng' },
      vip_member: { name: 'Thành viên VIP', icon: '💎', description: 'Đăng ký gói VIP' },
      first_lesson: { name: 'Bước đầu tiên', icon: '🎯', description: 'Hoàn thành bài học đầu tiên' },
      master_of_all: { name: 'Bách khoa', icon: '🎓', description: 'Hoàn thành tất cả môn học' }
    };
    
    const badges = user.badges.map(badgeId => ({
      id: badgeId,
      ...badgeDefinitions[badgeId],
      earnedAt: new Date()
    }));
    
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user statistics
app.get('/api/user/stats', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Calculate total lessons completed
    const totalLessons = user.completedLessons.length;
    
    // Calculate average quiz score
    const avgScore = user.quizScores.length > 0 
      ? user.quizScores.reduce((sum, q) => sum + q.score, 0) / user.quizScores.length 
      : 0;
    
    // Calculate weekly progress
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyScores = user.quizScores.filter(q => q.completedAt > oneWeekAgo);
    const weeklyProgress = weeklyScores.length;
    
    // Calculate monthly progress
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyScores = user.quizScores.filter(q => q.completedAt > oneMonthAgo);
    const monthlyProgress = monthlyScores.length;
    
    // Calculate rank
    const rank = await User.countDocuments({ xp: { $gt: user.xp } }) + 1;
    
    res.json({
      totalXP: user.xp,
      level: user.level,
      streak: user.streak,
      totalLessonsCompleted: totalLessons,
      averageScore: avgScore.toFixed(2),
      weeklyProgress,
      monthlyProgress,
      rank,
      diamonds: user.diamonds,
      energy: user.energy,
      subscription: user.subscription,
      subscriptionExpires: user.subscriptionExpires,
      badgesCount: user.badges.length,
      joinDate: user.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get learning path (AI generated)
app.post('/api/user/learning-path', authenticateJWT, async (req, res) => {
  try {
    const { weakSubjects, targetScore, studyHoursPerWeek, examTarget } = req.body;
    const user = await User.findById(req.userId);
    
    // Analyze user performance
    const subjectPerformance = {};
    for (const subj of ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia']) {
      const subjectScores = user.quizScores.filter(q => q.lessonId.startsWith(subj));
      if (subjectScores.length > 0) {
        subjectPerformance[subj] = subjectScores.reduce((sum, q) => sum + q.score, 0) / subjectScores.length;
      } else {
        subjectPerformance[subj] = 50;
      }
    }
    
    // Identify weakest subjects
    const sortedSubjects = Object.entries(subjectPerformance)
      .sort((a, b) => a[1] - b[1])
      .map(([subj]) => subj);
    
    const recommendedSubjects = weakSubjects || sortedSubjects.slice(0, 3);
    
    // Generate daily study plan
    const dailyPlan = [];
    const subjectsPerDay = Math.min(3, recommendedSubjects.length);
    
    for (let i = 0; i < 7; i++) {
      dailyPlan.push({
        day: i + 1,
        subjects: recommendedSubjects.slice(0, subjectsPerDay).map(subj => ({
          subject: subj,
          lessons: Math.ceil(studyHoursPerWeek / 7 / subjectsPerDay),
          focus: subjectPerformance[subj] < 60 ? 'Củng cố kiến thức' : 'Nâng cao'
        })),
        totalHours: studyHoursPerWeek / 7
      });
    }
    
    // Generate weekly goals
    const weeklyGoals = {
      xpTarget: 500 * (targetScore / 10),
      lessonsTarget: 20,
      quizTarget: 15,
      streakTarget: user.streak + 7
    };
    
    // Exam preparation plan
    let examPlan = null;
    if (examTarget === 'grade10') {
      examPlan = {
        name: 'Ôn thi vào lớp 10',
        duration: '6 tháng',
        phases: [
          { phase: 1, name: 'Củng cố kiến thức cơ bản', weeks: 8, focus: ['toan', 'van', 'anh'] },
          { phase: 2, name: 'Luyện đề cơ bản', weeks: 6, focus: ['toan', 'van', 'anh'] },
          { phase: 3, name: 'Nâng cao và tổng hợp', weeks: 6, focus: ['toan', 'van', 'anh'] },
          { phase: 4, name: 'Luyện đề cấp tốc', weeks: 4, focus: ['toan', 'van', 'anh'] }
        ]
      };
    } else if (examTarget === 'university') {
      examPlan = {
        name: 'Ôn thi THPT Quốc gia',
        duration: '12 tháng',
        phases: [
          { phase: 1, name: 'Ôn tập kiến thức lớp 10-11', weeks: 16, focus: ['toan', 'ly', 'hoa'] },
          { phase: 2, name: 'Học kiến thức lớp 12', weeks: 16, focus: ['toan', 'ly', 'hoa'] },
          { phase: 3, name: 'Luyện đề chuyên sâu', weeks: 12, focus: ['toan', 'ly', 'hoa'] },
          { phase: 4, name: 'Nước rút', weeks: 8, focus: ['toan', 'ly', 'hoa'] }
        ]
      };
    }
    
    res.json({
      recommendedSubjects,
      subjectPerformance,
      dailyPlan,
      weeklyGoals,
      examPlan,
      estimatedTimeToTarget: `${Math.ceil((targetScore - subjectPerformance[recommendedSubjects[0]]) / 5)} tháng`,
      nextMilestone: {
        xpToNextLevel: 1000 - (user.xp % 1000),
        lessonsToNextBadge: Math.max(0, 50 - user.completedLessons.length)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user achievements
app.get('/api/user/achievements', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const achievements = [
      {
        id: 'first_lesson',
        name: 'Bước đầu tiên',
        description: 'Hoàn thành bài học đầu tiên',
        icon: '🎯',
        achieved: user.completedLessons.length >= 1,
        progress: user.completedLessons.length >= 1 ? 100 : 0,
        target: 1
      },
      {
        id: 'ten_lessons',
        name: 'Học viên chăm chỉ',
        description: 'Hoàn thành 10 bài học',
        icon: '📚',
        achieved: user.completedLessons.length >= 10,
        progress: Math.min(100, (user.completedLessons.length / 10) * 100),
        target: 10
      },
      {
        id: 'fifty_lessons',
        name: 'Người học xuất sắc',
        description: 'Hoàn thành 50 bài học',
        icon: '⭐',
        achieved: user.completedLessons.length >= 50,
        progress: Math.min(100, (user.completedLessons.length / 50) * 100),
        target: 50
      },
      {
        id: 'hundred_lessons',
        name: 'Bậc thầy',
        description: 'Hoàn thành 100 bài học',
        icon: '🏆',
        achieved: user.completedLessons.length >= 100,
        progress: Math.min(100, (user.completedLessons.length / 100) * 100),
        target: 100
      },
      {
        id: 'perfect_score',
        name: 'Hoàn hảo',
        description: 'Đạt điểm tuyệt đối trong 5 bài kiểm tra',
        icon: '💯',
        achieved: user.quizScores.filter(q => q.score === 100).length >= 5,
        progress: Math.min(100, (user.quizScores.filter(q => q.score === 100).length / 5) * 100),
        target: 5
      },
      {
        id: 'seven_day_streak',
        name: 'Tuần học tập',
        description: 'Duy trì streak 7 ngày',
        icon: '🔥',
        achieved: user.streak >= 7,
        progress: Math.min(100, (user.streak / 7) * 100),
        target: 7
      },
      {
        id: 'thirty_day_streak',
        name: 'Tháng học tập',
        description: 'Duy trì streak 30 ngày',
        icon: '💪',
        achieved: user.streak >= 30,
        progress: Math.min(100, (user.streak / 30) * 100),
        target: 30
      },
      {
        id: 'diamond_collector',
        name: 'Nhà sưu tầm',
        description: 'Sở hữu 1000 kim cương',
        icon: '💎',
        achieved: user.diamonds >= 1000,
        progress: Math.min(100, (user.diamonds / 1000) * 100),
        target: 1000
      },
      {
        id: 'all_subjects',
        name: 'Bách khoa',
        description: 'Hoàn thành bài học ở cả 8 môn',
        icon: '🎓',
        achieved: (() => {
          const subjects = ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia'];
          return subjects.every(subj => user.completedLessons.some(l => l.startsWith(subj)));
        })(),
        progress: (() => {
          const subjects = ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia'];
          const completed = subjects.filter(subj => user.completedLessons.some(l => l.startsWith(subj))).length;
          return (completed / 8) * 100;
        })(),
        target: 8
      }
    ];
    
    const totalAchievements = achievements.length;
    const achievedCount = achievements.filter(a => a.achieved).length;
    
    res.json({
      achievements,
      summary: {
        total: totalAchievements,
        achieved: achievedCount,
        percentage: (achievedCount / totalAchievements) * 100,
        nextAchievement: achievements.find(a => !a.achieved)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { type = 'xp', province, limit = 100, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (province) filter.province = province;
    
    const sortField = type === 'xp' ? 'xp' : type === 'streak' ? 'streak' : 'level';
    const sortOrder = -1;
    
    const leaders = await User.find(filter)
      .select('name avatar xp level streak diamonds province subscription')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    // Get current user rank
    const currentUser = await User.findById(req.userId);
    const userRank = await User.countDocuments({ 
      ...filter, 
      [sortField]: { $gt: currentUser[sortField] } 
    }) + 1;
    
    res.json({
      leaders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      userRank
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get regional leaderboard
app.get('/api/leaderboard/regional', async (req, res) => {
  try {
    const regions = {
      north: ['Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Hưng Yên', 'Hải Dương', 'Thái Bình', 'Nam Định', 'Ninh Bình'],
      central: ['Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi'],
      south: ['TP Hồ Chí Minh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Long An', 'Tiền Giang', 'Bến Tre', 'Cần Thơ']
    };
    
    const regionalStats = {};
    
    for (const [region, provinces] of Object.entries(regions)) {
      const users = await User.find({ province: { $in: provinces } })
        .select('xp level streak')
        .sort({ xp: -1 })
        .limit(10);
      
      const topUser = users[0] || null;
      const avgXP = users.reduce((sum, u) => sum + u.xp, 0) / (users.length || 1);
      
      regionalStats[region] = {
        name: region === 'north' ? 'Miền Bắc' : region === 'central' ? 'Miền Trung' : 'Miền Nam',
        topUser,
        avgXP,
        totalUsers: users.length
      };
    }
    
    res.json(regionalStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= USER SETTINGS =============

// Update user settings
app.patch('/api/user/settings', authenticateJWT, async (req, res) => {
  try {
    const { notifications, theme, language, emailNotifications, studyReminders } = req.body;
    const user = await User.findById(req.userId);
    
    if (notifications !== undefined) user.notifications = notifications;
    if (theme !== undefined) user.theme = theme;
    if (language !== undefined) user.language = language;
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
    if (studyReminders !== undefined) user.studyReminders = studyReminders;
    
    await user.save();
    
    res.json({
      success: true,
      settings: {
        notifications: user.notifications,
        theme: user.theme,
        language: user.language,
        emailNotifications: user.emailNotifications,
        studyReminders: user.studyReminders
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user activity
app.get('/api/user/activity', authenticateJWT, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const user = await User.findById(req.userId);
    
    // Group quiz scores by date
    const dailyActivity = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString();
      dailyActivity[date] = { lessons: 0, quizzes: 0, xp: 0 };
    }
    
    user.quizScores.forEach(quiz => {
      if (quiz.completedAt > startDate) {
        const date = quiz.completedAt.toDateString();
        if (dailyActivity[date]) {
          dailyActivity[date].quizzes += 1;
          dailyActivity[date].xp += 50;
        }
      }
    });
    
    // Find completed lessons by date
    const lessonCompletionDates = user.completedLessons.map(lessonId => ({
      date: new Date().toDateString(),
      lessonId
    }));
    
    lessonCompletionDates.forEach(completion => {
      const date = completion.date;
      if (dailyActivity[date]) {
        dailyActivity[date].lessons += 1;
      }
    });
    
    const activity = Object.entries(dailyActivity)
      .map(([date, stats]) => ({ date, ...stats }))
      .reverse();
    
    // Calculate heatmap data (last 52 weeks)
    const heatmapData = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const activityCount = user.quizScores.filter(q => 
        q.completedAt.toISOString().split('T')[0] === dateStr
      ).length;
      heatmapData.unshift({ date: dateStr, count: activityCount });
    }
    
    res.json({
      activity,
      heatmapData,
      totalActiveDays: Object.values(dailyActivity).filter(d => d.lessons > 0 || d.quizzes > 0).length,
      currentStreak: user.streak,
      longestStreak: Math.max(user.streak, 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user friends
app.get('/api/user/friends', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'name avatar xp level streak');
    res.json(user.friends || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add friend
app.post('/api/user/friends/:friendId', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friend = await User.findById(req.params.friendId);
    
    if (!friend) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ error: 'Đã là bạn bè' });
    }
    
    user.friends.push(friend._id);
    await user.save();
    
    res.json({ success: true, friend });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove friend
app.delete('/api/user/friends/:friendId', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.friends = user.friends.filter(f => f.toString() !== req.params.friendId);
    await user.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});