// ============= admin_dashboard.js - BACKEND =============

// Admin stats
app.get('/api/admin/stats', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - 7));
    const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));
    
    // User stats
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfDay } });
    const newUsersWeek = await User.countDocuments({ createdAt: { $gte: startOfWeek } });
    const activeUsers = await User.countDocuments({ lastActive: { $gte: startOfWeek } });
    const vipUsers = await User.countDocuments({ subscription: { $ne: 'free' } });
    
    // Revenue stats
    const revenue = await Transaction.aggregate([
      { $match: { type: { $in: ['deposit', 'subscription', 'purchase_diamonds'] }, status: 'success' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const revenueToday = await Transaction.aggregate([
      { $match: { type: { $in: ['deposit', 'subscription', 'purchase_diamonds'] }, status: 'success', completedAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    // Material stats
    const totalMaterials = await Material.countDocuments();
    const pendingMaterials = await Material.countDocuments({ isApproved: false });
    
    // Order stats
    const totalOrders = await Order.countDocuments({ status: 'completed' });
    const totalSales = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    
    // Platform fee
    const platformFees = await Transaction.aggregate([
      { $match: { type: 'platform_fee' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    res.json({
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newWeek: newUsersWeek,
        active: activeUsers,
        vip: vipUsers
      },
      revenue: {
        total: revenue[0]?.total || 0,
        today: revenueToday[0]?.total || 0
      },
      marketplace: {
        totalMaterials,
        pendingMaterials,
        totalOrders,
        totalSales: totalSales[0]?.total || 0,
        platformFees: platformFees[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (admin)
app.get('/api/admin/users', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role (admin)
app.patch('/api/admin/users/:userId/role', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    
    user.role = role;
    await user.save();
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ban/unban user
app.patch('/api/admin/users/:userId/ban', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    
    user.isBanned = isBanned;
    await user.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all transactions (admin)
app.get('/api/admin/transactions', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    
    const transactions = await Transaction.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard chart data
app.get('/api/admin/charts', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    
    const revenueData = [];
    const userData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const dayRevenue = await Transaction.aggregate([
        { $match: { type: { $in: ['deposit', 'subscription', 'purchase_diamonds'] }, status: 'success', completedAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      
      const dayUsers = await User.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } });
      
      revenueData.push({
        date: startOfDay.toISOString().split('T')[0],
        revenue: dayRevenue[0]?.total || 0
      });
      
      userData.push({
        date: startOfDay.toISOString().split('T')[0],
        users: dayUsers
      });
    }
    
    res.json({ revenueData, userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});