// ============= live_stream_complete.js - BACKEND =============

const StreamSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 2000 },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail: { type: String },
  streamKey: { type: String, unique: true, required: true },
  streamUrl: { type: String },
  
  // Status
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'ended', 'cancelled'], 
    default: 'scheduled' 
  },
  
  // Schedule
  scheduledAt: { type: Date },
  startedAt: { type: Date },
  endedAt: { type: Date },
  
  // Statistics
  viewers: { type: Number, default: 0 },
  peakViewers: { type: Number, default: 0 },
  totalViewers: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 }, // in seconds
  likes: { type: Number, default: 0 },
  gifts: { type: Number, default: 0 },
  giftValue: { type: Number, default: 0 }, // in diamonds
  
  // Chat & Interaction
  chatMessages: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userAvatar: String,
    content: String,
    isGift: { type: Boolean, default: false },
    giftType: { type: String },
    giftValue: { type: Number },
    createdAt: { type: Date, default: Date.now }
  }],
  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId }],
  
  // Recording
  recordingUrl: { type: String },
  recordingDuration: { type: Number },
  
  // Settings
  isPublic: { type: Boolean, default: true },
  allowChat: { type: Boolean, default: true },
  requireApproval: { type: Boolean, default: false },
  password: { type: String }, // for private streams
  
  // Categories
  subject: { type: String, enum: ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'all'], default: 'all' },
  grade: { type: Number, min: 6, max: 12 },
  tags: [{ type: String }],
  
  // Moderation
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bannedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Notifications
  notifiedFollowers: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Gift types
const GIFT_TYPES = {
  'flower': { name: '🌹 Hoa hồng', value: 10, icon: '🌹' },
  'heart': { name: '❤️ Trái tim', value: 20, icon: '❤️' },
  'star': { name: '⭐ Ngôi sao', value: 50, icon: '⭐' },
  'diamond': { name: '💎 Kim cương', value: 100, icon: '💎' },
  'rocket': { name: '🚀 Tên lửa', value: 500, icon: '🚀' },
  'crown': { name: '👑 Vương miện', value: 1000, icon: '👑' }
};

// ============= LIVE STREAM API =============

// Create stream
app.post('/api/live/streams', authenticateJWT, async (req, res) => {
  try {
    const { title, description, scheduledAt, subject, grade, tags, isPublic, password } = req.body;
    const user = await User.findById(req.userId);
    
    // Only teachers and admins can create streams
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ giáo viên mới có thể tạo livestream' });
    }
    
    // Check subscription
    if (user.subscription === 'free') {
      return res.status(403).json({ error: 'Chỉ tài khoản Pro/VIP mới được tạo livestream' });
    }
    
    const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    
    const stream = new Stream({
      title,
      description,
      host: user._id,
      streamKey,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      subject: subject || 'all',
      grade: grade || null,
      tags: tags || [],
      isPublic: isPublic !== false,
      password: password || null
    });
    
    await stream.save();
    
    // Notify followers
    if (stream.scheduledAt) {
      const followers = await Relationship.find({ following: user._id }).distinct('follower');
      followers.forEach(followerId => {
        createNotification({
          userId: followerId,
          type: 'stream_scheduled',
          title: 'Livestream sắp diễn ra',
          content: `${user.name} sẽ phát trực tiếp: ${title}`,
          data: { streamId: stream._id, scheduledAt: stream.scheduledAt }
        });
      });
    }
    
    res.json({ success: true, stream, streamKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get streams (with filters)
app.get('/api/live/streams', authenticateJWT, async (req, res) => {
  try {
    const { status = 'live', subject, grade, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status === 'live') {
      query.status = 'live';
    } else if (status === 'scheduled') {
      query.status = 'scheduled';
      query.scheduledAt = { $gt: new Date() };
    } else if (status === 'ended') {
      query.status = 'ended';
    }
    
    if (subject && subject !== 'all') query.subject = subject;
    if (grade) query.grade = parseInt(grade);
    
    const streams = await Stream.find(query)
      .populate('host', 'name avatar')
      .sort({ status === 'live' ? { startedAt: -1 } : { scheduledAt: 1 } })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json(streams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stream by ID
app.get('/api/live/streams/:streamId', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId)
      .populate('host', 'name avatar')
      .populate('moderators', 'name avatar');
    
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    // Check access
    if (!stream.isPublic && stream.host._id.toString() !== req.userId && !stream.moderators.includes(req.userId)) {
      if (stream.password) {
        // Password protected, require password
        return res.status(401).json({ error: 'Cần mật khẩu để xem', requirePassword: true });
      }
      return res.status(403).json({ error: 'Livestream này là riêng tư' });
    }
    
    // Check if user is banned
    if (stream.bannedUsers.includes(req.userId)) {
      return res.status(403).json({ error: 'Bạn đã bị cấm khỏi livestream này' });
    }
    
    res.json(stream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start stream
app.post('/api/live/streams/:streamId/start', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    if (stream.host.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không phải chủ của livestream này' });
    }
    
    if (stream.status === 'live') {
      return res.status(400).json({ error: 'Livestream đang diễn ra' });
    }
    
    stream.status = 'live';
    stream.startedAt = new Date();
    await stream.save();
    
    // Notify all followers
    const followers = await Relationship.find({ following: stream.host }).distinct('follower');
    followers.forEach(followerId => {
      io.to(`user_${followerId}`).emit('stream-started', {
        streamId: stream._id,
        title: stream.title,
        host: stream.host
      });
    });
    
    // Notify all users in stream room
    io.to(`stream_${stream._id}`).emit('stream-started', { streamId: stream._id });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// End stream
app.post('/api/live/streams/:streamId/end', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    if (stream.host.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không phải chủ của livestream này' });
    }
    
    if (stream.status !== 'live') {
      return res.status(400).json({ error: 'Livestream chưa bắt đầu' });
    }
    
    const duration = Math.floor((new Date() - stream.startedAt) / 1000);
    stream.status = 'ended';
    stream.endedAt = new Date();
    stream.totalDuration = duration;
    await stream.save();
    
    io.to(`stream_${stream._id}`).emit('stream-ended', { streamId: stream._id });
    
    res.json({ success: true, duration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send chat message
app.post('/api/live/streams/:streamId/chat', authenticateJWT, async (req, res) => {
  try {
    const { content } = req.body;
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    if (stream.status !== 'live') {
      return res.status(400).json({ error: 'Livestream chưa bắt đầu' });
    }
    
    if (!stream.allowChat) {
      return res.status(403).json({ error: 'Chức năng chat đã bị tắt' });
    }
    
    // Check if user is banned
    if (stream.bannedUsers.includes(req.userId)) {
      return res.status(403).json({ error: 'Bạn đã bị cấm chat' });
    }
    
    const user = await User.findById(req.userId);
    
    const message = {
      user: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      content,
      isGift: false,
      createdAt: new Date()
    };
    
    stream.chatMessages.push(message);
    
    // Limit chat history
    if (stream.chatMessages.length > 1000) {
      stream.chatMessages = stream.chatMessages.slice(-500);
    }
    
    await stream.save();
    
    io.to(`stream_${stream._id}`).emit('new-chat-message', message);
    
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send gift
app.post('/api/live/streams/:streamId/gift', authenticateJWT, async (req, res) => {
  try {
    const { giftType } = req.body;
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    if (stream.status !== 'live') {
      return res.status(400).json({ error: 'Livestream chưa bắt đầu' });
    }
    
    const gift = GIFT_TYPES[giftType];
    if (!gift) return res.status(400).json({ error: 'Loại quà không hợp lệ' });
    
    const user = await User.findById(req.userId);
    
    // Check diamonds
    if (user.diamonds < gift.value) {
      return res.status(400).json({ error: 'Không đủ kim cương' });
    }
    
    // Deduct diamonds
    user.diamonds -= gift.value;
    await user.save();
    
    // Add to stream
    stream.gifts += 1;
    stream.giftValue += gift.value;
    
    const message = {
      user: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      content: `Đã tặng ${gift.name} cho chủ phòng!`,
      isGift: true,
      giftType: giftType,
      giftValue: gift.value,
      createdAt: new Date()
    };
    
    stream.chatMessages.push(message);
    await stream.save();
    
    // Add diamonds to host
    const host = await User.findById(stream.host);
    host.diamonds += gift.value;
    await host.save();
    
    io.to(`stream_${stream._id}`).emit('new-gift', {
      user: user.name,
      giftType: giftType,
      giftName: gift.name,
      giftIcon: gift.icon
    });
    io.to(`stream_${stream._id}`).emit('new-chat-message', message);
    
    res.json({ success: true, gift });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update viewer count
app.post('/api/live/streams/:streamId/viewer', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    stream.viewers += 1;
    if (stream.viewers > stream.peakViewers) {
      stream.peakViewers = stream.viewers;
    }
    stream.totalViewers += 1;
    await stream.save();
    
    io.to(`stream_${stream._id}`).emit('viewer-update', { 
      viewers: stream.viewers,
      peakViewers: stream.peakViewers,
      totalViewers: stream.totalViewers
    });
    
    res.json({ viewers: stream.viewers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave stream (decrease viewer count)
app.post('/api/live/streams/:streamId/leave', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    if (stream.viewers > 0) {
      stream.viewers -= 1;
      await stream.save();
      
      io.to(`stream_${stream._id}`).emit('viewer-update', { viewers: stream.viewers });
    }
    
    res.json({ viewers: stream.viewers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like stream
app.post('/api/live/streams/:streamId/like', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    stream.likes += 1;
    await stream.save();
    
    io.to(`stream_${stream._id}`).emit('like-update', { likes: stream.likes });
    
    res.json({ likes: stream.likes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pin message (moderator only)
app.post('/api/live/streams/:streamId/pin/:messageId', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    const isModerator = stream.moderators.includes(req.userId) || stream.host.toString() === req.userId;
    if (!isModerator && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền pin tin nhắn' });
    }
    
    const message = stream.chatMessages.id(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    
    stream.pinnedMessages.push(message._id);
    await stream.save();
    
    io.to(`stream_${stream._id}`).emit('message-pinned', { messageId: message._id, message });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ban user from stream
app.post('/api/live/streams/:streamId/ban/:userId', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    const isModerator = stream.moderators.includes(req.userId) || stream.host.toString() === req.userId;
    if (!isModerator && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền ban người dùng' });
    }
    
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    
    if (!stream.bannedUsers.includes(targetUser._id)) {
      stream.bannedUsers.push(targetUser._id);
      await stream.save();
    }
    
    io.to(`stream_${stream._id}`).emit('user-banned', { userId: targetUser._id, userName: targetUser.name });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add moderator
app.post('/api/live/streams/:streamId/moderator/:userId', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    if (stream.host.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ chủ phòng mới có thể thêm moderator' });
    }
    
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    
    if (!stream.moderators.includes(targetUser._id)) {
      stream.moderators.push(targetUser._id);
      await stream.save();
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stream recordings
app.get('/api/live/recordings', authenticateJWT, async (req, res) => {
  try {
    const recordings = await Stream.find({ status: 'ended', recordingUrl: { $ne: null } })
      .populate('host', 'name avatar')
      .sort({ endedAt: -1 })
      .limit(50);
    
    res.json(recordings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});