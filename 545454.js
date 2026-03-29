// ============= admin_hierarchy.js - PHÂN CẤP ADMIN =============

const AdminHierarchySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  role: { type: String, enum: ['super_admin', 'admin'], required: true }, // super_admin = admin chính
  permissions: {
    withdraw: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false },
    manageContent: { type: Boolean, default: false },
    manageAdmins: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AdminHierarchy = mongoose.model('AdminHierarchy', AdminHierarchySchema);

// ===== MODEL YÊU CẦU RÚT TIỀN CẦN DUYỆT =====
const WithdrawalApprovalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // người yêu cầu rút
  userName: { type: String },
  userEmail: { type: String },
  amount: { type: Number, required: true }, // số tiền muốn rút
  fee: { type: Number, default: 500 }, // phí rút 500đ
  totalDeduct: { type: Number, required: true }, // tổng trừ (amount + fee)
  bankInfo: {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved_by_admin', 'approved_by_super', 'processing', 'completed', 'rejected'], 
    default: 'pending' 
  },
  approvedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin phụ duyệt
  approvedBySuper: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin chính duyệt
  approvedByAdminAt: { type: Date },
  approvedBySuperAt: { type: Date },
  completedAt: { type: Date },
  rejectionReason: { type: String },
  rejectionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transactionId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const WithdrawalApproval = mongoose.model('WithdrawalApproval', WithdrawalApprovalSchema);

// ===== MODEL GIAO DỊCH VÍ TỔNG (ADMIN WALLET) =====
const AdminWalletSchema = new mongoose.Schema({
  totalBalance: { type: Number, default: 0 }, // tổng tiền user nạp vào
  availableForWithdrawal: { type: Number, default: 0 }, // tiền có thể rút (từ bán tài liệu)
  pendingWithdrawals: { type: Number, default: 0 }, // tiền đang chờ rút
  totalWithdrawn: { type: Number, default: 0 }, // tổng đã rút
  transactions: [{
    type: { type: String, enum: ['deposit', 'material_purchase', 'material_sale', 'withdrawal', 'fee'], required: true },
    amount: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: String,
    createdAt: { type: Date, default: Date.now }
  }],
  updatedAt: { type: Date, default: Date.now }
});

const AdminWallet = mongoose.model('AdminWallet', AdminWalletSchema);