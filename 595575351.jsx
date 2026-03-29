// src/components/LessonLearner.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCheck, FaTimes, FaLightbulb, FaSpinner } from 'react-icons/fa';

const LessonLearner = ({ lessonId, onComplete }) => {
  const { user, api } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [theoryView, setTheoryView] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [essayAnswers, setEssayAnswers] = useState({});
  const [essayResult, setEssayResult] = useState(null);
  const [energy, setEnergy] = useState(user?.energy || 25);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  
  const sections = [
    { name: 'Lý thuyết', icon: '📖' },
    { name: 'Ví dụ', icon: '💡' },
    { name: 'Bài tập trắc nghiệm', icon: '📝' },
    { name: 'Bài tập tự luận', icon: '✍️' }
  ];
  
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
  
  const handleTheoryComplete = () => {
    setTheoryView(true);
    setCurrentSection(1);
  };
  
  const handleQuizSubmit = () => {
    let correct = 0;
    const results = [];
    
    lesson.exercises.multipleChoice.forEach((q, idx) => {
      const userAnswer = quizAnswers[idx];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correct++;
      results.push({ isCorrect, correctAnswer: q.correctAnswer, explanation: q.explanation });
    });
    
    const score = (correct / lesson.exercises.multipleChoice.length) * 100;
    const passed = score >= 80;
    
    setQuizResult({ score, passed, results, correct, total: lesson.exercises.multipleChoice.length });
    
    if (!passed) {
      setWrongAttempts(prev => prev + 1);
      setEnergy(prev => Math.max(0, prev - 3));
      
      // Gọi API cập nhật năng lượng
      api.post('/energy/update', { energy: energy - 3 });
    }
  };
  
  const handleEssaySubmit = async () => {
    const results = [];
    let totalScore = 0;
    const maxScore = lesson.exercises.essay.length * 2;
    
    for (let i = 0; i < lesson.exercises.essay.length; i++) {
      const q = lesson.exercises.essay[i];
      const userAnswer = essayAnswers[i];
      
      // Gọi AI chấm điểm
      const response = await api.post('/ai/grade-essay', {
        question: q.question,
        userAnswer,
        modelAnswer: q.modelAnswer,
        scoringGuide: q.scoringGuide
      });
      
      results.push({
        score: response.data.score,
        feedback: response.data.feedback,
        suggestions: response.data.suggestions
      });
      totalScore += response.data.score;
    }
    
    const percentage = (totalScore / maxScore) * 100;
    const passed = percentage >= 80;
    
    setEssayResult({ passed, percentage, results, totalScore, maxScore });
    
    if (!passed) {
      setWrongAttempts(prev => prev + 1);
      setEnergy(prev => Math.max(0, prev - 3));
      api.post('/energy/update', { energy: energy - 3 });
    }
  };
  
  const handleNextLesson = async () => {
    if (quizResult?.passed && essayResult?.passed) {
      // Tính độ hiểu bài
      const understanding = (quizResult.score + essayResult.percentage) / 2;
      
      if (understanding >= 80) {
        await api.post('/lesson/complete', { lessonId, score: understanding });
        onComplete();
      } else {
        alert(`Độ hiểu bài: ${understanding}%. Cần đạt 80% để qua bài. Hãy học lại!`);
        setCurrentSection(0);
        setTheoryView(false);
        setQuizResult(null);
        setEssayResult(null);
        setQuizAnswers({});
        setEssayAnswers({});
      }
    }
  };
  
  if (loading) {
    return <div className="text-center py-10">Đang tải bài học...</div>;
  }
  
  if (!lesson) {
    return <div className="text-center py-10 text-red-500">Không tìm thấy bài học</div>;
  }
  
  // Hiển thị loading khi AI đang tìm nội dung
  if (lesson.isLoading) {
    return (
      <div className="text-center py-20">
        <FaSpinner className="animate-spin text-4xl text-green-500 mx-auto mb-4" />
        <p className="text-gray-600">{lesson.loadingMessage || 'AI đang tìm nội dung bài học...'}</p>
        <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${lesson.loadingProgress || 0}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-400 mt-2">Mất khoảng 30 phút, vui lòng chờ...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Năng lượng */}
      <div className="bg-yellow-50 rounded-xl p-3 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="font-medium">Năng lượng: {energy}/25</span>
        </div>
        {wrongAttempts > 0 && (
          <div className="text-red-500 text-sm">
            Đã sai {wrongAttempts} lần, bị trừ {wrongAttempts * 3} năng lượng
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="flex gap-1 mb-6">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className={`flex-1 h-2 rounded-full transition-all ${
              currentSection > idx ? 'bg-green-500' :
              currentSection === idx ? 'bg-green-300' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {sections[currentSection].icon} {sections[currentSection].name}
        </h2>
        <div className="text-sm text-gray-500">
          {currentSection + 1}/{sections.length}
        </div>
      </div>
      
      {/* Lý thuyết */}
      {currentSection === 0 && (
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-3">📖 Lý thuyết</h3>
            <div className="whitespace-pre-line text-gray-700">
              {lesson.theory}
            </div>
          </div>
          
          {lesson.keyPoints && (
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">🎯 Điểm chính</h3>
              <ul className="list-disc list-inside space-y-1">
                {lesson.keyPoints.map((point, idx) => (
                  <li key={idx} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
          )}
          
          <button
            onClick={handleTheoryComplete}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Đã hiểu, tiếp tục
          </button>
        </div>
      )}
      
      {/* Ví dụ */}
      {currentSection === 1 && (
        <div className="space-y-6">
          <div className="bg-orange-50 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-3">💡 Ví dụ minh họa</h3>
            <div className="space-y-4">
              {lesson.examples?.map((ex, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg">
                  <p className="font-medium">Ví dụ {idx + 1}:</p>
                  <p className="text-gray-700 mt-1">{ex}</p>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => setCurrentSection(2)}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Đã hiểu, làm bài tập
          </button>
        </div>
      )}
      
      {/* Trắc nghiệm */}
      {currentSection === 2 && (
        <div className="space-y-6">
          {lesson.exercises?.multipleChoice?.map((q, idx) => (
            <div key={idx} className="border rounded-xl p-4">
              <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
              <div className="space-y-2 pl-4">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                      quizAnswers[idx] === optIdx
                        ? quizResult
                          ? quizResult.results[idx]?.isCorrect
                            ? 'bg-green-100 border border-green-500'
                            : 'bg-red-100 border border-red-500'
                          : 'bg-blue-50 border border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q_${idx}`}
                      value={optIdx}
                      checked={quizAnswers[idx] === optIdx}
                      onChange={() => !quizResult && setQuizAnswers({ ...quizAnswers, [idx]: optIdx })}
                      disabled={!!quizResult}
                      className="w-4 h-4"
                    />
                    <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                  </label>
                ))}
              </div>
              {quizResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                  quizResult.results[idx]?.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {quizResult.results[idx]?.isCorrect ? (
                    <span>✅ Đúng! {q.explanation}</span>
                  ) : (
                    <span>❌ Sai! Đáp án đúng là {String.fromCharCode(65 + q.correctAnswer)}. {q.explanation}</span>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {!quizResult ? (
            <button
              onClick={handleQuizSubmit}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
            >
              Nộp bài
            </button>
          ) : (
            <div className={`p-4 rounded-xl text-center ${
              quizResult.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <div className="text-2xl font-bold">{quizResult.score}%</div>
              <p>{quizResult.correct}/{quizResult.total} câu đúng</p>
              {quizResult.passed ? (
                <button
                  onClick={() => setCurrentSection(3)}
                  className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg"
                >
                  Tiếp tục
                </button>
              ) : (
                <div className="mt-3">
                  <p className="text-red-600">❌ Cần đạt 80% để qua. Bạn bị trừ 3 năng lượng!</p>
                  <button
                    onClick={() => {
                      setQuizResult(null);
                      setQuizAnswers({});
                    }}
                    className="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg"
                  >
                    Học lại
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Tự luận */}
      {currentSection === 3 && (
        <div className="space-y-6">
          {lesson.exercises?.essay?.map((q, idx) => (
            <div key={idx} className="border rounded-xl p-4">
              <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
              <textarea
                value={essayAnswers[idx] || ''}
                onChange={(e) => setEssayAnswers({ ...essayAnswers, [idx]: e.target.value })}
                disabled={!!essayResult}
                placeholder="Nhập câu trả lời của bạn..."
                className="w-full p-3 border rounded-lg min-h-[120px]"
              />
              {essayResult && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Điểm: {essayResult.results[idx]?.score}/2</span>
                    <span className="text-sm text-gray-500">Cần 1.6 điểm để đạt</span>
                  </div>
                  <p className="text-sm mt-1">{essayResult.results[idx]?.feedback}</p>
                  {essayResult.results[idx]?.suggestions && (
                    <p className="text-sm text-blue-600 mt-1">💡 {essayResult.results[idx]?.suggestions}</p>
                  )}
                  <details className="mt-2">
                    <summary className="text-sm text-gray-500 cursor-pointer">Xem đáp án mẫu</summary>
                    <p className="mt-2 text-sm text-gray-600 p-2 bg-white rounded">{q.modelAnswer}</p>
                  </details>
                </div>
              )}
            </div>
          ))}
          
          {!essayResult ? (
            <button
              onClick={handleEssaySubmit}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
            >
              Nộp bài
            </button>
          ) : (
            <div className={`p-4 rounded-xl text-center ${
              essayResult.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <div className="text-2xl font-bold">{essayResult.percentage}%</div>
              <p>{essayResult.totalScore}/{essayResult.maxScore} điểm</p>
              {essayResult.passed ? (
                <button
                  onClick={handleNextLesson}
                  className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg"
                >
                  Hoàn thành bài học
                </button>
              ) : (
                <div className="mt-3">
                  <p className="text-red-600">❌ Cần đạt 80% để qua. Bạn bị trừ 3 năng lượng!</p>
                  <button
                    onClick={() => {
                      setEssayResult(null);
                      setEssayAnswers({});
                    }}
                    className="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg"
                  >
                    Làm lại
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonLearner;