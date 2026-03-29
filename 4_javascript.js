// ============= MODULE 4: AI SUPER TUTOR - SIÊU TRÍ TUỆ NHÂN TẠO =============
// Thêm vào server.js

const axios = require('axios');
const cheerio = require('cheerio');
const { Configuration, OpenAIApi } = require('openai');
const puppeteer = require('puppeteer'); // Cho web scraping nâng cao

// Cấu hình OpenAI với model mạnh nhất
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// ============= WEB SEARCH ENGINE (KHÔNG GIỚI HẠN) =============
class WebSearchEngine {
  constructor() {
    this.searchCache = new Map();
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ];
  }

  async search(query, maxResults = 10) {
    const cacheKey = query.toLowerCase();
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    try {
      // Sử dụng Google Custom Search API hoặc DuckDuckGo
      const results = await this.searchDuckDuckGo(query, maxResults);
      this.searchCache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async searchDuckDuckGo(query, maxResults) {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: { 'User-Agent': this.userAgents[Math.floor(Math.random() * this.userAgents.length)] }
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    $('.result').each((i, elem) => {
      if (i >= maxResults) return;
      const title = $(elem).find('.result__a').text();
      const link = $(elem).find('.result__a').attr('href');
      const snippet = $(elem).find('.result__snippet').text();
      
      if (title && link) {
        results.push({ title, link, snippet });
      }
    });
    
    return results;
  }

  async fetchPageContent(url) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgents[0] },
        timeout: 10000
      });
      const $ = cheerio.load(response.data);
      // Loại bỏ script, style, nav, footer
      $('script, style, nav, footer, header, aside').remove();
      const content = $('body').text().replace(/\s+/g, ' ').trim();
      return content.substring(0, 5000); // Giới hạn 5000 ký tự
    } catch (error) {
      return null;
    }
  }
}

const webSearch = new WebSearchEngine();

// ============= SUPER AI PROMPT ENGINE =============
class SuperAIPromptEngine {
  constructor() {
    this.contextMemory = new Map();
  }

  buildSystemPrompt(role, subject, grade) {
    const rolePrompts = {
      tutor: `Bạn là AI Gia sư Siêu Cấp - được đào tạo chuyên sâu về chương trình giáo dục Việt Nam (Kết nối tri thức với cuộc sống). 
      Bạn có khả năng:
      - Suy luận logic cấp độ chuyên gia
      - Giải thích từng bước chi tiết, dễ hiểu
      - Tạo bài tập mới với độ khó phù hợp
      - Tra cứu kiến thức từ nhiều nguồn uy tín
      - Phân tích chuyên sâu vấn đề học thuật
      
      Học sinh đang học môn ${subject} lớp ${grade}.
      Hãy trả lời bằng tiếng Việt, giọng thân thiện, động viên.`,
      
      researcher: `Bạn là Chuyên gia Nghiên cứu Học thuật với khả năng phân tích chuyên sâu.
      Bạn có thể:
      - Phân tích vấn đề từ nhiều góc độ
      - Đưa ra dẫn chứng khoa học
      - So sánh các lý thuyết khác nhau
      - Đề xuất hướng nghiên cứu mới
      
      Chủ đề nghiên cứu: ${subject} lớp ${grade}.`,
      
      problem_solver: `Bạn là Chuyên gia Giải Bài Tập - có khả năng giải mọi dạng bài tập.
      Phong cách giải:
      - Phân tích đề bài chi tiết
      - Đưa ra 2-3 cách giải khác nhau
      - So sánh ưu nhược điểm từng cách
      - Gợi ý bài tập tương tự
      - Lưu ý các lỗi thường gặp`
    };
    
    return rolePrompts[role] || rolePrompts.tutor;
  }

  async enhanceWithWebSearch(query, subject, grade) {
    const searchResults = await webSearch.search(`${subject} lớp ${grade} ${query}`, 5);
    let context = "";
    
    for (const result of searchResults) {
      const content = await webSearch.fetchPageContent(result.link);
      if (content) {
        context += `\n--- Nguồn: ${result.title} ---\n${content}\n`;
      }
    }
    
    return context;
  }

  async generateResponse(userQuery, userContext, options = {}) {
    const { role = 'tutor', subject = 'toan', grade = '10', useWebSearch = true } = options;
    
    // Xây dựng prompt
    let systemPrompt = this.buildSystemPrompt(role, subject, grade);
    let enhancedContext = "";
    
    // Tra cứu web nếu cần
    if (useWebSearch && this.shouldSearchWeb(userQuery)) {
      enhancedContext = await this.enhanceWithWebSearch(userQuery, subject, grade);
      if (enhancedContext) {
        systemPrompt += `\n\nTHÔNG TIN TRA CỨU TỪ INTERNET (hãy sử dụng nếu phù hợp):\n${enhancedContext}`;
      }
    }
    
    // Thêm lịch sử hội thoại
    const conversationHistory = userContext?.history || [];
    
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: "user", content: userQuery }
    ];
    
    // Gọi AI với cấu hình mạnh nhất
    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-4", // Hoặc gpt-3.5-turbo-16k nếu cần context dài
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
      });
      
      return {
        success: true,
        answer: completion.data.choices[0].message.content,
        tokensUsed: completion.data.usage.total_tokens,
        webSearchUsed: !!enhancedContext
      };
    } catch (error) {
      console.error('AI Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  shouldSearchWeb(query) {
    const searchKeywords = ['tìm', 'tra cứu', 'google', 'wiki', 'công thức', 'định luật', 'lý thuyết', 'khái niệm', 'nguyên lý'];
    return searchKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }
}

