import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Skeleton from '../components/common/Skeleton';
import { Award, CheckCircle, XCircle, Sparkles, ArrowLeft, Brain, BarChart2 } from 'lucide-react';

const QuizResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useNotification();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/results/attempt/${attemptId}`);
        setAttempt(res.data);
      } catch (err) {
        console.error('Error fetching quiz result:', err);
        addToast('Failed to load quiz results', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar title="Quiz Score Report" />
          <div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar title="Result Not Found" />
          <div className="p-8 max-w-4xl mx-auto w-full">
            <p className="text-gray-500">Attempt result not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const evaluations = attempt.evaluations || [];
  const scorePct = attempt.percentage || 0;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Quiz Score Report" />

        <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
          {/* Back Action */}
          <Link
            to={`/classrooms/${attempt.quiz?.classroomId}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Classroom</span>
          </Link>

          {/* Score Header Card */}
          <div className="glass-card p-8 rounded-3xl border border-gray-200 bg-gradient-to-r from-green-100/40 via-indigo-950/30 to-emerald-100/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50/80 px-3 py-1 rounded-full border border-purple-800/60 mb-2 inline-block">
                Assessment Completed
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 font-['Outfit']">{attempt.quiz?.title}</h2>
              <p className="text-xs text-gray-600 mt-1">
                Completed on {new Date(attempt.submittedAt).toLocaleString()}
              </p>
            </div>

            {/* Gauge Display */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-green-600 to-emerald-500 p-1 flex items-center justify-center shadow-xl shadow-purple-500/25 shrink-0">
              <div className="w-full h-full bg-gray-50 rounded-full flex flex-col items-center justify-center p-2">
                <span className="text-3xl font-extrabold text-gray-900 font-['Outfit']">{scorePct}%</span>
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                  {scorePct >= 80 ? 'Mastery' : scorePct >= 60 ? 'Proficient' : 'Needs Review'}
                </span>
              </div>
            </div>
          </div>

          {/* Question Breakdown List */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 font-['Outfit'] border-b border-gray-200 pb-3">
              Detailed Question Analysis ({evaluations.length})
            </h3>

            {evaluations.map((item, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center font-bold text-gray-600 text-xs shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {item.type === 'mcq' ? 'Multiple Choice' : 'Descriptive / Applied'}
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm mt-0.5">{item.question}</h4>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-xl border shrink-0 ${
                      item.type === 'mcq'
                        ? item.isCorrect
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                          : 'bg-red-950/60 text-red-300 border-red-800/60'
                        : 'bg-green-50/60 text-green-600 border-purple-800/60'
                    }`}
                  >
                    {item.pointsEarned} / {item.maxPoints} pts
                  </span>
                </div>

                {/* MCQ Result View */}
                {item.type === 'mcq' && (
                  <div className="pl-10 space-y-2">
                    <div className="text-xs space-y-1">
                      <p className="text-gray-500">
                        Selected Choice:{' '}
                        <span className={item.isCorrect ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {item.options[item.studentChoice] || 'None'}
                        </span>
                      </p>
                      {!item.isCorrect && (
                        <p className="text-gray-500">
                          Correct Choice:{' '}
                          <span className="text-emerald-400 font-semibold">{item.options[item.correctOption]}</span>
                        </p>
                      )}
                    </div>
                    {item.explanation && (
                      <p className="text-xs text-gray-600 bg-white/60 p-3 rounded-xl border border-gray-200">
                        💡 <strong>Explanation:</strong> {item.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Descriptive Result View with AI Microservice breakdown */}
                {item.type === 'descriptive' && (
                  <div className="pl-10 space-y-4">
                    <div className="bg-white/80 p-4 rounded-xl border border-gray-200 text-xs space-y-2">
                      <p className="text-gray-500 font-medium">Your Answer:</p>
                      <p className="text-gray-900 italic bg-black/40 p-3 rounded-lg border border-gray-200">
                        "{item.studentAnswer || 'No answer provided'}"
                      </p>
                    </div>

                    {item.aiEvaluation && (
                      <div className="bg-green-50/30 p-4 rounded-xl border border-purple-800/40 space-y-3">
                        <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-green-600" />
                          <span>AI Service Evaluation Metrics</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Similarity</span>
                            <span className="text-sm font-extrabold text-green-600">{item.aiEvaluation.similarity}%</span>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Keyword Score</span>
                            <span className="text-sm font-extrabold text-emerald-400">{item.aiEvaluation.keyword_score}%</span>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Concept Score</span>
                            <span className="text-sm font-extrabold text-green-600">{item.aiEvaluation.concept_score}%</span>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Understanding</span>
                            <span className="text-sm font-extrabold text-amber-400">{item.aiEvaluation.understanding_score}%</span>
                          </div>
                        </div>

                        {item.aiEvaluation.feedback && (
                          <p className="text-xs text-green-700 mt-2 font-medium">
                            📝 <strong>AI Feedback:</strong> {item.aiEvaluation.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default QuizResult;
