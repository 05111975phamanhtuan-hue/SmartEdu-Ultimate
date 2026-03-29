// src/components/LessonViewer.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaLock, FaPlay, FaStar, FaClock, FaGem, FaBolt } from 'react-icons/fa';

const LessonViewer = () => {
  const { lessonId } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [activeTab, setActiveTab] = useState('theory');
  const contentRef = useRef(null);
  
  useEffect(() => {
    fetchLesson();
  }, [lessonId]);
  
  const fetchLesson = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/lessons/${lessonId}`);
      setLesson(response.data.lesson);
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response.data.error);
      } else {
        setError('Không thể tải bài học');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleAnswerChange = (questionIndex, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };
  
  const handleSubmit = async () => {
    // Calculate score
    let correctCount = 0;
    lesson.exercises.basic.forEach((exercise, idx) => {
      if (quizAnswers[idx] && quizAnswers[idx].toLowerCase() === exercise.answer.toLowerCase()) {
        correctCount++;
      }
    });
    
    const score = (correctCount / lesson.exercises.basic.length) * 100;
    
    try {
      const response = await api.post(`/lessons/${lessonId}/complete`, {
        answers: quizAnswers,
        timeSpent: Math.floor((Date.now() - startTime) / 1000)
      });
      
      setResult(response.data);
      setSubmitted(true);
      
      // Play success sound
      const audio = new Audio('/sounds/success.mp3');
      audio.play();
    } catch (err) {
      if (err.response?.status === 400) {
        setResult(err.response.data);
        setSubmitted(true);
      } else {
        alert('Có lỗi xảy ra, vui lòng thử lại');
      }
    }
  };
  
  const startTime = useRef(Date.now());
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">📖 Đang tải bài học...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Không thể truy cập bài học</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          {error.includes('nâng cao') && (
            <button 
              onClick={() => navigate('/subscription')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Nâng cấp VIP
            </button>
          )}
          {error.includes('bài học trước') && (
            <button 
              onClick={() => navigate(-1)}
              className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Quay lại
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (!lesson) return null;
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Lesson Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm opacity-80">
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
            <div className="flex gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1"><FaClock /> {lesson.duration} phút</span>
              <span className="flex items-center gap-1"><FaStar /> {lesson.xpReward} XP</span>
              <span className="flex items-center gap-1"><FaGem /> +1💎</span>
              {user.energy >= 2 && <span className="flex items-center gap-1"><FaBolt /> +2⚡ khi hoàn thành</span>}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${
            lesson.difficulty === 'basic' ? 'bg-green-400' : 
            lesson.difficulty === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
          }`}>
            {lesson.difficulty === 'basic' ? 'Cơ bản' : 
             lesson.difficulty === 'intermediate' ? 'Nâng cao' : 'HSG/Chuyên'}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'theory', label: '📖 Lý thuyết' },
          { id: 'examples', label: '💡 Ví dụ' },
          { id: 'quiz', label: '📝 Bài tập' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Theory Tab */}
      {activeTab === 'theory' && (
        <div className="bg-white rounded-2xl shadow-lg p-6" ref={contentRef}>
          <div className="prose max-w-none">
            <h2 className="text-xl font-bold mb-4">Nội dung bài học</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {lesson.theory}
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">📌 Điểm chính</h3>
            <ul className="list-disc list-inside space-y-2">
              {lesson.keyPoints?.map((point, idx) => (
                <li key={idx} className="text-gray-700">{point}</li>
              ))}
            </ul>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">🔍 Dấu hiệu nhận biết</h3>
            <ul className="list-disc list-inside space-y-2">
              {lesson.recognitionSigns?.map((sign, idx) => (
                <li key={idx} className="text-gray-700">{sign}</li>
              ))}
            </ul>
            
            {/* Vocabulary section for English */}
            {lesson.vocabulary?.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-3">📚 Từ vựng</h3>
                <div className="grid gap-3">
                  {lesson.vocabulary.map((vocab, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="font-semibold">{vocab.word}</div>
                      <div className="text-sm text-gray-500">{vocab.pronunciation}</div>
                      <div className="text-gray-700">{vocab.meaning}</div>
                      <div className="text-sm text-gray-600 mt-1">Ví dụ: {vocab.example}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {/* Grammar section for English */}
            {lesson.grammar?.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-3">📝 Ngữ pháp</h3>
                {lesson.grammar.map((gram, idx) => (
                  <div key={idx} className="bg-blue-50 rounded-lg p-4 mb-3">
                    <div className="font-semibold">{gram.structure}</div>
                    <div className="text-sm text-gray-600 mt-1">{gram.usage}</div>
                    <div className="mt-2">
                      {gram.examples?.map((ex, i) => (
                        <div key={i} className="text-sm text-gray-700">• {ex}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {/* Outline for Literature */}
            {lesson.outline && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-3">📑 Dàn ý</h3>
                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                  {lesson.outline}
                </pre>
              </>
            )}
            
            {/* Analysis for Literature */}
            {lesson.analysis && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-3">📖 Phân tích</h3>
                <p className="text-gray-700 leading-relaxed">{lesson.analysis}</p>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Examples Tab */}
      {activeTab === 'examples' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">💡 Ví dụ minh họa</h2>
          <div className="space-y-4">
            {lesson.examples?.map((example, idx) => (
              <div key={idx} className="border-l-4 border-green-500 pl-4 py-2">
                <p className="text-gray-700">{example}</p>
              </div>
            ))}
          </div>
          
          {/* Sample paragraph for Literature */}
          {lesson.sampleParagraph && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-3">📝 Đoạn văn mẫu</h3>
              <div className="bg-gray-50 rounded-lg p-4 italic">
                {lesson.sampleParagraph}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Quiz Tab */}
      {activeTab === 'quiz' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">📝 Bài tập</h2>
          
          {submitted && result ? (
            <div className={`rounded-xl p-6 text-center ${
              result.score >= 70 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="text-5xl mb-3">{result.score >= 70 ? '🎉' : '😢'}</div>
              <div className="text-2xl font-bold mb-2">{result.score}%</div>
              <p className="mb-2">{result.correctCount}/{result.total} câu đúng</p>
              
              {result.score >= 70 ? (
                <>
                  <p className="text-green-600 mb-2">✨ Hoàn thành bài học!</p>
                  <p className="text-sm text-gray-600">+{lesson.xpReward} XP, +1💎, +2⚡</p>
                  {result.nextLesson && (
                    <button
                      onClick={() => navigate(`/lesson/${result.nextLesson.id}`)}
                      className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                    >
                      Học bài tiếp theo
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-red-600 mb-2">Bị trừ 3 năng lượng</p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setQuizAnswers({});
                    }}
                    className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
                  >
                    Làm lại
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {lesson.exercises?.basic?.map((exercise, idx) => (
                  <div key={idx} className="border rounded-xl p-4">
                    <div className="font-medium mb-3">{idx + 1}. {exercise.question}</div>
                    <input
                      type="text"
                      value={quizAnswers[idx] || ''}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nhập đáp án của bạn..."
                    />
                    {showHint && (
                      <div className="mt-2 text-sm text-gray-500">
                        💡 Gợi ý: {exercise.explanation.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-blue-500 hover:underline"
                >
                  {showHint ? 'Ẩn gợi ý' : 'Hiện gợi ý'}
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                >
                  Nộp bài
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonViewer;