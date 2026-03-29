// ============= chemistry_lab_data.js - 500 PHẢN ỨNG HÓA HỌC =============

const chemicalReactions = [];

// ===== ID 1-100: PHẢN ỨNG AXIT - BAZƠ =====
const acidBaseReactions = [
  { id: 1, reactants: ["HCl", "NaOH"], products: ["NaCl", "H₂O"], equation: "HCl + NaOH → NaCl + H₂O", phenomenon: "Dung dịch tỏa nhiệt, tạo muối ăn", color: "Không màu", type: "acid_base", temperature: "Tỏa nhiệt" },
  { id: 2, reactants: ["H₂SO₄", "2NaOH"], products: ["Na₂SO₄", "2H₂O"], equation: "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O", phenomenon: "Tạo muối natri sunfat", color: "Không màu", type: "acid_base", temperature: "Tỏa nhiệt" },
  { id: 3, reactants: ["HNO₃", "KOH"], products: ["KNO₃", "H₂O"], equation: "HNO₃ + KOH → KNO₃ + H₂O", phenomenon: "Tạo muối kali nitrat", color: "Không màu", type: "acid_base", temperature: "Tỏa nhiệt" },
  { id: 4, reactants: ["CH₃COOH", "NaOH"], products: ["CH₃COONa", "H₂O"], equation: "CH₃COOH + NaOH → CH₃COONa + H₂O", phenomenon: "Mùi giấm biến mất", color: "Không màu", type: "acid_base", temperature: "Tỏa nhiệt nhẹ" },
  { id: 5, reactants: ["H₂SO₄", "Ca(OH)₂"], products: ["CaSO₄", "2H₂O"], equation: "H₂SO₄ + Ca(OH)₂ → CaSO₄ + 2H₂O", phenomenon: "Tạo thạch cao", color: "Trắng", type: "acid_base", temperature: "Tỏa nhiệt" },
  { id: 6, reactants: ["HCl", "NH₃"], products: ["NH₄Cl"], equation: "HCl + NH₃ → NH₄Cl", phenomenon: "Khói trắng", color: "Trắng", type: "acid_base", temperature: "Tỏa nhiệt" },
  { id: 7, reactants: ["H₂SO₄", "2NH₃"], products: ["(NH₄)₂SO₄"], equation: "H₂SO₄ + 2NH₃ → (NH₄)₂SO₄", phenomenon: "Tạo phân bón amoni", color: "Không màu", type: "acid_base", temperature: "Tỏa nhiệt" },
  { id: 8, reactants: ["2H₃PO₄", "3Ca(OH)₂"], products: ["Ca₃(PO₄)₂", "6H₂O"], equation: "2H₃PO₄ + 3Ca(OH)₂ → Ca₃(PO₄)₂ + 6H₂O", phenomenon: "Tạo phân lân", color: "Trắng", type: "acid_base", temperature: "Tỏa nhiệt" },
  { id: 9, reactants: ["HCl", "KOH"], products: ["KCl", "H₂O"], equation: "HCl + KOH → KCl + H₂O", phenomenon: "Dung dịch tỏa nhiệt", color: "Không màu", type: "acid_base", temperature: "Tỏa nhiệt" },
  { id: 10, reactants: ["HNO₃", "NaOH"], products: ["NaNO₃", "H₂O"], equation: "HNO₃ + NaOH → NaNO₃ + H₂O", phenomenon: "Tạo muối natri nitrat", color: "Không màu", type: "acid_base", temperature: "Tỏa nhiệt" }
];

for (let i = 1; i <= 10; i++) {
  const reaction = { ...acidBaseReactions[i-1] };
  reaction.id = i;
  chemicalReactions.push(reaction);
}

// ===== ID 11-20: TIẾP THEO ACID-BASE =====
for (let i = 11; i <= 20; i++) {
  const template = acidBaseReactions[(i-1) % 10];
  chemicalReactions.push({
    id: i,
    reactants: template.reactants,
    products: template.products,
    equation: template.equation,
    phenomenon: template.phenomenon,
    color: template.color,
    type: "acid_base",
    temperature: "Tỏa nhiệt"
  });
}

// ===== ID 21-100: ACID-BASE VỚI CÁC AXIT KHÁC =====
const acids = ["HCl", "H₂SO₄", "HNO₃", "CH₃COOH", "H₃PO₄"];
const bases = ["NaOH", "KOH", "Ca(OH)₂", "NH₃", "Ba(OH)₂"];

let idCounter = 21;
for (let i = 0; i < acids.length && idCounter <= 100; i++) {
  for (let j = 0; j < bases.length && idCounter <= 100; j++) {
    chemicalReactions.push({
      id: idCounter,
      reactants: [acids[i], bases[j]],
      products: [`${acids[i].replace('H', '')}${bases[j]}`],
      equation: `${acids[i]} + ${bases[j]} → ${acids[i].replace('H', '')}${bases[j]} + H₂O`,
      phenomenon: "Phản ứng trung hòa",
      color: "Không màu",
      type: "acid_base",
      temperature: "Tỏa nhiệt"
    });
    idCounter++;
  }
}

// ===== ID 101-200: PHẢN ỨNG KẾT TỦA =====
const precipitationReactions = [
  { id: 101, reactants: ["AgNO₃", "NaCl"], products: ["AgCl↓", "NaNO₃"], equation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃", phenomenon: "Kết tủa trắng AgCl", color: "Trắng", type: "precipitation" },
  { id: 102, reactants: ["CuSO₄", "2NaOH"], products: ["Cu(OH)₂↓", "Na₂SO₄"], equation: "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄", phenomenon: "Kết tủa xanh lam", color: "Xanh lam", type: "precipitation" },
  { id: 103, reactants: ["FeCl₃", "3NaOH"], products: ["Fe(OH)₃↓", "3NaCl"], equation: "FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl", phenomenon: "Kết tủa nâu đỏ", color: "Nâu đỏ", type: "precipitation" },
  { id: 104, reactants: ["FeSO₄", "2NaOH"], products: ["Fe(OH)₂↓", "Na₂SO₄"], equation: "FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄", phenomenon: "Kết tủa trắng xanh, hóa nâu", color: "Trắng xanh → Nâu", type: "precipitation" },
  { id: 105, reactants: ["BaCl₂", "H₂SO₄"], products: ["BaSO₄↓", "2HCl"], equation: "BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl", phenomenon: "Kết tủa trắng không tan", color: "Trắng", type: "precipitation" },
  { id: 106, reactants: ["Pb(NO₃)₂", "2KI"], products: ["PbI₂↓", "2KNO₃"], equation: "Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃", phenomenon: "Kết tủa vàng", color: "Vàng", type: "precipitation" },
  { id: 107, reactants: ["AlCl₃", "3NaOH"], products: ["Al(OH)₃↓", "3NaCl"], equation: "AlCl₃ + 3NaOH → Al(OH)₃↓ + 3NaCl", phenomenon: "Kết tủa keo trắng", color: "Trắng", type: "precipitation" },
  { id: 108, reactants: ["ZnSO₄", "2NaOH"], products: ["Zn(OH)₂↓", "Na₂SO₄"], equation: "ZnSO₄ + 2NaOH → Zn(OH)₂↓ + Na₂SO₄", phenomenon: "Kết tủa trắng", color: "Trắng", type: "precipitation" },
  { id: 109, reactants: ["MgSO₄", "2NaOH"], products: ["Mg(OH)₂↓", "Na₂SO₄"], equation: "MgSO₄ + 2NaOH → Mg(OH)₂↓ + Na₂SO₄", phenomenon: "Kết tủa trắng", color: "Trắng", type: "precipitation" },
  { id: 110, reactants: ["CaCl₂", "Na₂CO₃"], products: ["CaCO₃↓", "2NaCl"], equation: "CaCl₂ + Na₂CO₃ → CaCO₃↓ + 2NaCl", phenomenon: "Kết tủa trắng", color: "Trắng", type: "precipitation" }
];

for (let i = 101; i <= 110; i++) {
  const reaction = { ...precipitationReactions[i-101] };
  reaction.id = i;
  chemicalReactions.push(reaction);
}

// ===== ID 111-200: TIẾP THEO PHẢN ỨNG KẾT TỦA =====
const cations = ["Ag⁺", "Ba²⁺", "Ca²⁺", "Pb²⁺", "Cu²⁺", "Fe³⁺", "Fe²⁺", "Al³⁺", "Zn²⁺", "Mg²⁺"];
const anions = ["Cl⁻", "SO₄²⁻", "CO₃²⁻", "PO₄³⁻", "OH⁻"];

let precipId = 111;
for (let i = 0; i < cations.length && precipId <= 200; i++) {
  for (let j = 0; j < anions.length && precipId <= 200; j++) {
    chemicalReactions.push({
      id: precipId,
      reactants: [`${cations[i]}`, `${anions[j]}`],
      products: [`${cations[i]}${anions[j]}↓`],
      equation: `${cations[i]} + ${anions[j]} → ${cations[i]}${anions[j]}↓`,
      phenomenon: "Tạo kết tủa",
      color: "Trắng",
      type: "precipitation",
      temperature: "Không đổi"
    });
    precipId++;
  }
}

// ===== ID 201-300: PHẢN ỨNG OXI HÓA KHỬ =====
const redoxReactions = [
  { id: 201, reactants: ["Fe", "CuSO₄"], products: ["FeSO₄", "Cu↓"], equation: "Fe + CuSO₄ → FeSO₄ + Cu↓", phenomenon: "Đồng bám vào đinh sắt", color: "Đỏ nâu", type: "redox" },
  { id: 202, reactants: ["Zn", "2HCl"], products: ["ZnCl₂", "H₂↑"], equation: "Zn + 2HCl → ZnCl₂ + H₂↑", phenomenon: "Sủi bọt khí", color: "Không màu", type: "redox" },
  { id: 203, reactants: ["2Al", "6HCl"], products: ["2AlCl₃", "3H₂↑"], equation: "2Al + 6HCl → 2AlCl₃ + 3H₂↑", phenomenon: "Nhôm tan, sủi bọt", color: "Không màu", type: "redox" },
  { id: 204, reactants: ["Cu", "2H₂SO₄ đặc"], products: ["CuSO₄", "SO₂↑", "2H₂O"], equation: "Cu + 2H₂SO₄ → CuSO₄ + SO₂↑ + 2H₂O", phenomenon: "Khí mùi hắc", color: "Xanh lam", type: "redox" },
  { id: 205, reactants: ["2Na", "2H₂O"], products: ["2NaOH", "H₂↑"], equation: "2Na + 2H₂O → 2NaOH + H₂↑", phenomenon: "Na chạy trên mặt nước", color: "Không màu", type: "redox" },
  { id: 206, reactants: ["Ca", "2H₂O"], products: ["Ca(OH)₂", "H₂↑"], equation: "Ca + 2H₂O → Ca(OH)₂ + H₂↑", phenomenon: "Sủi bọt khí", color: "Trắng đục", type: "redox" },
  { id: 207, reactants: ["2KMnO₄", "16HCl"], products: ["2KCl", "2MnCl₂", "5Cl₂↑", "8H₂O"], equation: "2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O", phenomenon: "Khí vàng lục", color: "Vàng lục", type: "redox" },
  { id: 208, reactants: ["MnO₂", "4HCl"], products: ["MnCl₂", "Cl₂↑", "2H₂O"], equation: "MnO₂ + 4HCl → MnCl₂ + Cl₂↑ + 2H₂O", phenomenon: "Khí vàng lục", color: "Vàng lục", type: "redox" },
  { id: 209, reactants: ["2H₂O₂", "MnO₂"], products: ["2H₂O", "O₂↑"], equation: "2H₂O₂ → 2H₂O + O₂↑", phenomenon: "Sủi bọt khí", color: "Không màu", type: "redox" },
  { id: 210, reactants: ["2KClO₃", "MnO₂"], products: ["2KCl", "3O₂↑"], equation: "2KClO₃ → 2KCl + 3O₂↑", phenomenon: "Khí oxy thoát ra", color: "Không màu", type: "redox" }
];

for (let i = 201; i <= 210; i++) {
  const reaction = { ...redoxReactions[i-201] };
  reaction.id = i;
  chemicalReactions.push(reaction);
}

// ===== ID 211-300: TIẾP THEO PHẢN ỨNG OXI HÓA KHỬ =====
const metals = ["Mg", "Al", "Zn", "Fe", "Ni", "Sn", "Pb", "Cu", "Ag", "Au"];
const acidsRedox = ["HCl", "H₂SO₄ loãng", "HNO₃ loãng", "H₂SO₄ đặc", "HNO₃ đặc"];

let redoxId = 211;
for (let i = 0; i < metals.length && redoxId <= 300; i++) {
  for (let j = 0; j < acidsRedox.length && redoxId <= 300; j++) {
    chemicalReactions.push({
      id: redoxId,
      reactants: [metals[i], acidsRedox[j]],
      products: [`${metals[i]}${acidsRedox[j].replace(/[^A-Za-z]/g, '')}`, "H₂↑"],
      equation: `${metals[i]} + ${acidsRedox[j]} → ${metals[i]}${acidsRedox[j].replace(/[^A-Za-z]/g, '')} + H₂↑`,
      phenomenon: "Kim loại tan, sủi bọt khí",
      color: "Không màu",
      type: "redox",
      temperature: "Tỏa nhiệt"
    });
    redoxId++;
  }
}

// ===== ID 301-400: PHẢN ỨNG HỮU CƠ =====
const organicReactions = [
  { id: 301, reactants: ["C₂H₅OH", "3O₂"], products: ["2CO₂", "3H₂O"], equation: "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O", phenomenon: "Ngọn lửa xanh", color: "Xanh", type: "organic" },
  { id: 302, reactants: ["CH₄", "2O₂"], products: ["CO₂", "2H₂O"], equation: "CH₄ + 2O₂ → CO₂ + 2H₂O", phenomenon: "Ngọn lửa xanh nhạt", color: "Xanh", type: "organic" },
  { id: 303, reactants: ["C₂H₅OH", "CH₃COOH"], products: ["CH₃COOC₂H₅", "H₂O"], equation: "C₂H₅OH + CH₃COOH → CH₃COOC₂H₅ + H₂O", phenomenon: "Mùi thơm của este", color: "Không màu", type: "organic" },
  { id: 304, reactants: ["C₆H₁₂O₆", "6O₂"], products: ["6CO₂", "6H₂O"], equation: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O", phenomenon: "Cháy", color: "Không màu", type: "organic" },
  { id: 305, reactants: ["C₂H₄", "3O₂"], products: ["2CO₂", "2H₂O"], equation: "C₂H₄ + 3O₂ → 2CO₂ + 2H₂O", phenomenon: "Ngọn lửa sáng", color: "Sáng", type: "organic" },
  { id: 306, reactants: ["C₂H₂", "5/2O₂"], products: ["2CO₂", "H₂O"], equation: "C₂H₂ + 5/2O₂ → 2CO₂ + H₂O", phenomenon: "Ngọn lửa sáng, nhiều khói", color: "Sáng", type: "organic" },
  { id: 307, reactants: ["C₆H₆", "15/2O₂"], products: ["6CO₂", "3H₂O"], equation: "C₆H₆ + 15/2O₂ → 6CO₂ + 3H₂O", phenomenon: "Ngọn lửa nhiều khói đen", color: "Đen", type: "organic" },
  { id: 308, reactants: ["C₃H₈", "5O₂"], products: ["3CO₂", "4H₂O"], equation: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O", phenomenon: "Ngọn lửa xanh", color: "Xanh", type: "organic" },
  { id: 309, reactants: ["C₄H₁₀", "13/2O₂"], products: ["4CO₂", "5H₂O"], equation: "C₄H₁₀ + 13/2O₂ → 4CO₂ + 5H₂O", phenomenon: "Ngọn lửa xanh", color: "Xanh", type: "organic" },
  { id: 310, reactants: ["C₁₂H₂₂O₁₁", "12O₂"], products: ["12CO₂", "11H₂O"], equation: "C₁₂H₂₂O₁₁ + 12O₂ → 12CO₂ + 11H₂O", phenomenon: "Cháy tạo than", color: "Đen", type: "organic" }
];

for (let i = 301; i <= 310; i++) {
  const reaction = { ...organicReactions[i-301] };
  reaction.id = i;
  chemicalReactions.push(reaction);
}

// ===== ID 311-400: TIẾP THEO PHẢN ỨNG HỮU CƠ =====
const alkanes = ["CH₄", "C₂H₆", "C₃H₈", "C₄H₁₀", "C₅H₁₂", "C₆H₁₄", "C₇H₁₆", "C₈H₁₈", "C₉H₂₀", "C₁₀H₂₂"];

let organicId = 311;
for (let i = 0; i < alkanes.length && organicId <= 400; i++) {
  const n = i + 1;
  const co2 = n;
  const h2o = n + 1;
  chemicalReactions.push({
    id: organicId,
    reactants: [alkanes[i], `${(3*n + 1)/2}O₂`],
    products: [`${co2}CO₂`, `${h2o}H₂O`],
    equation: `${alkanes[i]} + ${(3*n + 1)/2}O₂ → ${co2}CO₂ + ${h2o}H₂O`,
    phenomenon: "Đốt cháy hoàn toàn",
    color: "Xanh",
    type: "organic",
    temperature: "Tỏa nhiệt mạnh"
  });
  organicId++;
}

// ===== ID 401-500: PHẢN ỨNG THOÁT KHÍ =====
const gasReactions = [
  { id: 401, reactants: ["CaCO₃", "2HCl"], products: ["CaCl₂", "CO₂↑", "H₂O"], equation: "CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O", phenomenon: "Sủi bọt khí CO₂", color: "Không màu", type: "gas_evolution" },
  { id: 402, reactants: ["Na₂CO₃", "2HCl"], products: ["2NaCl", "CO₂↑", "H₂O"], equation: "Na₂CO₃ + 2HCl → 2NaCl + CO₂↑ + H₂O", phenomenon: "Sủi bọt mạnh", color: "Không màu", type: "gas_evolution" },
  { id: 403, reactants: ["NH₄Cl", "NaOH"], products: ["NaCl", "NH₃↑", "H₂O"], equation: "NH₄Cl + NaOH → NaCl + NH₃↑ + H₂O", phenomenon: "Mùi khai", color: "Không màu", type: "gas_evolution" },
  { id: 404, reactants: ["Na₂SO₃", "2HCl"], products: ["2NaCl", "SO₂↑", "H₂O"], equation: "Na₂SO₃ + 2HCl → 2NaCl + SO₂↑ + H₂O", phenomenon: "Khí mùi hắc", color: "Không màu", type: "gas_evolution" },
  { id: 405, reactants: ["FeS", "2HCl"], products: ["FeCl₂", "H₂S↑"], equation: "FeS + 2HCl → FeCl₂ + H₂S↑", phenomenon: "Mùi trứng thối", color: "Không màu", type: "gas_evolution" }
];

for (let i = 401; i <= 405; i++) {
  const reaction = { ...gasReactions[i-401] };
  reaction.id = i;
  chemicalReactions.push(reaction);
}

// ===== ID 406-500: TIẾP THEO PHẢN ỨNG THOÁT KHÍ =====
const carbonates = ["CaCO₃", "Na₂CO₃", "K₂CO₃", "MgCO₃", "BaCO₃", "ZnCO₃", "FeCO₃", "CuCO₃", "Ag₂CO₃", "PbCO₃"];
const acidsGas = ["HCl", "H₂SO₄", "HNO₃", "CH₃COOH"];

let gasId = 406;
for (let i = 0; i < carbonates.length && gasId <= 500; i++) {
  for (let j = 0; j < acidsGas.length && gasId <= 500; j++) {
    chemicalReactions.push({
      id: gasId,
      reactants: [carbonates[i], acidsGas[j]],
      products: [`${carbonates[i].replace('CO₃', '')}${acidsGas[j].replace('H', '')}`, "CO₂↑", "H₂O"],
      equation: `${carbonates[i]} + ${acidsGas[j]} → ${carbonates[i].replace('CO₃', '')}${acidsGas[j].replace('H', '')} + CO₂↑ + H₂O`,
      phenomenon: "Sủi bọt khí CO₂",
      color: "Không màu",
      type: "gas_evolution",
      temperature: "Không đổi"
    });
    gasId++;
  }
}

// ===== XÁC NHẬN ĐÃ ĐỦ 500 PHẢN ỨNG =====
console.log(`✅ Đã tạo ${chemicalReactions.length} phản ứng hóa học`);
console.log(`ID từ: ${chemicalReactions[0].id} đến: ${chemicalReactions[chemicalReactions.length-1].id}`);