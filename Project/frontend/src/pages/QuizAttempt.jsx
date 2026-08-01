import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Skeleton from '../components/common/Skeleton';
import { Clock, CheckCircle, Brain, Sparkles, Send, AlertTriangle } from 'lucide-react';

const QuizAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useNotification();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Student Answers State
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [descriptiveAnswers, setDescriptiveAnswers] = useState({});

  // Countdown timer state (15 mins default)
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quizzes/${id}`);
        setQuiz(res.data);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        addToast('Failed to load quiz questions', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (!quiz || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, loading]);

  const handleMcqSelect = (mcqIdx, optionIdx) => {
    setMcqAnswers((prev) => ({ ...prev, [mcqIdx]: optionIdx }));
  };

  const handleDescriptiveChange = (descIdx, text) => {
    setDescriptiveAnswers((prev) => ({ ...prev, [descIdx]: text }));
  };

  const handleSubmitQuiz = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      addToast('Evaluating answers with ML & Semantic Similarity...', 'info', 'Evaluating');

      const questions = quiz.questions || {};
      const mcqList = questions.mcq || [];
      const descList = questions.descriptive || [];

      const formattedMcq = mcqList.map((_, idx) => (mcqAnswers[idx] !== undefined ? mcqAnswers[idx] : -1));
      const formattedDesc = descList.map((_, idx) => descriptiveAnswers[idx] || '');

      const res = await api.post(`/quizzes/${id}/submit`, {
        mcqAnswers: formattedMcq,
        descriptiveAnswers: formattedDesc,
      });

      addToast('Quiz attempt evaluated and scored!', 'success', 'Submission Complete');
      navigate(`/quiz-result/${res.data.attemptId}`);
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      addToast(err.response?.data?.message || 'Failed to submit quiz attempt', 'error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar title="Quiz Assessment" />
          <div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const questions = quiz?.questions || {};
  const mcqList = questions.mcq || [];
  const descList = questions.descriptive || [];

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={quiz?.title || 'Quiz Assessment'} />

        <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
          {/* Header Bar with Countdown Timer */}
          <div className="glass-card p-6 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-['Outfit']">{quiz?.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Classroom: <span className="text-green-600 font-semibold">{quiz?.classroom?.name}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50/60 border border-purple-800/60 text-green-600 font-mono font-bold text-sm">
              <Clock className="w-4 h-4 text-green-600 animate-pulse" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {/* Submitting Overlay Banner */}
          {submitting && (
            <div className="p-6 rounded-2xl bg-green-50/80 border border-purple-500/50 text-center space-y-3 animate-pulse">
              <Sparkles className="w-8 h-8 text-green-600 mx-auto animate-spin" />
              <h3 className="text-lg font-bold text-gray-900">Evaluating Answers with AI Microservice...</h3>
              <p className="text-xs text-green-700">
                Running semantic sentence embeddings, TF-IDF keyword extraction, and concept coverage check...
              </p>
            </div>
          )}

          {/* 1. MCQs Section */}
          {mcqList.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 font-['Outfit'] border-b border-gray-200 pb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Section A: Multiple Choice Questions ({mcqList.length})
              </h3>

              {mcqList.map((q, qIdx) => (
                <div key={qIdx} className="glass-card p-6 rounded-2xl border border-gray-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-green-50/80 border border-purple-800/60 flex items-center justify-center font-bold text-green-600 text-xs shrink-0">
                      Q{qIdx + 1}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm leading-relaxed">{q.question}</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pl-10">
                    {q.options?.map((opt, optIdx) => {
                      const isSelected = mcqAnswers[qIdx] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleMcqSelect(qIdx, optIdx)}
                          className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-green-600/30 border-purple-500 text-gray-900 shadow-lg shadow-purple-600/20'
                              : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-gray-50/60 hover:text-gray-900'
                          }`}
                        >
                          <span>{opt}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-purple-400 bg-green-500' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Descriptive Questions Section */}
          {descList.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 font-['Outfit'] border-b border-gray-200 pb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Section B: Conceptual & Applied Questions ({descList.length})
              </h3>

              {descList.map((q, qIdx) => (
                <div key={qIdx} className="glass-card p-6 rounded-2xl border border-gray-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-green-50/80 border border-blue-800/60 flex items-center justify-center font-bold text-green-600 text-xs shrink-0">
                      D{qIdx + 1}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm leading-relaxed">{q.question}</h4>
                  </div>

                  <div className="pl-10 space-y-2">
                    <textarea
                      rows={4}
                      value={descriptiveAnswers[qIdx] || ''}
                      onChange={(e) => handleDescriptiveChange(qIdx, e.target.value)}
                      placeholder="Write your explanation here in detail..."
                      className="w-full p-4 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-500 text-xs focus:outline-none focus:border-blue-500 transition-all"
                    />
                    <p className="text-[10px] text-gray-500">
                      Evaluated for semantic understanding, keyword coverage, and concept mastery using pure ML embeddings.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Quiz Action */}
          <div className="pt-6 border-t border-gray-200 flex items-center justify-end">
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Quiz Answers</span>
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QuizAttempt;
