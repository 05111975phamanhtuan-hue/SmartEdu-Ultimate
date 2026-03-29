// src/components/DepositModal.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCopy, FaCheck, FaBank } from 'react-icons/fa';

const DepositModal = ({ isOpen, onClose }) => {
  const { api } = useAuth();
  const [amount, setAmount] = useState(50000);
  const [selectedBank, setSelectedBank] = useState('vcb');
  const [banks, setBanks] = useState([]);
  const [depositInfo, setDepositInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await api.get('/banks');
      setBanks(response.data);
    } catch (err) {}
  };

  const handleDeposit = async () => {
    try {
      const response = await api.post('/wallet/deposit', { amount, bankId: selectedBank });
      setDepositInfo(response.data.bankInfo);
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">💳 Nạp tiền vào ví</h2>
        
        {!depositInfo ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Số tiền (VNĐ)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="flex-1 p-2 border rounded-lg"
                  min="50000"
                  step="10000"
                />
                <div className="flex gap-1">
                  <button onClick={() => setAmount(50000)} className="px-3 py-2 bg-gray-100 rounded-lg">50k</button>
                  <button onClick={() => setAmount(100000)} className="px-3 py-2 bg-gray-100 rounded-lg">100k</button>
                  <button onClick={() => setAmount(200000)} className="px-3 py-2 bg-gray-100 rounded-lg">200k</button>
                  <button onClick={() => setAmount(500000)} className="px-3 py-2 bg-gray-100 rounded-lg">500k</button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Tối thiểu 50,000 VNĐ</div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Ngân hàng nhận</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    🏦 {bank.name} - {bank.accountNumber}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleDeposit}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 mb-3"
            >
              Tạo yêu cầu nạp tiền
            </button>
            
            <div className="text-xs text-gray-500 text-center">
              ⚡ Sau khi chuyển khoản, admin sẽ xác nhận và cộng tiền vào ví trong 24h
            </div>
          </>
        ) : (
          <div>
            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <div className="font-bold mb-2">📝 Thông tin chuyển khoản</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngân hàng:</span>
                  <span className="font-medium">{depositInfo.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tài khoản:</span>
                  <span className="font-mono font-medium flex items-center gap-1">
                    {depositInfo.accountNumber}
                    <button onClick={() => copyToClipboard(depositInfo.accountNumber)} className="text-blue-500">
                      {copied ? <FaCheck /> : <FaCopy />}
                    </button>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chủ tài khoản:</span>
                  <span className="font-medium">{depositInfo.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-bold text-green-600">{depositInfo.amount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nội dung:</span>
                  <span className="font-mono text-sm">{depositInfo.content}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <div className="text-sm font-medium mb-1">✨ Hướng dẫn:</div>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                <li>Mở app ngân hàng, chọn "Chuyển khoản"</li>
                <li>Nhập thông tin tài khoản trên</li>
                <li>Nhập số tiền <b>{depositInfo.amount.toLocaleString()}đ</b></li>
                <li>Nhập nội dung: <b>{depositInfo.content}</b></li>
                <li>Xác nhận chuyển khoản</li>
                <li>Sau 24h, admin sẽ xác nhận và cộng tiền vào ví</li>
              </ol>
            </div>
            
            <button
              onClick={() => {
                setDepositInfo(null);
                onClose();
              }}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Đóng
            </button>
          </div>
        )}
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
    </div>
  );
};

export default DepositModal;