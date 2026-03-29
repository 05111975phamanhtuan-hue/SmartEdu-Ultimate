// ============= admin_dashboard_advanced.js =============

// ===== ADVANCED ADMIN STATS =====

// Get detailed revenue breakdown
app.get('/api/admin/revenue/details', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      status: 'success',
      completedAt: {}
    };
    if (startDate) query.completedAt.$gte = new Date(startDate);
    if (endDate) query.completedAt.$lte = new Date(endDate);
    
    const revenueByType = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ]);
    
    const revenueByDay = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const revenueByMonth = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$completedAt" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const topSpenders = await Transaction.aggregate([
      { $match: { type: { $in: ['deposit', 'subscription', 'purchase_diamonds'] }, status: 'success' } },
      { $group: { _id: "$user", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } }
    ]);
    
    res.json({
      byType: revenueByType,
      byDay: revenueByDay,
      byMonth: revenueByMonth,
      topSpenders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user retention stats
app.get('/api/admin/users/retention', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const retention = [];
    
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const newUsers = await User.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      
      const activeUsers = await User.countDocuments({
        lastActive: { $gte: monthStart, $lte: monthEnd }
      });
      
      retention.push({
        month: monthStart.toLocaleString('vi', { month: 'long', year: 'numeric' }),
        newUsers,
        activeUsers,
        retentionRate: newUsers > 0 ? (activeUsers / newUsers) * 100 : 0
      });
    }
    
    res.json(retention);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get content analytics
app.get('/api/admin/content/analytics', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const topLessons = await Lesson.aggregate([
      { $project: { title: 1, totalAttempts: 1, averageScore: 1 } },
      { $sort: { totalAttempts: -1 } },
      { $limit: 10 }
    ]);
    
    const topMaterials = await Material.aggregate([
      { $match: { isPublished: true } },
      { $project: { title: 1, downloads: 1, views: 1, rating: 1 } },
      { $sort: { downloads: -1 } },
      { $limit: 10 }
    ]);
    
    const topExams = await Exam.aggregate([
      { $project: { name: 1, totalAttempts: 1, averageScore: 1 } },
      { $sort: { totalAttempts: -1 } },
      { $limit: 10 }
    ]);
    
    const lessonBySubject = await Lesson.aggregate([
      { $group: { _id: "$subject", count: { $sum: 1 }, avgAttempts: { $avg: "$totalAttempts" } } }
    ]);
    
    res.json({
      topLessons,
      topMaterials,
      topExams,
      lessonBySubject
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export data
app.get('/api/admin/export/:type', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;
    
    let data = [];
    let filename = '';
    
    switch(type) {
      case 'users':
        data = await User.find().select('-password').lean();
        filename = `users_${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'transactions':
        const query = {};
        if (startDate) query.createdAt = { $gte: new Date(startDate) };
        if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
        data = await Transaction.find(query).populate('user', 'name email').lean();
        filename = `transactions_${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'revenue':
        const revenueData = await Transaction.aggregate([
          { $match: { type: { $in: ['deposit', 'subscription', 'purchase_diamonds'] }, status: 'success' } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } }, total: { $sum: "$amount" } } },
          { $sort: { _id: 1 } }
        ]);
        data = revenueData;
        filename = `revenue_${new Date().toISOString().split('T')[0]}.json`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});