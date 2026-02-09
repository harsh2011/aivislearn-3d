import React, { useState } from 'react';
import { Sparkles, Rocket, Play, Loader2, User } from 'lucide-react';
import { SAMPLE_PROMPTS, AGE_SPECIFIC_PROMPTS } from '../constants';

interface HomePageProps {
  onGenerate: (topic: string, age: number) => void;
  isLoading: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ onGenerate, isLoading }) => {
  const [input, setInput] = useState('');
  const [age, setAge] = useState(7);

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
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center relative overflow-hidden">

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-600"></div>
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="AI Vizual Learning Logo" className="w-20 h-20 object-contain" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            AI Vizual Learning
          </h1>

          <p className="text-lg text-gray-600 mb-6">
            Type anything you want to learn, and our AI will build a magical 3D world just for you!
          </p>

          <form onSubmit={handleSubmit} className="relative mb-6 group space-y-4">

            {/* Topic Input */}
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Solar System, Counting to 5, Colors..."
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

          <div className="text-left">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Try these adventures:</p>
            <div className="flex flex-wrap gap-2">
              {currentPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onGenerate(prompt, age)}
                  disabled={isLoading}
                  type="button"
                  className="bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-indigo-200"
                >
                  <Sparkles className="w-3 h-3 inline mr-1 text-yellow-500" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
