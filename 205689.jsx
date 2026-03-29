// src/components/LessonAssessment.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaBrain, FaCheckCircle, FaStar, FaSpinner } from 'react-icons/fa';

const LessonAssessment = ({ lessonId, lessonContent, onComplete }) => {
  const { api } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [essayAnswers, setEssayAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [step, setStep] = useState('start'); // start, taking, result
  
  const startAssessment = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/assess-lesson', {
        lessonId,
        lessonContent
      });
      setAssessment(response.data.assessment);
      setStep('taking');
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };
  
  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const response = await api.post('/ai/submit-assessment', {
        lessonId,
        mcqAnswers: assessment.mcq.map((q, idx) => ({
          question: q.question,
          options: q.options,
          userAnswer: mcqAnswers[idx],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        })),
        essayAnswers: assessment.essay.map((q, idx) => ({
          question: q.question,
          userAnswer: essayAnswers[idx] || '',
          modelAnswer: q.modelAnswer
        })),
        lessonContent
      });
      setResult(response.data.result);
      setStep('result');
      if (onComplete) onComplete(response.data.result);
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };
  
  const getLevelColor = (level) => {
    if (level >= 4) return 'bg-green-100 text-green-700';
    if (level >= 3) return 'bg-blue-100 text-blue-700';
    if (level >= 2) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };
  
  if (loading) {
    return (
      <div className="text-center py-10">
        <FaSpinner className="animate-spin text-3xl mx-auto mb-3" />
        <p>AI đang tạo bài đánh giá...</p>
      </div>
    );
  }
  
  if (step === 'start') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <FaBrain className="text-5xl text-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Đánh giá mức độ hiểu bài</h2>
        <p className="text-gray-600 mb-4">
          Bài đánh giá gồm 10 câu trắc nghiệm và 5 câu tự luận.<br />
          AI sẽ chấm điểm và đưa ra nhận xét chi tiết.
        </p>
        <button
          onClick={startAssessment}
          className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600"
        >
          Bắt đầu đánh giá
        </button>
      </div>
    );
  }
  
  if (step === 'taking') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📝 Đánh giá bài học</h2>
          <div className="text-sm text-gray-500">
            Trắc nghiệm: {Object.keys(mcqAnswers).length}/{assessment.mcq.length} | 
            Tự luận: {Object.keys(essayAnswers).length}/{assessment.essay.length}
          </div>
        </div>
        
        {/* Phần trắc nghiệm */}
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-3">A. Trắc nghiệm (10 câu)</h3>
          <div className="space-y-4">
            {assessment.mcq.map((q, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
                <div className="space-y-2 pl-4">
                  {q.options.map((opt, optIdx) => (
                    <label key={optIdx} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`mcq_${idx}`}
                        value={optIdx}
                        checked={mcqAnswers[idx] === optIdx}
                        onChange={() => setMcqAnswers({ ...mcqAnswers, [idx]: optIdx })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{String.fromCharCode(65 + optIdx)}. {opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Phần tự luận */}
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-3">B. Tự luận (5 câu)</h3>
          <div className="space-y-4">
            {assessment.essay.map((q, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
                <textarea
                  value={essayAnswers[idx] || ''}
                  onChange={(e) => setEssayAnswers({ ...essayAnswers, [idx]: e.target.value })}
                  placeholder="Nhập câu trả lời của bạn..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows="4"
                />
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={submitAssessment}
          disabled={submitting}
          className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
        >
          {submitting ? 'AI đang chấm bài...' : 'Nộp bài và xem kết quả'}
        </button>
      </div>
    );
  }
  
  if (step === 'result' && result) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className={`inline-block p-4 rounded-full ${getLevelColor(result.understandingLevel)} mb-3`}>
            <FaCheckCircle className="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold">Kết quả đánh giá</h2>
          <div className={`mt-2 inline-block px-4 py-2 rounded-full ${getLevelColor(result.understandingLevel)}`}>
            Mức độ {result.understandingLevel}/5 - {result.levelText}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{result.overallScore}%</div>
            <div className="text-sm text-gray-600">Tổng điểm</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{result.mcqScore}</div>
            <div className="text-sm text-gray-600">Trắc nghiệm</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{result.essayScore}</div>
            <div className="text-sm text-gray-600">Tự luận</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">+{result.xpGained} XP</div>
            <div className="text-sm text-gray-600">Nhận được</div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-bold mb-2">📝 Nhận xét từ AI</h3>
          <p className="text-gray-700">{result.feedback}</p>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-bold mb-2">💡 Gợi ý cải thiện</h3>
          <ul className="list-disc list-inside space-y-1">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="text-gray-700 text-sm">{rec}</li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full mt-4 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
        >
          Đóng
        </button>
      </div>
    );
  }
  
  return null;
};

export default LessonAssessment;