// src/components/live/StreamShop.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaShoppingCart, FaDiamond, FaExternalLinkAlt, FaCheck } from 'react-icons/fa';

const StreamShop = ({ streamId, onClose }) => {
  const { user, api } = useAuth();
  const [products, setProducts] = useState([]);
  const [ads, setAds] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  
  useEffect(() => {
    fetchProducts();
    fetchAds();
  }, [streamId]);
  
  const fetchProducts = async () => {
    try {
      const response = await api.get(`/live/streams/${streamId}/products`);
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };
  
  const fetchAds = async () => {
    try {
      const response = await api.get(`/live/streams/${streamId}/ads`);
      setAds(response.data);
    } catch (err) {
      console.error('Failed to fetch ads:', err);
    }
  };
  
  const buyProduct = async (productId) => {
    setBuying(productId);
    try {
      const response = await api.post(`/live/streams/${streamId}/products/${productId}/buy`);
      if (response.data.externalLink) {
        window.open(response.data.externalLink, '_blank');
        alert('Mua thành công! Đã chuyển đến trang thanh toán.');
      } else {
        alert('Mua thành công! Sản phẩm sẽ được gửi đến bạn.');
      }
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Mua hàng thất bại');
    } finally {
      setBuying(null);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">🛍️ Shop trong livestream</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-3 text-center ${activeTab === 'products' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
          >
            🛒 Sản phẩm ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`flex-1 py-3 text-center ${activeTab === 'ads' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
          >
            📢 Quảng cáo
          </button>
        </div>
        
        {/* Products List */}
        {activeTab === 'products' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <div className="text-4xl mb-3">🛍️</div>
                <p>Chưa có sản phẩm nào</p>
              </div>
            ) : (
              products.map(product => (
                <div key={product._id} className="border rounded-xl p-4">
                  <div className="flex gap-3">
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt="" className="w-20 h-20 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold">{product.title}</div>
                      <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-green-600 font-bold text-lg">{product.price}💎</span>
                        {product.originalPrice && (
                          <span className="text-gray-400 line-through text-sm">{product.originalPrice}đ</span>
                        )}
                        {product.stock > 0 && (
                          <span className="text-xs text-gray-500">Còn {product.stock}</span>
                        )}
                      </div>
                      <button
                        onClick={() => buyProduct(product._id)}
                        disabled={buying === product._id || product.stock === 0}
                        className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                      >
                        {buying === product._id ? 'Đang xử lý...' : <><FaShoppingCart /> Mua ngay</>}
                      </button>
                      {product.isExternal && (
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <FaExternalLinkAlt /> Liên kết ngoài
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Ads List */}
        {activeTab === 'ads' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {ads.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <div className="text-4xl mb-3">📢</div>
                <p>Chưa có quảng cáo</p>
              </div>
            ) : (
              ads.map(ad => (
                <div key={ad._id} className="border rounded-xl p-4">
                  <div className="flex gap-3">
                    {ad.imageUrl && (
                      <img src={ad.imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold">{ad.title}</div>
                      <div className="text-sm text-gray-500 mt-1">{ad.description}</div>
                      <div className="text-xs text-gray-400 mt-2">
                        {ad.impressions} lượt xem • {ad.clicks} lượt click
                      </div>
                      {ad.linkUrl && (
                        <a
                          href={ad.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 text-sm hover:underline inline-flex items-center gap-1 mt-2"
                        >
                          Xem chi tiết <FaExternalLinkAlt />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamShop;