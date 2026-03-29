// ============= live_stream.js - BACKEND =============

const StreamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail: { type: String },
  streamKey: { type: String, unique: true },
  status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
  scheduledAt: { type: Date },
  startedAt: { type: Date },
  endedAt: { type: Date },
  viewers: { type: Number, default: 0 },
  totalViewers: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  gifts: { type: Number, default: 0 },
  chatMessages: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userAvatar: String,
    content: String,
    isGift: { type: Boolean, default: false },
    giftType: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  recording: { type: String },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Stream = mongoose.model('Stream', StreamSchema);

// API: Create stream
app.post('/api/live/streams', authenticateJWT, async (req, res) => {
  try {
    const { title, description, scheduledAt, tags, isPublic } = req.body;
    const user = await User.findById(req.userId);
    
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ giáo viên mới có thể tạo livestream' });
    }
    
    const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    const stream = new Stream({
      title,
      description,
      host: req.userId,
      streamKey,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      tags,
      isPublic: isPublic !== false
    });
    await stream.save();
    
    res.json({ stream, streamKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get live streams
app.get('/api/live/streams', authenticateJWT, async (req, res) => {
  try {
    const { status = 'live', page = 1, limit = 20 } = req.query;
    const streams = await Stream.find({ status })
      .populate('host', 'name avatar')
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json(streams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stream detail
app.get('/api/live/streams/:streamId', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId).populate('host', 'name avatar');
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
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
    
    stream.status = 'live';
    stream.startedAt = new Date();
    await stream.save();
    
    io.emit('stream-started', { streamId: stream._id, title: stream.title });
    
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
    
    stream.status = 'ended';
    stream.endedAt = new Date();
    await stream.save();
    
    io.emit('stream-ended', { streamId: stream._id });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send chat message
app.post('/api/live/streams/:streamId/chat', authenticateJWT, async (req, res) => {
  try {
    const { content, isGift, giftType } = req.body;
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    const user = await User.findById(req.userId);
    
    const message = {
      user: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      content,
      isGift: isGift || false,
      giftType: giftType || null,
      createdAt: new Date()
    };
    
    stream.chatMessages.push(message);
    if (stream.chatMessages.length > 500) {
      stream.chatMessages = stream.chatMessages.slice(-500);
    }
    
    if (isGift) {
      stream.gifts += 1;
      // Add diamonds to host
      const host = await User.findById(stream.host);
      host.diamonds += 10;
      await host.save();
    }
    
    await stream.save();
    
    io.to(`stream_${stream._id}`).emit('new-chat-message', message);
    
    res.json(message);
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
    stream.totalViewers += 1;
    await stream.save();
    
    io.to(`stream_${stream._id}`).emit('viewer-update', { viewers: stream.viewers });
    
    res.json({ viewers: stream.viewers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});