import React, { useState, useEffect } from 'react';
import { Sparkles, Rocket, Play, Loader2, User, Clock, BookOpen } from 'lucide-react';
import { SAMPLE_PROMPTS, AGE_SPECIFIC_PROMPTS } from '../constants';
import { fetchGeneratedLessons, LessonSummary } from '../services/geminiService';

interface HomePageProps {
  onGenerate: (topic: string, age: number) => void;
  isLoading: boolean;
  onLoadLesson: (filename: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onGenerate, isLoading, onLoadLesson }) => {
  const [input, setInput] = useState('');
  const [age, setAge] = useState(7);
  const [recentLessons, setRecentLessons] = useState<LessonSummary[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  useEffect(() => {
    const loadLessons = async () => {
      try {
        const lessons = await fetchGeneratedLessons();
        setRecentLessons(lessons);
      } catch (error) {
        console.error("Failed to load recent lessons", error);
      } finally {
        setLoadingLessons(false);
      }
    };
    loadLessons();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onGenerate(input, age);
  };

  // Determine age group and get relevant prompts
  const getPromptsForAge = (currentAge: number) => {
    if (currentAge <= 5) return AGE_SPECIFIC_PROMPTS.toddler;
    if (currentAge >= 10) return AGE_SPECIFIC_PROMPTS.preteen;
    return AGE_SPECIFIC_PROMPTS.child;
  };

  const currentPrompts = getPromptsForAge(age);

  return (
    <div className="min-h-screen bg-[#3b0764] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full relative overflow-hidden my-8">

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-600"></div>
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12">

          {/* Left Column: Form & Intro */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center text-left">
            <div className="flex items-center gap-4 mb-6">
              <img src="/logo.png" alt="AI Vizual Learning Logo" className="w-16 h-16 object-contain" />
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                AI Vizual<br /><span className="text-indigo-600">Learning</span>
              </h1>
            </div>

            <p className="text-lg text-gray-600 mb-8">
              Type anything you want to learn, and our AI will build a magical 3D world just for you!
            </p>

            <form onSubmit={handleSubmit} className="mb-0 group space-y-6">

              {/* Topic Input */}
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., Solar System, Counting to 5..."
                  className="w-full px-5 py-3 text-lg rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm group-hover:shadow-md"
                  disabled={isLoading}
                />
              </div>

              {/* Age Slider */}
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-indigo-700 font-bold flex items-center gap-2">
                    <User className="w-5 h-5" /> Learner Age
                  </label>
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                    {age} Years Old
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-indigo-400 mt-1 font-medium">
                  <span>Toddler (3)</span>
                  <span>Kid (7)</span>
                  <span>Pre-teen (12)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Play className="w-5 h-5 fill-current" /> Build My World!</>}
              </button>
            </form>
          </div>

          {/* Right Column: Suggestions & History */}
          <div className="lg:col-span-5 bg-indigo-50/50 p-8 sm:p-10 border-t lg:border-t-0 lg:border-l border-indigo-100 flex flex-col h-full">

            <div className="mb-8">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" /> Try these adventures
              </p>
              <div className="flex flex-wrap gap-2">
                {currentPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onGenerate(prompt, age)}
                    disabled={isLoading}
                    type="button"
                    className="bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-indigo-100 hover:border-indigo-300 shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {recentLessons.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Worlds
                </p>
                <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1 flex-1 custom-scrollbar max-h-[300px] lg:max-h-none">
                  {recentLessons.map((lesson) => (
                    <button
                      key={lesson.filename}
                      onClick={() => onLoadLesson(lesson.filename)}
                      disabled={isLoading}
                      className="w-full text-left bg-white hover:bg-indigo-50 p-3 rounded-xl transition-all border border-indigo-100 hover:border-indigo-300 group flex justify-between items-center shadow-sm hover:shadow-md"
                    >
                      <div className="overflow-hidden mr-2">
                        <h3 className="font-semibold text-indigo-900 text-sm group-hover:text-indigo-700 truncate">{lesson.topic}</h3>
                        <p className="text-xs text-indigo-500">Age: {lesson.age || lesson.ageFromFilename || 'Unknown'} • {new Date(lesson.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default HomePage;
