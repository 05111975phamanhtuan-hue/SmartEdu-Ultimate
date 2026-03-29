// ============= auto_withdrawal_with_fee.js - THÊM PHÍ RÚT 500đ =============

const MIN_WITHDRAWAL_AMOUNT = 500000; // 500.000 VNĐ tối thiểu
const WITHDRAWAL_FEE = 500; // 500đ phí mỗi lần rút

// ===== API: YÊU CẦU RÚT TIỀN (CÓ PHÍ 500đ) =====
app.post('/api/seller/withdraw', authenticateJWT, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    
    // 1. Kiểm tra số tiền rút
    if (!amount || amount < MIN_WITHDRAWAL_AMOUNT) {
      return res.status(400).json({ 
        error: `Số tiền rút tối thiểu ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()} VNĐ`,
        minAmount: MIN_WITHDRAWAL_AMOUNT
      });
    }
    
    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin ngân hàng' });
    }
    
    // 2. Tính tổng số tiền cần trừ (bao gồm phí rút)
    const totalDeduct = amount + WITHDRAWAL_FEE;
    
    // 3. Kiểm tra số dư BALANCE của người bán
    const user = await User.findById(req.userId);
    if (user.balance < totalDeduct) {
      return res.status(400).json({ 
        error: `Số dư trong ví không đủ (cần ${totalDeduct.toLocaleString()}đ bao gồm phí rút ${WITHDRAWAL_FEE.toLocaleString()}đ)`,
        balance: user.balance,
        requested: amount,
        fee: WITHDRAWAL_FEE,
        totalNeeded: totalDeduct
      });
    }
    
    // 4. Trừ BALANCE người bán (tiền ảo) - bao gồm cả phí rút
    user.balance -= totalDeduct;
    await user.save();
    
    // 5. Ghi nhận phí rút vào doanh thu của hệ thống
    const feeTransaction = new Transaction({
      user: req.userId,
      type: 'withdrawal_fee',
      amount: -WITHDRAWAL_FEE,
      description: `Phí rút tiền ${WITHDRAWAL_FEE.toLocaleString()}đ`,
      status: 'success',
      completedAt: new Date()
    });
    await feeTransaction.save();
    
    // 6. Ghi nhận giao dịch rút tiền
    const transaction = new Transaction({
      user: req.userId,
      type: 'withdraw',
      amount: -amount,
      description: `Rút ${amount.toLocaleString()}đ về ${bankName} - ${accountNumber} (phí ${WITHDRAWAL_FEE.toLocaleString()}đ)`,
      status: 'processing',
      bankInfo: { bankName, accountNumber, accountName },
      metadata: { fee: WITHDRAWAL_FEE },
      reference: `WITHDRAW_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    });
    await transaction.save();
    
    // 7. TẠO LỆNH CHUYỂN TIỀN TỰ ĐỘNG
    const transferResult = await autoTransferToBank({
      bankName,
      accountNumber,
      accountName,
      amount,
      transactionId: transaction._id
    });
    
    if (transferResult.success) {
      transaction.status = 'success';
      transaction.completedAt = new Date();
      await transaction.save();
      
      // Thông báo thành công
      await createNotification({
        userId: req.userId,
        type: 'withdraw_success',
        title: 'Rút tiền thành công',
        content: `Đã chuyển ${amount.toLocaleString()}đ vào tài khoản ${bankName} - ${accountNumber}. Phí rút: ${WITHDRAWAL_FEE.toLocaleString()}đ.`,
        data: { amount, fee: WITHDRAWAL_FEE, bankName, accountNumber }
      });
      
      res.json({
        success: true,
        message: `Rút tiền thành công! ${amount.toLocaleString()}đ đã được chuyển vào tài khoản của bạn. Phí rút: ${WITHDRAWAL_FEE.toLocaleString()}đ.`,
        remainingBalance: user.balance,
        transactionId: transaction._id,
        fee: WITHDRAWAL_FEE
      });
    } else {
      // Nếu chuyển thất bại, hoàn tiền lại vào ví (cả phí)
      user.balance += totalDeduct;
      await user.save();
      
      transaction.status = 'failed';
      transaction.adminNote = transferResult.error;
      await transaction.save();
      
      // Hoàn phí
      await Transaction.findOneAndDelete({ reference: feeTransaction._id });
      
      res.status(500).json({ 
        error: 'Chuyển tiền thất bại, vui lòng thử lại sau',
        details: transferResult.error
      });
    }
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: KIỂM TRA SỐ DƯ CÓ THỂ RÚT (CÓ TÍNH PHÍ) =====
app.get('/api/seller/withdraw-info', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const canWithdraw = user.balance >= (MIN_WITHDRAWAL_AMOUNT + WITHDRAWAL_FEE);
    const remainingToMin = canWithdraw ? 0 : (MIN_WITHDRAWAL_AMOUNT + WITHDRAWAL_FEE) - user.balance;
    
    // Lấy danh sách các ngân hàng hỗ trợ
    const supportedBanks = [
      { id: 'vcb', name: 'Vietcombank', code: 'VCB' },
      { id: 'vtb', name: 'Vietinbank', code: 'ICB' },
      { id: 'agb', name: 'Agribank', code: 'AGB' },
      { id: 'bidv', name: 'BIDV', code: 'BIDV' },
      { id: 'tcb', name: 'Techcombank', code: 'TCB' },
      { id: 'mb', name: 'MB Bank', code: 'MB' },
      { id: 'vp', name: 'VPBank', code: 'VPB' },
      { id: 'stb', name: 'Sacombank', code: 'STB' },
      { id: 'acb', name: 'ACB', code: 'ACB' },
      { id: 'shb', name: 'SHB', code: 'SHB' }
    ];
    
    // Lấy lịch sử rút tiền
    const withdrawalHistory = await Transaction.find({
      user: req.userId,
      type: 'withdraw'
    }).sort({ createdAt: -1 }).limit(20);
    
    // Tính tổng phí đã đóng
    const totalFees = await Transaction.aggregate([
      { $match: { user: req.userId, type: 'withdrawal_fee', status: 'success' } },
      { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
    ]);
    
    res.json({
      balance: user.balance,
      minWithdrawAmount: MIN_WITHDRAWAL_AMOUNT,
      withdrawalFee: WITHDRAWAL_FEE,
      totalNeeded: MIN_WITHDRAWAL_AMOUNT + WITHDRAWAL_FEE,
      canWithdraw,
      remainingToMin,
      totalFeesPaid: totalFees[0]?.total || 0,
      supportedBanks,
      withdrawalHistory: withdrawalHistory.map(w => ({
        amount: Math.abs(w.amount),
        fee: w.metadata?.fee || 0,
        bankInfo: w.bankInfo,
        status: w.status,
        createdAt: w.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== API: ADMIN XEM THỐNG KÊ PHÍ RÚT =====
app.get('/api/admin/withdrawal-fees', authenticateJWT, authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { type: 'withdrawal_fee', status: 'success' };
    
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    
    const fees = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: { $abs: "$amount" } }, count: { $sum: 1 } } }
    ]);
    
    const dailyFees = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: { $abs: "$amount" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      totalFees: fees[0]?.total || 0,
      totalWithdrawals: fees[0]?.count || 0,
      averageFeePerWithdrawal: fees[0]?.count > 0 ? fees[0]?.total / fees[0]?.count : 0,
      dailyFees
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});