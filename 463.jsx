// src/components/live/LiveStreamPlayer.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaHeart, FaGift, FaUser, FaBan, FaThumbtack } from 'react-icons/fa';
import moment from 'moment';
import 'moment/locale/vi';

const LiveStreamPlayer = ({ streamId, onClose }) => {
  const { user, api } = useAuth();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);
  
  const gifts = {
    flower: { name: 'Hoa hồng', icon: '🌹', value: 10 },
    heart: { name: 'Trái tim', icon: '❤️', value: 20 },
    star: { name: 'Ngôi sao', icon: '⭐', value: 50 },
    diamond: { name: 'Kim cương', icon: '💎', value: 100 },
    rocket: { name: 'Tên lửa', icon: '🚀', value: 500 },
    crown: { name: 'Vương miện', icon: '👑', value: 1000 }
  };
  
  useEffect(() => {
    fetchStream();
    connectSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-stream', { streamId });
        socketRef.current.disconnect();
      }
    };
  }, [streamId]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  const fetchStream = async () => {
    try {
      const response = await api.get(`/live/streams/${streamId}`);
      setStream(response.data);
      setChatMessages(response.data.chatMessages || []);
      setViewers(response.data.viewers);
      setLikes(response.data.likes);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch stream:', err);
      setLoading(false);
    }
  };
  
  const connectSocket = () => {
    socketRef.current = io(window.location.origin);
    
    socketRef.current.on('connect', () => {
      setSocketConnected(true);
      socketRef.current.emit('join-stream', { streamId, userId: user.id });
    });
    
    socketRef.current.on('new-chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });
    
    socketRef.current.on('new-gift', (gift) => {
      setChatMessages(prev => [...prev, {
        user: gift.user,
        userName: gift.user,
        content: `Đã tặng ${gift.giftName} ${gift.giftIcon}`,
        isGift: true,
        createdAt: new Date()
      }]);
    });
    
    socketRef.current.on('viewer-update', (data) => {
      setViewers(data.viewers);
    });
    
    socketRef.current.on('like-update', (data) => {
      setLikes(data.likes);
    });
    
    socketRef.current.on('stream-ended', () => {
      alert('Livestream đã kết thúc');
      onClose();
    });
  };
  
  const sendMessage = async () => {
    if (!messageInput.trim()) return;
    
    try {
      await api.post(`/live/streams/${streamId}/chat`, { content: messageInput });
      setMessageInput('');
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể gửi tin nhắn');
    }
  };
  
  const sendGift = async (giftType) => {
    try {
      await api.post(`/live/streams/${streamId}/gift`, { giftType });
      setShowGiftModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể gửi quà');
    }
  };
  
  const likeStream = async () => {
    try {
      await api.post(`/live/streams/${streamId}/like`);
    } catch (err) {}
  };
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">Đang tải livestream...</div>
      </div>
    );
  }
  
  if (!stream) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">Không tìm thấy livestream</div>
        <button onClick={onClose} className="mt-4 bg-white text-black px-4 py-2 rounded-lg">Đóng</button>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={stream.host?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(stream.host?.name)}`}
              alt=""
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div>
              <div className="font-bold">{stream.title}</div>
              <div className="text-sm opacity-90">{stream.host?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">LIVE</span>
            </div>
            <div className="flex items-center gap-1">
              <FaUser /> {viewers}
            </div>
            <button onClick={likeStream} className="flex items-center gap-1 hover:text-red-400">
              <FaHeart /> {likes}
            </button>
            <button onClick={() => setShowGiftModal(true)} className="flex items-center gap-1 hover:text-yellow-400">
              <FaGift /> Tặng quà
            </button>
            <button onClick={onClose} className="bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30">
              Đóng
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Player */}
        <div className="flex-1 bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-6xl mb-4">📺</div>
            <p className="text-gray-400">Video player đang được phát triển</p>
            <p className="text-sm text-gray-500">Sử dụng HLS/WebRTC để phát trực tiếp</p>
          </div>
        </div>
        
        {/* Chat Sidebar */}
        <div className="w-80 bg-gray-900 flex flex-col">
          <div className="bg-gray-800 p-3 text-white font-medium border-b border-gray-700">
            Chat {stream.allowChat ? '💬' : '🔇'}
          </div>
          
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.slice(-50).map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.isGift ? 'bg-yellow-500/20 p-2 rounded-lg' : ''}`}>
                <img
                  src={msg.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.userName)}&size=24`}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{msg.userName}</span>
                    <span className="text-gray-400 text-xs">{moment(msg.createdAt).fromNow()}</span>
                  </div>
                  <div className={`text-sm ${msg.isGift ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {stream.allowChat && (
            <div className="p-3 border-t border-gray-700 flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button onClick={sendMessage} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                Gửi
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">🎁 Tặng quà cho chủ phòng</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {Object.entries(gifts).map(([key, gift]) => (
                <button
                  key={key}
                  onClick={() => sendGift(key)}
                  className="p-3 border rounded-lg hover:bg-purple-50 text-center"
                >
                  <div className="text-2xl mb-1">{gift.icon}</div>
                  <div className="text-sm font-medium">{gift.name}</div>
                  <div className="text-xs text-gray-500">{gift.value}💎</div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowGiftModal(false)} className="w-full bg-gray-200 py-2 rounded-lg">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamPlayer;