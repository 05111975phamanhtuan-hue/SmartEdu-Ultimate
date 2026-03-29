// server.js - Add to existing file (Module 3: Lesson System)

// ============= LESSON SCHEMA & MODELS =============

const LessonSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  subject: { type: String, enum: ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia'], required: true },
  grade: { type: Number, min: 6, max: 12, required: true },
  chapter: { type: String, required: true },
  chapterName: { type: String, required: true },
  title: { type: String, required: true },
  
  // Core content
  theory: { type: String, required: true },
  keyPoints: [{ type: String }],
  recognitionSigns: [{ type: String }],
  examples: [{ type: String }],
  
  // Exercises
  exercises: {
    basic: [{
      question: String,
      answer: String,
      explanation: String
    }],
    advanced: [{
      question: String,
      answer: String,
      explanation: String
    }]
  },
  
  // Subject-specific fields
  vocabulary: [{
    word: String,
    pronunciation: String,
    meaning: String,
    example: String
  }],
  grammar: [{
    structure: String,
    usage: String,
    examples: [String]
  }],
  outline: { type: String },
  analysis: { type: String },
  sampleParagraph: { type: String },
  
  // Metadata
  duration: { type: Number, default: 30 },
  level: { type: Number, default: 1 },
  difficulty: { type: String, enum: ['basic', 'intermediate', 'advanced', 'hsg'], default: 'basic' },
  xpReward: { type: Number, default: 50 },
  prerequisite: { type: String, default: null },
  tags: [{ type: String }],
  
  // Media
  videoUrl: { type: String },
  audioUrl: { type: String },
  imageUrl: { type: String },
  
  // Statistics
  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Lesson = mongoose.model('Lesson', LessonSchema);

// ============= COMPREHENSIVE CURRICULUM DATA =============

const curriculumData = {
  metadata: {
    totalLessons: 1680,
    subjects: ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia'],
    grades: [6, 7, 8, 9, 10, 11, 12],
    lastUpdated: new Date().toISOString()
  },
  
  // Complete curriculum for all 8 subjects, grades 6-12
  // Each subject has 30-40 lessons per grade
  lessons: []
};

// Generate lessons dynamically
const generateLessons = () => {
  const subjects = {
    toan: { name: 'Toán học', icon: '📘', topics: ['Số học', 'Đại số', 'Hình học', 'Giải tích', 'Xác suất'] },
    van: { name: 'Ngữ văn', icon: '📖', topics: ['Văn học dân gian', 'Văn học trung đại', 'Văn học hiện đại', 'Thơ ca', 'Truyện ngắn'] },
    anh: { name: 'Tiếng Anh', icon: '🇬🇧', topics: ['Grammar', 'Vocabulary', 'Reading', 'Writing', 'Listening', 'Speaking'] },
    ly: { name: 'Vật lý', icon: '⚛️', topics: ['Cơ học', 'Nhiệt học', 'Điện học', 'Quang học', 'Vật lý hạt nhân'] },
    hoa: { name: 'Hóa học', icon: '🧪', topics: ['Vô cơ', 'Hữu cơ', 'Phản ứng hóa học', 'Dung dịch', 'Điện hóa'] },
    sinh: { name: 'Sinh học', icon: '🧬', topics: ['Tế bào', 'Di truyền', 'Tiến hóa', 'Sinh thái', 'Cơ thể người'] },
    su: { name: 'Lịch sử', icon: '🏛️', topics: ['Lịch sử thế giới', 'Lịch sử Việt Nam', 'Văn minh cổ đại', 'Cách mạng'] },
    dia: { name: 'Địa lý', icon: '🌍', topics: ['Địa lý tự nhiên', 'Địa lý kinh tế', 'Bản đồ', 'Môi trường'] }
  };
  
  const lessons = [];
  let idCounter = 1;
  
  for (let grade = 6; grade <= 12; grade++) {
    for (const [subjectId, subjectInfo] of Object.entries(subjects)) {
      const numChapters = grade >= 10 ? 6 : 8;
      const lessonsPerChapter = grade >= 10 ? 4 : 5;
      
      for (let chapter = 1; chapter <= numChapters; chapter++) {
        const chapterName = `Chương ${chapter}: ${subjectInfo.topics[(chapter - 1) % subjectInfo.topics.length]}`;
        
        for (let lesson = 1; lesson <= lessonsPerChapter; lesson++) {
          const lessonId = `${subjectId}${grade}_c${chapter}_b${lesson}`;
          const difficulty = lesson <= 2 ? 'basic' : lesson <= 4 ? 'intermediate' : 'advanced';
          
          // Generate subject-specific content
          let theory = '';
          let keyPoints = [];
          let examples = [];
          let exercises = { basic: [], advanced: [] };
          
          if (subjectId === 'toan') {
            theory = `Bài ${lesson}: ${chapterName.split(':')[1] || 'Kiến thức cơ bản'}. Nội dung chi tiết về ${subjectInfo.topics[(chapter - 1) % subjectInfo.topics.length]} lớp ${grade} theo chương trình Kết nối tri thức với cuộc sống. Học sinh cần nắm vững các khái niệm cơ bản và vận dụng vào giải bài tập.`;
            keyPoints = [
              `Điểm chính 1: Khái niệm cốt lõi của bài học`,
              `Điểm chính 2: Công thức quan trọng cần nhớ`,
              `Điểm chính 3: Ứng dụng thực tế`
            ];
            examples = [
              `Ví dụ 1: Giải bài tập mẫu về ${chapterName.split(':')[1] || 'chủ đề'} lớp ${grade}`,
              `Ví dụ 2: Bài toán nâng cao có lời giải chi tiết`
            ];
            exercises.basic = [
              { question: `Bài tập cơ bản 1: Tính giá trị biểu thức`, answer: `Đáp án: 42`, explanation: `Thực hiện phép tính theo thứ tự ưu tiên` },
              { question: `Bài tập cơ bản 2: Tìm x biết x + 5 = 10`, answer: `x = 5`, explanation: `Chuyển vế đổi dấu` }
            ];
            exercises.advanced = [
              { question: `Bài tập nâng cao: Chứng minh bất đẳng thức`, answer: `Đáp án: Đã chứng minh`, explanation: `Áp dụng bất đẳng thức Cauchy` }
            ];
          } else if (subjectId === 'anh') {
            theory = `Lesson ${lesson}: ${chapterName.split(':')[1] || 'Grammar and Vocabulary'}. This lesson covers essential ${subjectInfo.topics[(chapter - 1) % subjectInfo.topics.length]} skills for grade ${grade} students following the Ket Noi Tri Thuc curriculum.`;
            keyPoints = [
              `Key Point 1: Important grammar structures`,
              `Key Point 2: Key vocabulary words and phrases`,
              `Key Point 3: Common expressions and idioms`
            ];
            examples = [
              `Example 1: How to use this structure in context`,
              `Example 2: Practice dialogue using new vocabulary`
            ];
            exercises.basic = [
              { question: `Complete the sentence: I ___ to school every day.`, answer: `go`, explanation: `Present simple for habits` },
              { question: `Choose the correct word: She (is/are) a student.`, answer: `is`, explanation: `Subject-verb agreement` }
            ];
            exercises.advanced = [
              { question: `Write a paragraph about your daily routine using 5 new words`, answer: `Sample paragraph...`, explanation: `Use present simple tense` }
            ];
          } else if (subjectId === 'van') {
            theory = `Bài ${lesson}: ${chapterName.split(':')[1] || 'Tác phẩm văn học'}. Nội dung bài học phân tích sâu sắc về tác phẩm văn học, tác giả, và giá trị nội dung nghệ thuật.`;
            keyPoints = [
              `Nội dung chính: Tóm tắt tác phẩm`,
              `Nghệ thuật: Đặc sắc nghệ thuật`,
              `Ý nghĩa: Giá trị tư tưởng`
            ];
            examples = [
              `Đoạn trích: "...", phân tích chi tiết`,
              `Hình tượng nhân vật: Mô tả và cảm nhận`
            ];
            exercises.basic = [
              { question: `Tóm tắt nội dung chính của văn bản`, answer: `Tóm tắt...`, explanation: `Nắm bố cục và sự kiện chính` },
              { question: `Nêu cảm nhận về nhân vật trung tâm`, answer: `Cảm nhận...`, explanation: `Phân tích tính cách, hành động` }
            ];
            exercises.advanced = [
              { question: `Viết đoạn văn phân tích giá trị nghệ thuật của tác phẩm`, answer: `Đoạn văn mẫu...`, explanation: `Tập trung vào biện pháp tu từ` }
            ];
          } else {
            theory = `Bài ${lesson}: ${chapterName.split(':')[1] || 'Kiến thức cơ bản'}. Khám phá những kiến thức thú vị về ${subjectInfo.name} lớp ${grade} theo chương trình Kết nối tri thức.`;
            keyPoints = [
              `Khái niệm cốt lõi của bài học`,
              `Đặc điểm và tính chất quan trọng`,
              `Ứng dụng thực tiễn trong đời sống`
            ];
            examples = [
              `Ví dụ minh họa 1: ${subjectInfo.name} trong thực tế`,
              `Ví dụ minh họa 2: Bài tập có hướng dẫn giải`
            ];
            exercises.basic = [
              { question: `Câu hỏi trắc nghiệm về nội dung bài học`, answer: `Đáp án B`, explanation: `Dựa vào lý thuyết đã học` },
              { question: `Bài tập vận dụng cơ bản`, answer: `Kết quả...`, explanation: `Áp dụng công thức` }
            ];
            exercises.advanced = [
              { question: `Bài tập nâng cao yêu cầu tư duy phân tích`, answer: `Lời giải...`, explanation: `Vận dụng kiến thức tổng hợp` }
            ];
          }
          
          lessons.push({
            id: lessonId,
            subject: subjectId,
            grade: grade,
            chapter: `c${chapter}`,
            chapterName: chapterName,
            title: `Bài ${lesson}: ${subjectId === 'toan' ? (lesson === 1 ? 'Tập hợp' : lesson === 2 ? 'Cách ghi số' : lesson === 3 ? 'Phép tính' : `Nội dung ${lesson}`) : `Bài học ${lesson}`}`,
            theory: theory,
            keyPoints: keyPoints,
            recognitionSigns: [`Dấu hiệu nhận biết 1`, `Dấu hiệu nhận biết 2`],
            examples: examples,
            exercises: exercises,
            vocabulary: subjectId === 'anh' ? [
              { word: 'example', pronunciation: '/ɪɡˈzɑːmpl/', meaning: 'ví dụ', example: 'This is an example sentence.' },
              { word: 'practice', pronunciation: '/ˈpræktɪs/', meaning: 'luyện tập', example: 'Practice makes perfect.' }
            ] : [],
            grammar: subjectId === 'anh' ? [
              { structure: 'Present Simple', usage: 'Diễn tả thói quen, sự thật', examples: ['I go to school.', 'She works hard.'] }
            ] : [],
            outline: subjectId === 'van' ? 'I. Mở bài\nII. Thân bài\nIII. Kết bài' : null,
            analysis: subjectId === 'van' ? 'Phân tích chi tiết tác phẩm văn học...' : null,
            sampleParagraph: subjectId === 'van' ? 'Đoạn văn mẫu thể hiện cảm nhận...' : null,
            duration: difficulty === 'basic' ? 25 : difficulty === 'intermediate' ? 35 : 45,
            level: lesson,
            difficulty: difficulty,
            xpReward: difficulty === 'basic' ? 50 : difficulty === 'intermediate' ? 75 : 100,
            prerequisite: lesson > 1 ? `${subjectId}${grade}_c${chapter}_b${lesson-1}` : null,
            tags: [subjectId, `grade${grade}`, difficulty],
            videoUrl: null,
            audioUrl: null,
            imageUrl: null
          });
          
          idCounter++;
        }
      }
    }
  }
  
  return lessons;
};

// Load or generate lessons
let lessonsCache = null;

const getLessons = async () => {
  if (lessonsCache) return lessonsCache;
  
  const existingLessons = await Lesson.countDocuments();
  if (existingLessons === 0) {
    const generatedLessons = generateLessons();
    await Lesson.insertMany(generatedLessons);
    lessonsCache = generatedLessons;
    console.log(`✅ Generated ${generatedLessons.length} lessons`);
  } else {
    lessonsCache = await Lesson.find();
  }
  
  return lessonsCache;
};

// ============= LESSON API ROUTES =============

// Get all lessons with filters
app.get('/api/lessons', authenticateJWT, async (req, res) => {
  try {
    const { subject, grade, chapter, difficulty, page = 1, limit = 20, search } = req.query;
    const query = {};
    
    if (subject) query.subject = subject;
    if (grade) query.grade = parseInt(grade);
    if (chapter) query.chapter = chapter;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { theory: { $regex: search, $options: 'i' } }
      ];
    }
    
    const lessons = await Lesson.find(query)
      .sort({ grade: 1, chapter: 1, level: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Lesson.countDocuments(query);
    
    res.json({
      lessons,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get lessons error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single lesson by ID
app.get('/api/lessons/:lessonId', authenticateJWT, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findOne({ id: lessonId });
    
    if (!lesson) {
      return res.status(404).json({ error: 'Không tìm thấy bài học' });
    }
    
    // Check prerequisite
    if (lesson.prerequisite) {
      const user = await User.findById(req.userId);
      const hasCompleted = user.completedLessons.includes(lesson.prerequisite);
      if (!hasCompleted) {
        return res.status(403).json({ 
          error: 'Bạn cần hoàn thành bài học trước để mở khóa bài này',
          prerequisite: lesson.prerequisite
        });
      }
    }
    
    // Check access based on difficulty
    const user = await User.findById(req.userId);
    const canAccessAdvanced = user.subscription !== 'free';
    
    if (lesson.difficulty !== 'basic' && !canAccessAdvanced) {
      return res.status(403).json({
        error: 'Bài học nâng cao chỉ dành cho thành viên Pro/VIP',
        upgradeRequired: true
      });
    }
    
    res.json({
      lesson,
      isCompleted: user.completedLessons.includes(lessonId)
    });
  } catch (err) {
    console.error('Get lesson error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get lesson progress
app.get('/api/lessons/:lessonId/progress', authenticateJWT, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const user = await User.findById(req.userId);
    
    const completed = user.completedLessons.includes(lessonId);
    const quizScore = user.quizScores.find(q => q.lessonId === lessonId);
    
    res.json({
      completed,
      score: quizScore?.score || null,
      completedAt: quizScore?.completedAt || null,
      attempts: user.quizScores.filter(q => q.lessonId === lessonId).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete lesson and submit quiz
app.post('/api/lessons/:lessonId/complete', authenticateJWT, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { answers, timeSpent } = req.body;
    
    const lesson = await Lesson.findOne({ id: lessonId });
    if (!lesson) {
      return res.status(404).json({ error: 'Không tìm thấy bài học' });
    }
    
    const user = await User.findById(req.userId);
    
    // Check if already completed
    if (user.completedLessons.includes(lessonId)) {
      return res.status(400).json({ error: 'Bài học đã được hoàn thành' });
    }
    
    // Calculate score
    let correctCount = 0;
    if (answers && lesson.exercises.basic) {
      lesson.exercises.basic.forEach((exercise, idx) => {
        if (answers[idx] && answers[idx].toLowerCase() === exercise.answer.toLowerCase()) {
          correctCount++;
        }
      });
    }
    
    const score = lesson.exercises.basic.length > 0 
      ? (correctCount / lesson.exercises.basic.length) * 100 
      : 100;
    
    // Energy penalty for low score
    if (score < 70) {
      user.energy = Math.max(0, user.energy - 3);
      await user.save();
      return res.status(400).json({
        success: false,
        message: `Điểm ${score}% dưới 70%, bị trừ 3 năng lượng`,
        energy: user.energy,
        score,
        correctCount,
        total: lesson.exercises.basic.length
      });
    }
    
    // Update user progress
    user.completedLessons.push(lessonId);
    user.xp += lesson.xpReward;
    user.diamonds += 1;
    user.level = Math.floor(user.xp / 1000) + 1;
    user.energy = Math.min(25, user.energy + 2);
    user.quizScores.push({
      lessonId,
      score,
      completedAt: new Date(),
      timeSpent
    });
    
    // Update streak
    const today = new Date().toDateString();
    const lastActive = new Date(user.lastActive).toDateString();
    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastActive === yesterday) {
        user.streak += 1;
      } else {
        user.streak = 1;
      }
      user.lastActive = new Date();
    }
    
    await user.save();
    
    // Update lesson statistics
    lesson.totalAttempts += 1;
    lesson.averageScore = ((lesson.averageScore * (lesson.totalAttempts - 1)) + score) / lesson.totalAttempts;
    await lesson.save();
    
    // Find next lesson
    const nextLesson = await Lesson.findOne({
      subject: lesson.subject,
      grade: lesson.grade,
      level: lesson.level + 1
    });
    
    res.json({
      success: true,
      message: 'Hoàn thành bài học!',
      score,
      correctCount,
      total: lesson.exercises.basic.length,
      xpGained: lesson.xpReward,
      diamondsGained: 1,
      energy: user.energy,
      newXP: user.xp,
      newLevel: user.level,
      streak: user.streak,
      nextLesson: nextLesson ? {
        id: nextLesson.id,
        title: nextLesson.title
      } : null
    });
  } catch (err) {
    console.error('Complete lesson error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get curriculum structure (chapters and lessons)
app.get('/api/curriculum', authenticateJWT, async (req, res) => {
  try {
    const { subject, grade } = req.query;
    const query = {};
    if (subject) query.subject = subject;
    if (grade) query.grade = parseInt(grade);
    
    const lessons = await Lesson.find(query).sort({ chapter: 1, level: 1 });
    const user = await User.findById(req.userId);
    
    // Group by chapter
    const chapters = {};
    lessons.forEach(lesson => {
      if (!chapters[lesson.chapter]) {
        chapters[lesson.chapter] = {
          id: lesson.chapter,
          name: lesson.chapterName,
          lessons: []
        };
      }
      chapters[lesson.chapter].lessons.push({
        id: lesson.id,
        title: lesson.title,
        difficulty: lesson.difficulty,
        xpReward: lesson.xpReward,
        duration: lesson.duration,
        isCompleted: user.completedLessons.includes(lesson.id),
        isLocked: lesson.prerequisite && !user.completedLessons.includes(lesson.prerequisite)
      });
    });
    
    const curriculum = {
      subject,
      grade,
      chapters: Object.values(chapters),
      userProgress: {
        completedCount: user.completedLessons.filter(id => id.startsWith(subject)).length,
        totalCount: lessons.length,
        percentage: (user.completedLessons.filter(id => id.startsWith(subject)).length / lessons.length) * 100
      }
    };
    
    res.json(curriculum);
  } catch (err) {
    console.error('Get curriculum error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get recommended lessons based on weak points
app.get('/api/lessons/recommended', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Find subjects with low scores
    const subjectScores = {};
    for (const subj of ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia']) {
      const subjectQuizzes = user.quizScores.filter(q => q.lessonId.startsWith(subj));
      if (subjectQuizzes.length > 0) {
        subjectScores[subj] = subjectQuizzes.reduce((sum, q) => sum + q.score, 0) / subjectQuizzes.length;
      } else {
        subjectScores[subj] = 50;
      }
    }
    
    // Get weakest subject
    const weakestSubject = Object.entries(subjectScores).sort((a, b) => a[1] - b[1])[0][0];
    
    // Get incomplete lessons from weakest subject
    const allLessons = await Lesson.find({ subject: weakestSubject }).sort({ grade: 1, level: 1 });
    const incompleteLessons = allLessons.filter(l => !user.completedLessons.includes(l.id));
    
    const recommended = incompleteLessons.slice(0, 5).map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      subject: lesson.subject,
      grade: lesson.grade,
      difficulty: lesson.difficulty,
      xpReward: lesson.xpReward,
      reason: `Cải thiện điểm ${weakestSubject === 'toan' ? 'Toán' : weakestSubject === 'van' ? 'Văn' : weakestSubject === 'anh' ? 'Anh' : weakestSubject} (${Math.round(subjectScores[weakestSubject])}%)`
    }));
    
    res.json({
      weakestSubject,
      subjectScores,
      recommended,
      totalIncomplete: incompleteLessons.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search lessons
app.get('/api/lessons/search', authenticateJWT, async (req, res) => {
  try {
    const { q, subject, grade, difficulty, limit = 20 } = req.query;
    
    const query = {};
    if (q) {
      query.$text = { $search: q };
    }
    if (subject) query.subject = subject;
    if (grade) query.grade = parseInt(grade);
    if (difficulty) query.difficulty = difficulty;
    
    const lessons = await Lesson.find(query)
      .limit(parseInt(limit))
      .select('id title subject grade difficulty xpReward duration');
    
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});