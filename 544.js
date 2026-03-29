// ============= generate_exams.js - SINH 500 ĐỀ THI ĐẦU TIÊN =============

const generateExams = async () => {
  const exams = [];
  let examId = 1;
  
  const subjects = ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia'];
  const subjectNames = {
    toan: 'Toán học',
    van: 'Ngữ văn',
    anh: 'Tiếng Anh',
    ly: 'Vật lý',
    hoa: 'Hóa học',
    sinh: 'Sinh học',
    su: 'Lịch sử',
    dia: 'Địa lý'
  };
  
  const examTypes = ['midterm1', 'midterm2', 'final1', 'final2', 'entrance_10', 'hsg', 'national_2025', 'chuyen', 'university'];
  
  for (let subjectIdx = 0; subjectIdx < subjects.length; subjectIdx++) {
    const subject = subjects[subjectIdx];
    
    for (let grade = 6; grade <= 12; grade++) {
      for (let typeIdx = 0; typeIdx < examTypes.length; typeIdx++) {
        const type = examTypes[typeIdx];
        
        // Bỏ qua một số tổ hợp không phù hợp
        if (type === 'entrance_10' && grade !== 9) continue;
        if (type === 'national_2025' && grade !== 12) continue;
        if (type === 'university' && grade !== 12) continue;
        if (type === 'chuyen' && grade < 9) continue;
        
        // Mỗi loại đề sinh 2-5 đề
        const numExams = type === 'midterm1' || type === 'midterm2' || type === 'final1' || type === 'final2' ? 5 : 3;
        
        for (let version = 1; version <= numExams; version++) {
          if (examId > 500) break;
          
          const exam = {
            id: examId,
            subject: subject,
            subjectName: subjectNames[subject],
            grade: grade,
            type: type,
            version: version,
            name: this.getExamName(type, subjectNames[subject], grade, version),
            duration: this.getDuration(type),
            totalPoints: this.getTotalPoints(type),
            questions: [],
            answerSheet: {
              answers: [],
              scoringGuide: ''
            },
            tags: [subject, `grade${grade}`, type],
            totalAttempts: 0,
            averageScore: 0,
            createdAt: new Date()
          };
          
          // Sinh câu hỏi theo cấu trúc
          exam.questions = await generateQuestions(subject, grade, type, version);
          
          // Sinh đáp án
          exam.answerSheet = generateAnswerSheet(exam.questions);
          
          exams.push(exam);
          examId++;
        }
        
        if (examId > 500) break;
      }
      if (examId > 500) break;
    }
    if (examId > 500) break;
  }
  
  return exams;
};

const getExamName = (type, subject, grade, version) => {
  const typeNames = {
    midterm1: `Đề kiểm tra giữa kỳ I`,
    midterm2: `Đề kiểm tra giữa kỳ II`,
    final1: `Đề kiểm tra cuối kỳ I`,
    final2: `Đề kiểm tra cuối kỳ II`,
    entrance_10: `Đề thi thử vào lớp 10`,
    hsg: `Đề thi học sinh giỏi`,
    national_2025: `Đề thi thử tốt nghiệp THPT`,
    chuyen: `Đề thi vào trường chuyên`,
    university: `Đề thi thử đại học`
  };
  return `${typeNames[type]} môn ${subject} lớp ${grade} - Đề ${version}`;
};

const getDuration = (type) => {
  const durations = {
    midterm1: 90,
    midterm2: 90,
    final1: 90,
    final2: 90,
    entrance_10: 120,
    hsg: 180,
    national_2025: 90,
    chuyen: 150,
    university: 90
  };
  return durations[type] || 90;
};

const getTotalPoints = (type) => {
  const points = {
    midterm1: 10,
    midterm2: 10,
    final1: 10,
    final2: 10,
    entrance_10: 10,
    hsg: 20,
    national_2025: 10,
    chuyen: 20,
    university: 10
  };
  return points[type] || 10;
};

const generateQuestions = async (subject, grade, type, version) => {
  const structure = EXAM_STRUCTURES[type] || EXAM_STRUCTURES.midterm;
  const questions = [];
  let questionId = 1;
  
  if (structure.sections) {
    // Đề có cấu trúc section
    for (const section of structure.sections) {
      for (let i = 1; i <= section.questions; i++) {
        const difficulty = getDifficulty(i, section.questions, section.difficulty);
        const question = await generateQuestionBySubject(subject, grade, type, difficulty, questionId);
        questions.push({
          id: questionId,
          section: section.name,
          type: section.format || 'multiple_choice',
          content: question.content,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          points: section.pointsPerQuestion || (section.total / section.questions),
          difficulty: difficulty
        });
        questionId++;
      }
    }
  } else if (structure.questions) {
    // Đề tự luận có cấu trúc câu hỏi cố định
    for (const q of structure.questions) {
      const question = await generateQuestionBySubject(subject, grade, type, q.difficulty, questionId);
      questions.push({
        id: questionId,
        type: 'essay',
        content: question.content,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        points: q.points,
        difficulty: q.difficulty
      });
      questionId++;
    }
  }
  
  return questions;
};

const getDifficulty = (index, total, distribution) => {
  if (!distribution) return 'medium';
  
  const easyCount = distribution.easy || 0;
  const mediumCount = distribution.medium || 0;
  
  if (index <= easyCount) return 'easy';
  if (index <= easyCount + mediumCount) return 'medium';
  return 'hard';
};

const generateQuestionBySubject = async (subject, grade, type, difficulty, questionId) => {
  // Sinh câu hỏi dựa trên môn học
  const templates = {
    toan: {
      easy: [
        { content: `Tính giá trị biểu thức: 125 + 75 × 2 - 50`, answer: `225`, explanation: `125 + 150 - 50 = 225` },
        { content: `Tìm x biết: x + 125 = 250`, answer: `125`, explanation: `x = 250 - 125 = 125` },
        { content: `Tìm x biết: 15 × x = 450`, answer: `30`, explanation: `x = 450 : 15 = 30` }
      ],
      medium: [
        { content: `Giải phương trình: x² - 5x + 6 = 0`, answer: `x = 2 hoặc x = 3`, explanation: `Δ = 25 - 24 = 1 → x₁ = 3, x₂ = 2` },
        { content: `Tìm ƯCLN và BCNN của 24 và 36`, answer: `ƯCLN = 12, BCNN = 72`, explanation: `24 = 2³ × 3; 36 = 2² × 3²` }
      ],
      hard: [
        { content: `Chứng minh rằng: √2 là số vô tỉ`, answer: `Giả sử √2 = a/b (tối giản) → 2b² = a² → a chẵn → a=2k → b²=2k² → b chẵn → mâu thuẫn`, explanation: `Phương pháp phản chứng` }
      ]
    },
    van: {
      easy: [
        { content: `Tóm tắt truyện "Thánh Gióng" bằng 5-7 câu`, answer: `Thánh Gióng là truyền thuyết về người anh hùng làng Gióng...`, explanation: `Nắm các sự kiện chính` }
      ],
      medium: [
        { content: `Phân tích nhân vật Thánh Gióng trong truyện cùng tên`, answer: `Thánh Gióng là hình tượng anh hùng...`, explanation: `Phân tích ngoại hình, hành động, ý nghĩa` }
      ]
    },
    anh: {
      easy: [
        { content: `Complete: I ___ a student.`, answer: `am`, explanation: `Subject I goes with am` },
        { content: `What do you say at 8:00 AM?`, answer: `Good morning`, explanation: `Good morning is used before 12:00 PM` }
      ]
    }
  };
  
  const subjectTemplates = templates[subject] || templates.toan;
  const levelTemplates = subjectTemplates[difficulty] || subjectTemplates.medium;
  const template = levelTemplates[(questionId - 1) % levelTemplates.length];
  
  return {
    content: template.content,
    options: template.options || null,
    correctAnswer: template.answer,
    explanation: template.explanation
  };
};

const generateAnswerSheet = (questions) => {
  const answers = [];
  for (const q of questions) {
    answers.push({
      questionId: q.id,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points
    });
  }
  
  return {
    answers: answers,
    scoringGuide: generateScoringGuide(questions)
  };
};

const generateScoringGuide = (questions) => {
  let guide = "HƯỚNG DẪN CHẤM ĐIỂM\n\n";
  for (const q of questions) {
    guide += `Câu ${q.id} (${q.points} điểm): ${q.correctAnswer}\n`;
    guide += `  Giải thích: ${q.explanation}\n\n`;
  }
  return guide;
};