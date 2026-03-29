// ============= ai_content_crawler.js - AI TỰ TÌM NỘI DUNG =============

const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===== CẤU HÌNH CRAWLER =====
const SOURCES = {
  vietjack: {
    baseUrl: 'https://vietjack.com',
    toan: '/toan-',
    van: '/soan-van-',
    anh: '/tieng-anh-',
    ly: '/vat-ly-',
    hoa: '/hoa-hoc-',
    sinh: '/sinh-hoc-'
  },
  loigiaihay: {
    baseUrl: 'https://loigiaihay.com',
    toan: '/toan-',
    van: '/ngu-van-',
    anh: '/tieng-anh-',
    ly: '/vat-ly-',
    hoa: '/hoa-hoc-',
    sinh: '/sinh-hoc-'
  }
};

// ===== LỚP AI CONTENT CRAWLER =====
class AIContentCrawler {
  constructor() {
    this.contentCache = new Map();
    this.isLoading = false;
    this.loadingProgress = 0;
    this.loadingMessage = '';
  }
  
  // Tìm nội dung bài học từ internet
  async fetchLessonContent(subject, grade, lessonName, chapter) {
    const cacheKey = `${subject}_${grade}_${lessonName}`;
    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }
    
    this.isLoading = true;
    this.loadingProgress = 0;
    this.loadingMessage = `Đang tìm nội dung bài ${lessonName}...`;
    
