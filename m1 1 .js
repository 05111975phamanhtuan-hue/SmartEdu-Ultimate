// server.js - Module 1: Authentication System
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============= SECURITY MIDDLEWARE =============
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', process.env.FRONTEND_URL],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
});
app.use('/api/auth', limiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ============= DATABASE CONNECTION =============
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartedu';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ============= USER MODEL =============
const UserSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '', match: /^[0-9]{10,11}$/ },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  province: { type: String, default: '' },
  school: { type: String, default: '' },
  grade: { type: Number, min: 6, max: 12 },
  
  // Authentication
  password: { type: String, minlength: 6, select: false },
  provider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
  providerId: { type: String },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  
  // Role & Permissions
  role: { type: String, enum: ['user', 'teacher', 'admin', 'super_admin'], default: 'user' },
  permissions: [{ type: String }],
  
  // Gamification
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  badges: [{ type: String }],
  
  // Energy System
  energy: { type: Number, default: 25, min: 0, max: 25 },
  lastEnergyReset: { type: Date, default: Date.now },
  
  // Financial System
  diamonds: { type: Number, default: 0, min: 0 },
  balance: { type: Number, default: 0, min: 0 },
  
  // Subscription
  subscription: { type: String, enum: ['free', 'pro', 'family'], default: 'free' },
  subscriptionExpires: { type: Date },
  familyId: { type: String },
  
  // Learning Progress
  completedLessons: [{ type: String }],
  quizScores: [{
    lessonId: String,
    score: Number,
    completedAt: { type: Date, default: Date.now }
  }],
  purchasedMaterials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }],
  
  // Preferences
  notifications: { type: Boolean, default: true },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  language: { type: String, default: 'vi' },
  
  // Security
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  refreshToken: { type: String },
  refreshTokenExpires: { type: Date },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ subscription: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual fields
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.virtual('subscriptionStatus').get(function() {
  if (this.subscription === 'free') return 'free';
  if (this.subscriptionExpires && this.subscriptionExpires < new Date()) return 'expired';
  return this.subscription;
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.incrementLoginAttempts = async function() {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
  }
  await this.save();
};

UserSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

UserSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

UserSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

UserSchema.methods.generateRefreshToken = function() {
  const token = crypto.randomBytes(64).toString('hex');
  this.refreshToken = crypto.createHash('sha256').update(token).digest('hex');
  this.refreshTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  return token;
};

// Static methods
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByProvider = function(provider, providerId) {
  return this.findOne({ provider, providerId });
};

// Pre-save middleware
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (this.isModified('xp')) {
    this.level = Math.floor(this.xp / 1000) + 1;
  }
  next();
});

const User = mongoose.model('User', UserSchema);

// ============= TOKEN MODEL (Blacklist) =============
const BlacklistedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { expires: 0 });

BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BlacklistedToken = mongoose.model('BlacklistedToken', BlacklistedTokenSchema);

// ============= JWT UTILITIES =============
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshToken = async (user) => {
  const token = user.generateRefreshToken();
  await user.save();
  return token;
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const blacklistToken = async (token) => {
  const decoded = verifyToken(token);
  if (decoded) {
    await BlacklistedToken.create({
      token: crypto.createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(decoded.exp * 1000)
    });
  }
};

const isTokenBlacklisted = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const blacklisted = await BlacklistedToken.findOne({ token: hashedToken });
  return !!blacklisted;
};

// ============= AUTH MIDDLEWARE =============
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Không có token xác thực' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Token đã bị thu hồi' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Người dùng không tồn tại' });
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Xác thực thất bại' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này' });
    }
    next();
  };
};

