// src/components/marketplace/CartSidebar.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaTrash, FaCreditCard, FaGem, FaMoneyBillWave, FaTimes } from 'react-icons/fa';

const CartSidebar = ({ onClose, onUpdate }) => {
  const { user, api } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('diamonds');
  
  useEffect(() => {
    fetchCart();
  }, []);
  
  const fetchCart = async () => {
    try {
      const response = await api.get('/marketplace/cart');
      setCart(response.data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const removeItem = async (materialId) => {
    try {
      await api.delete(`/marketplace/cart/remove/${materialId}`);
      fetchCart();
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };
  
  const applyCoupon = async () => {
    if (!couponCode) return;
    
    try {
      const response = await api.post('/marketplace/coupon/apply', {
        code: couponCode,
        subtotal: cart?.subtotal || 0
      });
      setCouponDiscount(response.data.discount);
    } catch (err) {
      alert(err.response?.data?.error || 'Mã giảm giá không hợp lệ');
    }
  };
  
  const checkout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await api.post('/marketplace/checkout', { paymentMethod });
      alert('Thanh toán thành công!');
      onClose();
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Thanh toán thất bại');
    } finally {
      setCheckoutLoading(false);
    }
  };
  
  const total = (cart?.subtotal || 0) - couponDiscount;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">🛒 Giỏ hàng ({cart?.items?.length || 0})</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FaTimes />
          </button>
        </div>
        
        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10">Đang tải...</div>
          ) : cart?.items?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <div className="text-4xl mb-3">🛒</div>
              <p>Giỏ hàng trống</p>
            </div>
          ) : (
            cart?.items?.map(item => (
              <div key={item.material._id} className="flex gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{item.material.title}</div>
                  <div className="text-sm text-gray-500">
                    {item.material.subject === 'toan' ? 'Toán' : 
                     item.material.subject === 'van' ? 'Văn' : 
                     item.material.subject === 'anh' ? 'Anh' : 
                     item.material.subject === 'ly' ? 'Lý' : 
                     item.material.subject === 'hoa' ? 'Hóa' : 
                     item.material.subject === 'sinh' ? 'Sinh' : 
                     item.material.subject === 'su' ? 'Sử' : 'Địa'} - Lớp {item.material.grade}
                  </div>
                  <div className="text-green-600 font-bold">{item.price}💎</div>
                </div>
                <button
                  onClick={() => removeItem(item.material._id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Coupon */}
        {cart?.items?.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Mã giảm giá"
                className="flex-1 p-2 border rounded-lg"
              />
              <button onClick={applyCoupon} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">
                Áp dụng
              </button>
            </div>
            {couponDiscount > 0 && (
              <div className="text-green-600 text-sm mt-2">
                Giảm {couponDiscount}💎
              </div>
            )}
          </div>
        )}
        
        {/* Payment Method */}
        {cart?.items?.length > 0 && (
          <div className="p-4 border-t">
            <div className="font-medium mb-2">Phương thức thanh toán</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="diamonds"
                  checked={paymentMethod === 'diamonds'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <FaGem className="text-purple-500" /> Kim cương ({user?.diamonds}💎)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="balance"
                  checked={paymentMethod === 'balance'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <FaMoneyBillWave className="text-green-500" /> Ví tiền ({user?.balance?.toLocaleString()}đ)
              </label>
            </div>
          </div>
        )}
        
        {/* Footer */}
        {cart?.items?.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between mb-2">
              <span>Tạm tính:</span>
              <span>{cart?.subtotal?.toLocaleString()}💎</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>Giảm giá:</span>
                <span>-{couponDiscount}💎</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Tổng cộng:</span>
              <span className="text-green-600">{total.toLocaleString()}💎</span>
            </div>
            <button
              onClick={checkout}
              disabled={checkoutLoading}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
            >
              {checkoutLoading ? 'Đang xử lý...' : 'Thanh toán'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;