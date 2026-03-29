// ============= MODULE 6: AI LESSON CONTENT GENERATOR =============
// Thêm vào server.js

// API: Tạo nội dung bài học đầy đủ
app.post('/api/ai/generate-lesson-content', authenticateJWT, async (req, res) => {
  try {
    const { subject, grade, chapter, lessonName, lessonNumber } = req.body;
    const user = await User.findById(req.userId);
    
    // Kiểm tra năng lượng
    if (user.subscription === 'free' && !await useEnergy(user._id, 2)) {
      return res.status(403).json({ error: 'Không đủ năng lượng để tạo bài học' });
    }
    
    // Prompt để AI sinh nội dung đầy đủ
    const prompt = `Bạn là giáo viên dạy môn ${subject} lớp ${grade} theo sách "Kết nối tri thức với cuộc sống".
    
Hãy tạo nội dung chi tiết cho bài học "${lessonName}" với cấu trúc sau:

=== LÝ THUYẾT ===
1. KHÁI NIỆM: (định nghĩa ngắn gọn, dễ hiểu)
2. DẤU HIỆU NHẬN BIẾT: (các đặc điểm, tính chất đặc trưng)
3. CÔNG THỨC (nếu có): (viết rõ ràng, có chú thích)
4. TÍNH CHẤT: (các tính chất quan trọng)

=== VÍ DỤ MINH HỌA ===
(2-3 ví dụ có lời giải chi tiết, giải thích từng bước)

=== BÀI TẬP ===
1. BÀI TẬP NHẬN BIẾT: (5 câu trắc nghiệm có đáp án)
2. BÀI TẬP VẬN DỤNG: (3 bài tập tự luận có đáp án và giải thích)

=== HƯỚNG DẪN THỰC HÀNH ===
(1-2 bài tập thực tế áp dụng kiến thức vào đời sống, có hướng dẫn chi tiết)

Yêu cầu:
- Nội dung chính xác theo chương trình KNTT
- Ngôn ngữ dễ hiểu với học sinh lớp ${grade}
- Có ví dụ cụ thể, gần gũi
- Bài tập có độ khó tăng dần

Trả về định dạng JSON với các trường: theory, keyPoints, formula, properties, examples, recognitionExercises, applicationExercises, practicalGuide`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });
    
    const lessonContent = JSON.parse(completion.choices[0].message.content);
    
    // Lưu vào database
    const lessonId = `${subject}${grade}_${lessonName.toLowerCase().replace(/ /g, '_')}_${Date.now()}`;
    
    const newLesson = {
      id: lessonId,
      subject: subject,
      grade: parseInt(grade),
      chapter: chapter,
      title: lessonName,
      theory: lessonContent.theory,
      keyPoints: lessonContent.keyPoints,
      formula: lessonContent.formula,
      properties: lessonContent.properties,
      examples: lessonContent.examples,
      recognitionExercises: lessonContent.recognitionExercises,
      applicationExercises: lessonContent.applicationExercises,
      practicalGuide: lessonContent.practicalGuide,
      xpReward: 80,
      difficulty: "basic",
      createdAt: new Date()
    };
    
    await Lesson.create(newLesson);
    
    res.json({
      success: true,
      lesson: newLesson,
      message: `✅ Đã tạo bài học "${lessonName}" thành công!`
    });
    
  } catch (err) {
    console.error('Generate lesson content error:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Lấy nội dung bài học đã tạo
app.get('/api/lesson/:lessonId', authenticateJWT, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const user = await User.findById(req.userId);
    
    const lesson = await Lesson.findOne({ id: lessonId });
    if (!lesson) {
      return res.status(404).json({ error: 'Không tìm thấy bài học' });
    }
    
    // Kiểm tra hoàn thành
    const isCompleted = user.completedLessons.includes(lessonId);
    
    res.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        subject: lesson.subject,
        grade: lesson.grade,
        theory: lesson.theory,
        keyPoints: lesson.keyPoints,
        formula: lesson.formula,
        properties: lesson.properties,
        examples: lesson.examples,
        recognitionExercises: lesson.recognitionExercises,
        applicationExercises: lesson.applicationExercises,
        practicalGuide: lesson.practicalGuide,
        xpReward: lesson.xpReward
      },
      isCompleted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});