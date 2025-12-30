const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure and COMPLETE API to the renderer process
contextBridge.exposeInMainWorld('api', {
  // === Patient APIs ===
  getPatients: () => ipcRenderer.invoke('db:get-patients'),
  getPatientById: (id) => ipcRenderer.invoke('db:get-patient-by-id', id),
  addPatient: (patient) => ipcRenderer.invoke('db:add-patient', patient),
  updatePatient: (patient) => ipcRenderer.invoke('db:update-patient', patient),
  deletePatient: (id) => ipcRenderer.invoke('db:delete-patient', id),

  // === Assessment (Report) APIs ===
  addAssessment: (assessmentData) => ipcRenderer.invoke('db:add-assessment', assessmentData),
  getAllAssessments: () => ipcRenderer.invoke('db:get-all-assessments'),
  getAssessmentById: (id) => ipcRenderer.invoke('db:get-assessment-by-id', id),
  getAssessmentsByPatientId: (patientId) => ipcRenderer.invoke('db:get-assessments-by-patient-id', patientId),

  // === Exercise APIs ===
  getAllExercises: () => ipcRenderer.invoke('db:get-all-exercises'),
  getExerciseBySlug: (slug) => ipcRenderer.invoke('db:get-exercise-by-slug', slug),
});
