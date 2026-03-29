// src/components/WalletCard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaWallet, FaGem, FaExchangeAlt, FaMoneyBillWave } from 'react-icons/fa';

const WalletCard = () => {
  const { user, api } = useAuth();
  const [balance, setBalance] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showBuyDiamondsModal, setShowBuyDiamondsModal] = useState(false);
  const [amount, setAmount] = useState(50000);
  const [selectedBank, setSelectedBank] = useState('vcb');
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    fetchWallet();
    fetchBanks();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await api.get('/wallet');
      setBalance(response.data.balance);
      setDiamonds(response.data.diamonds);
    } catch (err) {}
  };

  const fetchBanks = async () => {
    try {
      const response = await api.get('/banks');
      setBanks(response.data);
    } catch (err) {}
  };

  const handleDeposit = async () => {
    try {
      const response = await api.post('/wallet/deposit', { amount, bankId: selectedBank });
      alert(`Vui lòng chuyển ${amount.toLocaleString()}đ đến:\n\nNgân hàng: ${response.data.bankInfo.bankName}\nSố TK: ${response.data.bankInfo.accountNumber}\nChủ TK: ${response.data.bankInfo.accountName}\nNội dung: ${response.data.reference}`);
      setShowDepositModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleBuyDiamonds = async () => {
    try {
      const diamondsToBuy = Math.floor(amount / 500);
      const response = await api.post('/wallet/buy-diamonds', { diamonds: diamondsToBuy });
      setBalance(response.data.balance);
      setDiamonds(response.data.diamonds);
      alert(`Mua thành công ${diamondsToBuy} kim cương!`);
      setShowBuyDiamondsModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-5 text-white mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FaWallet className="text-2xl" />
            <span className="font-semibold">Ví SmartEdu</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{balance.toLocaleString()}đ</div>
            <div className="text-sm opacity-90">Số dư</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaGem className="text-2xl" />
            <div>
              <div className="text-xl font-bold">{diamonds}</div>
              <div className="text-xs opacity-90">Kim cương</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDepositModal(true)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm flex items-center gap-1"
            >
              <FaMoneyBillWave /> Nạp tiền
            </button>
            <button
              onClick={() => setShowBuyDiamondsModal(true)}
              className="bg-yellow-500 text-gray-800 hover:bg-yellow-400 px-4 py-2 rounded-lg text-sm flex items-center gap-1"
            >
              <FaExchangeAlt /> Mua 💎
            </button>
          </div>
        </div>
        
        <div className="mt-3 text-xs opacity-80">
          💎 100 kim cương = 50,000 VNĐ
        </div>
      </div>
      
      {/* Modal nạp tiền */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Nạp tiền vào ví</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Số tiền (VNĐ)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg"
                min="50000"
                step="10000"
              />
              <div className="text-xs text-gray-500 mt-1">Tối thiểu 50,000 VNĐ</div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Ngân hàng</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeposit}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
              >
                Xác nhận
              </button>
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal mua kim cương */}
      {showBuyDiamondsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Mua kim cương</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Số tiền (VNĐ)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg"
                min="50000"
                step="50000"
              />
              <div className="text-sm text-green-600 mt-2">
                Bạn sẽ nhận được: {Math.floor(amount / 500)} kim cương
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Tỷ giá: 500 VNĐ = 1 kim cương
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
              <div className="text-sm">Số dư hiện tại: {balance.toLocaleString()}đ</div>
              <div className="text-sm">Sau khi mua: {(balance - amount).toLocaleString()}đ</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBuyDiamonds}
                className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600"
              >
                Mua ngay
              </button>
              <button
                onClick={() => setShowBuyDiamondsModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletCard;