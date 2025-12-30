import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PersonnelManagement.css';

// 示例用户数据
const initialUsers = [
  { id: 1, name: '张三', gender: '男', age: 28, height: 175, weight: 68, lastCapture: '2023-10-15' },
  { id: 2, name: '李四', gender: '男', age: 32, height: 180, weight: 75, lastCapture: '2023-10-12' },
  { id: 3, name: '王五', gender: '男', age: 45, height: 172, weight: 70, lastCapture: '2023-10-08' },
  { id: 4, name: '赵六', gender: '女', age: 25, height: 165, weight: 52, lastCapture: '2023-10-05' },
];

const PersonnelManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    gender: '男',
    age: '',
    height: '',
    weight: '',
  });
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // 从localStorage加载用户数据，如果没有则使用示例数据
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(initialUsers);
    }
  }, []);

  useEffect(() => {
    // 保存用户数据到localStorage
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  const handleAddUser = () => {
    const newId = users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1;
    const today = new Date().toISOString().split('T')[0];

    const userToAdd = {
      ...newUser,
      id: newId,
      lastCapture: today
    };

    setUsers([...users, userToAdd]);
    setNewUser({
      name: '',
      gender: '男',
      age: '',
      height: '',
      weight: '',
    });
    setShowAddForm(false);
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    // 将选中的用户保存到localStorage，以便姿态捕获页面使用
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleStartCapture = () => {
    if (selectedUser) {
      // 导航到姿态捕获页面
      navigate('/posture-capture');
    } else {
      alert('请先选择一个用户');
    }
  };

  return (
    <div className="personnel-container">
      <div className="personnel-header">
        <h1>人员管理</h1>
        <div className="header-actions">
          <button onClick={() => setShowAddForm(true)} className="add-btn">添加人员</button>
          <button
            onClick={handleStartCapture}
            className={`capture-btn ${selectedUser ? 'active' : 'disabled'}`}
            disabled={!selectedUser}
          >
            姿态捕获
          </button>
        </div>
      </div>

      <div className="personnel-content">
        <div className="personnel-list">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>性别</th>
                <th>年龄</th>
                <th>身高(cm)</th>
                <th>体重(kg)</th>
                <th>最近捕获</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr
                  key={user.id}
                  className={selectedUser && selectedUser.id === user.id ? 'selected' : ''}
                  onClick={() => handleSelectUser(user)}
                >
                  <td>{user.name}</td>
                  <td>{user.gender}</td>
                  <td>{user.age}</td>
                  <td>{user.height}</td>
                  <td>{user.weight}</td>
                  <td>{user.lastCapture}</td>
                  <td>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUser(user.id);
                    }} className="delete-btn">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAddForm && (
          <div className="add-form-overlay">
            <div className="add-form">
              <h2>添加新人员</h2>
              <div className="form-group">
                <label>姓名:</label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>性别:</label>
                <select name="gender" value={newUser.gender} onChange={handleInputChange}>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div className="form-group">
                <label>年龄:</label>
                <input
                  type="number"
                  name="age"
                  value={newUser.age}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>身高(cm):</label>
                <input
                  type="number"
                  name="height"
                  value={newUser.height}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>体重(kg):</label>
                <input
                  type="number"
                  name="weight"
                  value={newUser.weight}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-actions">
                <button onClick={handleAddUser} className="submit-btn">添加</button>
                <button onClick={() => setShowAddForm(false)} className="cancel-btn">取消</button>
              </div>
            </div>
          </div>
        )}

        {selectedUser && (
          <div className="selected-user-info">
            <h3>已选择: {selectedUser.name}</h3>
            <button onClick={handleStartCapture} className="start-capture-btn">
              开始姿态捕获
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonnelManagement;