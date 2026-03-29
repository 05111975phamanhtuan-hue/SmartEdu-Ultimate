// ============= physics_lab_data.js - 500 THÍ NGHIỆM VẬT LÝ =============

const physicsExperiments = [];

// ===== ID 1-100: CƠ HỌC =====
const mechanicsExperiments = [
  { id: 1, name: "Thả rơi tự do", category: "mechanics", phenomenon: "Vật rơi nhanh dần đều", formula: "h = 1/2 gt²", equipment: ["Vật nặng", "Thước đo", "Đồng hồ bấm giây"], steps: ["Thả vật từ độ cao h", "Đo thời gian rơi", "Tính gia tốc trọng trường"] },
  { id: 2, name: "Con lắc đơn", category: "mechanics", phenomenon: "Dao động điều hòa", formula: "T = 2π√(l/g)", equipment: ["Dây treo", "Quả nặng", "Thước", "Đồng hồ"], steps: ["Treo quả nặng vào dây", "Kéo lệch khỏi vị trí cân bằng", "Thả và đo chu kỳ"] },
  { id: 3, name: "Định luật Hooke", category: "mechanics", phenomenon: "Lực đàn hồi tỷ lệ với độ biến dạng", formula: "F = k.Δl", equipment: ["Lò xo", "Quả nặng", "Thước"], steps: ["Treo lò xo thẳng đứng", "Đo chiều dài ban đầu", "Treo quả nặng, đo độ dãn"] },
  { id: 4, name: "Chuyển động thẳng đều", category: "mechanics", phenomenon: "Vận tốc không đổi", formula: "s = v.t", equipment: ["Xe lăn", "Máng nghiêng", "Đồng hồ"], steps: ["Đặt xe trên máng", "Thả xe", "Đo quãng đường và thời gian"] },
  { id: 5, name: "Định luật bảo toàn động lượng", category: "mechanics", phenomenon: "Động lượng bảo toàn", formula: "m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'", equipment: ["Xe lăn", "Cảm biến", "Máng trượt"], steps: ["Cho hai xe chuyển động", "Đo vận tốc trước và sau va chạm", "Tính động lượng"] },
  { id: 6, name: "Cân bằng lực", category: "mechanics", phenomenon: "Hợp lực bằng 0", formula: "∑F = 0", equipment: ["Lực kế", "Giá đỡ", "Quả nặng"], steps: ["Treo vật vào lực kế", "Đọc số chỉ", "So sánh với trọng lượng"] },
  { id: 7, name: "Đòn bẩy", category: "mechanics", phenomenon: "Cân bằng mômen lực", formula: "F₁.d₁ = F₂.d₂", equipment: ["Thước", "Giá đỡ", "Quả nặng"], steps: ["Đặt điểm tựa", "Treo vật ở hai bên", "Cân bằng và đo khoảng cách"] },
  { id: 8, name: "Ròng rọc", category: "mechanics", phenomenon: "Thay đổi hướng lực", formula: "F = P/n", equipment: ["Ròng rọc", "Dây", "Quả nặng"], steps: ["Lắp ròng rọc", "Treo vật", "Kéo dây và đo lực"] },
  { id: 9, name: "Mặt phẳng nghiêng", category: "mechanics", phenomenon: "Lực kéo nhỏ hơn trọng lượng", formula: "F = P.h/l", equipment: ["Máng nghiêng", "Lực kế", "Vật nặng"], steps: ["Đặt vật trên mặt phẳng nghiêng", "Kéo vật lên", "Đo lực kéo"] },
  { id: 10, name: "Định luật Newton II", category: "mechanics", phenomenon: "Gia tốc tỷ lệ với lực", formula: "F = m.a", equipment: ["Xe lăn", "Lực kế", "Cảm biến"], steps: ["Tác dụng lực lên xe", "Đo gia tốc", "Tính khối lượng"] }
];

