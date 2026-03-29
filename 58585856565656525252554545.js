// ============= learning_path_system.js - HỆ THỐNG LỘ TRÌNH HỌC TẬP =============

// ===== MODEL NGƯỜI DÙNG (CẬP NHẬT) =====
const UserSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Lộ trình học
  learningPath: {
    currentGrade: { type: Number, default: 6, min: 6, max: 12 },
    currentSemester: { type: Number, enum: [1, 2], default: 1 },
    completedExams: [{
      examId: String,
      score: Number,
      passed: Boolean,
      completedAt: Date
    }],
    weakSubjects: [{ type: String, enum: ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia'] }],
    strongSubjects: [{ type: String }],
    gradeCompleted: { type: Boolean, default: false },
    grade9Exam: {
      passed: { type: Boolean, default: false },
      scores: {
        toan: Number,
        van: Number,
        anh: Number,
        chuyen: Number
      },
      total: Number,
      completedAt: Date
    },
    grade12Exam: {
      passed: { type: Boolean, default: false },
      selectedSubjects: [{ type: String }],
      scores: {},
      total: Number,
      completedAt: Date
    },
    reviewDays: { type: Number, default: 0 },
    reviewStartedAt: { type: Date }
  },
  
  // Thống kê học tập
  learningStats: {
    totalXP: { type: Number, default: 0 },
    totalDiamonds: { type: Number, default: 0 },
    completedLessons: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    passedExams: { type: Number, default: 0 }
  }
});

// ===== AI ĐÁNH GIÁ TRÌNH ĐỘ BAN ĐẦU =====
app.post('/api/ai/assess-student', authenticateJWT, async (req, res) => {
  try {
    const { answers } = req.body; // answers là mảng câu trả lời từ form hỏi khó khăn
    const user = await User.findById(req.userId);
    
    // Phân tích câu trả lời để xác định môn yếu
    const weakSubjects = [];
    const strongSubjects = [];
    
    // Prompt để AI phân tích
    const prompt = `
      Dựa vào câu trả lời của học sinh về khó khăn trong học tập, hãy xác định:
      
      CÂU TRẢ LỜI: ${answers.join('\n')}
      
      Hãy phân tích:
      1. Môn học nào học sinh yếu nhất (liệt kê 3 môn)
      2. Môn học nào học sinh mạnh nhất (liệt kê 3 môn)
      3. Đề xuất lộ trình học tập phù hợp
      
      Trả về JSON:
      {
        "weakSubjects": ["toan", "van", "anh"],
        "strongSubjects": ["ly", "hoa", "sinh"],
        "recommendation": "Học sinh cần tập trung vào Toán và Văn..."
      }
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    const analysis = JSON.parse(completion.choices[0].message.content);
    
    user.learningPath.weakSubjects = analysis.weakSubjects;
    user.learningPath.strongSubjects = analysis.strongSubjects;
    await user.save();
    
    res.json({
      success: true,
      weakSubjects: analysis.weakSubjects,
      strongSubjects: analysis.strongSubjects,
      recommendation: analysis.recommendation,
      currentGrade: user.learningPath.currentGrade,
      currentSemester: user.learningPath.currentSemester
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: TẠO NỘI DUNG ÔN TẬP CHO KỲ THI (ẢI) =====
app.post('/api/ai/generate-exam-content', authenticateJWT, async (req, res) => {
  try {
    const { subject, grade, semester, examType } = req.body; // examType: 'midterm1', 'final1', 'midterm2', 'final2'
    const user = await User.findById(req.userId);
    
    // Kiểm tra năng lượng
    if (user.subscription === 'free' && !await useEnergy(user._id, 5)) {
      return res.status(403).json({ error: 'Không đủ năng lượng để tạo đề thi' });
    }
    
    // Prompt để AI tạo nội dung ôn tập
    const prompt = `
      Bạn là giáo viên môn ${subject} lớp ${grade}. Hãy tạo nội dung ôn tập cho kỳ thi ${examType === 'midterm1' ? 'Giữa kỳ I' : examType === 'final1' ? 'Cuối kỳ I' : examType === 'midterm2' ? 'Giữa kỳ II' : 'Cuối kỳ II'}.
      
      Yêu cầu:
      1. Tóm tắt lý thuyết trọng tâm (5-7 ý)
      2. 10 câu hỏi trắc nghiệm (có đáp án)
      3. 5 câu hỏi tự luận (có đáp án mẫu)
      4. Đề thi mẫu (3 đề, mỗi đề 10 câu)
      
      Học sinh yếu ở môn này, nên ưu tiên nội dung cơ bản, dễ hiểu.
      
      Trả về JSON:
      {
        "theory": ["Lý thuyết 1", "Lý thuyết 2", ...],
        "mcq": [{"question": "...", "options": [...], "correct": 0, "explanation": "..."}],
        "essay": [{"question": "...", "modelAnswer": "...", "scoringGuide": "..."}],
        "sampleExams": [{"questions": [...], "answers": [...]}]
      }
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 5000,
      response_format: { type: "json_object" }
    });
    
    const examContent = JSON.parse(completion.choices[0].message.content);
    
    // Lưu nội dung ôn tập tạm thời
    const examSession = new ExamSession({
      user: user._id,
      subject,
      grade,
      semester,
      examType,
      content: examContent,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ngày
    });
    await examSession.save();
    
    res.json({
      success: true,
      examId: examSession._id,
      content: examContent,
      message: 'Nội dung ôn tập đã sẵn sàng. Bạn có 7 ngày để hoàn thành.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: NỘP BÀI THI (VƯỢT ẢI) =====
app.post('/api/exams/submit', authenticateJWT, async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const user = await User.findById(req.userId);
    const examSession = await ExamSession.findById(examId);
    
    if (!examSession) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    if (examSession.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Đề thi đã hết hạn, vui lòng tạo mới' });
    }
    
    // Chấm điểm
    let totalScore = 0;
    const results = [];
    
    // Chấm trắc nghiệm
    for (let i = 0; i < examSession.content.mcq.length; i++) {
      const q = examSession.content.mcq[i];
      const userAnswer = answers.mcq[i];
      const isCorrect = userAnswer === q.correct;
      if (isCorrect) totalScore += 1;
      results.push({
        type: 'mcq',
        index: i,
        isCorrect,
        correctAnswer: q.correct,
        explanation: q.explanation
      });
    }
    
    // Chấm tự luận bằng AI
    const essayPrompt = `
      Chấm bài tự luận của học sinh:
      
      ${examSession.content.essay.map((e, idx) => `
        Câu ${idx + 1}: ${e.question}
        Đáp án mẫu: ${e.modelAnswer}
        Bài làm: ${answers.essay[idx]}
      `).join('\n')}
      
      Hãy chấm điểm từng câu theo thang 2 điểm.
      Trả về JSON với scores array.
    `;
    
    const essayCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: essayPrompt }],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    const essayResult = JSON.parse(essayCompletion.choices[0].message.content);
    const essayTotal = essayResult.scores.reduce((a, b) => a + b, 0);
    totalScore += essayTotal;
    
    const maxScore = examSession.content.mcq.length + examSession.content.essay.length * 2;
    const percentage = (totalScore / maxScore) * 10; // Thang 10 điểm
    
    const passed = percentage >= 8.0;
    
    // Lưu kết quả
    user.learningPath.completedExams.push({
      examId,
      subject: examSession.subject,
      semester: examSession.semester,
      score: percentage,
      passed,
      completedAt: new Date()
    });
    
    if (passed) {
      user.learningStats.totalDiamonds += 100; // Thưởng 100 kim cương
      user.learningStats.passedExams += 1;
    } else {
      // Trừ năng lượng
      user.energy = Math.max(0, user.energy - 3);
    }
    
    await user.save();
    
    // Kiểm tra hoàn thành 2 kỳ
    const semester1Exams = user.learningPath.completedExams.filter(e => e.semester === 1 && e.passed);
    const semester2Exams = user.learningPath.completedExams.filter(e => e.semester === 2 && e.passed);
    
    const completedGrade = semester1Exams.length >= 2 && semester2Exams.length >= 2;
    
    res.json({
      success: true,
      passed,
      score: percentage,
      totalScore,
      maxScore,
      reward: passed ? 100 : 0,
      energy: user.energy,
      completedGrade,
      results,
      essayFeedback: essayResult.feedbacks || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: HOÀN THÀNH LỚP (CHUYỂN LỚP) =====
app.post('/api/learning/complete-grade', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { currentGrade, currentSemester } = user.learningPath;
    
    // Kiểm tra đã hoàn thành cả 2 kỳ
    const semester1Exams = user.learningPath.completedExams.filter(e => e.semester === 1 && e.passed);
    const semester2Exams = user.learningPath.completedExams.filter(e => e.semester === 2 && e.passed);
    
    if (semester1Exams.length < 2 || semester2Exams.length < 2) {
      return res.status(400).json({ error: 'Chưa hoàn thành đủ các kỳ thi' });
    }
    
    // Tính điểm trung bình
    const allExams = [...semester1Exams, ...semester2Exams];
    const avgScore = allExams.reduce((sum, e) => sum + e.score, 0) / allExams.length;
    
    // Xác định danh hiệu
    let title = '';
    if (avgScore >= 9.0) title = 'Học sinh xuất sắc 🏆';
    else if (avgScore >= 8.0) title = 'Học sinh giỏi 🎖️';
    else if (avgScore >= 6.5) title = 'Học sinh khá 📚';
    else title = 'Cần cố gắng 💪';
    
    // Bắt đầu ôn tập 5 ngày
    user.learningPath.reviewDays = 5;
    user.learningPath.reviewStartedAt = new Date();
    user.learningPath.gradeCompleted = true;
    await user.save();
    
    res.json({
      success: true,
      avgScore,
      title,
      reviewDays: 5,
      message: `Chúc mừng! Bạn đã hoàn thành lớp ${currentGrade} với điểm trung bình ${avgScore.toFixed(1)}. ${title}. Bắt đầu ôn tập 5 ngày để lên lớp tiếp theo.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: KIỂM TRA ÔN TẬP VÀ CHUYỂN LỚP =====
app.post('/api/learning/check-review', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { reviewDays, reviewStartedAt, currentGrade } = user.learningPath;
    
    if (!reviewStartedAt) {
      return res.status(400).json({ error: 'Chưa bắt đầu ôn tập' });
    }
    
    const daysPassed = Math.floor((new Date() - reviewStartedAt) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, reviewDays - daysPassed);
    
    if (remainingDays === 0 && currentGrade < 9) {
      // Chuyển lên lớp tiếp theo
      user.learningPath.currentGrade = currentGrade + 1;
      user.learningPath.currentSemester = 1;
      user.learningPath.completedExams = [];
      user.learningPath.gradeCompleted = false;
      user.learningPath.reviewDays = 0;
      user.learningPath.reviewStartedAt = null;
      await user.save();
      
      res.json({
        success: true,
        action: 'promote',
        newGrade: currentGrade + 1,
        message: `Chúc mừng! Bạn đã lên lớp ${currentGrade + 1}. Hãy tiếp tục học tập!`
      });
    } else if (remainingDays === 0 && currentGrade === 9) {
      // Chuyển sang thi cấp 3
      res.json({
        success: true,
        action: 'grade9_exam',
        message: 'Bạn đã hoàn thành lớp 9. Đã đến lúc làm bài thi cấp 3!'
      });
    } else {
      res.json({
        success: true,
        action: 'reviewing',
        remainingDays,
        message: `Đang ôn tập. Còn ${remainingDays} ngày để lên lớp tiếp theo.`
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: THI CẤP 3 (VÀO LỚP 10) =====
app.post('/api/exams/grade9-exam', authenticateJWT, async (req, res) => {
  try {
    const { answers } = req.body; // answers.toan, answers.van, answers.anh, answers.chuyen
    const user = await User.findById(req.userId);
    
    // Tính điểm
    const scores = {
      toan: answers.toan,
      van: answers.van,
      anh: answers.anh,
      chuyen: answers.chuyen
    };
    
    const total = scores.toan + scores.van + scores.anh + scores.chuyen;
    const passed = total >= 24;
    
    user.learningPath.grade9Exam = {
      passed,
      scores,
      total,
      completedAt: new Date()
    };
    
    if (passed) {
      user.learningPath.currentGrade = 10;
      user.learningPath.currentSemester = 1;
      user.learningPath.completedExams = [];
      user.learningStats.totalDiamonds += 500; // Thưởng 500 kim cương
    }
    
    await user.save();
    
    res.json({
      success: true,
      passed,
      scores,
      total,
      required: 24,
      message: passed ? 'Chúc mừng! Bạn đã đỗ cấp 3 và lên lớp 10!' : 'Rất tiếc, bạn chưa đủ điểm. Hãy học lại lớp 9.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: THI ĐẠI HỌC =====
app.post('/api/exams/grade12-exam', authenticateJWT, async (req, res) => {
  try {
    const { selectedSubjects, scores } = req.body;
    const user = await User.findById(req.userId);
    
    const total = scores[selectedSubjects[0]] + scores[selectedSubjects[1]] + scores[selectedSubjects[2]];
    const passed = total >= 15;
    
    user.learningPath.grade12Exam = {
      passed,
      selectedSubjects,
      scores,
      total,
      completedAt: new Date()
    };
    
    if (passed) {
      user.learningStats.totalDiamonds += 1000; // Thưởng 1000 kim cương
      user.learningPath.currentGrade = 13; // Hoàn thành chương trình
    }
    
    await user.save();
    
    res.json({
      success: true,
      passed,
      selectedSubjects,
      scores,
      total,
      required: 15,
      message: passed ? 'Chúc mừng! Bạn đã đỗ đại học!' : 'Rất tiếc, bạn chưa đủ điểm. Hãy học lại lớp 12.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: LẤY THÔNG TIN LỘ TRÌNH HỌC TẬP =====
app.get('/api/learning/progress', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { learningPath, learningStats } = user;
    
    // Tính tiến độ
    const semester1Exams = learningPath.completedExams.filter(e => e.semester === 1 && e.passed);
    const semester2Exams = learningPath.completedExams.filter(e => e.semester === 2 && e.passed);
    
    const progress = {
      grade: learningPath.currentGrade,
      semester: learningPath.currentSemester,
      completedExams: {
        semester1: semester1Exams.length,
        semester2: semester2Exams.length,
        total: 4
      },
      weakSubjects: learningPath.weakSubjects,
      strongSubjects: learningPath.strongSubjects,
      grade9Exam: learningPath.grade9Exam,
      grade12Exam: learningPath.grade12Exam,
      reviewDays: learningPath.reviewDays,
      reviewRemaining: learningPath.reviewStartedAt 
        ? Math.max(0, learningPath.reviewDays - Math.floor((new Date() - learningPath.reviewStartedAt) / (1000 * 60 * 60 * 24)))
        : 0,
      stats: learningStats
    };
    
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});