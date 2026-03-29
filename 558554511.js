// ===== CẬP NHẬT POST SCHEMA =====
// Thêm vào PostSchema hiện có

const PostSchema = new mongoose.Schema({
  // ... existing fields ...
  isApproved: { type: Boolean, default: false }, // Cần admin duyệt
  isHidden: { type: Boolean, default: false },
  rejectionReason: { type: String },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  // ... existing fields ...
});

// ===== CẬP NHẬT MATERIAL SCHEMA =====
// Thêm vào MaterialSchema hiện có

const MaterialSchema = new mongoose.Schema({
  // ... existing fields ...
  isApproved: { type: Boolean, default: false }, // Cần admin duyệt
  isPublished: { type: Boolean, default: true },
  rejectionReason: { type: String },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  // ... existing fields ...
});