import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import api from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        const data = await api.getPatients();
        setPatients(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setError("无法从数据库加载人员信息。");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleOpenModal = (e, patient = null) => {
    e.stopPropagation(); // Prevent row click when clicking edit/delete
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const handleSavePatient = async (patientData) => {
    try {
      if (editingPatient) {
        const updatedPatient = await api.updatePatient({ ...editingPatient, ...patientData });
        setPatients(patients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      } else {
        const newPatient = await api.addPatient(patientData);
        setPatients([newPatient, ...patients]);
      }
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save patient:", err);
      setError("保存失败。");
    }
  };

  const handleDeletePatient = async (e, id) => {
    e.stopPropagation(); // Prevent row click
    if (window.confirm('确定要删除这位人员吗？该人员的所有评估报告也将被一并删除。')) {
      try {
        await api.deletePatient(id);
        setPatients(patients.filter(p => p.id !== id));
      } catch (err) {
        console.error("Failed to delete patient:", err);
        setError("删除失败。");
      }
    }
  };

  const handleViewPatientDetail = (patientId) => {
    navigate(`/patient/${patientId}`);
  };

  if (isLoading) {
    return <div className="page-container"><h1>正在加载人员信息...</h1></div>;
  }

  if (error) {
    return <div className="page-container"><h1 style={{ color: 'red' }}>{error}</h1></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>人员管理</h1>
        <button className="btn btn-primary" onClick={(e) => handleOpenModal(e)}>
          <FaPlus /> 添加新人员
        </button>
      </div>

      <div className="content-card">
        <div className="patient-table-container">
          <table className="patient-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>性别</th>
                <th>年龄</th>
                <th>身高 (cm)</th>
                <th>体重 (kg)</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? patients.map(patient => (
                <tr key={patient.id} className="patient-row" onClick={() => handleViewPatientDetail(patient.id)}>
                  <td>{patient.name}</td>
                  <td>{patient.gender}</td>
                  <td>{patient.age}</td>
                  <td>{patient.height}</td>
                  <td>{patient.weight}</td>
                  <td className="actions-cell">
                    <button className="btn-icon" title="编辑" onClick={(e) => handleOpenModal(e, patient)}><FaEdit /></button>
                    <button className="btn-icon btn-delete" title="删除" onClick={(e) => handleDeletePatient(e, patient.id)}><FaTrash /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="empty-state">数据库中暂无人员数据，请点击右上角添加。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && <PatientFormModal patient={editingPatient} onSave={handleSavePatient} onClose={handleCloseModal} />}
    </div>
  );
};

// PatientFormModal remains the same
const PatientFormModal = ({ patient, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '', gender: '男', age: '', height: '', weight: ''
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '', gender: patient.gender || '男', age: patient.age || '', height: patient.height || '', weight: patient.weight || ''
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('姓名不能为空');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <h2>{patient ? '编辑人员信息' : '添加新人员'}</h2>
          <div className="form-group">
            <label htmlFor="name">姓名</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="gender">性别</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="age">年龄</label>
            <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="height">身高 (cm)</label>
            <input type="number" step="0.01" id="height" name="height" value={formData.height} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="weight">体重 (kg)</label>
            <input type="number" step="0.01" id="weight" name="weight" value={formData.weight} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