    try {
      // Tìm kiếm trên nhiều nguồn
      const sources = await this.searchMultipleSources(subject, grade, lessonName);
      
      this.loadingProgress = 30;
      this.loadingMessage = `Đang phân tích nội dung từ ${sources.length} nguồn...`;
      
      // Tổng hợp nội dung từ các nguồn
      const content = await this.combineContent(sources, subject, grade, lessonName);
      
      this.loadingProgress = 70;
      this.loadingMessage = `Đang tạo bài tập...`;
      
      // Tạo bài tập bằng AI
      const exercises = await this.generateExercises(content, subject, grade);
      
      this.loadingProgress = 90;
      this.loadingMessage = `Đang hoàn thiện...`;
      
      const lessonData = {
        title: lessonName,
        theory: content.theory,
        keyPoints: content.keyPoints,
        examples: content.examples,
        exercises: exercises,
        source: sources.map(s => s.url),
        crawledAt: new Date()
      };
      
      this.contentCache.set(cacheKey, lessonData);
      this.isLoading = false;
      this.loadingProgress = 100;
      
      return lessonData;
    } catch (error) {
      console.error('Crawl error:', error);
      this.isLoading = false;
      // Fallback: Dùng AI tạo nội dung
      return await this.generateFallbackContent(subject, grade, lessonName);
    }
  }
  
  // Tìm kiếm trên nhiều nguồn
  async searchMultipleSources(subject, grade, lessonName) {
    const sources = [];
    const searchQueries = [
      `${subject} lớp ${grade} bài ${lessonName} kết nối tri thức`,
      `${subject} ${grade} bài ${lessonName} vietjack`,
      `${subject} ${grade} bài ${lessonName} loigiaihay`
    ];
    
    for (const query of searchQueries) {
      try {
        // Sử dụng Google Search API hoặc crawl trực tiếp
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        const links = [];
        
        $('a').each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && (href.includes('vietjack') || href.includes('loigiaihay'))) {
            links.push(href);
          }
        });
        
        for (const link of links.slice(0, 2)) {
          const content = await this.crawlPage(link);
          if (content) {
            sources.push({ url: link, content });
          }
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }
    
    return sources;
  }
  
  // Crawl nội dung từ trang
  async crawlPage(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Loại bỏ script, style, quảng cáo
      $('script, style, iframe, .ads, .advertisement').remove();
      
      // Lấy nội dung chính
      let content = '';
      const contentSelectors = [
        '.entry-content', '.content', '.post-content', '.article-content',
        '.main-content', '#content', '.lesson-content'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length) {
          content = element.text().trim();
          break;
        }
      }
      
      if (!content) {
        content = $('body').text().trim();
      }
      
      // Làm sạch nội dung
      content = content.replace(/\s+/g, ' ').substring(0, 5000);
      
      return { content, url };
    } catch (err) {
      console.error('Crawl page error:', err);
      return null;
    }
  }
  
  // Tổng hợp nội dung từ nhiều nguồn
  async combineContent(sources, subject, grade, lessonName) {
    const combinedText = sources.map(s => s.content).join('\n\n');
    
    const prompt = `
      Dựa vào nội dung từ các nguồn sau, hãy tổng hợp thành bài học môn ${subject} lớp ${grade} "${lessonName}":
      
      NỘI DUNG THAM KHẢO:
      ${combinedText.substring(0, 8000)}
      
      Hãy tạo cấu trúc:
      1. LÝ THUYẾT: (tóm tắt ngắn gọn, dễ hiểu)
      2. ĐIỂM CHÍNH: (3-5 ý quan trọng)
      3. VÍ DỤ: (2-3 ví dụ minh họa)
      
      Trả về JSON.
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(completion.choices[0].message.content);
  }
  
  // Tạo bài tập bằng AI
  async generateExercises(content, subject, grade) {
    const prompt = `
      Dựa vào nội dung bài học môn ${subject} lớp ${grade} sau, hãy tạo:
      
      NỘI DUNG BÀI HỌC:
      ${JSON.stringify(content)}
      
      Yêu cầu:
      1. 5 câu hỏi trắc nghiệm (4 đáp án, có giải thích)
      2. 3 câu hỏi tự luận (có đáp án mẫu)
      
      Trả về JSON:
      {
        "multipleChoice": [
          {"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}
        ],
        "essay": [
          {"question": "...", "modelAnswer": "...", "scoringGuide": "..."}
        ]
      }
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(completion.choices[0].message.content);
  }
  
  // Fallback: Tạo nội dung bằng AI
  async generateFallbackContent(subject, grade, lessonName) {
    const prompt = `
      Bạn là giáo viên môn ${subject} lớp ${grade} theo sách "Kết nối tri thức với cuộc sống".
      Hãy tạo nội dung bài học "${lessonName}" với cấu trúc:
      
      1. LÝ THUYẾT: (tóm tắt ngắn gọn)
      2. ĐIỂM CHÍNH: (3-5 ý)
      3. VÍ DỤ: (2-3 ví dụ)
      4. BÀI TẬP: (5 câu trắc nghiệm, 3 câu tự luận có đáp án)
      
      Trả về JSON.
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });
    
    const data = JSON.parse(completion.choices[0].message.content);
    
    return {
      theory: data.ly_thuyet || data.theory,
      keyPoints: data.diem_chinh || data.keyPoints,
      examples: data.vi_du || data.examples,
      exercises: {
        multipleChoice: data.bai_tap_trac_nghiem || data.multipleChoice,
        essay: data.bai_tap_tu_luan || data.essay
      }
    };
  }
  
  getLoadingStatus() {
    return {
      isLoading: this.isLoading,
      progress: this.loadingProgress,
      message: this.loadingMessage
    };
  }
}

const contentCrawler = new AIContentCrawler();

// ===== API: TẠO BÀI HỌC MỚI (30 PHÚT LOAD) =====
app.post('/api/lesson/create', authenticateJWT, async (req, res) => {
  try {
    const { subject, grade, lessonName, chapter } = req.body;
    const user = await User.findById(req.userId);
    
    // Kiểm tra năng lượng
    if (user.subscription === 'free' && !await useEnergy(user._id, 3)) {
      return res.status(403).json({ error: 'Không đủ năng lượng. Cần 3⚡ để tạo bài học mới' });
    }
    
    // Tạo task tìm nội dung
    const taskId = `lesson_${Date.now()}_${user._id}`;
    
    // Chạy async để không block
    contentCrawler.fetchLessonContent(subject, grade, lessonName, chapter)
      .then(async (lessonData) => {
        // Lưu vào database
        const lesson = new Lesson({
          id: `${subject}${grade}_${lessonName.toLowerCase().replace(/ /g, '_')}`,
          subject,
          grade,
          title: lessonName,
          theory: lessonData.theory,
          keyPoints: lessonData.keyPoints,
          examples: lessonData.examples,
          exercises: lessonData.exercises,
          source: lessonData.source,
          createdAt: new Date()
        });
        await lesson.save();
        
        // Cập nhật task status
        await Task.updateOne({ taskId }, { status: 'completed', lessonId: lesson._id });
      })
      .catch(async (err) => {
        await Task.updateOne({ taskId }, { status: 'failed', error: err.message });
      });
    
    // Lưu task
    const task = new Task({
      taskId,
      userId: user._id,
      type: 'create_lesson',
      status: 'processing',
      data: { subject, grade, lessonName, chapter },
      createdAt: new Date()
    });
    await task.save();
    
    res.json({
      success: true,
      taskId,
      message: 'Đang tạo bài học. Quá trình này mất khoảng 30 phút. Bạn sẽ nhận được thông báo khi hoàn thành.',
      estimatedTime: 30
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: KIỂM TRA TRẠNG THÁI TẠO BÀI HỌC =====
app.get('/api/lesson/task/:taskId', authenticateJWT, async (req, res) => {
  try {
    const task = await Task.findOne({ taskId: req.params.taskId, userId: req.userId });
    if (!task) return res.status(404).json({ error: 'Không tìm thấy task' });
    
    res.json({
      status: task.status,
      lessonId: task.lessonId,
      error: task.error,
      loadingStatus: contentCrawler.getLoadingStatus()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});