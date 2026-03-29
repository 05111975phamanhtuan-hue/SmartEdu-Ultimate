// src/admin/WithdrawalApproval.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaTimesCircle, FaClock, FaShieldAlt, FaMoneyBillWave } from 'react-icons/fa';

const WithdrawalApproval = () => {
  const { user, api } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [codes, setCodes] = useState(['', '', '', '', '']);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  const isSuperAdmin = user?.role === 'super_admin';
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  const fetchRequests = async () => {
    try {
      const response = await api.get('/admin/withdraw/requests');
      setRequests(response.data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStep1Approve = async (requestId) => {
    setProcessingId(requestId);
    try {
      await api.post(`/admin/withdraw/approve-step1/${requestId}`);
      alert('Đã duyệt bước 1. Đang chờ super admin xác nhận bước 2.');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleStep2Approve = async () => {
    if (!selectedRequest) return;
    
    const emptyCode = codes.some(code => !code.trim());
    if (emptyCode) {
      alert('Vui lòng nhập đủ 5 mã bảo mật');
      return;
    }
    
    setProcessingId(selectedRequest._id);
    try {
      const response = await api.post(`/super-admin/withdraw/approve-step2/${selectedRequest._id}`, { codes });
      alert(response.data.message);
      setShowCodeModal(false);
      setCodes(['', '', '', '', '']);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleReject = async (requestId) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;
    
    setProcessingId(requestId);
    try {
      await api.post(`/admin/withdraw/reject/${requestId}`, { reason });
      alert('Đã từ chối yêu cầu rút tiền');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setProcessingId(null);
    }
  };
  
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"><FaClock /> Chờ duyệt</span>;
      case 'approved_by_admin':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Đã duyệt bước 1</span>;
      case 'approved_by_super':
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Đã duyệt bước 2</span>;
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"><FaCheckCircle /> Hoàn thành</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"><FaTimesCircle /> Từ chối</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };
  
  if (loading) {
    return <div className="text-center py-10">Đang tải...</div>;
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">💰 Quản lý yêu cầu rút tiền</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2">
          <FaShieldAlt className="text-yellow-600" />
          <p className="text-sm text-yellow-800">
            {isSuperAdmin 
              ? '🔐 Super Admin: Bạn cần nhập 5 mã bảo mật để duyệt bước 2.'
              : '🔐 Admin: Bạn có thể duyệt bước 1. Sau đó super admin sẽ duyệt bước 2.'}
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Không có yêu cầu rút tiền nào
          </div>
        ) : (
          requests.map(req => (
            <div key={req._id} className="bg-white rounded-xl shadow-md p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg">{req.userName}</div>
                  <div className="text-sm text-gray-500">{req.userEmail}</div>
                </div>
                {getStatusBadge(req.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Số tiền rút</div>
                  <div className="text-xl font-bold text-green-600">{req.amount.toLocaleString()}đ</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phí rút</div>
                  <div className="text-sm text-orange-500">- {req.fee.toLocaleString()}đ</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Thực nhận</div>
                  <div className="font-medium">{req.amount.toLocaleString()}đ</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ngân hàng</div>
                  <div className="text-sm">{req.bankInfo?.bankName} - {req.bankInfo?.accountNumber}</div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-3">
                {req.status === 'pending' && !isSuperAdmin && (
                  <button
                    onClick={() => handleStep1Approve(req._id)}
                    disabled={processingId === req._id}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {processingId === req._id ? 'Đang xử lý...' : 'Duyệt bước 1'}
                  </button>
                )}
                
                {req.status === 'approved_by_admin' && isSuperAdmin && (
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowCodeModal(true);
                    }}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                  >
                    <FaShieldAlt className="inline mr-1" /> Duyệt bước 2 (5 mã)
                  </button>
                )}
                
                {req.status === 'pending' && (
                  <button
                    onClick={() => handleReject(req._id)}
                    disabled={processingId === req._id}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Modal nhập 5 mã bảo mật */}
      {showCodeModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">🔐 Xác nhận rút tiền</h2>
            <p className="text-gray-600 mb-4">
              Yêu cầu rút <span className="font-bold text-green-600">{selectedRequest.amount.toLocaleString()}đ</span> của <strong>{selectedRequest.userName}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-4">Vui lòng nhập 5 mã bảo mật để xác nhận:</p>
            
            <div className="flex gap-2 mb-4">
              {codes.map((code, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const newCodes = [...codes];
                    newCodes[idx] = e.target.value.toUpperCase();
                    setCodes(newCodes);
                    if (e.target.value.length === 6 && idx < 4) {
                      document.getElementById(`code-${idx + 1}`)?.focus();
                    }
                  }}
                  id={`code-${idx}`}
                  className="w-16 h-16 text-center text-2xl font-mono border rounded-lg focus:ring-2 focus:ring-purple-500"
                  maxLength="6"
                  placeholder={`Mã ${idx + 1}`}
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleStep2Approve}
                disabled={processingId === selectedRequest._id}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {processingId === selectedRequest._id ? 'Đang xử lý...' : 'Xác nhận rút tiền'}
              </button>
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setSelectedRequest(null);
                  setCodes(['', '', '', '', '']);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalApproval;