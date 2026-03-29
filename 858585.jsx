// src/components/admin/AdminRegisterRequest.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaShieldAlt, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

const AdminRegisterRequest = () => {
  const { user, api } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [step, setStep] = useState('form'); // form, verify, done
  
  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do đăng ký');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/admin/register-request', { reason });
      setRequestId(response.data.requestId);
      setStep('waiting');
      alert('Yêu cầu đã được gửi! Admin sẽ xem xét và liên hệ với bạn.');
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      alert('Vui lòng nhập mã xác thực');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/admin/verify-and-activate', {
        requestId,
        code: verificationCode
      });
      setStep('done');
      alert(response.data.message);
      // Refresh user info
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Mã xác thực không đúng');
    } finally {
      setLoading(false);
    }
  };
  
  if (user?.role === 'admin') {
    return (
      <div className="bg-green-50 rounded-xl p-6 text-center">
        <FaShieldAlt className="text-4xl text-green-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-green-600">Bạn đã là Admin!</h2>
        <p className="text-gray-600">Bạn có toàn quyền quản trị hệ thống.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaShieldAlt className="text-3xl text-purple-500" />
          <h1 className="text-2xl font-bold">Đăng ký làm Admin</h1>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ Lưu ý: Hệ thống chỉ hỗ trợ tối đa <strong>3 Admin</strong>. 
            Bạn sẽ cần xác thực qua Zalo <strong>0878860704</strong> để được kích hoạt quyền admin.
          </p>
        </div>
        
        {step === 'form' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Lý do đăng ký làm Admin</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Tôi muốn quản lý nội dung, hỗ trợ cộng đồng..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                rows="4"
              />
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu đăng ký'}
            </button>
          </>
        )}
        
        {step === 'waiting' && (
          <div className="text-center py-8">
            <FaClock className="text-4xl text-yellow-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-bold">Đang chờ admin xét duyệt</h3>
            <p className="text-gray-500 mt-2">
              Yêu cầu của bạn đã được gửi. Admin sẽ xem xét và liên hệ qua Zalo.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Nếu được chấp thuận, bạn sẽ nhận được mã xác thực qua Zalo <strong>0878860704</strong>
            </p>
          </div>
        )}
        
        {step === 'verify' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Mã xác thực từ Zalo</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Nhập mã 6 số"
                className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest"
                maxLength="6"
              />
              <p className="text-xs text-gray-500 mt-1">
                Vui lòng kiểm tra tin nhắn Zalo từ số <strong>0878860704</strong>
              </p>
            </div>
            
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận và kích hoạt Admin'}
            </button>
          </>
        )}
        
        {step === 'done' && (
          <div className="text-center py-8">
            <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-600">Kích hoạt thành công!</h3>
            <p className="text-gray-600 mt-2">
              Chúc mừng! Bạn đã trở thành Admin của SmartEdu.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Hãy sử dụng quyền hạn một cách có trách nhiệm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegisterRequest;