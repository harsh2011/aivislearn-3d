import React, { useState, useEffect, useMemo } from 'react';
import Scene3D from './components/Scene3D';
import UIOverlay from './components/UIOverlay';
import HomePage from './components/HomePage';
import { generateLesson, fetchLesson } from './services/geminiService';
import { LessonData, AppState, SceneObjectState } from './types';
import * as THREE from 'three';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Explanation State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Quiz State
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswerResult, setQuizAnswerResult] = useState<'correct' | 'incorrect' | null>(null);

  const handleGenerate = async (topic: string, age: number) => {
    setAppState('GENERATING');
    setError(null);
    try {
      const data = await generateLesson(topic, age);
      setLessonData(data);
      setCurrentStepIndex(0);
      setAppState('EXPLAINING');
    } catch (err) {
      console.error(err);
      setError("Oops! Something went wrong while building your world. Please try again.");
      setAppState('HOME');
    }
  };

  const handleLoadLesson = async (filename: string) => {
    setAppState('GENERATING'); // Use generating state to show loader
    setError(null);
    try {
      const data = await fetchLesson(filename);
      setLessonData(data);
      setCurrentStepIndex(0);
      setAppState('EXPLAINING');
    } catch (err) {
      console.error(err);
      setError("Could not load the selected lesson.");
      setAppState('HOME');
    }
  };

  const handleBackToHome = () => {
    setAppState('HOME');
    setLessonData(null);
    setCurrentStepIndex(0);
    setCurrentQuizIndex(0);
    setQuizAnswerResult(null);
  };

  const handleNextStep = () => {
    if (!lessonData) return;
    if (currentStepIndex < lessonData.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleStartQuiz = () => {
    setCurrentQuizIndex(0);
    setQuizAnswerResult(null);
    setAppState('QUIZ');
  };

  const handleQuizAnswer = (idx: number) => {
    if (!lessonData) return;
    const question = lessonData.quiz[currentQuizIndex];
    if (idx === question.correctAnswerIndex) {
      setQuizAnswerResult('correct');
    } else {
      setQuizAnswerResult('incorrect');
    }
  };

  const handleNextQuizQuestion = () => {
    if (!lessonData) return;
    setQuizAnswerResult(null);
    if (currentQuizIndex < lessonData.quiz.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setAppState('SUMMARY');
    }
  };

  // --- Calculate Current Object States based on steps ---
  const currentObjectStates = useMemo(() => {
    if (!lessonData) return [];

    // Start with initial objects
    // We must deep clone to avoid mutating the original definition
    const objectsMap = new Map<string, SceneObjectState>();
    lessonData.initialObjects.forEach(obj => {
      objectsMap.set(obj.id, JSON.parse(JSON.stringify(obj)));
    });

    // Apply updates up to current step
    for (let i = 0; i <= currentStepIndex; i++) {
      const step = lessonData.steps[i];
      if (step && step.objectUpdates && Array.isArray(step.objectUpdates)) {
        step.objectUpdates.forEach((updateWrapper) => {
          const { id, updates } = updateWrapper;
          if (objectsMap.has(id)) {
            const obj = objectsMap.get(id)!;
            // Merge updates
            if (updates.position) obj.position = updates.position as [number, number, number];
            if (updates.rotation) obj.rotation = updates.rotation as [number, number, number];
            if (updates.scale) obj.scale = updates.scale as [number, number, number];
            if (updates.color) obj.color = updates.color;
            if (updates.shape) obj.shape = updates.shape;
            if (updates.opacity !== undefined && updates.opacity !== null) obj.opacity = updates.opacity;
            if (updates.label !== undefined) obj.label = updates.label;
          }
        });
      }
    }

    return Array.from(objectsMap.values());
  }, [lessonData, currentStepIndex]);

  return (
    <div className="w-full h-screen overflow-hidden font-sans">
      {appState === 'HOME' || appState === 'GENERATING' ? (
        <>
          <HomePage
            onGenerate={handleGenerate}
            isLoading={appState === 'GENERATING'}
            onLoadLesson={handleLoadLesson}
          />
          {error && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-6 py-3 rounded-xl shadow-lg border border-red-200 z-50 animate-bounce">
              {error}
            </div>
          )}
        </>
      ) : (
        <>
          {lessonData && (
            <div className="relative w-full h-full bg-gray-900">
              <Scene3D
                currentObjectStates={currentObjectStates}
                theme={lessonData.theme}
              />
              <UIOverlay
                appState={appState}
                lessonData={lessonData}
                currentStepIndex={currentStepIndex}
                totalSteps={lessonData.steps.length}
                onNextStep={handleNextStep}
                onPrevStep={handlePrevStep}
                onStartQuiz={handleStartQuiz}
                onBackToHome={handleBackToHome}
                currentQuizIndex={currentQuizIndex}
                onQuizAnswer={handleQuizAnswer}
                quizAnswerResult={quizAnswerResult}
                onNextQuizQuestion={handleNextQuizQuestion}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