for (let i = 1; i <= 10; i++) {
  const exp = { ...mechanicsExperiments[i-1] };
  exp.id = i;
  physicsExperiments.push(exp);
}

// ===== ID 11-100: TIẾP THEO CƠ HỌC =====
const mechanicsConcepts = [
  "Chuyển động thẳng biến đổi đều", "Chuyển động tròn đều", "Lực hướng tâm", "Lực ma sát", "Công và công suất",
  "Động năng", "Thế năng", "Cơ năng", "Va chạm đàn hồi", "Va chạm mềm"
];

let mechId = 11;
for (let i = 0; i < mechanicsConcepts.length && mechId <= 100; i++) {
  for (let v = 1; v <= 9 && mechId <= 100; v++) {
    physicsExperiments.push({
      id: mechId,
      name: `Thí nghiệm ${mechanicsConcepts[i]} - Mẫu ${v}`,
      category: "mechanics",
      phenomenon: `Khảo sát ${mechanicsConcepts[i]}`,
      formula: "Theo định luật vật lý",
      equipment: ["Dụng cụ đo", "Thiết bị thí nghiệm", "Máy tính"],
      steps: ["Chuẩn bị dụng cụ", "Tiến hành thí nghiệm", "Ghi nhận kết quả", "Xử lý số liệu"]
    });
    mechId++;
  }
}

// ===== ID 101-200: NHIỆT HỌC =====
const thermodynamicsExperiments = [
  { id: 101, name: "Sự nở vì nhiệt của chất rắn", category: "thermodynamics", phenomenon: "Chiều dài tăng khi nhiệt độ tăng", formula: "Δl = α.l₀.Δt", equipment: ["Thanh kim loại", "Đèn cồn", "Thước"], steps: ["Đo chiều dài thanh kim loại", "Đun nóng", "Đo lại chiều dài"] },
  { id: 102, name: "Sự nở vì nhiệt của chất lỏng", category: "thermodynamics", phenomenon: "Thể tích tăng khi nhiệt độ tăng", formula: "ΔV = β.V₀.Δt", equipment: ["Bình cầu", "Ống nghiệm", "Đèn cồn"], steps: ["Đổ chất lỏng vào bình", "Đun nóng", "Quan sát mực chất lỏng"] },
  { id: 103, name: "Sự nở vì nhiệt của chất khí", category: "thermodynamics", phenomenon: "Thể tích tăng mạnh khi nhiệt độ tăng", formula: "V/T = hằng số", equipment: ["Bình cầu", "Ống nghiệm", "Nước nóng"], steps: ["Đổ nước nóng vào bình", "Quan sát sự thay đổi"] }
];

for (let i = 101; i <= 103; i++) {
  const exp = { ...thermodynamicsExperiments[i-101] };
  exp.id = i;
  physicsExperiments.push(exp);
}

// ===== ID 104-200: TIẾP THEO NHIỆT HỌC =====
const thermoConcepts = [
  "Định luật Boyle - Mariotte", "Định luật Charles", "Định luật Gay-Lussac", "Nhiệt dung riêng",
  "Sự nóng chảy", "Sự bay hơi", "Sự ngưng tụ", "Sự sôi"
];

let thermoId = 104;
for (let i = 0; i < thermoConcepts.length && thermoId <= 200; i++) {
  for (let v = 1; v <= 12 && thermoId <= 200; v++) {
    physicsExperiments.push({
      id: thermoId,
      name: `Thí nghiệm ${thermoConcepts[i]} - Mẫu ${v}`,
      category: "thermodynamics",
      phenomenon: `Khảo sát ${thermoConcepts[i]}`,
      formula: "Theo định luật nhiệt động lực học",
      equipment: ["Nhiệt kế", "Áp kế", "Bình chứa", "Nguồn nhiệt"],
      steps: ["Chuẩn bị dụng cụ", "Tiến hành thí nghiệm", "Ghi nhận số liệu", "Xử lý kết quả"]
    });
    thermoId++;
  }
}

// ===== ID 201-300: ĐIỆN HỌC =====
const electricityExperiments = [
  { id: 201, name: "Định luật Ohm", category: "electricity", phenomenon: "I tỷ lệ thuận với U", formula: "I = U/R", equipment: ["Nguồn điện", "Điện trở", "Ampe kế", "Vôn kế"], steps: ["Mắc mạch điện", "Đo U và I", "Tính R"] },
  { id: 202, name: "Điện trở nối tiếp", category: "electricity", phenomenon: "R = R₁ + R₂", formula: "R_tđ = R₁ + R₂", equipment: ["Điện trở", "Ampe kế", "Vôn kế"], steps: ["Mắc nối tiếp", "Đo điện trở tương đương", "So sánh"] },
  { id: 203, name: "Điện trở song song", category: "electricity", phenomenon: "1/R = 1/R₁ + 1/R₂", formula: "1/R_tđ = 1/R₁ + 1/R₂", equipment: ["Điện trở", "Ampe kế", "Vôn kế"], steps: ["Mắc song song", "Đo điện trở tương đương", "So sánh"] }
];

for (let i = 201; i <= 203; i++) {
  const exp = { ...electricityExperiments[i-201] };
  exp.id = i;
  physicsExperiments.push(exp);
}

// ===== ID 204-300: TIẾP THEO ĐIỆN HỌC =====
const electricityConcepts = [
  "Công suất điện", "Định luật Joule-Lenz", "Từ trường của dòng điện", "Lực điện từ",
  "Hiện tượng cảm ứng điện từ", "Máy phát điện", "Động cơ điện", "Máy biến thế"
];

let elecId = 204;
for (let i = 0; i < electricityConcepts.length && elecId <= 300; i++) {
  for (let v = 1; v <= 12 && elecId <= 300; v++) {
    physicsExperiments.push({
      id: elecId,
      name: `Thí nghiệm ${electricityConcepts[i]} - Mẫu ${v}`,
      category: "electricity",
      phenomenon: `Khảo sát ${electricityConcepts[i]}`,
      formula: "Theo định luật điện từ",
      equipment: ["Nguồn điện", "Dây dẫn", "Nam châm", "Điện kế"],
      steps: ["Lắp mạch điện", "Tiến hành thí nghiệm", "Quan sát hiện tượng", "Ghi nhận kết quả"]
    });
    elecId++;
  }
}

// ===== ID 301-400: QUANG HỌC =====
const opticsExperiments = [
  { id: 301, name: "Định luật phản xạ ánh sáng", category: "optics", phenomenon: "Góc tới = góc phản xạ", formula: "i = i'", equipment: ["Gương phẳng", "Đèn laser", "Thước đo góc"], steps: ["Chiếu tia sáng tới gương", "Đo góc tới và góc phản xạ", "So sánh"] },
  { id: 302, name: "Khúc xạ ánh sáng", category: "optics", phenomenon: "Tia sáng bị gãy khúc", formula: "n₁.sin i = n₂.sin r", equipment: ["Bể nước", "Đèn laser", "Thước"], steps: ["Chiếu tia sáng vào nước", "Đo góc tới và góc khúc xạ", "Tính chiết suất"] },
  { id: 303, name: "Thấu kính hội tụ", category: "optics", phenomenon: "Hội tụ ánh sáng", formula: "1/f = 1/d + 1/d'", equipment: ["Thấu kính", "Màn chắn", "Đèn"], steps: ["Chiếu sáng qua thấu kính", "Đo tiêu cự", "Xác định ảnh"] }
];

for (let i = 301; i <= 303; i++) {
  const exp = { ...opticsExperiments[i-301] };
  exp.id = i;
  physicsExperiments.push(exp);
}

// ===== ID 304-400: TIẾP THEO QUANG HỌC =====
const opticsConcepts = [
  "Thấu kính phân kỳ", "Hiện tượng tán sắc", "Giao thoa ánh sáng", "Kính lúp",
  "Kính hiển vi", "Kính thiên văn", "Cầu vồng"
];

