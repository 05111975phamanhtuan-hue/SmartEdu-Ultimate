// src/components/LessonViewer.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaBook, FaLightbulb, FaPen, FaFlask, FaCheckCircle } from 'react-icons/fa';

const LessonViewer = ({ lessonId }) => {
  const { user, api } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await api.get(`/lesson/${lessonId}`);
      setLesson(response.data.lesson);
    } catch (err) {
      console.error('Failed to fetch lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    let correct = 0;
    const total = lesson.recognitionExercises?.length || 0;
    
    lesson.recognitionExercises.forEach((ex, idx) => {
      if (answers[idx] && answers[idx].toLowerCase() === ex.answer.toLowerCase()) {
        correct++;
      }
    });
    
    const finalScore = total > 0 ? (correct / total) * 100 : 100;
    setScore(finalScore);
    setSubmitted(true);
    
    if (finalScore >= 70) {
      try {
        await api.post('/lesson/complete', { lessonId, score: finalScore });
      } catch (err) {}
    }
  };

  if (loading) {
    return <div className="text-center py-10">📖 Đang tải bài học...</div>;
  }

  if (!lesson) {
    return <div className="text-center py-10 text-red-500">Không tìm thấy bài học</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white mb-6">
        <div className="text-sm opacity-90">
          {lesson.subject === 'toan' && 'Toán học'}
          {lesson.subject === 'van' && 'Ngữ văn'}
          {lesson.subject === 'anh' && 'Tiếng Anh'}
          {lesson.subject === 'ly' && 'Vật lý'}
          {lesson.subject === 'hoa' && 'Hóa học'}
          {lesson.subject === 'sinh' && 'Sinh học'}
          {lesson.subject === 'su' && 'Lịch sử'}
          {lesson.subject === 'dia' && 'Địa lý'}
          {' • Lớp '}{lesson.grade}
        </div>
        <h1 className="text-2xl font-bold mt-2">{lesson.title}</h1>
        <div className="flex gap-3 mt-3 text-sm">
          <span className="flex items-center gap-1">⭐ {lesson.xpReward} XP</span>
          <span className="flex items-center gap-1">💎 +1 khi hoàn thành</span>
        </div>
      </div>
      
      {/* Lý thuyết */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 text-green-600 mb-4">
          <FaBook />
          <h2 className="text-xl font-bold">📖 Lý thuyết</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">1. Khái niệm</h3>
            <p className="text-gray-700 leading-relaxed">{lesson.theory?.concept}</p>
          </div>
          
          {lesson.keyPoints && (
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Điểm chính</h3>
              <ul className="list-disc list-inside space-y-1">
                {lesson.keyPoints.map((point, idx) => (
                  <li key={idx} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
          )}
          
          {lesson.formula && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">📐 Công thức</h3>
              <div className="font-mono text-lg text-center">{lesson.formula}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Ví dụ minh họa */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 text-orange-500 mb-4">
          <FaLightbulb />
          <h2 className="text-xl font-bold">💡 Ví dụ minh họa</h2>
        </div>
        
        <div className="space-y-4">
          {lesson.examples?.map((ex, idx) => (
            <div key={idx} className="border-l-4 border-orange-400 pl-4 py-2">
              <div className="font-medium">Ví dụ {idx + 1}</div>
              <div className="text-gray-700 mt-1">{ex.question}</div>
              <div className="bg-gray-50 p-3 rounded-lg mt-2">
                <div className="text-green-600 font-medium">Giải:</div>
                <div className="text-gray-600">{ex.solution}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bài tập nhận biết */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 text-blue-500 mb-4">
          <FaPen />
          <h2 className="text-xl font-bold">📝 Bài tập nhận biết</h2>
        </div>
        
        <div className="space-y-4">
          {lesson.recognitionExercises?.map((ex, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="font-medium">{idx + 1}. {ex.question}</div>
              
              {!submitted ? (
                <input
                  type="text"
                  value={answers[idx] || ''}
                  onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                  placeholder="Nhập đáp án..."
                  className="w-full mt-2 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <div className="mt-2">
                  <div className={`p-2 rounded-lg ${answers[idx]?.toLowerCase() === ex.answer.toLowerCase() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span className="font-medium">Đáp án: {ex.answer}</span>
                    {answers[idx]?.toLowerCase() !== ex.answer.toLowerCase() && (
                      <div className="text-sm mt-1">✅ {ex.explanation}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {!submitted && (
          <button
            onClick={handleSubmitQuiz}
            className="w-full mt-4 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
          >
            Nộp bài
          </button>
        )}
        
        {submitted && score !== null && (
          <div className={`mt-4 p-4 rounded-lg text-center ${score >= 70 ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="text-2xl font-bold">{Math.round(score)}%</div>
            <div className="text-sm">
              {score >= 70 ? '🎉 Chúc mừng! Bạn đã hoàn thành bài học!' : '📚 Hãy xem lại lý thuyết và thử lại!'}
            </div>
          </div>
        )}
      </div>
      
      {/* Bài tập vận dụng */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 text-purple-500 mb-4">
          <FaFlask />
          <h2 className="text-xl font-bold">🎯 Bài tập vận dụng</h2>
        </div>
        
        <div className="space-y-4">
          {lesson.applicationExercises?.map((ex, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="font-medium">{idx + 1}. {ex.question}</div>
              <button
                onClick={() => setShowAnswers({ ...showAnswers, [idx]: !showAnswers[idx] })}
                className="mt-2 text-blue-500 text-sm hover:underline"
              >
                {showAnswers[idx] ? 'Ẩn đáp án' : 'Xem đáp án'}
              </button>
              {showAnswers[idx] && (
                <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                  <div className="text-green-600 font-medium">Đáp án:</div>
                  <div className="text-gray-700">{ex.answer}</div>
                  <div className="text-gray-500 text-sm mt-1">💡 {ex.explanation}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Hướng dẫn thực hành */}
      {lesson.practicalGuide && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <FaCheckCircle />
            <h2 className="text-xl font-bold">🔧 Hướng dẫn thực hành</h2>
          </div>
          <div className="space-y-3">
            {lesson.practicalGuide.map((guide, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg">
                <div className="font-medium">{guide.title}</div>
                <div className="text-gray-600 text-sm mt-1">{guide.content}</div>
                <div className="text-gray-500 text-xs mt-2">📌 {guide.tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonViewer;