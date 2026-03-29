// ============= MODULE: EXAM SYSTEM =============
// Thêm vào server.js

// Model đề thi
const ExamSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  subject: { type: String, enum: ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia'], required: true },
  grade: { type: Number, min: 6, max: 12, required: true },
  type: { type: String, enum: ['midterm1', 'midterm2', 'final1', 'final2', 'entrance_10', 'hsg', 'university'], required: true },
  semester: { type: Number, enum: [1, 2] },
  name: { type: String, required: true },
  duration: { type: Number, default: 90 },
  totalPoints: { type: Number, default: 10 },
  questions: [{
    id: { type: Number },
    type: { type: String, enum: ['multiple_choice', 'essay', 'calculation'] },
    content: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    explanation: { type: String },
    points: { type: Number, default: 0.5 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] }
  }],
  answerSheet: {
    answers: [{
      questionId: Number,
      correctAnswer: String,
      explanation: String
    }],
    scoringGuide: String
  },
  tags: [{ type: String }],
  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Exam = mongoose.model('Exam', ExamSchema);

// ============= API ĐỀ THI =============

// Lấy danh sách đề thi
app.get('/api/exams', authenticateJWT, async (req, res) => {
  try {
    const { subject, grade, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (subject) query.subject = subject;
    if (grade) query.grade = parseInt(grade);
    if (type) query.type = type;
    
    const exams = await Exam.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('id name subject grade type duration totalPoints totalAttempts averageScore');
    
    const total = await Exam.countDocuments(query);
    
    res.json({
      exams,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy chi tiết đề thi
app.get('/api/exams/:examId', authenticateJWT, async (req, res) => {
  try {
    const exam = await Exam.findOne({ id: req.params.examId });
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Nộp bài thi
app.post('/api/exams/:examId/submit', authenticateJWT, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    const exam = await Exam.findOne({ id: req.params.examId });
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    
    let totalScore = 0;
    const results = [];
    
    exam.questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) totalScore += question.points;
      results.push({
        questionId: question.id,
        userAnswer,
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0
      });
    });
    
    const percentage = (totalScore / exam.totalPoints) * 100;
    
    // Cập nhật thống kê
    exam.totalAttempts += 1;
    exam.averageScore = ((exam.averageScore * (exam.totalAttempts - 1)) + percentage) / exam.totalAttempts;
    await exam.save();
    
    // Cập nhật user
    const user = await User.findById(req.userId);
    user.xp += Math.floor(percentage * 2);
    user.energy = Math.min(25, user.energy + 2);
    await user.save();
    
    res.json({
      success: true,
      totalScore,
      totalPoints: exam.totalPoints,
      percentage,
      results,
      xpGained: Math.floor(percentage * 2),
      energy: user.energy
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI tạo đề thi mới
app.post('/api/exams/generate', authenticateJWT, async (req, res) => {
  try {
    const { subject, grade, type, topics, difficulty = 'medium' } = req.body;
    const user = await User.findById(req.userId);
    
    if (user.subscription === 'free' && !await useEnergy(user._id, 3)) {
      return res.status(403).json({ error: 'Không đủ năng lượng' });
    }
    
    const prompt = `Tạo đề thi ${type} môn ${subject} lớp ${grade} theo sách Kết nối tri thức.
    
Các chủ đề: ${topics?.join(', ') || 'toàn bộ chương trình học kỳ'}
Độ khó: ${difficulty}

Yêu cầu:
1. 5 câu trắc nghiệm (mỗi câu 0.5 điểm)
2. 3 câu tự luận (mỗi câu 1-2 điểm)
3. Có đáp án chi tiết
4. Có hướng dẫn chấm điểm
5. Tổng điểm 10

Trả về JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });
    
    const examData = JSON.parse(completion.choices[0].message.content);
    const examId = `${subject}${grade}_${type}_${Date.now()}`;
    
    const newExam = new Exam({
      id: examId,
      subject,
      grade,
      type,
      name: `Đề ${type === 'midterm1' ? 'giữa kỳ I' : type === 'midterm2' ? 'giữa kỳ II' : type === 'final1' ? 'cuối kỳ I' : type === 'final2' ? 'cuối kỳ II' : type} môn ${subject} lớp ${grade}`,
      duration: 90,
      totalPoints: 10,
      questions: examData.questions,
      answerSheet: examData.answerSheet
    });
    
    await newExam.save();
    
    res.json({
      success: true,
      examId,
      exam: newExam
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});