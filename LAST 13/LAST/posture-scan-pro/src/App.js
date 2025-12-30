import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import Welcome from './components/Welcome';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import PatientDetailPage from './pages/PatientDetailPage';
import ReportDetailPage from './pages/ReportDetailPage';
import ExerciseSelectionPage from './pages/ExerciseSelectionPage';
import ExerciseAnalysisPage from './pages/ExerciseAnalysisPage';
import BicepCurlAnalysisPage from './pages/BicepCurlAnalysisPage';
import SettingsPage from './components/SettingsPage';
import PostureCapture from './modules/posture/PostureCapture';
import SpinalCurvature from './modules/posture/components/SpinalCurvature';
import SpinalCurvatureReport from './modules/posture/components/SpinalCurvatureReport';
import DatasetShowcase from './pages/DatasetShowcase';
import DataStatistics from './pages/DataStatistics';
import ExerciseReportDetail from './components/ExerciseReportDetail';
import { TrainingSessionProvider } from './contexts/TrainingSessionContext';

import './App.css';

// A component to dynamically select the correct analysis page
const DynamicExercisePage = () => {
  const { exerciseSlug } = useParams();
  
  if (exerciseSlug === 'bicep-curl') {
    return <BicepCurlAnalysisPage />;
  }
  
  return <ExerciseAnalysisPage />;
};

function App() {
  return (
    <Router>
      <TrainingSessionProvider>
        <Layout>
          <Routes>
            {/* Core Pages */}
            <Route path="/" element={<Welcome />} />
            <Route path="/personnel" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/spinal-curvature" element={<SpinalCurvature />} />
            <Route path="/patient/:patientId/spinal-curvature" element={<SpinalCurvature />} />
            <Route path="/spinal-curvature-report" element={<SpinalCurvatureReport />} />

            <Route path="/dataset" element={<DatasetShowcase />} />
                        <Route path="/statistics" element={<DataStatistics />} />

            {/* Patient-centric Flow */}
            <Route path="/patient/:patientId" element={<PatientDetailPage />} />
            <Route path="/patient/:patientId/assessment/new" element={<PostureCapture />} />
            <Route path="/assessment/:assessmentId" element={<ReportDetailPage />} />
            <Route path="/exercise-report/:reportId" element={<ExerciseReportDetail />} />

            {/* Motion Correction Flow */}
            <Route path="/motion-correction" element={<ExerciseSelectionPage />} />
            <Route path="/motion-correction/:exerciseSlug" element={<DynamicExercisePage />} />

            {/* Fallback for any other route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </TrainingSessionProvider>
    </Router>
  );
}

export default App;
