// src/components/TermsModal.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaTimesCircle, FaScroll, FaArrowDown, FaEdit } from 'react-icons/fa';

const TermsModal = ({ onAgree, onClose, isAdmin = false }) => {
  const { user, api } = useAuth();
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef(null);
  
  useEffect(() => {
    fetchTerms();
  }, []);
  
  const fetchTerms = async () => {
    try {
      const response = await api.get('/terms');
      setTerms(response.data);
    } catch (err) {
      console.error('Failed to fetch terms:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setScrolledToBottom(true);
    }
  };
  
  const handleAgree = async () => {
    if (!agreed || !scrolledToBottom) return;
    
    setIsSubmitting(true);
    try {
      await api.post('/terms/agree', { version: terms.version });
      onAgree();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">Đang tải điều khoản...</div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b">
          <FaScroll className="text-2xl text-green-600" />
          <h2 className="text-xl font-bold">{terms?.title || 'Điều khoản dịch vụ'}</h2>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              Phiên bản {terms?.version}
            </span>
            {isAdmin && (
              <button 
                onClick={() => window.location.href = '/admin/terms/edit'}
                className="text-blue-500 hover:text-blue-700"
              >
                <FaEdit />
              </button>
            )}
          </div>
        </div>
        
        {/* Nội dung điều khoản */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-xl"
          onScroll={handleScroll}
        >
          {terms?.sections?.map((section, idx) => (
            <div key={idx} className="mb-5 last:mb-0">
              <h3 className="font-bold text-lg mb-2 text-gray-800">{section.title}</h3>
              <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                {section.content}
              </div>
            </div>
          ))}
          
          {/* Hiển thị ngày hiệu lực */}
          <div className="mt-4 pt-3 border-t text-xs text-gray-400">
            Có hiệu lực từ: {new Date(terms?.effectiveDate).toLocaleDateString('vi-VN')}
          </div>
        </div>
        
        {/* Phần đồng ý */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 mb-4 p-3 bg-yellow-50 rounded-lg">
            <FaArrowDown className="text-yellow-600 animate-bounce" />
            <span className="text-sm text-yellow-800">
              Vui lòng đọc kỹ điều khoản trước khi đồng ý
            </span>
          </div>
          
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={!scrolledToBottom}
              className="w-5 h-5 cursor-pointer disabled:opacity-50"
            />
            <span className="text-sm">
              Tôi đã đọc và hiểu rõ <strong className="text-green-600">Điều khoản dịch vụ</strong> của SmartEdu
            </span>
          </label>
          
          {!scrolledToBottom && (
            <div className="bg-orange-50 p-2 rounded-lg mb-3">
              <p className="text-xs text-orange-600 text-center">
                📜 Vui lòng cuộn xuống hết nội dung điều khoản để kích hoạt nút đồng ý
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleAgree}
              disabled={!agreed || !scrolledToBottom || isSubmitting}
              className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? (
                'Đang xử lý...'
              ) : (
                <>
                  <FaCheckCircle /> Đồng ý và tiếp tục
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2 transition"
            >
              <FaTimesCircle /> Từ chối và thoát
            </button>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-3">
            Bằng cách nhấn "Đồng ý và tiếp tục", bạn xác nhận đã đọc và chấp nhận 
            <button className="text-green-600 underline mx-1">Điều khoản dịch vụ</button>
            và
            <button className="text-green-600 underline mx-1">Chính sách bảo mật</button>
            của SmartEdu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;