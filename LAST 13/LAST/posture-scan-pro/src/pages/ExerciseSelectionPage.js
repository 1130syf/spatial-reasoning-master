import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './ExerciseSelectionPage.css';

const ExerciseSelectionPage = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
        const data = await api.getAllExercises();
        setExercises(data);
      } catch (err) {
        console.error("Failed to fetch exercises:", err);
        setError("无法从数据库加载运动列表。");
      } finally {
        setIsLoading(false);
      }
    };
    fetchExercises();
  }, []);

  const handleSelectExercise = (exercise) => {
    // Navigate to a generic analysis page, passing the slug
    navigate(`/motion-correction/${exercise.slug}`);
  };

  if (isLoading) {
    return <div className="page-container"><h1>正在加载运动列表...</h1></div>;
  }

  if (error) {
    return <div className="page-container"><h1 style={{ color: 'red' }}>{error}</h1></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>运动纠正</h1>
        <p>请选择您希望进行分析和纠正的运动项目。</p>
      </div>

      <div className="exercise-grid">
        {exercises.map(exercise => (
          <div 
            key={exercise.id} 
            className="exercise-card"
            onClick={() => handleSelectExercise(exercise)}
          >
            <div className="exercise-card-category">{exercise.categoryName}</div>
            <h3 className="exercise-card-title">{exercise.name}</h3>
            <p className="exercise-card-description">{exercise.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseSelectionPage;
