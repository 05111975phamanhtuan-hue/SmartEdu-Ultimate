// src/components/LearningPath.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaGem, FaTrophy, FaBook, FaClock, FaArrowRight } from 'react-icons/fa';

const LearningPath = () => {
  const { user, api } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessmentMode, setAssessmentMode] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [examMode, setExamMode] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [examAnswers, setExamAnswers] = useState({ mcq: [], essay: [] });
  
  useEffect(() => {
    fetchProgress();
  }, []);
  
  const fetchProgress = async () => {
    try {
      const response = await api.get('/learning/progress');
      setProgress(response.data);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAssessmentSubmit = async () => {
    try {
      const response = await api.post('/ai/assess-student', { answers });
      setAssessmentMode(false);
      fetchProgress();
      alert(`Môn yếu: ${response.data.weakSubjects.join(', ')}\nGợi ý: ${response.data.recommendation}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };
  
  const startExam = async () => {
    try {
      const response = await api.post('/ai/generate-exam-content', {
        subject: progress.weakSubjects[0],
        grade: progress.grade,
        semester: progress.semester,
        examType: progress.semester === 1 ? 
          (progress.completedExams.semester1 === 0 ? 'midterm1' : 'final1') :
          (progress.completedExams.semester2 === 0 ? 'midterm2' : 'final2')
      });
      setCurrentExam(response.data);
      setExamMode(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };
  
  if (loading) {
    return <div className="text-center py-10">Đang tải lộ trình...</div>;
  }
  
  if (assessmentMode) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-4">📝 Đánh giá trình độ</h2>
          <p className="text-gray-600 mb-6">Hãy cho chúng tôi biết khó khăn của bạn trong học tập:</p>
          
          <textarea
            value={answers.join('\n')}
            onChange={(e) => setAnswers(e.target.value.split('\n'))}
            placeholder="Ví dụ:
Tôi gặp khó khăn với môn Toán, đặc biệt là phần hình học.
Môn Văn tôi không biết cách viết bài nghị luận.
Tiếng Anh của tôi yếu về từ vựng và ngữ pháp."
            className="w-full p-4 border rounded-xl min-h-[200px] mb-4"
          />
          
          <button
            onClick={handleAssessmentSubmit}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Gửi đánh giá
          </button>
        </div>
      </div>
    );
  }
  
  if (examMode && currentExam) {
    return (
      <ExamInterface
        exam={currentExam}
        onComplete={() => {
          setExamMode(false);
          fetchProgress();
        }}
      />
    );
  }
  
  // Kiểm tra nếu chưa có đánh giá ban đầu
  if (!progress.weakSubjects || progress.weakSubjects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold mb-2">Chào mừng đến với SmartEdu!</h2>
          <p className="text-gray-600 mb-6">Hãy cho chúng tôi biết khó khăn của bạn để xây dựng lộ trình học tập phù hợp.</p>
          <button
            onClick={() => setAssessmentMode(true)}
            className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Bắt đầu đánh giá
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header - Thông tin lớp học */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Lớp {progress.grade}</h1>
            <p className="opacity-90">Học kỳ {progress.semester}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <FaGem className="text-yellow-300" />
              <span className="text-xl font-bold">{progress.stats.totalDiamonds}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaStar className="text-yellow-300" />
              <span>{progress.stats.totalXP} XP</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tiến độ học kỳ */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">📊 Tiến độ học kỳ {progress.semester}</h2>
        <div className="flex gap-4 mb-4">
          <div className="flex-1 text-center">
            <div className={`text-2xl font-bold ${progress.completedExams.semester1 >= 1 ? 'text-green-500' : 'text-gray-400'}`}>
              {progress.completedExams.semester1 >= 1 ? '✓' : '○'}
            </div>
            <div className="text-sm text-gray-500">Giữa kỳ I</div>
          </div>
          <div className="flex-1 text-center">
            <div className={`text-2xl font-bold ${progress.completedExams.semester1 >= 2 ? 'text-green-500' : 'text-gray-400'}`}>
              {progress.completedExams.semester1 >= 2 ? '✓' : '○'}
            </div>
            <div className="text-sm text-gray-500">Cuối kỳ I</div>
          </div>
          <div className="flex-1 text-center">
            <div className={`text-2xl font-bold ${progress.completedExams.semester2 >= 1 ? 'text-green-500' : 'text-gray-400'}`}>
              {progress.completedExams.semester2 >= 1 ? '✓' : '○'}
            </div>
            <div className="text-sm text-gray-500">Giữa kỳ II</div>
          </div>
          <div className="flex-1 text-center">
            <div className={`text-2xl font-bold ${progress.completedExams.semester2 >= 2 ? 'text-green-500' : 'text-gray-400'}`}>
              {progress.completedExams.semester2 >= 2 ? '✓' : '○'}
            </div>
            <div className="text-sm text-gray-500">Cuối kỳ II</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${((progress.completedExams.semester1 + progress.completedExams.semester2) / 4) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Môn yếu - Cần tập trung */}
      <div className="bg-orange-50 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <FaBook className="text-orange-500" />
          Môn học cần tập trung
        </h2>
        <div className="flex flex-wrap gap-2">
          {progress.weakSubjects.map(sub => (
            <span key={sub} className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm">
              {sub === 'toan' ? 'Toán' : sub === 'van' ? 'Văn' : sub === 'anh' ? 'Anh' : 
               sub === 'ly' ? 'Lý' : sub === 'hoa' ? 'Hóa' : sub === 'sinh' ? 'Sinh' : 
               sub === 'su' ? 'Sử' : 'Địa'}
            </span>
          ))}
        </div>
      </div>
      
      {/* Nút hành động */}
      <div className="space-y-3">
        <button
          onClick={startExam}
          className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
        >
          <FaArrowRight /> Thi {progress.semester === 1 ? 
            (progress.completedExams.semester1 === 0 ? 'Giữa kỳ I' : 'Cuối kỳ I') :
            (progress.completedExams.semester2 === 0 ? 'Giữa kỳ II' : 'Cuối kỳ II')}
        </button>
        
        {progress.gradeCompleted && (
          <button
            onClick={async () => {
              const res = await api.post('/learning/check-review');
              if (res.data.action === 'grade9_exam') {
                // Chuyển sang thi cấp 3
              } else if (res.data.action === 'promote') {
                alert(res.data.message);
                fetchProgress();
              }
            }}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
          >
            Kiểm tra ôn tập ({progress.reviewRemaining} ngày)
          </button>
        )}
      </div>
      
      {/* Danh hiệu */}
      {progress.grade9Exam?.passed && (
        <div className="mt-6 bg-yellow-50 rounded-xl p-4 text-center">
          <FaTrophy className="text-3xl text-yellow-500 mx-auto mb-2" />
          <p className="font-bold">Đã tốt nghiệp cấp 2!</p>
          <p className="text-sm text-gray-600">Điểm thi: {progress.grade9Exam.total}/40</p>
        </div>
      )}
      
      {progress.grade12Exam?.passed && (
        <div className="mt-6 bg-purple-50 rounded-xl p-4 text-center">
          <FaTrophy className="text-3xl text-purple-500 mx-auto mb-2" />
          <p className="font-bold">Chúc mừng bạn đã đỗ đại học! 🎉</p>
          <p className="text-sm text-gray-600">Điểm thi: {progress.grade12Exam.total}/15</p>
        </div>
      )}
    </div>
  );
};

export default LearningPath;