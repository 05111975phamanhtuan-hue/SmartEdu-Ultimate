// ============= social_network.js - BACKEND =============
// Thêm vào server.js

// ============= MODELS =============

// Post Model
const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userAvatar: { type: String },
  content: { type: String, required: true },
  images: [{ type: String }],
  video: { type: String },
  type: { type: String, enum: ['post', 'question', 'material', 'announcement'], default: 'post' },
  subject: { type: String, enum: ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'all'], default: 'all' },
  grade: { type: Number, min: 6, max: 12 },
  tags: [{ type: String }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userAvatar: String,
    content: String,
    images: [String],
    createdAt: { type: Date, default: Date.now }
  }],
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Comment Model
const CommentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  userAvatar: String,
  content: String,
  images: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userAvatar: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// User Relationship Model (Follow/Block)
const RelationshipSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

// Chat Message Model
const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  images: [{ type: String }],
  file: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Conversation Model
const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: String },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCount: { type: Map, of: Number, default: {} },
  isGroup: { type: Boolean, default: false },
  groupName: { type: String },
  groupAvatar: { type: String },
  groupAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// Group Model (Study Group)
const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  avatar: { type: String },
  cover: { type: String },
  subject: { type: String, enum: ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'all'] },
  grade: { type: Number, min: 6, max: 12 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['member', 'admin', 'owner'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  joinRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isPrivate: { type: Boolean, default: false },
  tags: [{ type: String }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', PostSchema);
const Comment = mongoose.model('Comment', CommentSchema);
const Relationship = mongoose.model('Relationship', RelationshipSchema);
const Message = mongoose.model('Message', MessageSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);
const Group = mongoose.model('Group', GroupSchema);

// ============= API ROUTES =============

// ===== POST MANAGEMENT =====

// Get feed posts
app.get('/api/social/feed', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, subject, grade } = req.query;
    const user = await User.findById(req.userId);
    
    // Get following users
    const following = await Relationship.find({ follower: req.userId, status: 'active' }).distinct('following');
    following.push(req.userId);
    
    const query = {
      user: { $in: following },
      isHidden: false
    };
    if (subject && subject !== 'all') query.subject = subject;
    if (grade) query.grade = parseInt(grade);
    
    const posts = await Post.find(query)
      .populate('user', 'name avatar')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Get group posts
    const userGroups = await Group.find({ 'members.user': req.userId }).distinct('_id');
    const groupPosts = await Post.find({ group: { $in: userGroups }, isHidden: false })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const allPosts = [...posts, ...groupPosts].sort((a, b) => b.createdAt - a.createdAt).slice(0, parseInt(limit));
    
    res.json({
      posts: allPosts,
      page: parseInt(page),
      hasMore: allPosts.length === parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create post
app.post('/api/social/posts', authenticateJWT, async (req, res) => {
  try {
    const { content, images, video, type, subject, grade, tags, groupId } = req.body;
    const user = await User.findById(req.userId);
    
    if (!content && (!images || images.length === 0) && !video) {
      return res.status(400).json({ error: 'Vui lòng nhập nội dung hoặc thêm hình ảnh/video' });
    }
    
    const postData = {
      user: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      content: content || '',
      images: images || [],
      video: video || null,
      type: type || 'post',
      subject: subject || 'all',
      grade: grade || null,
      tags: tags || []
    };
    
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: 'Nhóm không tồn tại' });
      const isMember = group.members.some(m => m.user.toString() === req.userId);
      if (!isMember) return res.status(403).json({ error: 'Bạn không phải thành viên của nhóm này' });
      postData.group = groupId;
    }
    
    const post = new Post(postData);
    await post.save();
    
    // Notify followers
    const followers = await Relationship.find({ following: req.userId }).distinct('follower');
    followers.forEach(follower => {
      io.to(`user_${follower}`).emit('new-post', { post, userId: req.userId });
    });
    
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get post detail
app.get('/api/social/posts/:postId', authenticateJWT, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');
    
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    
    // Increase view count
    post.views += 1;
    await post.save();
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like/Unlike post
app.post('/api/social/posts/:postId/like', authenticateJWT, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    
    const likeIndex = post.likes.indexOf(req.userId);
    if (likeIndex === -1) {
      post.likes.push(req.userId);
      // Create notification
      if (post.user.toString() !== req.userId) {
        await createNotification({
          userId: post.user,
          type: 'like',
          title: 'Ai đó đã thích bài viết của bạn',
          content: `${req.user.name} đã thích bài viết của bạn`,
          data: { postId: post._id }
        });
      }
    } else {
      post.likes.splice(likeIndex, 1);
    }
    
    await post.save();
    
    io.to(`post_${post._id}`).emit('post-updated', { postId: post._id, likes: post.likes.length });
    
    res.json({ likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
app.post('/api/social/posts/:postId/comments', authenticateJWT, async (req, res) => {
  try {
    const { content, images } = req.body;
    const user = await User.findById(req.userId);
    const post = await Post.findById(req.params.postId);
    
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    if (!content && (!images || images.length === 0)) {
      return res.status(400).json({ error: 'Vui lòng nhập nội dung bình luận' });
    }
    
    const comment = {
      user: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      content: content || '',
      images: images || []
    };
    
    post.comments.push(comment);
    await post.save();
    
    // Create notification
    if (post.user.toString() !== req.userId) {
      await createNotification({
        userId: post.user,
        type: 'comment',
        title: 'Ai đó đã bình luận về bài viết của bạn',
        content: `${user.name} đã bình luận: ${content.substring(0, 50)}...`,
        data: { postId: post._id, commentId: post.comments[post.comments.length - 1]._id }
      });
    }
    
    io.to(`post_${post._id}`).emit('new-comment', { postId: post._id, comment });
    
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Share post
app.post('/api/social/posts/:postId/share', authenticateJWT, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    
    if (!post.shares.includes(req.userId)) {
      post.shares.push(req.userId);
      await post.save();
      
      // Create shared post
      const sharedPost = new Post({
        user: req.userId,
        userName: req.user.name,
        userAvatar: req.user.avatar,
        content: `Đã chia sẻ bài viết của ${post.userName}`,
        sharedPost: post._id,
        type: 'share'
      });
      await sharedPost.save();
    }
    
    res.json({ shares: post.shares.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post
app.delete('/api/social/posts/:postId', authenticateJWT, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    
    if (post.user.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bài viết này' });
    }
    
    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== USER RELATIONSHIP =====

// Follow user
app.post('/api/social/follow/:userId', authenticateJWT, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    if (req.userId === req.params.userId) {
      return res.status(400).json({ error: 'Không thể tự theo dõi bản thân' });
    }
    
    const existing = await Relationship.findOne({
      follower: req.userId,
      following: req.params.userId
    });
    
    if (existing) {
      if (existing.status === 'blocked') {
        return res.status(400).json({ error: 'Bạn đã chặn người dùng này' });
      }
      return res.status(400).json({ error: 'Bạn đã theo dõi người dùng này rồi' });
    }
    
    const relationship = new Relationship({
      follower: req.userId,
      following: req.params.userId,
      status: 'active'
    });
    await relationship.save();
    
    // Create notification
    await createNotification({
      userId: req.params.userId,
      type: 'follow',
      title: 'Ai đó đã theo dõi bạn',
      content: `${req.user.name} đã bắt đầu theo dõi bạn`,
      data: { followerId: req.userId }
    });
    
    io.to(`user_${req.params.userId}`).emit('new-follower', { followerId: req.userId, followerName: req.user.name });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unfollow user
app.delete('/api/social/follow/:userId', authenticateJWT, async (req, res) => {
  try {
    await Relationship.findOneAndDelete({
      follower: req.userId,
      following: req.params.userId
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Block user
app.post('/api/social/block/:userId', authenticateJWT, async (req, res) => {
  try {
    await Relationship.findOneAndUpdate(
      { follower: req.userId, following: req.params.userId },
      { status: 'blocked' },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get followers
app.get('/api/social/followers/:userId', authenticateJWT, async (req, res) => {
  try {
    const followers = await Relationship.find({ following: req.params.userId, status: 'active' })
      .populate('follower', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(followers.map(f => f.follower));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get following
app.get('/api/social/following/:userId', authenticateJWT, async (req, res) => {
  try {
    const following = await Relationship.find({ follower: req.params.userId, status: 'active' })
      .populate('following', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(following.map(f => f.following));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CHAT MESSAGING =====

// Get conversations
app.get('/api/social/conversations', authenticateJWT, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.userId })
      .populate('participants', 'name avatar')
      .sort({ lastMessageAt: -1 });
    
    // Add unread count
    const result = conversations.map(conv => ({
      ...conv.toObject(),
      unreadCount: conv.unreadCount.get(req.userId.toString()) || 0
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start conversation
app.post('/api/social/conversations', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.body;
    const existing = await Conversation.findOne({
      participants: { $all: [req.userId, userId], $size: 2 },
      isGroup: false
    });
    
    if (existing) {
      return res.json(existing);
    }
    
    const conversation = new Conversation({
      participants: [req.userId, userId],
      unreadCount: new Map([[req.userId.toString(), 0], [userId.toString(), 0]])
    });
    await conversation.save();
    
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages
app.get('/api/social/messages/:conversationId', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({
      conversationId: req.params.conversationId,
      deletedFor: { $ne: req.userId }
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Mark as read
    await Message.updateMany(
      { conversationId: req.params.conversationId, receiver: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    // Reset unread count
    await Conversation.updateOne(
      { _id: req.params.conversationId },
      { [`unreadCount.${req.userId}`]: 0 }
    );
    
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message
app.post('/api/social/messages', authenticateJWT, async (req, res) => {
  try {
    const { conversationId, receiverId, content, images, file } = req.body;
    
    let convId = conversationId;
    if (!convId) {
      const conversation = new Conversation({
        participants: [req.userId, receiverId],
        unreadCount: new Map([[req.userId.toString(), 0], [receiverId.toString(), 0]])
      });
      await conversation.save();
      convId = conversation._id;
    }
    
    const message = new Message({
      conversationId: convId,
      sender: req.userId,
      receiver: receiverId,
      content: content || '',
      images: images || [],
      file: file || null
    });
    await message.save();
    
    // Update conversation
    await Conversation.findByIdAndUpdate(convId, {
      lastMessage: content || 'Đã gửi một tin nhắn',
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${receiverId}`]: 1 }
    });
    
    // Real-time emit
    io.to(`user_${receiverId}`).emit('new-message', {
      conversationId: convId,
      message,
      sender: req.userId,
      senderName: req.user.name
    });
    
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete message
app.delete('/api/social/messages/:messageId', authenticateJWT, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa tin nhắn này' });
    }
    
    message.deletedFor.push(req.userId);
    await message.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== STUDY GROUPS =====

// Create group
app.post('/api/social/groups', authenticateJWT, async (req, res) => {
  try {
    const { name, description, subject, grade, isPrivate, tags } = req.body;
    
    const group = new Group({
      name,
      description,
      subject,
      grade,
      isPrivate: isPrivate || false,
      tags: tags || [],
      owner: req.userId,
      admins: [req.userId],
      members: [{ user: req.userId, role: 'owner' }]
    });
    await group.save();
    
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get groups
app.get('/api/social/groups', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, subject, grade } = req.query;
    const query = {};
    if (subject && subject !== 'all') query.subject = subject;
    if (grade) query.grade = parseInt(grade);
    if (!req.query.includePrivate) query.isPrivate = false;
    
    const groups = await Group.find(query)
      .populate('owner', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Check if user is member
    const userGroups = await Group.find({ 'members.user': req.userId }).distinct('_id');
    const groupsWithStatus = groups.map(group => ({
      ...group.toObject(),
      isMember: userGroups.includes(group._id)
    }));
    
    res.json(groupsWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group detail
app.get('/api/social/groups/:groupId', authenticateJWT, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('owner', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('members.user', 'name avatar');
    
    if (!group) return res.status(404).json({ error: 'Không tìm thấy nhóm' });
    
    const isMember = group.members.some(m => m.user._id.toString() === req.userId);
    if (group.isPrivate && !isMember && group.owner._id.toString() !== req.userId) {
      return res.status(403).json({ error: 'Nhóm này là riêng tư' });
    }
    
    res.json({ ...group.toObject(), isMember });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join group
app.post('/api/social/groups/:groupId/join', authenticateJWT, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Không tìm thấy nhóm' });
    
    const isMember = group.members.some(m => m.user.toString() === req.userId);
    if (isMember) {
      return res.status(400).json({ error: 'Bạn đã là thành viên của nhóm này' });
    }
    
    if (group.isPrivate) {
      group.joinRequests.push({ user: req.userId });
      await group.save();
      return res.json({ success: true, message: 'Đã gửi yêu cầu tham gia nhóm' });
    }
    
    group.members.push({ user: req.userId, role: 'member' });
    await group.save();
    
    res.json({ success: true, message: 'Đã tham gia nhóm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave group
app.post('/api/social/groups/:groupId/leave', authenticateJWT, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Không tìm thấy nhóm' });
    
    group.members = group.members.filter(m => m.user.toString() !== req.userId);
    group.admins = group.admins.filter(a => a.toString() !== req.userId);
    
    if (group.owner.toString() === req.userId) {
      if (group.members.length > 0) {
        group.owner = group.members[0].user;
        group.admins.push(group.members[0].user);
        group.members[0].role = 'owner';
      }
    }
    
    await group.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== NOTIFICATIONS =====

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'comment', 'follow', 'mention', 'group_invite', 'system'], required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', NotificationSchema);

// Get notifications
app.get('/api/social/notifications', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const notifications = await Notification.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const unreadCount = await Notification.countDocuments({ user: req.userId, isRead: false });
    
    res.json({
      notifications,
      unreadCount,
      page: parseInt(page),
      hasMore: notifications.length === parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
app.patch('/api/social/notifications/:notificationId/read', authenticateJWT, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.notificationId, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
app.patch('/api/social/notifications/read-all', authenticateJWT, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create notification helper
const createNotification = async ({ userId, type, title, content, data }) => {
  const notification = new Notification({
    user: userId,
    type,
    title,
    content,
    data
  });
  await notification.save();
  
  io.to(`user_${userId}`).emit('new-notification', notification);
  return notification;
};