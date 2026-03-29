// ============= MODEL: PENDING_DEPOSIT =============
const PendingDepositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  bankId: { type: String, required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountName: { type: String, required: true },
  reference: { type: String },
  transactionId: { type: String, unique: true, required: true },
  qrCodeUrl: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  adminNotes: { type: String },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const PendingDeposit = mongoose.model('PendingDeposit', PendingDepositSchema);