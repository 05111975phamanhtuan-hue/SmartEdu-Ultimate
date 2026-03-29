// ============= admin_management.js - QUẢN LÝ ADMIN CHUYÊN SÂU =============

// ===== MODEL ADMIN LOG (GHI NHẬN HOẠT ĐỘNG) =====
const AdminLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminName: { type: String },
  adminRole: { type: String, enum: ['super_admin', 'admin'] },
  action: { type: String, required: true },
  target: { type: String }, // user_id, material_id, etc
  targetType: { type: String, enum: ['user', 'material', 'post', 'comment', 'withdrawal', 'admin'] },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const AdminLog = mongoose.model('AdminLog', AdminLogSchema);

// ===== API: GHI LOG HOẠT ĐỘNG ADMIN =====
const logAdminAction = async (req, action, target, targetType, details) => {
  const adminLog = new AdminLog({
    admin: req.userId,
    adminName: req.user.name,
    adminRole: req.user.role,
    action,
    target,
    targetType,
    details,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  await adminLog.save();
};

// ===== API: XEM TẤT CẢ ADMIN (SUPER ADMIN) =====
app.get('/api/super-admin/admins', authenticateJWT, authenticateSuperAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } })
      .select('name email avatar role createdAt lastActive');
    
    // Lấy thống kê hoạt động của từng admin
    const adminStats = await Promise.all(admins.map(async (admin) => {
      const logCount = await AdminLog.countDocuments({ admin: admin._id });
      const lastAction = await AdminLog.findOne({ admin: admin._id }).sort({ timestamp: -1 });
      const withdrawalCount = await Transaction.countDocuments({ 
        user: admin._id, 
        type: 'admin_withdraw',
        status: 'success'
      });
      const totalWithdrawn = await Transaction.aggregate([
        { $match: { user: admin._id, type: 'admin_withdraw', status: 'success' } },
        { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
      ]);
      
      return {
        ...admin.toObject(),
        stats: {
          totalActions: logCount,
          lastAction: lastAction?.timestamp || null,
          lastActionType: lastAction?.action || null,
          withdrawals: withdrawalCount,
          totalWithdrawn: totalWithdrawn[0]?.total || 0
        }
      };
    }));
    
    res.json(adminStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: XÓA ADMIN VĨNH VIỄN (SUPER ADMIN) =====
app.delete('/api/super-admin/admins/:adminId', authenticateJWT, authenticateSuperAdmin, async (req, res) => {
  try {
    const targetAdmin = await User.findById(req.params.adminId);
    if (!targetAdmin) return res.status(404).json({ error: 'Không tìm thấy admin' });
    
    if (targetAdmin.role === 'super_admin') {
      return res.status(403).json({ error: 'Không thể xóa super admin chính' });
    }
    
    // Ghi log trước khi xóa
    await logAdminAction(req, 'DELETE_ADMIN', targetAdmin._id, 'admin', {
      deletedAdminName: targetAdmin.name,
      deletedAdminEmail: targetAdmin.email,
      deletedAdminRole: targetAdmin.role
    });
    
    // Thu hồi quyền admin
    targetAdmin.role = 'user';
    targetAdmin.isActive = false;
    await targetAdmin.save();
    
    // Xóa khỏi AdminHierarchy
    await AdminHierarchy.findOneAndDelete({ user: targetAdmin._id });
    
    res.json({ 
      success: true, 
      message: `Đã thu hồi quyền admin của ${targetAdmin.name}` 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: XEM LỊCH SỬ HOẠT ĐỘNG CỦA ADMIN (SUPER ADMIN) =====
app.get('/api/super-admin/admin-logs', authenticateJWT, authenticateSuperAdmin, async (req, res) => {
  try {
    const { adminId, action, page = 1, limit = 50 } = req.query;
    const query = {};
    if (adminId) query.admin = adminId;
    if (action) query.action = action;
    
    const logs = await AdminLog.find(query)
      .populate('admin', 'name email')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await AdminLog.countDocuments(query);
    
    res.json({
      logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: XEM THỐNG KÊ TÀI CHÍNH CỦA CÁC ADMIN (SUPER ADMIN) =====
app.get('/api/super-admin/admin-finance', authenticateJWT, authenticateSuperAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } })
      .select('name email role');
    
    const financeStats = await Promise.all(admins.map(async (admin) => {
      const withdrawals = await Transaction.aggregate([
        { $match: { user: admin._id, type: 'admin_withdraw', status: 'success' } },
        { $group: { _id: null, total: { $sum: { $abs: "$amount" } }, count: { $sum: 1 } } }
      ]);
      
      const pendingWithdrawals = await WithdrawalApproval.countDocuments({
        status: { $in: ['pending', 'approved_by_admin'] }
      });
      
      const totalRevenueManaged = await Transaction.aggregate([
        { $match: { type: { $in: ['deposit', 'subscription', 'purchase_diamonds'] }, status: 'success' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      
      return {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        },
        finance: {
          totalWithdrawn: withdrawals[0]?.total || 0,
          withdrawalCount: withdrawals[0]?.count || 0,
          pendingWithdrawals: pendingWithdrawals,
          totalRevenueManaged: totalRevenueManaged[0]?.total || 0
        }
      };
    }));
    
    res.json(financeStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: THAY ĐỔI QUYỀN HẠN ADMIN (SUPER ADMIN) =====
app.patch('/api/super-admin/admins/:adminId/permissions', authenticateJWT, authenticateSuperAdmin, async (req, res) => {
  try {
    const { permissions } = req.body;
    const targetAdmin = await User.findById(req.params.adminId);
    
    if (!targetAdmin) return res.status(404).json({ error: 'Không tìm thấy admin' });
    if (targetAdmin.role === 'super_admin') {
      return res.status(403).json({ error: 'Không thể thay đổi quyền của super admin chính' });
    }
    
    const adminHierarchy = await AdminHierarchy.findOne({ user: targetAdmin._id });
    if (adminHierarchy) {
      adminHierarchy.permissions = { ...adminHierarchy.permissions, ...permissions };
      await adminHierarchy.save();
    }
    
    await logAdminAction(req, 'UPDATE_ADMIN_PERMISSIONS', targetAdmin._id, 'admin', { permissions });
    
    res.json({ success: true, message: 'Đã cập nhật quyền hạn' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});