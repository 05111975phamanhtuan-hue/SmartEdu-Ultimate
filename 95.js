// ============= marketplace.js - BACKEND =============
// Thêm vào server.js

// ============= MODELS =============

// Material Model (Tài liệu)
const MaterialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  subject: { type: String, enum: ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia'], required: true },
  grade: { type: Number, min: 6, max: 12, required: true },
  type: { type: String, enum: ['document', 'exam', 'video', 'audio', 'presentation'], required: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0 },
  isFree: { type: Boolean, default: false },
  
  // File info
  fileUrl: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String },
  thumbnail: { type: String },
  previewUrl: { type: String },
  
  // Author info
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String },
  authorAvatar: { type: String },
  
  // Metadata
  tags: [{ type: String }],
  pages: { type: Number },
  duration: { type: Number }, // for video/audio
  language: { type: String, default: 'vi' },
  
  // Statistics
  downloads: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  
  // Status
  isPublished: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Review Model (Đánh giá)
const ReviewSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userAvatar: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
  images: [{ type: String }],
  isVerifiedPurchase: { type: Boolean, default: true },
  helpful: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Cart Model (Giỏ hàng)
const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    price: Number,
    addedAt: { type: Date, default: Date.now }
  }],
  updatedAt: { type: Date, default: Date.now }
});

// Order Model (Đơn hàng)
const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    title: String,
    price: Number,
    discountPrice: Number
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'completed', 'cancelled', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['diamonds', 'balance'], required: true },
  paymentId: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const Material = mongoose.model('Material', MaterialSchema);
const Review = mongoose.model('Review', ReviewSchema);
const Cart = mongoose.model('Cart', CartSchema);
const Order = mongoose.model('Order', OrderSchema);

// ============= API ROUTES =============

// ===== MATERIAL MANAGEMENT =====

