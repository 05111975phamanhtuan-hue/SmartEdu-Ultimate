// src/admin/TermsManager.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaScroll, FaEye } from 'react-icons/fa';

const TermsManager = () => {
  const { api } = useAuth();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTerms, setEditingTerms] = useState(null);
  const [formData, setFormData] = useState({
    version: '',
    title: 'Điều khoản dịch vụ SmartEdu',
    sections: [{ title: '', content: '', order: 1 }],
    effectiveDate: new Date().toISOString().split('T')[0]
  });
  const [previewTerms, setPreviewTerms] = useState(null);
  
  useEffect(() => {
    fetchVersions();
  }, []);
  
  const fetchVersions = async () => {
    try {
      const response = await api.get('/admin/terms/versions');
      setVersions(response.data);
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const addSection = () => {
    setFormData({
      ...formData,
      sections: [...formData.sections, { title: '', content: '', order: formData.sections.length + 1 }]
    });
  };
  
  const removeSection = (index) => {
    const newSections = formData.sections.filter((_, i) => i !== index);
    newSections.forEach((s, idx) => s.order = idx + 1);
    setFormData({ ...formData, sections: newSections });
  };
  
  const updateSection = (index, field, value) => {
    const newSections = [...formData.sections];
    newSections[index][field] = value;
    setFormData({ ...formData, sections: newSections });
  };
  
  const handleSubmit = async () => {
    if (!formData.version || formData.sections.some(s => !s.title || !s.content)) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    try {
      if (editingTerms) {
        await api.put(`/admin/terms/${editingTerms._id}`, formData);
        alert('Cập nhật thành công!');
      } else {
        await api.post('/admin/terms', formData);
        alert('Tạo phiên bản mới thành công!');
      }
      setShowForm(false);
      setEditingTerms(null);
      setFormData({
        version: '',
        title: 'Điều khoản dịch vụ SmartEdu',
        sections: [{ title: '', content: '', order: 1 }],
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      fetchVersions();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phiên bản này?')) return;
    
    try {
      await api.delete(`/admin/terms/${id}`);
      fetchVersions();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };
  
  const handlePreview = (terms) => {
    setPreviewTerms(terms);
  };
  
  if (loading) {
    return <div className="text-center py-10">Đang tải...</div>;
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FaScroll className="text-2xl text-green-600" />
          <h1 className="text-2xl font-bold">Quản lý điều khoản dịch vụ</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
        >
          <FaPlus /> Tạo phiên bản mới
        </button>
      </div>
      
      {/* Danh sách phiên bản */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Phiên bản</th>
                <th className="p-3 text-left">Tiêu đề</th>
                <th className="p-3 text-left">Ngày hiệu lực</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {versions.map(term => (
                <tr key={term._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono">{term.version}</td>
                  <td className="p-3">{term.title}</td>
                  <td className="p-3">{new Date(term.effectiveDate).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3 text-center">
                    {term.isActive ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Đang áp dụng</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">Hết hiệu lực</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handlePreview(term)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Xem trước"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTerms(term);
                          setFormData({
                            version: term.version,
                            title: term.title,
                            sections: term.sections,
                            effectiveDate: new Date(term.effectiveDate).toISOString().split('T')[0]
                          });
                          setShowForm(true);
                        }}
                        className="text-yellow-500 hover:text-yellow-700"
                        title="Sửa"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(term._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal tạo/sửa điều khoản */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTerms ? 'Sửa điều khoản' : 'Tạo phiên bản mới'}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phiên bản</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="Ví dụ: 2.0"
                    className="w-full p-2 border rounded-lg"
                    disabled={!!editingTerms}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày hiệu lực</label>
                  <input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Các mục điều khoản</label>
                  <button
                    onClick={addSection}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    + Thêm mục
                  </button>
                </div>
                
                {formData.sections.map((section, idx) => (
                  <div key={idx} className="border rounded-lg p-3 mb-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Mục {idx + 1}</span>
                      {formData.sections.length > 1 && (
                        <button
                          onClick={() => removeSection(idx)}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(idx, 'title', e.target.value)}
                      placeholder="Tiêu đề mục (VD: 1. Giới thiệu)"
                      className="w-full p-2 border rounded-lg mb-2"
                    />
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(idx, 'content', e.target.value)}
                      placeholder="Nội dung mục..."
                      rows="4"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <FaSave /> {editingTerms ? 'Cập nhật' : 'Tạo mới'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTerms(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
              >
                <FaTimes /> Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal xem trước */}
      {previewTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Xem trước: Phiên bản {previewTerms.version}</h2>
              <button onClick={() => setPreviewTerms(null)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-lg mb-3">{previewTerms.title}</h3>
              {previewTerms.sections?.sort((a,b) => a.order - b.order).map((section, idx) => (
                <div key={idx} className="mb-4">
                  <h4 className="font-semibold text-md mb-1">{section.title}</h4>
                  <p className="text-gray-700 whitespace-pre-line text-sm">{section.content}</p>
                </div>
              ))}
              <div className="mt-4 text-xs text-gray-400">
                Có hiệu lực từ: {new Date(previewTerms.effectiveDate).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsManager;