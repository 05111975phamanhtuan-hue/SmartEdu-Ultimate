// ============= CẤU TRÚC BÀI HỌC CHUẨN =============

{
  "id": "toan6_bai1",
  "subject": "toan",
  "subjectName": "Toán học",
  "grade": 6,
  "chapter": "Chương 1: Tập hợp các số tự nhiên",
  "title": "Bài 1: Tập hợp",
  "theory": {
    "concept": "Tập hợp là một nhóm các đối tượng có cùng tính chất...",
    "keyPoints": [
      "Tập hợp được ký hiệu bằng chữ cái in hoa",
      "Phần tử thuộc tập hợp ký hiệu ∈",
      "Phần tử không thuộc tập hợp ký hiệu ∉"
    ],
    "recognitionSigns": [
      "Các phần tử viết trong dấu ngoặc nhọn {}",
      "Các phần tử cách nhau bởi dấu ';' hoặc ','"
    ],
    "examples": [
      "A = {0; 1; 2; 3} là tập hợp các số tự nhiên nhỏ hơn 4",
      "5 ∉ A vì 5 không có trong tập hợp A"
    ]
  },
  "exercises": {
    "multipleChoice": [
      {
        "id": 1,
        "question": "Cách viết nào sau đây đúng?",
        "options": [
          "5 ∈ {1,2,3,4}",
          "5 ∉ {1,2,3,4,5}",
          "5 ∈ {1,2,3,4,5}",
          "5 ∉ {1,2,3,4}"
        ],
        "correctAnswer": 2,
        "explanation": "5 là phần tử của tập hợp {1,2,3,4,5} nên viết 5 ∈ {1,2,3,4,5}"
      }
    ],
    "essay": [
      {
        "id": 1,
        "question": "Viết tập hợp các số tự nhiên lớn hơn 3 và nhỏ hơn 8",
        "modelAnswer": "{4; 5; 6; 7}",
        "scoringGuide": "Liệt kê đúng các số 4,5,6,7",
        "aiScoringPrompt": "Chấm điểm bài làm của học sinh dựa trên đáp án mẫu"
      }
    ]
  }
}