const superAI = new SuperAIPromptEngine();

// ============= API: SUPER AI TUTOR =============
app.post('/api/ai/super-tutor', authenticateJWT, async (req, res) => {
  try {
    const { question, subject, grade, role = 'tutor', useWebSearch = true } = req.body;
    const user = await User.findById(req.userId);
    
    // Kiểm tra năng lượng (miễn phí cho Pro/VIP)
    if (user.subscription === 'free') {
      if (!await useEnergy(user._id, 1)) {
        return res.status(403).json({ 
          error: 'Hết năng lượng! Xem quảng cáo hoặc nâng cấp VIP để không giới hạn.',
          energy: user.energy
        });
      }
    }
    
    // Lấy lịch sử chat từ session
    const chatHistory = req.session.chatHistory || [];
    
    const response = await superAI.generateResponse(question, { history: chatHistory }, {
      role,
      subject,
      grade,
      useWebSearch
    });
    
    // Lưu lịch sử
    chatHistory.push(
      { role: "user", content: question },
      { role: "assistant", content: response.answer }
    );
    req.session.chatHistory = chatHistory.slice(-20);
    
    res.json({
      success: true,
      answer: response.answer,
      webSearchUsed: response.webSearchUsed,
      tokensUsed: response.tokensUsed,
      energy: user.subscription === 'free' ? user.energy : undefined
    });
    
  } catch (err) {
    console.error('Super AI error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= API: GIẢI BÀI TẬP CHUYÊN SÂU =============
app.post('/api/ai/solve-advanced', authenticateJWT, async (req, res) => {
  try {
    const { problem, subject, grade, solutionType = 'multiple' } = req.body;
    const user = await User.findById(req.userId);
    
    if (user.subscription === 'free' && !await useEnergy(user._id, 2)) {
      return res.status(403).json({ error: 'Không đủ năng lượng' });
    }
    
    const prompt = `Hãy giải bài tập ${subject} lớp ${grade} sau đây với yêu cầu ${solutionType === 'multiple' ? 'đưa ra nhiều cách giải' : 'giải chi tiết từng bước'}:

ĐỀ BÀI: ${problem}

YÊU CẦU:
1. Phân tích đề bài chi tiết
2. ${solutionType === 'multiple' ? 'Đưa ra ít nhất 2 cách giải khác nhau' : 'Giải từng bước chi tiết'}
3. So sánh ưu nhược điểm từng cách (nếu có)
4. Đáp án cuối cùng
5. Lưu ý các lỗi thường gặp
6. Gợi ý bài tập tương tự để luyện tập

Trình bày rõ ràng, dễ hiểu.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Bạn là chuyên gia giải bài tập với khả năng phân tích chuyên sâu." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 3000
    });
    
    res.json({
      success: true,
      solution: completion.data.choices[0].message.content
    });
    
  } catch (err) {
    console.error('Advanced solve error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= API: NGHIÊN CỨU CHUYÊN SÂU =============
app.post('/api/ai/research', authenticateJWT, async (req, res) => {
  try {
    const { topic, depth = 'standard', subject, grade } = req.body;
    const user = await User.findById(req.userId);
    
    if (user.subscription === 'free' && !await useEnergy(user._id, 3)) {
      return res.status(403).json({ error: 'Không đủ năng lượng' });
    }
    
    // Tìm kiếm thông tin từ web
    const searchResults = await webSearch.search(`${subject} ${topic} nghiên cứu học thuật`, 10);
    let webContent = "";
    
    for (const result of searchResults.slice(0, 3)) {
      const content = await webSearch.fetchPageContent(result.link);
      if (content) {
        webContent += `\n--- ${result.title} ---\n${content}\n`;
      }
    }
    
    const depthMap = {
      'basic': 'cơ bản, phù hợp với học sinh',
      'standard': 'tiêu chuẩn, có phân tích chuyên sâu',
      'advanced': 'nâng cao, dành cho nghiên cứu học thuật'
    };
    
    const prompt = `Thực hiện nghiên cứu chuyên sâu về chủ đề: "${topic}" (môn ${subject} lớp ${grade}).

Mức độ: ${depthMap[depth]}

THÔNG TIN THAM KHẢO TỪ INTERNET:
${webContent || 'Không có thông tin tham khảo từ internet'}

YÊU CẦU BÁO CÁO:
1. **TỔNG QUAN**: Giới thiệu chủ đề
2. **PHÂN TÍCH CHUYÊN SÂU**: 
   - Khái niệm cốt lõi
   - Các lý thuyết liên quan
   - Ứng dụng thực tế
3. **SO SÁNH & ĐỐI CHIẾU**: So sánh với các chủ đề tương tự
4. **KẾT LUẬN**: Tóm tắt và hướng phát triển
5. **TÀI LIỆU THAM KHẢO**: Nguồn tham khảo

Trình bày khoa học, có cấu trúc rõ ràng.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Bạn là chuyên gia nghiên cứu học thuật với khả năng phân tích chuyên sâu." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    res.json({
      success: true,
      research: completion.data.choices[0].message.content,
      sources: searchResults.slice(0, 5).map(r => ({ title: r.title, link: r.link }))
    });
    
  } catch (err) {
    console.error('Research error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= API: TẠO ĐỀ THI THÔNG MINH =============
app.post('/api/ai/create-exam', authenticateJWT, async (req, res) => {
  try {
    const { subject, grade, examType, difficulty, topics = [] } = req.body;
    const user = await User.findById(req.userId);
    
    if (user.subscription === 'free' && !await useEnergy(user._id, 4)) {
      return res.status(403).json({ error: 'Không đủ năng lượng' });
    }
    
    // Tìm đề thi mẫu từ internet
    const searchResults = await webSearch.search(`đề thi ${examType} môn ${subject} lớp ${grade} có đáp án`, 5);
    let examSamples = "";
    
    for (const result of searchResults) {
      const content = await webSearch.fetchPageContent(result.link);
      if (content) {
        examSamples += `\n--- Mẫu đề từ: ${result.title} ---\n${content.substring(0, 2000)}\n`;
      }
    }
    
    const difficultyMap = {
      'easy': 'dễ (40% câu dễ, 40% trung bình, 20% khó)',
      'medium': 'trung bình (30% dễ, 50% trung bình, 20% khó)',
      'hard': 'khó (20% dễ, 40% trung bình, 40% khó)',
      'hsg': 'học sinh giỏi (10% dễ, 30% trung bình, 60% khó)'
    };
    
    const prompt = `Tạo đề thi ${examType} môn ${subject} lớp ${grade} với độ khó ${difficultyMap[difficulty] || 'trung bình'}.

Các chủ đề cần tập trung: ${topics.length ? topics.join(', ') : 'toàn bộ chương trình học kỳ'}

THAM KHẢO CÁC ĐỀ THI MẪU:
${examSamples || 'Không có mẫu tham khảo'}

YÊU CẦU ĐỀ THI:
1. **CẤU TRÚC**:
   - Phần I: Trắc nghiệm (4 điểm - 8 câu)
   - Phần II: Tự luận (6 điểm - 3-4 câu)

2. **NỘI DUNG**:
   - Mỗi câu hỏi có đáp án và lời giải chi tiết
   - Phân bố điểm hợp lý
   - Có câu hỏi vận dụng cao

3. **ĐÁP ÁN & BIỂU ĐIỂM**:
   - Đáp án chi tiết từng câu
   - Thang điểm cụ thể

Trả về định dạng JSON.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Bạn là chuyên gia ra đề thi với kinh nghiệm 20 năm." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 5000,
      response_format: { type: "json_object" }
    });
    
    const exam = JSON.parse(completion.data.choices[0].message.content);
    
    // Lưu đề thi vào database
    const examId = `${subject}${grade}_${examType}_${Date.now()}`;
    await Exam.create({
      id: examId,
      subject,
      grade,
      type: examType,
      name: `Đề thi ${examType} môn ${subject} lớp ${grade}`,
      ...exam
    });
    
    res.json({
      success: true,
      examId,
      exam,
      message: 'Đề thi đã được tạo thành công!'
    });
    
  } catch (err) {
    console.error('Create exam error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= API: PHÂN TÍCH LỖI SAI CHUYÊN SÂU =============
app.post('/api/ai/analyze-mistake', authenticateJWT, async (req, res) => {
  try {
    const { question, userAnswer, correctAnswer, subject, grade } = req.body;
    
    const prompt = `Phân tích lỗi sai của học sinh lớp ${grade} môn ${subject}:

Câu hỏi: ${question}
Đáp án của học sinh: ${userAnswer}
Đáp án đúng: ${correctAnswer}

YÊU CẦU PHÂN TÍCH:
1. **LỖI SAI**: Chỉ ra lỗi cụ thể
2. **NGUYÊN NHÂN**: Tại sao học sinh lại sai?
3. **CÁCH KHẮC PHỤC**: Hướng dẫn chi tiết để sửa lỗi
4. **BÀI TẬP TƯƠNG TỰ**: Gợi ý 2-3 bài tập để luyện tập
5. **MẸO GHI NHỚ**: Cách để tránh lỗi này trong tương lai

Phân tích mang tính xây dựng, động viên học sinh.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Bạn là chuyên gia phân tích lỗi học tập." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });
    
    res.json({
      success: true,
      analysis: completion.data.choices[0].message.content
    });
    
  } catch (err) {
    console.error('Analyze mistake error:', err);
    res.status(500).json({ error: err.message });
  }
});