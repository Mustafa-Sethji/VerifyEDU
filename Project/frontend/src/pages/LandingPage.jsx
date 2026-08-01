import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  GraduationCap,
  Brain,
  FileText,
  CheckCircle,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 selection:bg-green-600 selection:text-gray-900">
      {/* Header Navigation */}
      <header className="px-8 py-6 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-50 bg-white/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles className="w-6 h-6 text-gray-900" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-['Outfit']">
            VERIFY<span className="text-green-600">EDU</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50/60 transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 shadow-lg shadow-purple-600/30 transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-8 pt-20 pb-32 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50/60 border border-purple-800/50 text-green-600 text-xs font-semibold mb-8 shadow-inner">
          <Sparkles className="w-4 h-4 text-green-600 animate-spin" />
          <span>Next-Generation AI Classroom Platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto font-['Outfit']">
          AI-Powered Learning, <br />
          <span className="gradient-text">Grounded in Authentic Coursework</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-normal leading-relaxed">
          Upload study materials, automatically generate intelligent quizzes, attempt interactive assessments, and analyze student comprehension with local ML answer grading.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup?role=teacher"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 font-bold text-base shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 group transition-all"
          >
            <GraduationCap className="w-5 h-5" />
            <span>Join as Teacher</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/signup?role=student"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-gray-200 hover:border-purple-500/50 text-gray-700 hover:text-gray-900 font-bold text-base flex items-center justify-center gap-2 transition-all"
          >
            <Users className="w-5 h-5 text-green-600" />
            <span>Join as Student</span>
          </Link>
        </div>

        {/* Preview Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="glass-card p-8 rounded-3xl border border-gray-200/80 glass-card-hover">
            <div className="w-12 h-12 rounded-2xl bg-green-50/60 border border-purple-800/50 flex items-center justify-center text-green-600 mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-['Outfit']">PDF RAG Processing</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Extract semantic text chunks and build instant FAISS vector indexes grounded strictly in course PDFs.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-gray-200/80 glass-card-hover">
            <div className="w-12 h-12 rounded-2xl bg-green-50/60 border border-blue-800/50 flex items-center justify-center text-green-600 mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-['Outfit']">Ollama LLM Quiz Gen</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Generates customized MCQ & descriptive conceptual quizzes without sending full PDFs outside your infrastructure.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-gray-200/80 glass-card-hover">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-['Outfit']">Semantic Answer Grading</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              ML sentence embeddings + TF-IDF keyword & concept scoring provide instant, accurate feedback on descriptive questions.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-gray-200/60 text-center text-xs text-gray-500">
        <p>© 2026 VERIFYEDU Platform. Powered by DeepMind & AI Classroom Systems.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