// Upload material (seller)
app.post('/api/marketplace/materials', authenticateJWT, async (req, res) => {
  try {
    const { title, description, subject, grade, type, price, tags, fileUrl, thumbnail } = req.body;
    const user = await User.findById(req.userId);
    
    if (!title || !description || !subject || !grade || !type || !fileUrl) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    // Check if user can sell (must be Pro or VIP)
    if (user.subscription === 'free') {
      return res.status(403).json({ error: 'Chỉ tài khoản Pro/VIP mới được đăng bán tài liệu' });
    }
    
    const material = new Material({
      title,
      description,
      subject,
      grade,
      type,
      price: price || 0,
      isFree: price === 0,
      fileUrl,
      thumbnail: thumbnail || null,
      tags: tags || [],
      author: user._id,
      authorName: user.name,
      authorAvatar: user.avatar,
      isPublished: true,
      isApproved: user.role === 'admin' // Admin auto-approve
    });
    
    await material.save();
    
    res.json({ success: true, material });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get materials (marketplace)
app.get('/api/marketplace/materials', authenticateJWT, async (req, res) => {
  try {
    const { 
      subject, grade, type, minPrice, maxPrice, search, 
      sort = 'newest', page = 1, limit = 20 
    } = req.query;
    
    const query = { isPublished: true, isApproved: true };
    if (subject && subject !== 'all') query.subject = subject;
    if (grade) query.grade = parseInt(grade);
    if (type && type !== 'all') query.type = type;
    if (minPrice) query.price = { $gte: parseInt(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseInt(maxPrice) };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [search] } }
      ];
    }
    
    let sortOption = {};
    switch(sort) {
      case 'newest': sortOption = { createdAt: -1 }; break;
      case 'oldest': sortOption = { createdAt: 1 }; break;
      case 'price_asc': sortOption = { price: 1 }; break;
      case 'price_desc': sortOption = { price: -1 }; break;
      case 'popular': sortOption = { downloads: -1 }; break;
      case 'rating': sortOption = { rating: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }
    
    const materials = await Material.find(query)
      .populate('author', 'name avatar')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Material.countDocuments(query);
    
    res.json({
      materials,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get material detail
app.get('/api/marketplace/materials/:materialId', authenticateJWT, async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId)
      .populate('author', 'name avatar');
    
    if (!material) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    if (!material.isPublished || (!material.isApproved && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Tài liệu chưa được duyệt' });
    }
    
    // Increase view count
    material.views += 1;
    await material.save();
    
    // Get reviews
    const reviews = await Review.find({ material: material._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Check if user has purchased
    const hasPurchased = await Order.findOne({
      user: req.userId,
      'items.material': material._id,
      status: 'completed'
    });
    
    res.json({
      material,
      reviews,
      hasPurchased: !!hasPurchased
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CART & ORDER =====

// Get cart
app.get('/api/marketplace/cart', authenticateJWT, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate('items.material');
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
      await cart.save();
    }
    
    const subtotal = cart.items.reduce((sum, item) => sum + (item.material?.discountPrice || item.material?.price || 0), 0);
    
    res.json({
      items: cart.items,
      subtotal,
      total: subtotal
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add to cart
app.post('/api/marketplace/cart/add', authenticateJWT, async (req, res) => {
  try {
    const { materialId } = req.body;
    const material = await Material.findById(materialId);
    
    if (!material) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    if (material.author.toString() === req.userId) {
      return res.status(400).json({ error: 'Bạn không thể mua tài liệu của chính mình' });
    }
    
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }
    
    const existingItem = cart.items.find(item => item.material.toString() === materialId);
    if (existingItem) {
      return res.status(400).json({ error: 'Tài liệu đã có trong giỏ hàng' });
    }
    
    cart.items.push({
      material: materialId,
      price: material.discountPrice || material.price
    });
    cart.updatedAt = new Date();
    await cart.save();
    
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove from cart
app.delete('/api/marketplace/cart/remove/:materialId', authenticateJWT, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ error: 'Giỏ hàng trống' });
    
    cart.items = cart.items.filter(item => item.material.toString() !== req.params.materialId);
    cart.updatedAt = new Date();
    await cart.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Checkout
app.post('/api/marketplace/checkout', authenticateJWT, async (req, res) => {
  try {
    const { paymentMethod } = req.body; // 'diamonds' or 'balance'
    const user = await User.findById(req.userId);
    const cart = await Cart.findOne({ user: req.userId }).populate('items.material');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống' });
    }
    
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of cart.items) {
      const price = item.material.discountPrice || item.material.price;
      subtotal += price;
      orderItems.push({
        material: item.material._id,
        title: item.material.title,
        price: item.material.price,
        discountPrice: item.material.discountPrice
      });
    }
    
    const total = subtotal;
    
    // Check payment
    if (paymentMethod === 'diamonds') {
      if (user.diamonds < total) {
        return res.status(400).json({ error: 'Không đủ kim cương' });
      }
      user.diamonds -= total;
    } else if (paymentMethod === 'balance') {
      if (user.balance < total) {
        return res.status(400).json({ error: 'Không đủ tiền trong ví' });
      }
      user.balance -= total;
    } else {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
    }
    
    // Create order
    const order = new Order({
      user: user._id,
      items: orderItems,
      subtotal,
      discount: subtotal - total,
      total,
      paymentMethod,
      status: 'completed',
      completedAt: new Date()
    });
    await order.save();
    
    // Update seller earnings and material downloads
    for (const item of orderItems) {
      const material = await Material.findById(item.material);
      material.downloads += 1;
      await material.save();
      
      // Add earnings to seller (80% after platform fee)
      const seller = await User.findById(material.author);
      const earnings = item.price * 0.8;
      seller.balance += earnings;
      await seller.save();
      
      // Platform fee (20%)
      const platformFee = item.price * 0.2;
      const feeTransaction = new Transaction({
        user: null,
        type: 'platform_fee',
        amount: platformFee,
        description: `Phí nền tảng từ giao dịch ${order._id}`,
        status: 'success'
      });
      await feeTransaction.save();
    }
    
    // Clear cart
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();
    
    res.json({
      success: true,
      order,
      diamonds: user.diamonds,
      balance: user.balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user orders
app.get('/api/marketplace/orders', authenticateJWT, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate('items.material')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download material
app.get('/api/marketplace/download/:materialId', authenticateJWT, async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId);
    if (!material) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    
    // Check if free or purchased
    const isFree = material.isFree || material.price === 0;
    const hasPurchased = await Order.findOne({
      user: req.userId,
      'items.material': material._id,
      status: 'completed'
    });
    
    if (!isFree && !hasPurchased) {
      return res.status(403).json({ error: 'Bạn chưa mua tài liệu này' });
    }
    
    // Update download count
    material.downloads += 1;
    await material.save();
    
    res.json({ downloadUrl: material.fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== REVIEWS =====

// Add review
app.post('/api/marketplace/reviews/:materialId', authenticateJWT, async (req, res) => {
  try {
    const { rating, comment, images } = req.body;
    const material = await Material.findById(req.params.materialId);
    if (!material) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    
    // Check if user purchased
    const hasPurchased = await Order.findOne({
      user: req.userId,
      'items.material': material._id,
      status: 'completed'
    });
    
    if (!hasPurchased) {
      return res.status(403).json({ error: 'Bạn cần mua tài liệu để đánh giá' });
    }
    
    // Check if already reviewed
    const existingReview = await Review.findOne({ material: material._id, user: req.userId });
    if (existingReview) {
      return res.status(400).json({ error: 'Bạn đã đánh giá tài liệu này rồi' });
    }
    
    const user = await User.findById(req.userId);
    const review = new Review({
      material: material._id,
      user: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      rating,
      comment,
      images,
      isVerifiedPurchase: true
    });
    await review.save();
    
    // Update material rating
    const reviews = await Review.find({ material: material._id });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    material.rating = totalRating / reviews.length;
    material.ratingCount = reviews.length;
    await material.save();
    
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN FUNCTIONS =====

// Approve material
app.patch('/api/admin/marketplace/materials/:materialId/approve', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId);
    if (!material) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    
    material.isApproved = true;
    material.approvedBy = req.userId;
    material.approvedAt = new Date();
    await material.save();
    
    // Notify author
    await createNotification({
      userId: material.author,
      type: 'system',
      title: 'Tài liệu đã được duyệt',
      content: `Tài liệu "${material.title}" của bạn đã được duyệt và đăng bán thành công!`,
      data: { materialId: material._id }
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject material
app.patch('/api/admin/marketplace/materials/:materialId/reject', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const material = await Material.findById(req.params.materialId);
    if (!material) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    
    material.isPublished = false;
    material.rejectionReason = reason;
    await material.save();
    
    // Notify author
    await createNotification({
      userId: material.author,
      type: 'system',
      title: 'Tài liệu bị từ chối',
      content: `Tài liệu "${material.title}" của bạn bị từ chối. Lý do: ${reason}`,
      data: { materialId: material._id }
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending materials
app.get('/api/admin/marketplace/pending', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const materials = await Material.find({ isApproved: false, isPublished: true })
      .populate('author', 'name email')
      .sort({ createdAt: 1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get platform stats
app.get('/api/admin/marketplace/stats', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const totalMaterials = await Material.countDocuments();
    const totalSales = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    const platformFees = await Transaction.aggregate([
      { $match: { type: 'platform_fee' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const topSellers = await Material.aggregate([
      { $group: { _id: "$author", totalSales: { $sum: "$downloads" } } },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "author" } }
    ]);
    
    res.json({
      totalMaterials,
      totalSales: totalSales[0]?.total || 0,
      platformFees: platformFees[0]?.total || 0,
      topSellers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});