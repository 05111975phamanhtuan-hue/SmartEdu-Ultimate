// ============= biology_lab_data.js - 500 MẪU VẬT SINH HỌC =============

const biologySpecimens = [];

// ===== ID 1-100: TẾ BÀO VÀ MÔ =====
const cellsAndTissues = [
  { id: 1, name: "Tế bào thực vật", category: "cells", structure: ["Vách tế bào", "Màng sinh chất", "Nhân", "Lục lạp", "Không bào"], tool: "Kính hiển vi", magnification: "40x-400x" },
  { id: 2, name: "Tế bào động vật", category: "cells", structure: ["Màng sinh chất", "Nhân", "Tế bào chất", "Ti thể"], tool: "Kính hiển vi", magnification: "40x-400x" },
  { id: 3, name: "Tế bào vi khuẩn", category: "cells", structure: ["Màng tế bào", "Thành tế bào", "Vùng nhân", "Plasmid"], tool: "Kính hiển vi", magnification: "1000x" },
  { id: 4, name: "Tế bào hồng cầu", category: "cells", structure: ["Màng tế bào", "Hemoglobin", "Không có nhân"], tool: "Kính hiển vi", magnification: "400x" },
  { id: 5, name: "Tế bào thần kinh", category: "cells", structure: ["Thân", "Sợi nhánh", "Sợi trục"], tool: "Kính hiển vi", magnification: "400x" },
  { id: 6, name: "Tế bào cơ", category: "cells", structure: ["Sợi cơ", "Nhân", "Vân ngang"], tool: "Kính hiển vi", magnification: "400x" },
  { id: 7, name: "Mô biểu bì", category: "tissues", structure: ["Tế bào xếp sít nhau"], tool: "Kính hiển vi", magnification: "100x" },
  { id: 8, name: "Mô cơ", category: "tissues", structure: ["Sợi cơ co giãn"], tool: "Kính hiển vi", magnification: "100x" },
  { id: 9, name: "Mô liên kết", category: "tissues", structure: ["Sợi collagen", "Tế bào liên kết"], tool: "Kính hiển vi", magnification: "100x" },
  { id: 10, name: "Mô thần kinh", category: "tissues", structure: ["Nơron", "Tế bào thần kinh đệm"], tool: "Kính hiển vi", magnification: "100x" }
];

for (let i = 1; i <= 10; i++) {
  const specimen = { ...cellsAndTissues[i-1] };
  specimen.id = i;
  biologySpecimens.push(specimen);
}

// ===== ID 11-100: TIẾP THEO TẾ BÀO =====
const cellTypes = [
  "Tế bào biểu bì hành tây", "Tế bào khoai tây", "Tế bào lá cây", "Tế bào rễ cây", "Tế bào cánh hoa",
  "Tế bào máu", "Tế bào gan", "Tế bào thận", "Tế bào tim", "Tế bào phổi"
];

let cellId = 11;
for (let i = 0; i < cellTypes.length && cellId <= 100; i++) {
  for (let v = 1; v <= 9 && cellId <= 100; v++) {
    biologySpecimens.push({
      id: cellId,
      name: `${cellTypes[i]} - Mẫu ${v}`,
      category: "cells",
      structure: ["Màng tế bào", "Nhân", "Tế bào chất", "Bào quan"],
      tool: "Kính hiển vi",
      magnification: "40x-400x"
    });
    cellId++;
  }
}

// ===== ID 101-200: CƠ QUAN =====
const organs = [
  { id: 101, name: "Tim", category: "organs", structure: ["Tâm nhĩ trái", "Tâm nhĩ phải", "Tâm thất trái", "Tâm thất phải"], function: "Bơm máu", tool: "Mô hình 3D" },
  { id: 102, name: "Phổi", category: "organs", structure: ["Phế quản", "Phế nang"], function: "Trao đổi khí", tool: "Mô hình 3D" },
  { id: 103, name: "Gan", category: "organs", structure: ["Tế bào gan", "Túi mật"], function: "Lọc máu", tool: "Mô hình 3D" },
  { id: 104, name: "Dạ dày", category: "organs", structure: ["Tâm vị", "Thân vị", "Môn vị"], function: "Tiêu hóa", tool: "Mô hình 3D" },
  { id: 105, name: "Não", category: "organs", structure: ["Đại não", "Tiểu não", "Hành não"], function: "Điều khiển", tool: "Mô hình 3D" },
  { id: 106, name: "Thận", category: "organs", structure: ["Vỏ thận", "Tủy thận", "Nephron"], function: "Lọc máu", tool: "Mô hình 3D" },
  { id: 107, name: "Mắt", category: "organs", structure: ["Giác mạc", "Thủy tinh thể", "Võng mạc"], function: "Nhìn", tool: "Mô hình 3D" },
  { id: 108, name: "Tai", category: "organs", structure: ["Tai ngoài", "Tai giữa", "Tai trong"], function: "Nghe", tool: "Mô hình 3D" },
  { id: 109, name: "Da", category: "organs", structure: ["Biểu bì", "Hạ bì"], function: "Bảo vệ", tool: "Mô hình 3D" },
  { id: 110, name: "Xương", category: "organs", structure: ["Màng xương", "Mô xương", "Tủy xương"], function: "Nâng đỡ", tool: "Mô hình 3D" }
];

