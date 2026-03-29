// src/components/marketplace/Marketplace.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import MaterialCard from './MaterialCard';
import CartSidebar from './CartSidebar';
import { FaSearch, FaFilter, FaShoppingCart } from 'react-icons/fa';

const Marketplace = () => {
  const { api } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [filters, setFilters] = useState({
    subject: 'all',
    grade: '',
    type: 'all',
    sort: 'newest',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const subjects = [
    { id: 'all', name: 'Tất cả', icon: '📚' },
    { id: 'toan', name: 'Toán', icon: '📘' },
    { id: 'van', name: 'Văn', icon: '📖' },
    { id: 'anh', name: 'Anh', icon: '🇬🇧' },
    { id: 'ly', name: 'Lý', icon: '⚛️' },
    { id: 'hoa', name: 'Hóa', icon: '🧪' },
    { id: 'sinh', name: 'Sinh', icon: '🧬' },
    { id: 'su', name: 'Sử', icon: '🏛️' },
    { id: 'dia', name: 'Địa', icon: '🌍' }
  ];
  
  const grades = [6, 7, 8, 9, 10, 11, 12];
  const types = [
    { id: 'all', name: 'Tất cả' },
    { id: 'document', name: 'Tài liệu' },
    { id: 'exam', name: 'Đề thi' },
    { id: 'video', name: 'Video' }
  ];
  const sortOptions = [
    { id: 'newest', name: 'Mới nhất' },
    { id: 'popular', name: 'Phổ biến' },
    { id: 'price_asc', name: 'Giá thấp đến cao' },
    { id: 'price_desc', name: 'Giá cao đến thấp' },
    { id: 'rating', name: 'Đánh giá cao nhất' }
  ];
  
  useEffect(() => {
    fetchCartCount();
    fetchMaterials();
  }, [filters, page]);
  
  const fetchCartCount = async () => {
    try {
      const response = await api.get('/marketplace/cart');
      setCartCount(response.data.items.length);
    } catch (err) {}
  };
  
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page,
        limit: 20
      });
      const response = await api.get(`/marketplace/materials?${params}`);
      
      if (page === 1) {
        setMaterials(response.data.materials);
      } else {
        setMaterials(prev => [...prev, ...response.data.materials]);
      }
      
      setHasMore(response.data.materials.length === 20);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMaterials();
  };
  
  const handleAddToCart = async (materialId) => {
    try {
      await api.post('/marketplace/cart/add', { materialId });
      setCartCount(prev => prev + 1);
      alert('Đã thêm vào giỏ hàng!');
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📚 Chợ tài liệu</h1>
        <button
          onClick={() => setShowCart(true)}
          className="relative bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
        >
          <FaShoppingCart />
          Giỏ hàng
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Tìm kiếm tài liệu..."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button type="submit" className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600">
            <FaSearch />
          </button>
        </div>
      </form>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FaFilter className="text-gray-500" />
          <span className="font-medium">Bộ lọc</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Môn học</label>
            <select
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.icon} {sub.name}</option>
              ))}
            </select>
          </div>
          
          {/* Grade Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Lớp</label>
            <select
              value={filters.grade}
              onChange={(e) => handleFilterChange('grade', e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Tất cả</option>
              {grades.map(g => (
                <option key={g} value={g}>Lớp {g}</option>
              ))}
            </select>
          </div>
          
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Loại tài liệu</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              {types.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          
          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Sắp xếp theo</label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              {sortOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map(material => (
          <MaterialCard
            key={material._id}
            material={material}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
      
      {/* Loading */}
      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      )}
      
      {/* Load More */}
      {hasMore && !loading && materials.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => setPage(prev => prev + 1)}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            Xem thêm
          </button>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && materials.length === 0 && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500">Không tìm thấy tài liệu</p>
          <p className="text-sm text-gray-400">Hãy thử thay đổi bộ lọc tìm kiếm</p>
        </div>
      )}
      
      {/* Cart Sidebar */}
      {showCart && <CartSidebar onClose={() => setShowCart(false)} onUpdate={fetchCartCount} />}
    </div>
  );
};

export default Marketplace;