// ============= live_stream_shopping.js - BÁN HÀNG & QUẢNG CÁO =============

// ===== MODELS =====

// Stream Product (Sản phẩm bán trong livestream)
const StreamProductSchema = new mongoose.Schema({
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true }, // in diamonds
  originalPrice: { type: Number },
  images: [{ type: String }],
  link: { type: String }, // external link to buy
  isExternal: { type: Boolean, default: false },
  stock: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
  commission: { type: Number, default: 10 }, // commission percentage for streamer
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Stream Ad (Quảng cáo trong livestream)
const StreamAdSchema = new mongoose.Schema({
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', required: true },
  advertiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  videoUrl: { type: String },
  linkUrl: { type: String },
  duration: { type: Number, default: 15 }, // seconds
  price: { type: Number, required: true }, // price in diamonds
  status: { type: String, enum: ['pending', 'active', 'ended', 'rejected'], default: 'pending' },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  scheduledAt: { type: Date },
  playedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Affiliate Link (Link tiếp thị liên kết)
const AffiliateLinkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String, required: true },
  imageUrl: { type: String },
  platform: { type: String, enum: ['shopee', 'tiki', 'lazada', 'other'], default: 'other' },
  commission: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Affiliate Click (Lượt click)
const AffiliateClickSchema = new mongoose.Schema({
  link: { type: mongoose.Schema.Types.ObjectId, ref: 'AffiliateLink' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ip: { type: String },
  userAgent: { type: String },
  converted: { type: Boolean, default: false },
  convertedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const StreamProduct = mongoose.model('StreamProduct', StreamProductSchema);
const StreamAd = mongoose.model('StreamAd', StreamAdSchema);
const AffiliateLink = mongoose.model('AffiliateLink', AffiliateLinkSchema);
const AffiliateClick = mongoose.model('AffiliateClick', AffiliateClickSchema);

// ===== API ROUTES =====

// ===== STREAM PRODUCTS (BÁN HÀNG TRONG LIVESTREAM) =====

// Add product to stream
app.post('/api/live/streams/:streamId/products', authenticateJWT, async (req, res) => {
  try {
    const { title, description, price, originalPrice, images, link, isExternal, stock } = req.body;
    const stream = await Stream.findById(req.params.streamId);
    
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    if (stream.host.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ chủ phòng mới có thể thêm sản phẩm' });
    }
    
    const product = new StreamProduct({
      stream: stream._id,
      seller: req.userId,
      title,
      description,
      price,
      originalPrice,
      images: images || [],
      link: link || null,
      isExternal: isExternal || false,
      stock: stock || 0
    });
    
    await product.save();
    
    // Notify viewers
    io.to(`stream_${stream._id}`).emit('new-product', {
      product: {
        id: product._id,
        title: product.title,
        price: product.price,
        images: product.images
      }
    });
    
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stream products
app.get('/api/live/streams/:streamId/products', authenticateJWT, async (req, res) => {
  try {
    const products = await StreamProduct.find({ 
      stream: req.params.streamId, 
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buy product in stream
app.post('/api/live/streams/:streamId/products/:productId/buy', authenticateJWT, async (req, res) => {
  try {
    const product = await StreamProduct.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    if (product.stock <= 0) return res.status(400).json({ error: 'Sản phẩm đã hết hàng' });
    
    const user = await User.findById(req.userId);
    if (user.diamonds < product.price) {
      return res.status(400).json({ error: 'Không đủ kim cương' });
    }
    
    // Deduct diamonds
    user.diamonds -= product.price;
    await user.save();
    
    // Update product stock
    product.stock -= 1;
    product.soldCount += 1;
    await product.save();
    
    // Add commission to streamer
    const streamer = await User.findById(product.seller);
    const commission = product.price * (product.commission / 100);
    streamer.diamonds += commission;
    await streamer.save();
    
    // Record purchase
    const purchase = new StreamPurchase({
      user: user._id,
      product: product._id,
      stream: product.stream,
      price: product.price,
      commission: commission,
      createdAt: new Date()
    });
    await purchase.save();
    
    // Notify stream
    io.to(`stream_${product.stream}`).emit('product-sold', {
      productId: product._id,
      productTitle: product.title,
      buyer: user.name,
      remainingStock: product.stock
    });
    
    // Send external link if external product
    if (product.isExternal && product.link) {
      return res.json({ 
        success: true, 
        externalLink: product.link,
        message: 'Mua thành công! Click vào link để hoàn tất đơn hàng.'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Mua thành công! Sản phẩm sẽ được gửi đến bạn.',
      diamonds: user.diamonds
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== STREAM ADS (QUẢNG CÁO) =====

// Create ad for stream
app.post('/api/live/streams/:streamId/ads', authenticateJWT, async (req, res) => {
  try {
    const { title, description, imageUrl, videoUrl, linkUrl, duration, price } = req.body;
    const stream = await Stream.findById(req.params.streamId);
    
    if (!stream) return res.status(404).json({ error: 'Không tìm thấy livestream' });
    
    // Check if stream is public or user is admin
    if (stream.host.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền đăng quảng cáo' });
    }
    
    const ad = new StreamAd({
      stream: stream._id,
      advertiser: req.userId,
      title,
      description,
      imageUrl,
      videoUrl,
      linkUrl,
      duration: duration || 15,
      price,
      status: stream.host.toString() === req.userId ? 'active' : 'pending'
    });
    
    await ad.save();
    
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Play ad in stream
app.post('/api/live/streams/:streamId/ads/:adId/play', authenticateJWT, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);
    const ad = await StreamAd.findById(req.params.adId);
    
    if (!stream || !ad) return res.status(404).json({ error: 'Không tìm thấy' });
    if (stream.host.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ chủ phòng mới có thể phát quảng cáo' });
    }
    
    ad.impressions += 1;
    ad.playedAt = new Date();
    await ad.save();
    
    // Notify all viewers to show ad
    io.to(`stream_${stream._id}`).emit('play-ad', {
      ad: {
        id: ad._id,
        title: ad.title,
        imageUrl: ad.imageUrl,
        videoUrl: ad.videoUrl,
        linkUrl: ad.linkUrl,
        duration: ad.duration
      }
    });
    
    // Add diamonds to streamer
    const streamer = await User.findById(stream.host);
    streamer.diamonds += ad.price;
    await streamer.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Click ad
app.post('/api/live/streams/:streamId/ads/:adId/click', authenticateJWT, async (req, res) => {
  try {
    const ad = await StreamAd.findById(req.params.adId);
    if (!ad) return res.status(404).json({ error: 'Không tìm thấy quảng cáo' });
    
    ad.clicks += 1;
    await ad.save();
    
    res.json({ linkUrl: ad.linkUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== AFFILIATE LINKS (TIẾP THỊ LIÊN KẾT) =====

// Create affiliate link
app.post('/api/affiliate/links', authenticateJWT, async (req, res) => {
  try {
    const { title, description, url, imageUrl, platform, commission } = req.body;
    
    const link = new AffiliateLink({
      user: req.userId,
      title,
      description,
      url,
      imageUrl,
      platform: platform || 'other',
      commission: commission || 0
    });
    
    await link.save();
    
    res.json({ success: true, link });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's affiliate links
app.get('/api/affiliate/links', authenticateJWT, async (req, res) => {
  try {
    const links = await AffiliateLink.find({ user: req.userId, isActive: true })
      .sort({ createdAt: -1 });
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track affiliate click
app.post('/api/affiliate/click/:linkId', authenticateJWT, async (req, res) => {
  try {
    const link = await AffiliateLink.findById(req.params.linkId);
    if (!link) return res.status(404).json({ error: 'Không tìm thấy link' });
    
    link.clicks += 1;
    await link.save();
    
    const click = new AffiliateClick({
      link: link._id,
      user: req.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    await click.save();
    
    res.json({ redirectUrl: link.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track affiliate conversion (from external callback)
app.post('/api/affiliate/convert/:clickId', async (req, res) => {
  try {
    const click = await AffiliateClick.findById(req.params.clickId);
    if (!click) return res.status(404).json({ error: 'Không tìm thấy click' });
    
    click.converted = true;
    click.convertedAt = new Date();
    await click.save();
    
    const link = await AffiliateLink.findById(click.link);
    link.conversions += 1;
    link.earnings += link.commission;
    await link.save();
    
    // Add earnings to user
    const user = await User.findById(link.user);
    user.balance += link.commission;
    await user.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get affiliate stats
app.get('/api/affiliate/stats', authenticateJWT, async (req, res) => {
  try {
    const links = await AffiliateLink.find({ user: req.userId });
    const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
    const totalConversions = links.reduce((sum, l) => sum + l.conversions, 0);
    const totalEarnings = links.reduce((sum, l) => sum + l.earnings, 0);
    
    res.json({
      totalLinks: links.length,
      totalClicks,
      totalConversions,
      totalEarnings,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      links: links.map(l => ({
        id: l._id,
        title: l.title,
        clicks: l.clicks,
        conversions: l.conversions,
        earnings: l.earnings
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});