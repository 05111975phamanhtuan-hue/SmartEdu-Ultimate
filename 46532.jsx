// src/components/affiliate/AffiliateDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaLink, FaChartLine, FaDollarSign, FaCopy, FaCheck } from 'react-icons/fa';

const AffiliateDashboard = () => {
  const { user, api } = useAuth();
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState(null);
  const [newLink, setNewLink] = useState({ title: '', url: '', platform: 'other', commission: 0 });
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(null);
  
  useEffect(() => {
    fetchLinks();
    fetchStats();
  }, []);
  
  const fetchLinks = async () => {
    try {
      const response = await api.get('/affiliate/links');
      setLinks(response.data);
    } catch (err) {
      console.error('Failed to fetch links:', err);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await api.get('/affiliate/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };
  
  const createLink = async () => {
    if (!newLink.title || !newLink.url) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    try {
      const response = await api.post('/affiliate/links', newLink);
      setLinks([response.data.link, ...links]);
      setNewLink({ title: '', url: '', platform: 'other', commission: 0 });
      setShowForm(false);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Tạo link thất bại');
    }
  };
  
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  
  const getPlatformIcon = (platform) => {
    switch(platform) {
      case 'shopee': return '🛍️';
      case 'tiki': return '📚';
      case 'lazada': return '📦';
      default: return '🔗';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔗 Tiếp thị liên kết</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FaLink className="text-blue-500 text-xl" />
            </div>
            <div>
              <div className="text-gray-500 text-sm">Tổng link</div>
              <div className="text-2xl font-bold">{stats?.totalLinks || 0}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <FaChartLine className="text-green-500 text-xl" />
            </div>
            <div>
              <div className="text-gray-500 text-sm">Tổng click</div>
              <div className="text-2xl font-bold">{stats?.totalClicks?.toLocaleString() || 0}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-xl">
              <FaCheck className="text-purple-500 text-xl" />
            </div>
            <div>
              <div className="text-gray-500 text-sm">Chuyển đổi</div>
              <div className="text-2xl font-bold">{stats?.totalConversions?.toLocaleString() || 0}</div>
              <div className="text-xs text-gray-500">Tỉ lệ: {stats?.conversionRate?.toFixed(1)}%</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <FaDollarSign className="text-yellow-500 text-xl" />
            </div>
            <div>
              <div className="text-gray-500 text-sm">Thu nhập</div>
              <div className="text-2xl font-bold">{stats?.totalEarnings?.toLocaleString()}đ</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Link Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          + Tạo link tiếp thị
        </button>
      </div>
      
      {/* Create Link Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Tạo link tiếp thị mới</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Tiêu đề sản phẩm"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
            <textarea
              placeholder="Mô tả (tùy chọn)"
              value={newLink.description}
              onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows="2"
            />
            <input
              type="url"
              placeholder="Link sản phẩm"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
            <div className="flex gap-3">
              <select
                value={newLink.platform}
                onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
                className="flex-1 p-2 border rounded-lg"
              >
                <option value="shopee">Shopee</option>
                <option value="tiki">Tiki</option>
                <option value="lazada">Lazada</option>
                <option value="other">Khác</option>
              </select>
              <input
                type="number"
                placeholder="Hoa hồng (VNĐ)"
                value={newLink.commission}
                onChange={(e) => setNewLink({ ...newLink, commission: parseInt(e.target.value) })}
                className="w-32 p-2 border rounded-lg"
              />
            </div>
            <button
              onClick={createLink}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
            >
              Tạo link
            </button>
          </div>
        </div>
      )}
      
      {/* Links List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-medium">Danh sách link tiếp thị</div>
        <div className="divide-y">
          {links.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-3">🔗</div>
              <p>Chưa có link tiếp thị nào</p>
              <p className="text-sm">Hãy tạo link đầu tiên để bắt đầu kiếm tiền</p>
            </div>
          ) : (
            links.map(link => (
              <div key={link._id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getPlatformIcon(link.platform)}</span>
                      <span className="font-bold">{link.title}</span>
                      {link.commission > 0 && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          Hoa hồng {link.commission.toLocaleString()}đ
                        </span>
                      )}
                    </div>
                    {link.description && (
                      <div className="text-sm text-gray-500 mt-1">{link.description}</div>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>📊 {link.clicks} click</span>
                      <span>✅ {link.conversions} chuyển đổi</span>
                      <span>💰 {link.earnings.toLocaleString()}đ</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-xs bg-gray-100 p-1 rounded">{`${window.location.origin}/go/${link._id}`}</code>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/go/${link._id}`, link._id)}
                        className="text-blue-500 text-sm hover:underline"
                      >
                        {copied === link._id ? 'Đã copy!' : 'Copy link'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;