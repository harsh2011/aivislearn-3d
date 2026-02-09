import React from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, RotateCcw, XCircle, BrainCircuit } from 'lucide-react';
import { LessonData, AppState, QuizQuestion } from '../types';

interface UIOverlayProps {
    appState: AppState;
    lessonData: LessonData;
    currentStepIndex: number;
    totalSteps: number;
    onNextStep: () => void;
    onPrevStep: () => void;
    onStartQuiz: () => void;
    onBackToHome: () => void;

    // Quiz Props
    currentQuizIndex: number;
    onQuizAnswer: (idx: number) => void;
    quizAnswerResult: 'correct' | 'incorrect' | null;
    onNextQuizQuestion: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
    appState, lessonData, currentStepIndex, totalSteps,
    onNextStep, onPrevStep, onStartQuiz, onBackToHome,
    currentQuizIndex, onQuizAnswer, quizAnswerResult, onNextQuizQuestion
}) => {

    // --- EXPLAINING MODE UI ---
    if (appState === 'EXPLAINING') {
        const step = lessonData.steps[currentStepIndex];
        const progress = ((currentStepIndex + 1) / totalSteps) * 100;

        return (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-8 z-10">
                {/* Top Bar */}
                <div className="flex justify-between items-center pointer-events-auto">
                    <button onClick={onBackToHome} className="bg-white/90 p-3 rounded-full shadow hover:bg-white">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="bg-white/90 px-4 py-2 rounded-full font-bold text-indigo-600 shadow">
                        {lessonData.topic}
                    </div>
                    <div className="w-10"></div>
                </div>

                {/* Explanation Bar - Bottom Center */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 pointer-events-auto flex justify-center">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-5 w-full border border-white/60 flex flex-col sm:flex-row items-center gap-6">

                        {/* Left: Progress & Step Info */}
                        <div className="flex flex-col items-center justify-center min-w-[80px] shrink-0 transform -translate-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Step</span>
                            <div className="text-3xl font-black text-indigo-600 leading-none tabular-nums">
                                {currentStepIndex + 1}<span className="text-lg text-indigo-400 font-medium ml-0.5">/{totalSteps}</span>
                            </div>
                        </div>

                        {/* Middle: Explanation Text */}
                        <div className="flex-grow text-center sm:text-left border-l-0 sm:border-l border-gray-200 px-0 sm:px-6 py-2 sm:py-0">
                            <p className="text-base sm:text-lg font-medium text-gray-800 leading-snug">
                                {step.explanation}
                            </p>
                        </div>

                        {/* Right: Controls */}
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={onPrevStep}
                                disabled={currentStepIndex === 0}
                                className="p-3 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Previous Step"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            {currentStepIndex < totalSteps - 1 ? (
                                <button
                                    onClick={onNextStep}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2"
                                >
                                    Next <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={onStartQuiz}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2 animate-pulse"
                                >
                                    <BrainCircuit className="w-4 h-4" /> Quiz
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- QUIZ MODE UI ---
    if (appState === 'QUIZ') {
        const question = lessonData.quiz[currentQuizIndex];
        return (
            <div className="absolute inset-0 flex items-center justify-center p-4 z-20 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-xl w-full pointer-events-auto border-4 border-indigo-50 relative overflow-hidden">
                    <div className="flex justify-center mb-4">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                            QUESTION {currentQuizIndex + 1} OF {lessonData.quiz.length}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
                        {question.question}
                    </h2>

                    <div className="space-y-3 mb-6">
                        {question.options.map((option, idx) => {
                            let btnClass = "w-full text-left p-4 rounded-xl border-2 font-medium transition-all duration-200 ";

                            if (quizAnswerResult === null) {
                                btnClass += "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700";
                            } else if (idx === question.correctAnswerIndex) {
                                btnClass += "border-green-500 bg-green-50 text-green-700";
                            } else if (quizAnswerResult === 'incorrect' && idx !== question.correctAnswerIndex) {
                                btnClass += "border-gray-200 opacity-50";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => onQuizAnswer(idx)}
                                    disabled={quizAnswerResult !== null}
                                    className={btnClass}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option}</span>
                                        {quizAnswerResult !== null && idx === question.correctAnswerIndex && <CheckCircle className="w-5 h-5 text-green-600" />}
                                        {quizAnswerResult === 'incorrect' && idx !== question.correctAnswerIndex && <span />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {quizAnswerResult && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in-down mb-4">
                            <div className="flex items-center gap-2 mb-2 font-bold">
                                {quizAnswerResult === 'correct' ? (
                                    <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Correct!</span>
                                ) : (
                                    <span className="text-red-500 flex items-center gap-1"><XCircle className="w-4 h-4" /> Incorrect</span>
                                )}
                            </div>
                            <p className="text-gray-600 text-sm">{question.explanation}</p>
                        </div>
                    )}

                    {quizAnswerResult && (
                        <button
                            onClick={onNextQuizQuestion}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
                        >
                            {currentQuizIndex < lessonData.quiz.length - 1 ? "Next Question" : "See Results"}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // --- SUMMARY MODE UI ---
    if (appState === 'SUMMARY') {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-bounce-in">
                    <BookOpen className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Lesson Complete!</h2>
                    <p className="text-gray-600 mb-8">You've explored {lessonData.topic} and tested your knowledge.</p>

                    <button
                        onClick={onBackToHome}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                    >
                        <RotateCcw className="w-5 h-5" /> Create New World
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default UIOverlay;
