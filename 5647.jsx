// src/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FaUsers, FaDollarSign, FaBook, FaShoppingCart, FaChartLine, 
  FaDownload, FaEye, FaStar, FaCrown, FaShieldAlt, FaUserShield,
  FaHistory, FaMoneyBillWave, FaTrash, FaEdit, FaLock, FaUnlock
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

const AdminDashboard = () => {
  const { user, api } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminFinance, setAdminFinance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const isSuperAdmin = user?.role === 'super_admin';
  
  useEffect(() => {
    fetchAllData();
  }, [activeTab]);
  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, adminsRes, logsRes, financeRes] = await Promise.all([
        api.get('/admin/stats'),
        isSuperAdmin ? api.get('/super-admin/admins') : Promise.resolve({ data: [] }),
        isSuperAdmin ? api.get('/super-admin/admin-logs') : Promise.resolve({ data: { logs: [] } }),
        isSuperAdmin ? api.get('/super-admin/admin-finance') : Promise.resolve({ data: [] })
      ]);
      
      setStats(statsRes.data);
      setAdmins(adminsRes.data);
      setAdminLogs(logsRes.data.logs || []);
      setAdminFinance(financeRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa admin ${adminName} vĩnh viễn?`)) return;
    
    try {
      await api.delete(`/super-admin/admins/${adminId}`);
      alert(`Đã xóa admin ${adminName}`);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };
  
  if (loading) {
    return <div className="text-center py-10">Đang tải dữ liệu...</div>;
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isSuperAdmin ? '👑 Super Admin Dashboard' : '📊 Admin Dashboard'}
      </h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaChartLine className="inline mr-1" /> Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'revenue'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaDollarSign className="inline mr-1" /> Doanh thu
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'admins'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaUserShield className="inline mr-1" /> Quản lý Admin
          </button>
          <button
            onClick={() => setActiveTab('admin-logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'admin-logs'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaHistory className="inline mr-1" /> Lịch sử hoạt động
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'finance'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaMoneyBillWave className="inline mr-1" /> Tài chính Admin
          </button>
        </nav>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <FaUsers className="text-blue-500 text-xl" />
                </div>
                <div>
                  <div className="text-gray-500 text-sm">Tổng người dùng</div>
                  <div className="text-2xl font-bold">{stats?.users?.total?.toLocaleString()}</div>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quản lý Admin Tab (chỉ Super Admin) */}
      {activeTab === 'admins' && isSuperAdmin && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-lg">👥 Danh sách Admin</h2>
            <button className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm">+ Thêm Admin</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Admin</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-center">Vai trò</th>
                  <th className="p-3 text-center">Số thao tác</th>
                  <th className="p-3 text-center">Đã rút</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={admin.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}`} className="w-8 h-8 rounded-full" />
                        <span className="font-medium">{admin.name}</span>
                      </div>
                    </td>
                    <td className="p-3">{admin.email}</td>
                    <td className="p-3 text-center">
                      {admin.role === 'super_admin' ? (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">Super Admin</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Admin</span>
                      )}
                    </td>
                    <td className="p-3 text-center">{admin.stats?.totalActions || 0}</td>
                    <td className="p-3 text-center text-green-600">{admin.stats?.totalWithdrawn?.toLocaleString()}đ</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="text-blue-500 hover:text-blue-700" title="Sửa quyền">
                          <FaEdit />
                        </button>
                        {admin.role !== 'super_admin' && (
                          <button 
                            onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                            className="text-red-500 hover:text-red-700"
                            title="Xóa admin"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Lịch sử hoạt động Admin */}
      {activeTab === 'admin-logs' && isSuperAdmin && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-lg">📋 Lịch sử hoạt động của Admin</h2>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-3 text-left">Admin</th>
                  <th className="p-3 text-left">Hành động</th>
                  <th className="p-3 text-left">Đối tượng</th>
                  <th className="p-3 text-left">Chi tiết</th>
                  <th className="p-3 text-left">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {adminLogs.map(log => (
                  <tr key={log._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.adminName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">{log.action}</span>
                    </td>
                    <td className="p-3">{log.targetType} / {log.target}</td>
                    <td className="p-3 text-sm text-gray-600 max-w-xs truncate">
                      {JSON.stringify(log.details).substring(0, 50)}...
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Tài chính Admin */}
      {activeTab === 'finance' && isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {adminFinance.map(admin => (
            <div key={admin.admin.id} className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <FaMoneyBillWave className="text-green-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{admin.admin.name}</h3>
                  <p className="text-sm text-gray-500">{admin.admin.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-500">Đã rút</div>
                  <div className="text-xl font-bold text-orange-600">{admin.finance.totalWithdrawn.toLocaleString()}đ</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-500">Số lần rút</div>
                  <div className="text-xl font-bold">{admin.finance.withdrawalCount}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center col-span-2">
                  <div className="text-sm text-gray-500">Yêu cầu đang chờ</div>
                  <div className="text-xl font-bold text-yellow-600">{admin.finance.pendingWithdrawals}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;