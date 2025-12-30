/**
 * API 兼容层 - 自动判断运行环境 (Electron/浏览器)
 * 在 Electron 中使用 IPC，在浏览器中使用 HTTP API
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// 检测是否在 Electron 环境中
const isElectron = () => {
  return window.api !== undefined;
};

// HTTP 请求封装
const httpRequest = async (url, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API 请求失败');
  }
  return response.json();
};

// 统一 API 接口
const api = {
  // ========== Patient APIs ==========
  getPatients: async () => {
    if (isElectron()) {
      return window.api.getPatients();
    }
    return httpRequest('/api/patients');
  },

  getPatientById: async (id) => {
    if (isElectron()) {
      return window.api.getPatientById(id);
    }
    return httpRequest(`/api/patients/${id}`);
  },

  addPatient: async (patient) => {
    if (isElectron()) {
      return window.api.addPatient(patient);
    }
    return httpRequest('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
  },

  updatePatient: async (patient) => {
    if (isElectron()) {
      return window.api.updatePatient(patient);
    }
    return httpRequest(`/api/patients/${patient.id}`, {
      method: 'PUT',
      body: JSON.stringify(patient),
    });
  },

  deletePatient: async (id) => {
    if (isElectron()) {
      return window.api.deletePatient(id);
    }
    return httpRequest(`/api/patients/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== Assessment APIs ==========
  addAssessment: async (assessmentData) => {
    if (isElectron()) {
      return window.api.addAssessment(assessmentData);
    }
    return httpRequest('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(assessmentData),
    });
  },

  getAllAssessments: async () => {
    if (isElectron()) {
      return window.api.getAllAssessments();
    }
    return httpRequest('/api/assessments');
  },

  getAssessmentById: async (id) => {
    if (isElectron()) {
      return window.api.getAssessmentById(id);
    }
    return httpRequest(`/api/assessments/${id}`);
  },

  getAssessmentsByPatientId: async (patientId) => {
    if (isElectron()) {
      return window.api.getAssessmentsByPatientId(patientId);
    }
    return httpRequest(`/api/patients/${patientId}/assessments`);
  },

  // ========== Exercise APIs ==========
  getAllExercises: async () => {
    if (isElectron()) {
      return window.api.getAllExercises();
    }
    return httpRequest('/api/exercises');
  },

  getExerciseBySlug: async (slug) => {
    if (isElectron()) {
      return window.api.getExerciseBySlug(slug);
    }
    return httpRequest(`/api/exercises/${slug}`);
  },

  // ========== Statistics APIs (数据展示模块) ==========
    getStatistics: async () => {
      if (isElectron()) {
        // Electron 模式下也调用 HTTP API（统一处理）
        return httpRequest('/api/statistics');
      }
      return httpRequest('/api/statistics');
    },
  
    // ========== 健康检查 ==========
  checkHealth: async () => {
    if (isElectron()) {
      return { status: 'ok', database: 'connected', mode: 'electron' };
    }
    try {
      const result = await httpRequest('/api/health');
      return { ...result, mode: 'browser' };
    } catch (error) {
      return { status: 'error', database: 'disconnected', mode: 'browser', error: error.message };
    }
  },
};

export default api;
