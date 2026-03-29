// src/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FaUsers, FaDollarSign, FaBook, FaShoppingCart, FaChartLine, 
  FaDownload, FaEye, FaStar, FaCrown 
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

const AdminDashboard = () => {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    fetchAllData();
  }, []);
  
  const fetchAllData = async () => {
    try {
      const [statsRes, chartsRes, revenueRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/charts'),
        api.get('/admin/revenue/details')
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
      setRevenueData(revenueRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const exportData = async (type) => {
    try {
      const response = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Xuất dữ liệu thất bại');
    }
  };
  
  if (loading) {
    return <div className="text-center py-10">Đang tải dữ liệu...</div>;
  }
  
  const revenueChartData = {
    labels: charts?.revenueData?.map(d => d.date) || [],
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      data: charts?.revenueData?.map(d => d.revenue) || [],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };
  
  const userChartData = {
    labels: charts?.userData?.map(d => d.date) || [],
    datasets: [{
      label: 'Người dùng mới',
      data: charts?.userData?.map(d => d.users) || [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };
  
  const revenueByTypeData = {
    labels: revenueData?.byType?.map(t => t._id === 'deposit' ? 'Nạp tiền' : t._id === 'subscription' ? 'Gói Pro' : 'Mua kim cương') || [],
    datasets: [{
      data: revenueData?.byType?.map(t => t.total) || [],
      backgroundColor: ['#10b981', '#f59e0b', '#8b5cf6']
    }]
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Admin Dashboard</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FaUsers className="text-blue-500 text-xl" />
            </div>
            <div>
              <div className="text-gray-500 text-sm">Tổng người dùng</div>
              <div className="text-2xl font-bold">{stats?.users?.total?.toLocaleString()}</div>
              <div className="text-xs text-green-600">+{stats?.users?.newToday} hôm nay</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <FaDollarSign className="text-green-500 text-xl" />
            </div>
            <div>
              <div className="text-gray-500 text-sm">Doanh thu</div>
              <div className="text-2xl font-bold">{stats?.revenue?.total?.toLocaleString()}đ</div>
              <div className="text-xs text-green-600">+{stats?.revenue?.today?.toLocaleString()}đ hôm nay</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-xl">
              <FaBook className="text-purple-500 text-xl" />
            </div>
            <div>
              <div className="text-gray-500 text-sm">Tài liệu</div>
              <div className="text-2xl font-bold">{stats?.marketplace?.totalMaterials?.toLocaleString()}</div>
              <div className="text-xs text-orange-500">{stats?.marketplace?.pendingMaterials} chờ duyệt</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <FaCrown className="text-yellow-500 text-xl" />
            </div>
            <div>
              <div className="text-gray-500 text-sm">Thành viên VIP</div>
              <div className="text-2xl font-bold">{stats?.users?.vip?.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{((stats?.users?.vip / stats?.users?.total) * 100).toFixed(1)}% tổng số</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'revenue', 'users', 'content', 'marketplace'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' && 'Tổng quan'}
              {tab === 'revenue' && 'Doanh thu'}
              {tab === 'users' && 'Người dùng'}
              {tab === 'content' && 'Nội dung'}
              {tab === 'marketplace' && 'Marketplace'}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="font-bold mb-4">📈 Doanh thu theo ngày</h2>
            <Line data={revenueChartData} options={{ responsive: true }} />
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="font-bold mb-4">👥 Người dùng mới</h2>
            <Bar data={userChartData} options={{ responsive: true }} />
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="font-bold mb-4">💰 Doanh thu theo loại</h2>
            <Doughnut data={revenueByTypeData} options={{ responsive: true }} />
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="font-bold mb-4">📊 Tổng quan</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Tổng doanh thu:</span>
                <span className="font-bold text-green-600">{stats?.revenue?.total?.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Phí nền tảng:</span>
                <span className="font-bold text-orange-500">{stats?.marketplace?.platformFees?.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng đơn hàng:</span>
                <span className="font-bold">{stats?.marketplace?.totalOrders?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Người dùng hoạt động (7 ngày):</span>
                <span className="font-bold">{stats?.users?.active?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">📊 Chi tiết doanh thu</h2>
            <button onClick={() => exportData('revenue')} className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
              <FaDownload /> Xuất file
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Ngày</th>
                  <th className="p-2 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {revenueData?.byDay?.map(day => (
                  <tr key={day._id} className="border-t">
                    <td className="p-2">{day._id}</td>
                    <td className="p-2 text-right text-green-600">{day.total.toLocaleString()}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">👥 Danh sách người dùng</h2>
            <button onClick={() => exportData('users')} className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
              <FaDownload /> Xuất file
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Tên</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-center">XP</th>
                  <th className="p-2 text-center">Level</th>
                  <th className="p-2 text-center">Vai trò</th>
                  <th className="p-2 text-center">Gói</th>
                </tr>
              </thead>
              <tbody>
                {/* User list would be loaded separately */}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-lg mb-4">📚 Bài học phổ biến</h2>
            <div className="space-y-2">
              {/* Top lessons would be loaded */}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-lg mb-4">📄 Tài liệu phổ biến</h2>
            <div className="space-y-2">
              {/* Top materials would be loaded */}
            </div>
          </div>
        </div>
      )}
      
      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-lg mb-4">⏳ Tài liệu chờ duyệt</h2>
            <div className="space-y-3">
              {/* Pending materials would be loaded */}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-lg mb-4">🏆 Người bán hàng đầu</h2>
            <div className="space-y-2">
              {/* Top sellers would be loaded */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;