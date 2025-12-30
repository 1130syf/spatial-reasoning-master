import React, { createContext, useContext, useState, useCallback } from 'react';

const TrainingSessionContext = createContext();

export const useTrainingSession = () => {
  const context = useContext(TrainingSessionContext);
  if (!context) {
    throw new Error('useTrainingSession must be used within TrainingSessionProvider');
  }
  return context;
};

export const TrainingSessionProvider = ({ children }) => {
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [exerciseType, setExerciseType] = useState(null); // 'squat', 'bicep-curl', etc.

  const startTraining = useCallback((type) => {
    setIsTrainingActive(true);
    setExerciseType(type);
  }, []);

  const endTraining = useCallback(() => {
    setIsTrainingActive(false);
    setExerciseType(null);
  }, []);

  const value = {
    isTrainingActive,
    exerciseType,
    startTraining,
    endTraining,
  };

  return (
    <TrainingSessionContext.Provider value={value}>
      {children}
    </TrainingSessionContext.Provider>
  );
};