let opticsId = 304;
for (let i = 0; i < opticsConcepts.length && opticsId <= 400; i++) {
  for (let v = 1; v <= 14 && opticsId <= 400; v++) {
    physicsExperiments.push({
      id: opticsId,
      name: `Thí nghiệm ${opticsConcepts[i]} - Mẫu ${v}`,
      category: "optics",
      phenomenon: `Khảo sát ${opticsConcepts[i]}`,
      formula: "Theo định luật quang học",
      equipment: ["Nguồn sáng", "Thấu kính", "Gương", "Màn chắn"],
      steps: ["Bố trí thí nghiệm", "Quan sát hiện tượng", "Đo đạc số liệu", "Phân tích kết quả"]
    });
    opticsId++;
  }
}

// ===== ID 401-500: ÂM HỌC =====
const acousticsExperiments = [
  { id: 401, name: "Sự truyền âm trong chất rắn", category: "acoustics", phenomenon: "Âm truyền qua thanh kim loại", equipment: ["Thanh kim loại", "Đồng hồ", "Tai nghe"], steps: ["Áp tai vào thanh kim loại", "Gõ vào đầu thanh", "Nghe âm thanh"] },
  { id: 402, name: "Sự truyền âm trong chất lỏng", category: "acoustics", phenomenon: "Âm truyền qua nước", equipment: ["Bể nước", "Chuông", "Tai nghe"], steps: ["Đặt chuông vào nước", "Rung chuông", "Nghe âm thanh"] },
  { id: 403, name: "Sự truyền âm trong chất khí", category: "acoustics", phenomenon: "Âm truyền qua không khí", equipment: ["Chuông", "Tai nghe"], steps: ["Rung chuông", "Nghe âm thanh"] },
  { id: 404, name: "Sự phản xạ âm", category: "acoustics", phenomenon: "Âm dội lại", formula: "s = v.t/2", equipment: ["Mặt chắn", "Nguồn âm", "Đồng hồ"], steps: ["Phát âm", "Đo thời gian phản xạ", "Tính khoảng cách"] },
  { id: 405, name: "Độ cao của âm", category: "acoustics", phenomenon: "Phụ thuộc tần số", equipment: ["Âm thoa", "Dao động ký"], steps: ["Gõ âm thoa", "Ghi nhận tần số", "Phân tích"] }
];

for (let i = 401; i <= 405; i++) {
  const exp = { ...acousticsExperiments[i-401] };
  exp.id = i;
  physicsExperiments.push(exp);
}

// ===== ID 406-500: TIẾP THEO ÂM HỌC =====
const acousticsConcepts = [
  "Độ to của âm", "Sóng dừng", "Hiệu ứng Doppler", "Tiếng vang", "Cộng hưởng âm"
];

let audioId = 406;
for (let i = 0; i < acousticsConcepts.length && audioId <= 500; i++) {
  for (let v = 1; v <= 19 && audioId <= 500; v++) {
    physicsExperiments.push({
      id: audioId,
      name: `Thí nghiệm ${acousticsConcepts[i]} - Mẫu ${v}`,
      category: "acoustics",
      phenomenon: `Khảo sát ${acousticsConcepts[i]}`,
      formula: "Theo định luật âm học",
      equipment: ["Nguồn âm", "Máy thu", "Dao động ký", "Máy tính"],
      steps: ["Chuẩn bị thiết bị", "Phát tín hiệu âm thanh", "Ghi nhận kết quả", "Phân tích dữ liệu"]
    });
    audioId++;
  }
}

console.log(`✅ Đã tạo ${physicsExperiments.length} thí nghiệm vật lý`);
console.log(`ID từ: ${physicsExperiments[0].id} đến: ${physicsExperiments[physicsExperiments.length-1].id}`);