for (let i = 101; i <= 110; i++) {
  const specimen = { ...organs[i-101] };
  specimen.id = i;
  biologySpecimens.push(specimen);
}

// ===== ID 111-200: TIẾP THEO CƠ QUAN =====
const organList = [
  "Ruột non", "Ruột già", "Tụy", "Lách", "Tuyến giáp", "Tuyến yên", "Tuyến thượng thận", "Buồng trứng", "Tinh hoàn", "Tử cung"
];

let organId = 111;
for (let i = 0; i < organList.length && organId <= 200; i++) {
  for (let v = 1; v <= 9 && organId <= 200; v++) {
    biologySpecimens.push({
      id: organId,
      name: `${organList[i]} - Mẫu ${v}`,
      category: "organs",
      structure: ["Cấu trúc chính", "Mô đặc trưng", "Mạch máu", "Thần kinh"],
      function: "Chức năng sinh lý",
      tool: "Mô hình 3D"
    });
    organId++;
  }
}

// ===== ID 201-300: HỆ CƠ QUAN =====
const systems = [
  { id: 201, name: "Hệ tuần hoàn", category: "systems", structure: ["Tim", "Động mạch", "Tĩnh mạch", "Mao mạch"], function: "Vận chuyển máu", tool: "Mô hình 3D" },
  { id: 202, name: "Hệ hô hấp", category: "systems", structure: ["Mũi", "Khí quản", "Phế quản", "Phổi"], function: "Trao đổi khí", tool: "Mô hình 3D" },
  { id: 203, name: "Hệ tiêu hóa", category: "systems", structure: ["Miệng", "Thực quản", "Dạ dày", "Ruột"], function: "Tiêu hóa", tool: "Mô hình 3D" },
  { id: 204, name: "Hệ thần kinh", category: "systems", structure: ["Não", "Tủy sống", "Dây thần kinh"], function: "Điều khiển", tool: "Mô hình 3D" },
  { id: 205, name: "Hệ bài tiết", category: "systems", structure: ["Thận", "Niệu quản", "Bàng quang"], function: "Bài tiết", tool: "Mô hình 3D" },
  { id: 206, name: "Hệ vận động", category: "systems", structure: ["Xương", "Cơ", "Khớp"], function: "Vận động", tool: "Mô hình 3D" },
  { id: 207, name: "Hệ sinh dục nam", category: "systems", structure: ["Tinh hoàn", "Mào tinh", "Ống dẫn tinh"], function: "Sinh sản", tool: "Mô hình 3D" },
  { id: 208, name: "Hệ sinh dục nữ", category: "systems", structure: ["Buồng trứng", "Tử cung", "Vòi trứng"], function: "Sinh sản", tool: "Mô hình 3D" },
  { id: 209, name: "Hệ nội tiết", category: "systems", structure: ["Tuyến yên", "Tuyến giáp", "Tuyến tụy"], function: "Điều hòa", tool: "Mô hình 3D" },
  { id: 210, name: "Hệ bạch huyết", category: "systems", structure: ["Hạch bạch huyết", "Lách", "Mạch bạch huyết"], function: "Miễn dịch", tool: "Mô hình 3D" }
];

for (let i = 201; i <= 210; i++) {
  const specimen = { ...systems[i-201] };
  specimen.id = i;
  biologySpecimens.push(specimen);
}

// ===== ID 211-300: TIẾP THEO HỆ CƠ QUAN =====
const systemList = [
  "Hệ miễn dịch", "Hệ bạch huyết", "Hệ da", "Hệ cơ xương khớp", "Hệ sinh sản",
  "Hệ nội tiết", "Hệ tiết niệu", "Hệ vận động", "Hệ cảm giác"
];

