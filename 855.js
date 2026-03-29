// ============= ai_lesson_assessment.js - AI ĐÁNH GIÁ BÀI HỌC =============

// ===== MÔ HÌNH LƯU KẾT QUẢ ĐÁNH GIÁ =====
const LessonAssessmentSchema = new mongoose.Schema({
  lessonId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  understandingLevel: { type: Number, min: 1, max: 5 }, // 5 mức độ
  mcqAnswers: [{
    question: String,
    options: [String],
    userAnswer: Number,
    correctAnswer: Number,
    isCorrect: Boolean,
    explanation: String
  }],
  essayAnswers: [{
    question: String,
    userAnswer: String,
    modelAnswer: String,
    aiScore: Number,
    aiFeedback: String
  }],
  overallScore: { type: Number, min: 0, max: 100 },
  aiFeedback: { type: String },
  recommendations: [{ type: String }],
  completedAt: { type: Date, default: Date.now }
});

const LessonAssessment = mongoose.model('LessonAssessment', LessonAssessmentSchema);

// ===== API: AI ĐÁNH GIÁ BÀI HỌC SAU KHI HỌC XONG =====
app.post('/api/ai/assess-lesson', authenticateJWT, async (req, res) => {
  try {
    const { lessonId, subject, grade, lessonContent } = req.body;
    const user = await User.findById(req.userId);
    
    if (user.subscription === 'free' && !await useEnergy(user._id, 3)) {
      return res.status(403).json({ error: 'Không đủ năng lượng' });
    }
    
    // Tạo 10 câu trắc nghiệm và 5 câu tự luận bằng AI
    const prompt = `
      Bạn là giáo viên đánh giá năng lực học sinh. Dựa vào nội dung bài học sau, hãy tạo:
      
      NỘI DUNG BÀI HỌC:
      ${lessonContent.substring(0, 3000)}
      
      YÊU CẦU:
      1. Tạo 10 câu hỏi trắc nghiệm (4 đáp án) với các mức độ:
         - 2 câu mức độ Nhận biết
         - 3 câu mức độ Thông hiểu
         - 3 câu mức độ Vận dụng
         - 2 câu mức độ Vận dụng cao
      
      2. Tạo 5 câu hỏi tự luận:
         - 1 câu Nhận biết
         - 1 câu Thông hiểu
         - 1 câu Vận dụng
         - 1 câu Vận dụng cao
         - 1 câu Mở rộng/Sáng tạo
      
      3. Mỗi câu hỏi đều có đáp án và giải thích chi tiết
      
      Trả về JSON với cấu trúc:
      {
        "mcq": [
          { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "...", "difficulty": "recognition" },
          ...
        ],
        "essay": [
          { "question": "...", "modelAnswer": "...", "scoringGuide": "...", "difficulty": "recognition" },
          ...
        ]
      }
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });
    
    const assessment = JSON.parse(completion.choices[0].message.content);
    
    res.json({
      success: true,
      assessment,
      message: 'Đã tạo bài đánh giá. Hãy hoàn thành để biết mức độ hiểu bài của bạn!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: NỘP BÀI ĐÁNH GIÁ VÀ CHẤM ĐIỂM =====
app.post('/api/ai/submit-assessment', authenticateJWT, async (req, res) => {
  try {
    const { lessonId, mcqAnswers, essayAnswers, lessonContent } = req.body;
    const user = await User.findById(req.userId);
    
    // 1. Chấm trắc nghiệm
    let mcqScore = 0;
    const mcqResults = [];
    
    for (const answer of mcqAnswers) {
      const isCorrect = answer.userAnswer === answer.correctAnswer;
      if (isCorrect) mcqScore += 1;
      mcqResults.push({
        ...answer,
        isCorrect,
        points: isCorrect ? 1 : 0
      });
    }
    const mcqPercentage = (mcqScore / mcqAnswers.length) * 100;
    
    // 2. Chấm tự luận bằng AI
    const essayPrompt = `
      Bạn là giáo viên chấm bài tự luận. Hãy chấm các bài làm sau:
      
      ${essayAnswers.map((e, idx) => `
        Câu ${idx + 1}: ${e.question}
        Đáp án của học sinh: ${e.userAnswer}
        Đáp án mẫu: ${e.modelAnswer}
      `).join('\n')}
      
      Yêu cầu:
      - Mỗi câu 2 điểm
      - Đánh giá theo thang điểm 0-2
      - Nhận xét chi tiết từng câu
      - Đề xuất cải thiện
      
      Trả về JSON:
      {
        "scores": [score1, score2, ...],
        "feedbacks": ["feedback1", "feedback2", ...],
        "overallComment": "nhận xét tổng quan",
        "recommendations": ["gợi ý 1", "gợi ý 2"]
      }
    `;
    
    const essayCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: essayPrompt }],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    const essayResult = JSON.parse(essayCompletion.choices[0].message.content);
    const essayTotal = essayResult.scores.reduce((a, b) => a + b, 0);
    const essayMax = essayAnswers.length * 2;
    const essayPercentage = (essayTotal / essayMax) * 100;
    
    // 3. Tính tổng điểm và xác định mức độ hiểu bài
    const overallScore = (mcqPercentage * 0.6 + essayPercentage * 0.4);
    
    let understandingLevel = 1;
    let levelText = '';
    if (overallScore >= 90) {
      understandingLevel = 5;
      levelText = 'Xuất sắc - Hiểu bài sâu sắc, có thể dạy lại người khác';
    } else if (overallScore >= 75) {
      understandingLevel = 4;
      levelText = 'Tốt - Nắm vững kiến thức, có thể vận dụng linh hoạt';
    } else if (overallScore >= 60) {
      understandingLevel = 3;
      levelText = 'Khá - Hiểu bài cơ bản, cần luyện tập thêm';
    } else if (overallScore >= 40) {
      understandingLevel = 2;
      levelText = 'Trung bình - Cần ôn tập lại lý thuyết';
    } else {
      understandingLevel = 1;
      levelText = 'Yếu - Cần học lại từ đầu';
    }
    
    // 4. Tạo gợi ý học tập dựa trên kết quả
    const recommendationPrompt = `
      Học sinh đạt ${overallScore.toFixed(1)}% bài đánh giá, mức độ: ${levelText}
      Điểm mạnh: ${mcqScore}/${mcqAnswers.length} câu trắc nghiệm đúng
      Điểm yếu: ${essayTotal}/${essayMax} điểm tự luận
      
      Hãy đề xuất 3-5 gợi ý học tập cụ thể để cải thiện.
    `;
    
    const recCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: recommendationPrompt }],
      max_tokens: 500
    });
    
    const recommendations = recCompletion.choices[0].message.content.split('\n').filter(r => r.trim());
    
    // 5. Lưu kết quả đánh giá
    const assessment = new LessonAssessment({
      lessonId,
      userId: user._id,
      understandingLevel,
      mcqAnswers: mcqResults,
      essayAnswers: essayAnswers.map((e, idx) => ({
        ...e,
        aiScore: essayResult.scores[idx],
        aiFeedback: essayResult.feedbacks[idx]
      })),
      overallScore,
      aiFeedback: essayResult.overallComment,
      recommendations,
      completedAt: new Date()
    });
    await assessment.save();
    
    // 6. Cập nhật XP và kim cương
    const xpGained = Math.floor(overallScore * 2);
    const diamondsGained = understandingLevel >= 4 ? 2 : understandingLevel >= 2 ? 1 : 0;
    
    user.xp += xpGained;
    user.diamonds += diamondsGained;
    user.level = Math.floor(user.xp / 1000) + 1;
    await user.save();
    
    res.json({
      success: true,
      result: {
        understandingLevel,
        levelText,
        overallScore: overallScore.toFixed(1),
        mcqScore: `${mcqScore}/${mcqAnswers.length}`,
        essayScore: `${essayTotal}/${essayMax}`,
        mcqPercentage: mcqPercentage.toFixed(1),
        essayPercentage: essayPercentage.toFixed(1),
        feedback: essayResult.overallComment,
        recommendations,
        xpGained,
        diamondsGained,
        newXP: user.xp,
        newLevel: user.level
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: XEM LỊCH SỬ ĐÁNH GIÁ BÀI HỌC =====
app.get('/api/ai/assessment-history', authenticateJWT, async (req, res) => {
  try {
    const { lessonId, limit = 10 } = req.query;
    const query = { userId: req.userId };
    if (lessonId) query.lessonId = lessonId;
    
    const assessments = await LessonAssessment.find(query)
      .sort({ completedAt: -1 })
      .limit(parseInt(limit));
    
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});