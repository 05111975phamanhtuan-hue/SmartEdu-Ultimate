// src/components/SuperAIChat.js
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaRobot, FaSpinner, FaSearch, FaGraduationCap, FaChartLine, FaBrain } from 'react-icons/fa';

const SuperAIChat = () => {
  const { user, api } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('tutor');
  const [subject, setSubject] = useState('toan');
  const [grade, setGrade] = useState('10');
  const [useWebSearch, setUseWebSearch] = useState(true);
  const messagesEndRef = useRef(null);

  const modes = [
    { id: 'tutor', name: 'Gia sư', icon: <FaGraduationCap />, desc: 'Giải bài tập, hướng dẫn học' },
    { id: 'researcher', name: 'Nghiên cứu', icon: <FaBrain />, desc: 'Phân tích chuyên sâu' },
    { id: 'solver', name: 'Giải bài', icon: <FaChartLine />, desc: 'Giải bài tập nâng cao' }
  ];

  const subjects = [
    { id: 'toan', name: 'Toán', icon: '📘' },
    { id: 'van', name: 'Văn', icon: '📖' },
    { id: 'anh', name: 'Anh', icon: '🇬🇧' },
    { id: 'ly', name: 'Lý', icon: '⚛️' },
    { id: 'hoa', name: 'Hóa', icon: '🧪' },
    { id: 'sinh', name: 'Sinh', icon: '🧬' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/super-tutor', {
        question: input,
        subject,
        grade,
        role: mode,
        useWebSearch
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.answer,
        webSearchUsed: response.data.webSearchUsed,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại!',
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <FaRobot className="text-3xl" />
          <div>
            <h1 className="text-xl font-bold">AI Super Tutor</h1>
            <p className="text-sm opacity-90">Siêu trí tuệ nhân tạo - Suy luận gấp 2 lần ChatGPT</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b p-4 flex flex-wrap gap-3">
        {/* Mode Selector */}
        <div className="flex gap-2">
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition ${
                mode === m.id ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {m.icon}
              {m.name}
            </button>
          ))}
        </div>

        {/* Subject Selector */}
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="px-3 py-1 border rounded-lg text-sm"
        >
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>

        {/* Grade Selector */}
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="px-3 py-1 border rounded-lg text-sm"
        >
          {[6,7,8,9,10,11,12].map(g => (
            <option key={g} value={g}>Lớp {g}</option>
          ))}
        </select>

        {/* Web Search Toggle */}
        <button
          onClick={() => setUseWebSearch(!useWebSearch)}
          className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition ${
            useWebSearch ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          <FaSearch />
          Tra cứu web
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <FaRobot className="text-5xl mx-auto mb-3 text-purple-300" />
            <p>Hãy hỏi tôi bất kỳ câu hỏi nào!</p>
            <p className="text-sm mt-2">Tôi có thể: Giải bài tập, Nghiên cứu chuyên sâu, Phân tích lỗi sai, Tạo đề thi</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3/4 rounded-2xl p-3 ${
                msg.role === 'user'
                  ? 'bg-purple-500 text-white'
                  : msg.isError
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-white text-gray-800 shadow'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              {msg.webSearchUsed && (
                <div className="text-xs mt-2 text-gray-400 flex items-center gap-1">
                  <FaSearch /> Đã tra cứu internet
                </div>
              )}
              <div className="text-xs mt-1 opacity-50">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl p-3 shadow flex items-center gap-2">
              <FaSpinner className="animate-spin text-purple-500" />
              <span className="text-sm text-gray-500">AI đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Hỏi tôi bất kỳ điều gì về học tập..."
            className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows="2"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-purple-500 text-white px-6 py-2 rounded-xl hover:bg-purple-600 disabled:opacity-50"
          >
            Gửi
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2 flex justify-between">
          <span>⚡ {user?.subscription === 'free' ? 'Học sinh free: 1 câu/ngày' : 'VIP: Không giới hạn'}</span>
          <span>🔍 AI có thể tra cứu internet khi cần</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAIChat;