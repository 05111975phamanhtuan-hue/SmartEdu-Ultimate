// ============= exam_structures.js - CẤU TRÚC ĐỀ THI CHUẨN =============

const EXAM_STRUCTURES = {
  // 1. ĐỀ GIỮA KỲ I & II - LỚP 6-9
  midterm: {
    grades: [6,7,8,9],
    duration: 90,
    totalPoints: 10,
    sections: [
      {
        name: "Trắc nghiệm nhiều lựa chọn",
        questions: 12,
        pointsPerQuestion: 0.25,
        total: 3,
        difficulty: { easy: 6, medium: 4, hard: 2 }
      },
      {
        name: "Trắc nghiệm Đúng/Sai",
        questions: 4,
        pointsPerQuestion: 1,
        total: 4,
        format: "true_false"
      },
      {
        name: "Tự luận",
        questions: 3,
        total: 3,
        difficulty: { easy: 1, medium: 1, hard: 1 }
      }
    ]
  },
  
  // 2. ĐỀ CUỐI KỲ I & II - LỚP 6-9
  final: {
    grades: [6,7,8,9],
    duration: 90,
    totalPoints: 10,
    sections: [
      {
        name: "Trắc nghiệm nhiều lựa chọn",
        questions: 8,
        pointsPerQuestion: 0.5,
        total: 4,
        difficulty: { easy: 3, medium: 3, hard: 2 }
      },
      {
        name: "Tự luận",
        questions: 4,
        total: 6,
        difficulty: { easy: 1, medium: 2, hard: 1 }
      }
    ]
  },
  
  // 3. ĐỀ THI VÀO LỚP 10
  entrance_10: {
    grades: [9],
    duration: 120,
    totalPoints: 10,
    format: "essay",
    questions: [
      { id: 1, topic: "Rút gọn biểu thức", points: 1.5, difficulty: "easy" },
      { id: 2, topic: "Giải phương trình / Hệ phương trình", points: 1.5, difficulty: "easy" },
      { id: 3, topic: "Bài toán thực tế (năng suất, lãi suất)", points: 1.0, difficulty: "medium" },
      { id: 4, topic: "Hàm số và đồ thị", points: 1.5, difficulty: "medium" },
      { id: 5, topic: "Phương trình bậc hai - Định lý Vi-ét", points: 1.5, difficulty: "medium" },
      { id: 6, topic: "Hình học (3 ý: chứng minh, tính toán)", points: 3.0, difficulty: "hard" }
    ]
  },
  
  // 4. ĐỀ THI TỐT NGHIỆP THPT 2025
  national_2025: {
    grades: [12],
    duration: 90,
    totalPoints: 10,
    sections: [
      {
        name: "Phần 1: Trắc nghiệm nhiều lựa chọn",
        questions: 12,
        pointsPerQuestion: 0.25,
        total: 3,
        difficulty: { easy: 4, medium: 5, hard: 3 }
      },
      {
        name: "Phần 2: Trắc nghiệm Đúng/Sai",
        questions: 4,
        pointsPerQuestion: 1,
        total: 4,
        format: "true_false",
        subQuestions: 4
      },
      {
        name: "Phần 3: Trắc nghiệm trả lời ngắn",
        questions: 6,
        pointsPerQuestion: 0.5,
        total: 3,
        format: "short_answer"
      }
    ]
  },
  
  // 5. ĐỀ THI HỌC SINH GIỎI
  hsg: {
    grades: [6,7,8,9,10,11,12],
    duration: 180,
    totalPoints: 20,
    format: "essay",
    questions: [
      { id: 1, topic: "Lý thuyết", points: 2, difficulty: "medium" },
      { id: 2, topic: "Bài tập vận dụng", points: 3, difficulty: "medium" },
      { id: 3, topic: "Bài tập tổng hợp", points: 4, difficulty: "hard" },
      { id: 4, topic: "Bài tập nâng cao", points: 5, difficulty: "hard" },
      { id: 5, topic: "Bài tập mở rộng", points: 6, difficulty: "hard" }
    ],
    ratio: { theory: 0.3, practice: 0.7 }
  },
  
  // 6. ĐỀ THI CHUYÊN
  chuyen: {
    grades: [9,10,11,12],
    duration: 150,
    totalPoints: 20,
    format: "essay",
    questions: 5,
    difficulty: { medium: 1, hard: 3, very_hard: 1 }
  },
  
  // 7. ĐỀ THI ĐẠI HỌC
  university: {
    grades: [12],
    duration: 90,
    totalPoints: 10,
    format: "multiple_choice",
    questions: 50,
    pointsPerQuestion: 0.2
  }
};

module.exports = EXAM_STRUCTURES;