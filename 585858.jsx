// src/components/seller/WithdrawModal.js (Cập nhật)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaMoneyBillWave, FaBank, FaShieldAlt, FaInfoCircle, FaReceipt } from 'react-icons/fa';

const WithdrawModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, api } = useAuth();
  const [withdrawInfo, setWithdrawInfo] = useState(null);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      fetchWithdrawInfo();
    }
  }, [isOpen]);
  
  const fetchWithdrawInfo = async () => {
    try {
      const response = await api.get('/seller/withdraw-info');
      setWithdrawInfo(response.data);
      setBanks(response.data.supportedBanks);
      if (response.data.bankInfo) {
        setBankName(response.data.bankInfo.bankName);
        setAccountNumber(response.data.bankInfo.accountNumber);
        setAccountName(response.data.bankInfo.accountName);
      }
    } catch (err) {
      console.error('Failed to fetch withdraw info:', err);
    }
  };
  
  const handleWithdraw = async () => {
    setError('');
    
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount < withdrawInfo?.minWithdrawAmount) {
      setError(`Số tiền rút tối thiểu ${withdrawInfo?.minWithdrawAmount?.toLocaleString()} VNĐ`);
      return;
    }
    
    const totalNeeded = numAmount + withdrawInfo?.withdrawalFee;
    if (totalNeeded > withdrawInfo?.balance) {
      setError(`Số dư trong ví không đủ (cần ${totalNeeded.toLocaleString()}đ bao gồm phí rút ${withdrawInfo?.withdrawalFee.toLocaleString()}đ)`);
      return;
    }
    
    if (!bankName || !accountNumber || !accountName) {
      setError('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/seller/withdraw', {
        amount: numAmount,
        bankName,
        accountNumber,
        accountName
      });
      
      alert(response.data.message);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  const receivedAmount = parseInt(amount) || 0;
  const fee = withdrawInfo?.withdrawalFee || 500;
  const totalDeduct = receivedAmount + fee;
  const canWithdraw = receivedAmount >= withdrawInfo?.minWithdrawAmount && totalDeduct <= withdrawInfo?.balance;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">💰 Rút tiền về tài khoản ngân hàng</h2>
        
        {/* Số dư hiện tại */}
        <div className="bg-green-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Số dư khả dụng:</span>
            <span className="text-2xl font-bold text-green-600">
              {withdrawInfo?.balance?.toLocaleString()}đ
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Tổng phí đã đóng: {withdrawInfo?.totalFeesPaid?.toLocaleString()}đ
          </div>
          {!withdrawInfo?.canWithdraw && (
            <div className="mt-2 text-sm text-orange-600 flex items-center gap-1">
              <FaInfoCircle />
              Cần thêm {withdrawInfo?.remainingToMin?.toLocaleString()}đ để đạt mức rút tối thiểu
            </div>
          )}
        </div>
        
        {/* Số tiền rút */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Số tiền rút (VNĐ)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Tối thiểu ${withdrawInfo?.minWithdrawAmount?.toLocaleString()}đ`}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <div className="text-xs text-gray-500 mt-1 flex justify-between">
            <span>💰 Phí rút: {fee.toLocaleString()}đ</span>
            <span>📥 Thực nhận: {receivedAmount.toLocaleString()}đ</span>
          </div>
        </div>
        
        {/* Thông tin ngân hàng */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Ngân hàng</label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Chọn ngân hàng</option>
            {banks.map(bank => (
              <option key={bank.id} value={bank.name}>{bank.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Số tài khoản</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Nhập số tài khoản"
            className="w-full p-2 border rounded-lg"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Chủ tài khoản</label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Nhập tên chủ tài khoản"
            className="w-full p-2 border rounded-lg"
          />
        </div>
        
        {/* Tóm tắt giao dịch */}
        {receivedAmount > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FaReceipt className="text-gray-500" />
              <span className="font-medium text-sm">Tóm tắt giao dịch</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Số tiền rút:</span>
                <span>{receivedAmount.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Phí rút tiền:</span>
                <span>- {fee.toLocaleString()}đ</span>
              </div>
              <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                <span>Tổng trừ từ ví:</span>
                <span>{totalDeduct.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Thực nhận:</span>
                <span>{receivedAmount.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        {/* Nút rút tiền */}
        <button
          onClick={handleWithdraw}
          disabled={loading || !canWithdraw}
          className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Đang xử lý...' : <><FaMoneyBillWave /> Rút {receivedAmount.toLocaleString()}đ (phí {fee.toLocaleString()}đ)</>}
        </button>
        
        <div className="mt-4 text-xs text-gray-400 text-center flex items-center justify-center gap-1">
          <FaShieldAlt />
          Tiền sẽ được chuyển vào tài khoản của bạn trong vòng 24h
        </div>
        
        <button onClick={onClose} className="mt-4 w-full text-gray-500 text-sm py-2">
          Hủy
        </button>
      </div>
    </div>
  );
};

export default WithdrawModal;