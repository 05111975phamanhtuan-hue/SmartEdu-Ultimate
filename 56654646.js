// ============= moderation_system.js - KIỂM DUYỆT NỘI DUNG =============

// ===== MODELS =====
const ReportedContentSchema = new mongoose.Schema({
  type: { type: String, enum: ['post', 'comment', 'material'], required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  details: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  moderatorNote: { type: String },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const ContentFlagSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['post', 'comment', 'material'], required: true },
  flags: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }],
  flagCount: { type: Number, default: 0 }
});

const ReportedContent = mongoose.model('ReportedContent', ReportedContentSchema);
const ContentFlag = mongoose.model('ContentFlag', ContentFlagSchema);

// ===== API: BÁO CÁO NỘI DUNG =====
app.post('/api/report', authenticateJWT, async (req, res) => {
  try {
    const { type, contentId, reason, details } = req.body;
    
    const existingReport = await ReportedContent.findOne({
      type,
      contentId,
      reporter: req.userId,
      status: 'pending'
    });
    
    if (existingReport) {
      return res.status(400).json({ error: 'Bạn đã báo cáo nội dung này rồi' });
    }
    
    const report = new ReportedContent({
      type,
      contentId,
      reporter: req.userId,
      reason,
      details,
      status: 'pending'
    });
    await report.save();
    
    // Tăng flag count
    let flag = await ContentFlag.findOne({ type, contentId });
    if (!flag) {
      flag = new ContentFlag({ type, contentId, flags: [], flagCount: 0 });
    }
    flag.flags.push({ user: req.userId, reason });
    flag.flagCount += 1;
    await flag.save();
    
    // Thông báo admin nếu flag count > 5
    if (flag.flagCount >= 5) {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          type: 'content_flag',
          title: 'Nội dung cần kiểm duyệt',
          content: `Nội dung đã bị báo cáo ${flag.flagCount} lần`,
          data: { type, contentId, flagCount: flag.flagCount }
        });
      }
    }
    
    res.json({ success: true, message: 'Đã gửi báo cáo. Admin sẽ xem xét.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN XEM NỘI DUNG CẦN DUYỆT =====
app.get('/api/admin/pending-content', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    // Posts pending approval
    const pendingPosts = await Post.find({ isApproved: false, isHidden: false })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Materials pending approval
    const pendingMaterials = await Material.find({ isApproved: false, isPublished: true })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Reported content
    const reported = await ReportedContent.find({ status: 'pending' })
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      pendingPosts,
      pendingMaterials,
      reported,
      summary: {
        posts: pendingPosts.length,
        materials: pendingMaterials.length,
        reports: reported.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN DUYỆT BÀI VIẾT =====
app.patch('/api/admin/approve-post/:postId', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { status, reason } = req.body; // status: 'approved', 'rejected'
    const post = await Post.findById(req.params.postId);
    
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    
    if (status === 'approved') {
      post.isApproved = true;
      post.isHidden = false;
      
      // Thông báo cho người đăng
      await createNotification({
        userId: post.user,
        type: 'content_approved',
        title: 'Bài viết của bạn đã được duyệt',
        content: `Bài viết "${post.content.substring(0, 50)}..." đã được duyệt và hiển thị công khai.`,
        data: { postId: post._id }
      });
    } else if (status === 'rejected') {
      post.isHidden = true;
      post.rejectionReason = reason;
      
      // Thông báo cho người đăng
      await createNotification({
        userId: post.user,
        type: 'content_rejected',
        title: 'Bài viết của bạn bị từ chối',
        content: `Bài viết của bạn bị từ chối. Lý do: ${reason}`,
        data: { postId: post._id }
      });
    }
    
    post.moderatedBy = req.userId;
    post.moderatedAt = new Date();
    await post.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN DUYỆT TÀI LIỆU =====
app.patch('/api/admin/approve-material/:materialId', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const material = await Material.findById(req.params.materialId);
    
    if (!material) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    
    if (status === 'approved') {
      material.isApproved = true;
      material.isPublished = true;
      
      await createNotification({
        userId: material.author,
        type: 'content_approved',
        title: 'Tài liệu của bạn đã được duyệt',
        content: `Tài liệu "${material.title}" đã được duyệt và đăng bán thành công!`,
        data: { materialId: material._id }
      });
    } else if (status === 'rejected') {
      material.isPublished = false;
      material.rejectionReason = reason;
      
      await createNotification({
        userId: material.author,
        type: 'content_rejected',
        title: 'Tài liệu của bạn bị từ chối',
        content: `Tài liệu "${material.title}" bị từ chối. Lý do: ${reason}`,
        data: { materialId: material._id }
      });
    }
    
    material.moderatedBy = req.userId;
    material.moderatedAt = new Date();
    await material.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN XỬ LÝ BÁO CÁO =====
app.patch('/api/admin/handle-report/:reportId', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { action, moderatorNote } = req.body; // action: 'delete_content', 'ignore', 'warn_user', 'ban_user'
    const report = await ReportedContent.findById(req.params.reportId);
    
    if (!report) return res.status(404).json({ error: 'Không tìm thấy báo cáo' });
    
    report.status = 'approved';
    report.moderatorNote = moderatorNote;
    report.moderatedBy = req.userId;
    report.moderatedAt = new Date();
    await report.save();
    
    if (action === 'delete_content') {
      // Xóa nội dung vi phạm
      if (report.type === 'post') {
        await Post.findByIdAndDelete(report.contentId);
      } else if (report.type === 'comment') {
        await Comment.findByIdAndDelete(report.contentId);
      } else if (report.type === 'material') {
        await Material.findByIdAndUpdate(report.contentId, { isPublished: false, isApproved: false });
      }
      
      await createNotification({
        userId: report.reporter,
        type: 'report_resolved',
        title: 'Báo cáo của bạn đã được xử lý',
        content: `Nội dung bạn báo cáo đã bị xóa vì vi phạm quy định.`,
        data: { reportId: report._id }
      });
    } else if (action === 'warn_user') {
      // Cảnh báo người dùng
      const content = await getContentById(report.type, report.contentId);
      if (content) {
        await createNotification({
          userId: content.user,
          type: 'warning',
          title: 'Cảnh báo vi phạm',
          content: `Nội dung của bạn đã bị báo cáo và nhận cảnh báo. Vui lòng tuân thủ quy định cộng đồng.`,
          data: { contentId: report.contentId }
        });
      }
    } else if (action === 'ban_user') {
      // Khóa tài khoản người dùng
      const content = await getContentById(report.type, report.contentId);
      if (content) {
        await User.findByIdAndUpdate(content.user, { isBanned: true });
        await createNotification({
          userId: content.user,
          type: 'banned',
          title: 'Tài khoản bị khóa',
          content: `Tài khoản của bạn đã bị khóa do vi phạm quy định cộng đồng nhiều lần.`,
          data: { reason: moderatorNote }
        });
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function
const getContentById = async (type, id) => {
  if (type === 'post') return await Post.findById(id);
  if (type === 'comment') return await Comment.findById(id);
  if (type === 'material') return await Material.findById(id);
  return null;
};