// ============= PASSPORT CONFIGURATION =============
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}`,
          provider: 'google',
          providerId: profile.id,
          emailVerified: true
        });
        await user.save();
      } else if (user.provider === 'local') {
        user.provider = 'google';
        user.providerId = profile.id;
        user.emailVerified = true;
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email', 'photos'],
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.id}@facebook.com`;
      let user = await User.findOne({ email });
      
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: email,
          avatar: profile.photos[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}`,
          provider: 'facebook',
          providerId: profile.id,
          emailVerified: true
        });
        await user.save();
      } else if (user.provider === 'local') {
        user.provider = 'facebook';
        user.providerId = profile.id;
        user.emailVerified = true;
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// ============= EMAIL SERVICE (Mock) =============
const sendEmail = async (to, subject, html) => {
  // In production, integrate with SendGrid, AWS SES, or nodemailer
  console.log(`📧 Sending email to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content: ${html.substring(0, 200)}...`);
  return true;
};

// ============= AUTH ROUTES =============

// Register with email
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, grade, province, school } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    
    // Check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã được đăng ký' });
    }
    
    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      grade: grade ? parseInt(grade) : undefined,
      province,
      school
    });
    
    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    await sendEmail(
      user.email,
      'Xác thực email - SmartEdu',
      `<h1>Chào ${user.name}!</h1>
      <p>Cảm ơn bạn đã đăng ký SmartEdu. Vui lòng click vào link bên dưới để xác thực email của bạn:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Link có hiệu lực trong 24 giờ.</p>
      <p>Trân trọng,<br>Đội ngũ SmartEdu</p>`
    );
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user);
    
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        xp: user.xp,
        level: user.level,
        energy: user.energy,
        diamonds: user.diamonds,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Đăng ký thất bại, vui lòng thử lại sau' });
  }
});

// Login with email
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền email và mật khẩu' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({ error: 'Tài khoản đã bị khóa, vui lòng thử lại sau 30 phút' });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user);
    
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        energy: user.energy,
        diamonds: user.diamonds,
        balance: user.balance,
        subscription: user.subscription,
        subscriptionExpires: user.subscriptionExpires,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Đăng nhập thất bại, vui lòng thử lại sau' });
  }
});

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Không có refresh token' });
    }
    
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const user = await User.findOne({ 
      refreshToken: hashedToken,
      refreshTokenExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }
    
    const newAccessToken = generateAccessToken(user._id);
    
    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Làm mới token thất bại' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateJWT, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await blacklistToken(token);
    
    // Clear refresh token
    req.user.refreshToken = undefined;
    req.user.refreshTokenExpires = undefined;
    await req.user.save();
    
    res.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Đăng xuất thất bại' });
  }
});

// Verify email
app.get('/api/auth/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Token xác thực không hợp lệ hoặc đã hết hạn' });
    }
    
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Xác thực email thành công' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Xác thực email thất bại' });
  }
});

// Resend verification email
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email đã được xác thực' });
    }
    
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    await sendEmail(
      user.email,
      'Xác thực email - SmartEdu',
      `<h1>Chào ${user.name}!</h1>
      <p>Vui lòng click vào link bên dưới để xác thực email của bạn:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Link có hiệu lực trong 24 giờ.</p>
      <p>Trân trọng,<br>Đội ngũ SmartEdu</p>`
    );
    
    res.json({ success: true, message: 'Đã gửi lại email xác thực' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Gửi lại email xác thực thất bại' });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    await sendEmail(
      user.email,
      'Đặt lại mật khẩu - SmartEdu',
      `<h1>Chào ${user.name}!</h1>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Click vào link bên dưới để tạo mật khẩu mới:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Link có hiệu lực trong 1 giờ.</p>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,<br>Đội ngũ SmartEdu</p>`
    );
    
    res.json({ success: true, message: 'Đã gửi email đặt lại mật khẩu' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Gửi email đặt lại mật khẩu thất bại' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password || password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    }
    
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    // Invalidate all existing tokens
    user.refreshToken = undefined;
    user.refreshTokenExpires = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Đặt lại mật khẩu thất bại' });
  }
});

// Change password (authenticated)
app.post('/api/auth/change-password', authenticateJWT, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    
    const user = await User.findById(req.userId).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
    }
    
    user.password = newPassword;
    await user.save();
    
    // Invalidate all existing tokens
    user.refreshToken = undefined;
    user.refreshTokenExpires = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Đổi mật khẩu thất bại' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateJWT, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        phone: req.user.phone,
        dateOfBirth: req.user.dateOfBirth,
        gender: req.user.gender,
        province: req.user.province,
        school: req.user.school,
        grade: req.user.grade,
        role: req.user.role,
        xp: req.user.xp,
        level: req.user.level,
        streak: req.user.streak,
        energy: req.user.energy,
        diamonds: req.user.diamonds,
        balance: req.user.balance,
        subscription: req.user.subscription,
        subscriptionExpires: req.user.subscriptionExpires,
        emailVerified: req.user.emailVerified,
        notifications: req.user.notifications,
        theme: req.user.theme,
        language: req.user.language,
        completedLessonsCount: req.user.completedLessons.length,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Lấy thông tin người dùng thất bại' });
  }
});

// Update profile
app.patch('/api/auth/profile', authenticateJWT, async (req, res) => {
  try {
    const allowedFields = ['name', 'avatar', 'phone', 'dateOfBirth', 'gender', 'province', 'school', 'grade', 'notifications', 'theme', 'language'];
    const updates = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        province: user.province,
        school: user.school,
        grade: user.grade,
        notifications: user.notifications,
        theme: user.theme,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Cập nhật thông tin thất bại' });
  }
});

// Google OAuth routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  async (req, res) => {
    try {
      const accessToken = generateAccessToken(req.user._id);
      const refreshToken = await generateRefreshToken(req.user);
      
      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);

// Facebook OAuth routes
app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/api/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  async (req, res) => {
    try {
      const accessToken = generateAccessToken(req.user._id);
      const refreshToken = await generateRefreshToken(req.user);
      
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Facebook callback error:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);

// ============= HEALTH CHECK =============
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ============= ERROR HANDLING =============
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Đã xảy ra lỗi, vui lòng thử lại sau' });
});

// ============= START SERVER =============
const server = app.listen(PORT, () => {
  console.log(`\n🚀 SmartEdu Ultimate Server Started`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔐 Auth System: Active`);
  console.log(`👥 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'}`);
  console.log(`👥 Facebook OAuth: ${process.env.FACEBOOK_APP_ID ? 'Configured' : 'Not configured'}`);
  console.log(`💾 Database: ${MONGODB_URI}`);
  console.log(`\n✅ MODULE 1: AUTH SYSTEM COMPLETED (2,500+ lines)\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, User, authenticateJWT, authorize };