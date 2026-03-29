// ============= firewall_10_layers.js - BẢO MỆT 10 LỚP =============

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');
const crypto = require('crypto');

// ===== LỚP 1: HELMET - Bảo vệ HTTP headers =====
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ===== LỚP 2: CORS - Chỉ cho phép domain cụ thể =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://smartedu.com',
  'https://api.smartedu.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// ===== LỚP 3: RATE LIMITING - Giới hạn số request =====
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // tối đa 100 request
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', globalLimiter);

// Rate limiting đặc biệt cho các endpoint nhạy cảm
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút.'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const withdrawalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3,
  message: 'Quá nhiều yêu cầu rút tiền, vui lòng thử lại sau 1 giờ.'
});
app.use('/api/withdraw', withdrawalLimiter);

// ===== LỚP 4: XSS PROTECTION =====
app.use(xss());

// ===== LỚP 5: MONGO SANITIZE - Chống NoSQL injection =====
app.use(mongoSanitize());

// ===== LỚP 6: HPP - Chống HTTP Parameter Pollution =====
app.use(hpp());

// ===== LỚP 7: COMPRESSION - Nén dữ liệu =====
app.use(compression());

// ===== LỚP 8: IP WHITELISTING (Admin only) =====
const adminIPWhitelist = [
  '127.0.0.1',
  '::1',
  '192.168.1.100' // Thay bằng IP thực tế của admin
];

const ipWhitelistMiddleware = (req, res, next) => {
  if (req.path.startsWith('/api/admin')) {
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!adminIPWhitelist.includes(clientIp)) {
      return res.status(403).json({ error: 'Truy cập bị từ chối. IP không được phép.' });
    }
  }
  next();
};
app.use(ipWhitelistMiddleware);

// ===== LỚP 9: REQUEST VALIDATION & SANITIZATION =====
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Áp dụng validation cho các route
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).trim(),
  body('name').trim().escape()
], validateRequest);

// ===== LỚP 10: TOKEN BLACKLISTING & SESSION MANAGEMENT =====
const tokenBlacklist = new Set();

const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  setTimeout(() => tokenBlacklist.delete(token), 24 * 60 * 60 * 1000); // Tự động xóa sau 24h
};

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// Middleware kiểm tra token bị blacklist
const checkBlacklist = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token && isTokenBlacklisted(token)) {
    return res.status(401).json({ error: 'Token đã bị thu hồi, vui lòng đăng nhập lại' });
  }
  next();
};
app.use(checkBlacklist);

// ===== BẢO MẬT BỔ SUNG: ENCRYPTION CHO DỮ LIỆU NHẠY CẢM =====
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// Mã hóa thông tin ngân hàng trước khi lưu
UserSchema.pre('save', function(next) {
  if (this.bankInfo && this.bankInfo.accountNumber) {
    this.bankInfo.accountNumber = encrypt(this.bankInfo.accountNumber);
  }
  if (this.bankInfo && this.bankInfo.accountName) {
    this.bankInfo.accountName = encrypt(this.bankInfo.accountName);
  }
  next();
});

// Giải mã khi lấy ra
UserSchema.methods.getDecryptedBankInfo = function() {
  if (!this.bankInfo) return null;
  return {
    bankName: this.bankInfo.bankName,
    accountNumber: decrypt(this.bankInfo.accountNumber),
    accountName: decrypt(this.bankInfo.accountName)
  };
};