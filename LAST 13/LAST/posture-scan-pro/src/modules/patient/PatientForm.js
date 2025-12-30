import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PatientForm.css';

const PatientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = id !== undefined;
  
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    birthDate: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (isEditMode) {
      // 在实际应用中，这里应该从API获取人员数据
      // 模拟从API获取数据
      setTimeout(() => {
        setFormData({
          name: '张三',
          gender: 'male',
          birthDate: '1985-06-15',
          email: 'zhangsan@example.com',
          phone: '13812345678',
          address: '北京市海淀区科技园路8号',
          notes: '人员有轻微腰背痛历史'
        });
        setLoading(false);
      }, 500);
    }
  }, [id, isEditMode]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // 清除相关字段的错误
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '姓名不能为空';
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = '请选择出生日期';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '手机号格式不正确';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

    const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  // 获取当前存储的人员数据（如果有的话）
  const existingPatientsString = localStorage.getItem('patients');
  const existingPatients = existingPatientsString ? JSON.parse(existingPatientsString) : [];
  
  // 创建新人员对象或更新现有人员
  const patientData = {
    ...formData,
    // 如果是编辑模式，使用现有 ID，否则生成新的 ID
    id: isEditMode ? parseInt(id) : (existingPatients.length > 0 ? Math.max(...existingPatients.map(p => p.id)) + 1 : 1),
    // 添加其他字段
    gender: formData.gender === 'male' ? '男' : formData.gender === 'female' ? '女' : '其他',
    lastAssessment: new Date().toISOString().split('T')[0], // 当前日期作为最近评估日期
    assessmentCount: isEditMode ? (existingPatients.find(p => p.id === parseInt(id))?.assessmentCount || 0) : 0
  };
  
  // 如果是编辑模式，更新现有人员；否则添加新人员
  const updatedPatients = isEditMode
    ? existingPatients.map(p => p.id === parseInt(id) ? patientData : p)
    : [...existingPatients, patientData];
  
  // 保存更新后的数据到本地存储
  localStorage.setItem('patients', JSON.stringify(updatedPatients));
  
  // 显示成功消息
  alert(isEditMode ? '人员信息更新成功！' : '新人员添加成功！');
  navigate('/users');
};
  
  const handleCancel = () => {
    navigate('/users');
  };
  
  if (loading) {
    return <div className="patient-form-loading">加载中...</div>;
  }
  
  return (
    <div className="patient-form-container">
      <div className="form-header">
        <h1>{isEditMode ? '编辑人员' : '新增人员'}</h1>
      </div>
      
      <form className="patient-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>基本信息</h2>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="name">姓名 <span className="required">*</span></label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>
            
            <div className="form-field">
              <label htmlFor="gender">性别</label>
              <select 
                id="gender" 
                name="gender" 
                value={formData.gender} 
                onChange={handleInputChange}
              >
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="birthDate">出生日期 <span className="required">*</span></label>
              <input 
                type="date" 
                id="birthDate" 
                name="birthDate" 
                value={formData.birthDate} 
                onChange={handleInputChange}
                className={errors.birthDate ? 'error' : ''}
                min="1920-01-01"
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.birthDate && <div className="error-message">{errors.birthDate}</div>}
            </div>
            
            <div className="form-field">
              <label htmlFor="email">邮箱</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="phone">电话</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <div className="error-message">{errors.phone}</div>}
            </div>
            
            <div className="form-field">
              <label htmlFor="address">地址</label>
              <input 
                type="text" 
                id="address" 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>附加信息</h2>
          
          <div className="form-field">
            <label htmlFor="notes">备注</label>
            <textarea 
              id="notes" 
              name="notes" 
              value={formData.notes} 
              onChange={handleInputChange}
              rows={4}
              placeholder="输入人员相关备注信息..."
            ></textarea>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={handleCancel}>
            取消
          </button>
          <button type="submit" className="btn-submit">
            {isEditMode ? '更新' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
