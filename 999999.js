// ============= ai_moderation.js - AI KIỂM DUYỆT NỘI DUNG =============

const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Danh sách từ khóa độc hại cần kiểm tra
const HARMFUL_KEYWORDS = {
  spam: ['mua bán', 'quảng cáo', 'link', 'click vào', 'đăng ký', 'khuyến mãi', 'giảm giá'],
  abuse: ['đồ ngu', 'ngu', 'chết', 'điên', 'khùng', 'dâm', 'đồi trụy'],
  violence: ['giết', 'đánh', 'chém', 'bắn', 'khủng bố', 'bạo lực'],
  illegal: ['ma túy', 'cờ bạc', 'lừa đảo', 'hack', 'crack', 'lậu']
};

// AI Moderation Class
class AIModeration {
  constructor() {
    this.moderationQueue = [];
    this.isProcessing = false;
  }

  // Kiểm tra nội dung bằng AI
  async checkContent(content, type = 'text') {
    try {
      const prompt = `
        Bạn là AI kiểm duyệt nội dung cho nền tảng giáo dục SmartEdu.
        Hãy phân tích nội dung sau và xác định xem có vi phạm quy định không:
        
        NỘI DUNG: "${content}"
        
        Trả về JSON với các trường:
        - isHarmful: true/false
        - category: "spam" | "abuse" | "violence" | "illegal" | "none"
        - confidence: 0-100
        - reason: "lý do vi phạm"
        - suggestedAction: "block" | "warn" | "approve"
      `;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      
      // Kiểm tra thêm từ khóa
      const keywordCheck = this.checkKeywords(content);
      if (keywordCheck.isHarmful && !result.isHarmful) {
        result.isHarmful = true;
        result.category = keywordCheck.category;
        result.confidence = Math.max(result.confidence, 70);
        result.reason = keywordCheck.reason;
      }
      
      return result;
    } catch (error) {
      console.error('AI Moderation error:', error);
      // Fallback to keyword check
      return this.checkKeywords(content);
    }
  }
  
  // Kiểm tra từ khóa
  checkKeywords(content) {
    const lowerContent = content.toLowerCase();
    
    for (const [category, keywords] of Object.entries(HARMFUL_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword)) {
          return {
            isHarmful: true,
            category: category,
            confidence: 85,
            reason: `Chứa từ khóa nhạy cảm: "${keyword}"`,
            suggestedAction: category === 'spam' ? 'warn' : 'block'
          };
        }
      }
    }
    
    return {
      isHarmful: false,
      category: 'none',
      confidence: 100,
      reason: 'Nội dung an toàn',
      suggestedAction: 'approve'
    };
  }
  
  // Tự động xử lý nội dung vi phạm
  async autoModerate(content, contentType, contentId, userId) {
    const result = await this.checkContent(content);
    
    if (result.isHarmful && result.confidence > 80) {
      // Tự động chặn nội dung
      if (contentType === 'post') {
        await Post.findByIdAndUpdate(contentId, { isHidden: true, isApproved: false, rejectionReason: result.reason });
      } else if (contentType === 'comment') {
        await Comment.findByIdAndUpdate(contentId, { isHidden: true });
      } else if (contentType === 'material') {
        await Material.findByIdAndUpdate(contentId, { isPublished: false, rejectionReason: result.reason });
      } else if (contentType === 'stream_chat') {
        // Chặn tin nhắn chat trong livestream
        io.to(`stream_${contentId}`).emit('message-blocked', { messageId: contentId, reason: result.reason });
      }
      
      // Ghi log vi phạm
      await ViolationLog.create({
        user: userId,
        contentType,
        contentId,
        content,
        reason: result.reason,
        category: result.category,
        action: result.suggestedAction,
        moderatedBy: 'AI',
        createdAt: new Date()
      });
      
      // Cảnh báo user
      await createNotification({
        userId: userId,
        type: 'content_warning',
        title: 'Cảnh báo nội dung vi phạm',
        content: `Nội dung của bạn đã bị AI phát hiện vi phạm: ${result.reason}`,
        data: { contentType, contentId }
      });
      
      // Nếu vi phạm nhiều lần, tự động khóa tài khoản
      const violationCount = await ViolationLog.countDocuments({ user: userId, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
      if (violationCount >= 5) {
        await User.findByIdAndUpdate(userId, { isBanned: true });
        await createNotification({
          userId: userId,
          type: 'account_banned',
          title: 'Tài khoản bị khóa',
          content: 'Tài khoản của bạn đã bị khóa do vi phạm quy định nhiều lần.',
          data: {}
        });
      }
      
      return { isHarmful: true, action: result.suggestedAction, reason: result.reason };
    }
    
    return { isHarmful: false, action: 'approve' };
  }
}

const aiModeration = new AIModeration();

// ===== MIDDLEWARE: KIỂM DUYỆT NỘI DUNG TRƯỚC KHI ĐĂNG =====
const moderateContent = async (req, res, next) => {
  try {
    const content = req.body.content || req.body.message || req.body.description;
    if (!content) return next();
    
    const result = await aiModeration.checkContent(content);
    
    if (result.isHarmful && result.confidence > 85) {
      return res.status(403).json({
        error: 'Nội dung vi phạm quy định',
        reason: result.reason,
        category: result.category
      });
    }
    
    // Gắn kết quả kiểm duyệt vào request
    req.moderationResult = result;
    next();
  } catch (err) {
    console.error('Moderation middleware error:', err);
    next();
  }
};

// Áp dụng middleware cho các route
app.post('/api/social/posts', authenticateJWT, moderateContent, async (req, res) => {
  // ... existing code
});

app.post('/api/live/streams/:streamId/chat', authenticateJWT, moderateContent, async (req, res) => {
  // ... existing code
});

app.post('/api/marketplace/materials', authenticateJWT, moderateContent, async (req, res) => {
  // ... existing code
});