let systemId = 211;
for (let i = 0; i < systemList.length && systemId <= 300; i++) {
  for (let v = 1; v <= 10 && systemId <= 300; v++) {
    biologySpecimens.push({
      id: systemId,
      name: `${systemList[i]} - Mô hình ${v}`,
      category: "systems",
      structure: ["Cấu trúc 1", "Cấu trúc 2", "Cấu trúc 3", "Cấu trúc 4"],
      function: "Chức năng chính của hệ",
      tool: "Mô hình 3D tương tác"
    });
    systemId++;
  }
}

// ===== ID 301-400: VI SINH VẬT =====
const microorganisms = [
  { id: 301, name: "Vi khuẩn E.coli", category: "microorganisms", structure: ["Hình que", "Tiên mao"], tool: "Kính hiển vi", magnification: "1000x" },
  { id: 302, name: "Nấm men", category: "microorganisms", structure: ["Hình cầu", "Nảy chồi"], tool: "Kính hiển vi", magnification: "400x" },
  { id: 303, name: "Trùng giày", category: "microorganisms", structure: ["Hình đế giày", "Lông bơi"], tool: "Kính hiển vi", magnification: "100x" },
  { id: 304, name: "Trùng biến hình", category: "microorganisms", structure: ["Hình dạng thay đổi", "Chân giả"], tool: "Kính hiển vi", magnification: "100x" },
  { id: 305, name: "Tảo lục", category: "microorganisms", structure: ["Hình sợi", "Lục lạp"], tool: "Kính hiển vi", magnification: "400x" }
];

for (let i = 301; i <= 305; i++) {
  const specimen = { ...microorganisms[i-301] };
  specimen.id = i;
  biologySpecimens.push(specimen);
}

// ===== ID 306-400: TIẾP THEO VI SINH VẬT =====
const microbeList = [
  "Vi khuẩn lao", "Vi khuẩn tả", "Vi khuẩn thương hàn", "Vi khuẩn uốn ván", "Vi khuẩn tụ cầu",
  "Nấm mốc", "Nấm men rượu", "Trùng sốt rét", "Trùng kiết lỵ", "Virus HIV", "Virus Corona"
];

let microbeId = 306;
for (let i = 0; i < microbeList.length && microbeId <= 400; i++) {
  for (let v = 1; v <= 9 && microbeId <= 400; v++) {
    biologySpecimens.push({
      id: microbeId,
      name: `${microbeList[i]} - Chủng ${v}`,
      category: "microorganisms",
      structure: ["Cấu trúc đặc trưng", "Vỏ protein", "Vật chất di truyền"],
      tool: "Kính hiển vi điện tử",
      magnification: "10000x"
    });
    microbeId++;
  }
}

// ===== ID 401-500: THỰC VẬT VÀ ĐỘNG VẬT =====
const plantsAndAnimals = [
  { id: 401, name: "Rêu", category: "plants", structure: ["Thân", "Lá", "Rễ giả"], tool: "Kính lúp" },
  { id: 402, name: "Dương xỉ", category: "plants", structure: ["Rễ", "Thân rễ", "Lá non cuộn tròn"], tool: "Kính lúp" },
  { id: 403, name: "Thông", category: "plants", structure: ["Rễ cọc", "Thân gỗ", "Lá kim"], tool: "Mô hình" },
  { id: 404, name: "Cây một lá mầm", category: "plants", structure: ["Rễ chùm", "Lá có gân song song"], tool: "Mô hình" },
  { id: 405, name: "Cây hai lá mầm", category: "plants", structure: ["Rễ cọc", "Lá có gân hình mạng"], tool: "Mô hình" }
];

for (let i = 401; i <= 405; i++) {
  const specimen = { ...plantsAndAnimals[i-401] };
  specimen.id = i;
  biologySpecimens.push(specimen);
}

// ===== ID 406-500: TIẾP THEO ĐỘNG VẬT =====
const animalList = [
  "Cá chép", "Ếch đồng", "Thằn lằn", "Chim bồ câu", "Thỏ",
  "Giun đất", "Châu chấu", "Trai sông", "Mực", "Tôm sông"
];

let animalId = 406;
for (let i = 0; i < animalList.length && animalId <= 500; i++) {
  for (let v = 1; v <= 10 && animalId <= 500; v++) {
    biologySpecimens.push({
      id: animalId,
      name: `${animalList[i]} - Mẫu vật ${v}`,
      category: "animals",
      structure: ["Cơ quan nội tạng", "Hệ thần kinh", "Hệ tuần hoàn", "Hệ tiêu hóa"],
      tool: "Mô hình 3D có thể mổ xẻ"
    });
    animalId++;
  }
}

console.log(`✅ Đã tạo ${biologySpecimens.length} mẫu vật sinh học`);
console.log(`ID từ: ${biologySpecimens[0].id} đến: ${biologySpecimens[biologySpecimens.length-1].id}`);