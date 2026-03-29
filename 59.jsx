// src/admin/PendingDeposits.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

const PendingDeposits = () => {
  const { api } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPendingDeposits();
  }, []);

  const fetchPendingDeposits = async () => {
    try {
      const response = await api.get('/admin/pending-deposits');
      setDeposits(response.data);
    } catch (err) {
      console.error('Failed to fetch deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeposit = async (transactionId, notes) => {
    if (!window.confirm('Xác nhận đã nhận tiền từ giao dịch này?')) return;
    
    setProcessing(transactionId);
    try {
      await api.post('/admin/confirm-deposit', { transactionId, notes });
      alert('Xác nhận thành công!');
      fetchPendingDeposits();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">💰 Giao dịch chờ xác nhận</h1>
      
      {deposits.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          <FaClock className="text-4xl mx-auto mb-3 text-gray-300" />
          <p>Không có giao dịch nào đang chờ xác nhận</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map(deposit => (
            <div key={deposit._id} className="bg-white rounded-xl shadow-md p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg">{deposit.user?.name}</div>
                  <div className="text-sm text-gray-500">{deposit.user?.email}</div>
                  <div className="text-sm text-gray-500">{deposit.user?.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {deposit.amount.toLocaleString()}đ
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(deposit.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-500">Ngân hàng:</span> {deposit.bankName}</div>
                  <div><span className="text-gray-500">Số TK:</span> {deposit.accountNumber}</div>
                  <div><span className="text-gray-500">Nội dung:</span> <span className="font-mono">{deposit.transactionId}</span></div>
                  <div><span className="text-gray-500">QR Code:</span> <a href={deposit.qrCodeUrl} target="_blank" className="text-blue-500">Xem</a></div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => confirmDeposit(deposit.transactionId, '')}
                  disabled={processing === deposit.transactionId}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  {processing === deposit.transactionId ? 'Đang xử lý...' : <><FaCheckCircle /> Xác nhận</>}
                </button>
                <button
                  onClick={() => confirmDeposit(deposit.transactionId, 'Từ chối')}
                  disabled={processing === deposit.transactionId}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                >
                  <FaTimesCircle /> Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingDeposits;