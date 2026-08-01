import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Users,
  Award,
  Upload,
  Plus,
  Copy,
  Sparkles,
  Play,
  CheckCircle,
  Trash2,
  Brain,
  ListChecks,
} from 'lucide-react';

const ClassroomDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materials');

  // PDF Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Generate Quiz Modal State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [numMcq, setNumMcq] = useState(5);
  const [numDescriptive, setNumDescriptive] = useState(2);
  const [generating, setGenerating] = useState(false);

  const isTeacher = user?.role === 'TEACHER';

  const fetchClassroom = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/classrooms/${id}`);
      setClassroom(res.data);

      // Fetch leaderboard
      const lbRes = await api.get(`/analytics/classrooms/${id}/leaderboard`);
      setLeaderboard(lbRes.data);
    } catch (err) {
      console.error('Error fetching classroom detail:', err);
      addToast('Failed to load classroom details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassroom();
  }, [id]);

  const copyCode = () => {
    if (!classroom?.code) return;
    navigator.clipboard.writeText(classroom.code);
    addToast(`Classroom code "${classroom.code}" copied to clipboard!`, 'success', 'Copied');
  };

  // Upload PDF Handler
  const handleUploadPdf = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast('Please select a PDF file', 'error');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('classroomId', id);

      addToast('Uploading & processing PDF with AI embeddings...', 'info', 'AI Processing');
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast(`Document "${res.data.document.documentName}" uploaded & indexed by AI!`, 'success', 'PDF Processed');
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      fetchClassroom();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to upload/process PDF', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Generate Quiz Handler
  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!selectedDocId) {
      addToast('Please select a document for quiz generation', 'error');
      return;
    }
    setGenerating(true);
    try {
      addToast('Generating quiz questions using Ollama LLM...', 'info', 'AI Working');
      const res = await api.post('/quizzes/generate', {
        classroomId: id,
        documentId: selectedDocId,
        title: quizTitle,
        numMcq,
        numDescriptive,
      });

      addToast(`Quiz "${res.data.quiz.title}" generated successfully!`, 'success', 'Quiz Ready');
      setIsQuizModalOpen(false);
      setQuizTitle('');
      setSelectedDocId('');
      fetchClassroom();
      setActiveTab('quizzes');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate quiz', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Remove ${studentName} from classroom?`)) return;
    try {
      await api.delete(`/classrooms/${id}/students/${studentId}`);
      addToast(`${studentName} removed from classroom`, 'info');
      fetchClassroom();
    } catch (err) {
      addToast('Failed to remove student', 'error');
    }
  };

  const handleDeleteDocument = async (docId, docName) => {
    if (!window.confirm(`Delete document "${docName}"?`)) return;
    try {
      await api.delete(`/documents/${docId}`);
      addToast(`Document "${docName}" deleted.`, 'info');
      fetchClassroom();
    } catch (err) {
      addToast('Failed to delete document', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar title="Classroom" />
          <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar title="Classroom Not Found" />
          <div className="p-8 max-w-7xl mx-auto w-full">
            <EmptyState title="Classroom Not Found" description="The requested classroom does not exist or you do not have permission." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={classroom.name} />

        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Banner */}
          <div className="glass-card p-8 rounded-3xl border border-gray-200 relative overflow-hidden bg-gradient-to-r from-green-100/40 via-indigo-900/20 to-emerald-100/40">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-green-600 bg-green-50/80 px-3 py-1 rounded-full border border-purple-800/60 mb-3 inline-block">
                  Classroom Hub
                </span>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-['Outfit']">{classroom.name}</h1>
                <p className="text-xs text-gray-600 mt-2 max-w-2xl">{classroom.description || 'No description provided.'}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Instructor: <span className="text-green-600 font-semibold">{classroom.teacher?.name}</span>
                </p>
              </div>

              {/* Classroom Code Card */}
              <div className="flex flex-col items-end gap-3 bg-white/80 p-4 rounded-2xl border border-gray-200">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Classroom Code</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-extrabold text-green-600 tracking-widest">{classroom.code}</span>
                  <button
                    onClick={copyCode}
                    className="p-2 rounded-xl bg-green-600 hover:bg-green-500 text-gray-900 transition-all shadow-md shadow-purple-600/20"
                    title="Copy Code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              {[
                { id: 'materials', label: 'Study Materials', icon: FileText, count: classroom.documents?.length },
                { id: 'quizzes', label: 'Quizzes', icon: HelpCircle, count: classroom.quizzes?.length },
                { id: 'members', label: 'Members', icon: Users, count: classroom.members?.length },
                { id: 'leaderboard', label: 'Leaderboard', icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      activeTab === tab.id
                        ? 'bg-green-600 text-gray-900 shadow-lg shadow-purple-600/25'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="px-1.5 py-0.5 rounded-md bg-white/80 text-[10px] text-gray-600 border border-gray-200/50">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Upload PDF & Generate Quiz Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-purple-500/50 text-gray-700 hover:text-gray-900 font-bold text-xs flex items-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4 text-green-600" />
                <span>Upload PDF</span>
              </button>

              <button
                onClick={() => setIsQuizModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
              >
                <Brain className="w-4 h-4" />
                <span>Generate Quiz</span>
              </button>
            </div>
          </div>

          {/* Tab Content: Study Materials */}
          {activeTab === 'materials' && (
            <div className="space-y-6">
              {classroom.documents?.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No Study Materials Uploaded"
                  description="Upload a PDF textbook, lecture slides, or study notes. The AI engine will process and chunk it for instant quiz generation."
                  actionLabel="Upload First PDF"
                  onAction={() => setIsUploadModalOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classroom.documents.map((doc) => {
                    const keywordsList = doc.keywords ? JSON.parse(doc.keywords) : [];
                    return (
                      <div key={doc.id} className="glass-card p-6 rounded-2xl border border-gray-200 space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-green-50/60 border border-purple-800/50 flex items-center justify-center text-green-600">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm font-['Outfit']">{doc.documentName}</h4>
                                <p className="text-[11px] text-gray-500">Uploaded by {doc.uploader?.name}</p>
                              </div>
                            </div>

                            {isTeacher && (
                              <button
                                onClick={() => handleDeleteDocument(doc.id, doc.documentName)}
                                className="text-gray-500 hover:text-red-400 p-1"
                                title="Delete document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {doc.summary && (
                            <p className="text-xs text-gray-600 bg-white/60 p-3 rounded-xl border border-gray-200 line-clamp-3">
                              {doc.summary}
                            </p>
                          )}

                          {keywordsList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {keywordsList.slice(0, 5).map((kw, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-green-50/40 border border-purple-800/40 text-green-600 font-medium"
                                >
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-200/80 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono">
                            AI Doc ID: {doc.aiDocumentId?.slice(0, 8)}...
                          </span>
                          <button
                            onClick={() => {
                              setSelectedDocId(doc.id);
                              setIsQuizModalOpen(true);
                            }}
                            className="text-xs text-green-600 font-semibold hover:text-green-600 flex items-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Generate Quiz
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Quizzes */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6">
              {classroom.quizzes?.length === 0 ? (
                <EmptyState
                  icon={HelpCircle}
                  title="No Quizzes Available"
                  description="Generate a new AI quiz from your uploaded study materials."
                  actionLabel="Generate Quiz Now"
                  onAction={() => setIsQuizModalOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classroom.quizzes.map((quiz) => {
                    const studentAttempts = quiz.attempts || [];
                    const userAttempt = studentAttempts.find((a) => a.studentId === user.id);

                    return (
                      <div key={quiz.id} className="glass-card p-6 rounded-2xl border border-gray-200 space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <span className="text-[10px] font-bold text-green-600 bg-green-50/50 px-2 py-0.5 rounded border border-blue-800/50 mb-1 inline-block">
                                {quiz.numMcq} MCQs + {quiz.numDescriptive} Conceptual
                              </span>
                              <h4 className="font-bold text-gray-900 text-base font-['Outfit']">{quiz.title}</h4>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500">
                            Based on document: <span className="text-gray-600 font-medium">{quiz.document?.documentName || 'Course material'}</span>
                          </p>
                        </div>

                        <div className="pt-4 border-t border-gray-200/80 flex items-center justify-between">
                          {userAttempt ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/50 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Score: {userAttempt.percentage}%
                              </span>
                              <button
                                onClick={() => navigate(`/quiz-result/${userAttempt.id}`)}
                                className="text-xs text-gray-500 hover:text-gray-900 underline"
                              >
                                View Breakdown
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-400 font-medium">Not Attempted Yet</span>
                          )}

                          <button
                            onClick={() => navigate(`/quiz-attempt/${quiz.id}`)}
                            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-gray-900 font-bold text-xs shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{userAttempt ? 'Retake Quiz' : 'Start Quiz'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Members */}
          {activeTab === 'members' && (
            <div className="glass-card p-6 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-base font-['Outfit']">Enrolled Students ({classroom.members?.length || 0})</h3>
              </div>

              <div className="divide-y divide-gray-800">
                {classroom.members?.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-gray-900 font-bold text-xs">
                        {m.student?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{m.student?.name}</p>
                        <p className="text-[10px] text-gray-500">{m.student?.email}</p>
                      </div>
                    </div>

                    {isTeacher && (
                      <button
                        onClick={() => handleRemoveStudent(m.student.id, m.student.name)}
                        className="text-xs text-red-400 hover:bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-900/40"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content: Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div className="glass-card p-6 rounded-2xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-900 text-base font-['Outfit'] mb-4">Classroom Leaderboard</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/80 text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Rank</th>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Quizzes Taken</th>
                      <th className="p-3.5">Total Points</th>
                      <th className="p-3.5 rounded-r-xl">Average Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 text-gray-600">
                    {leaderboard.map((row, idx) => (
                      <tr key={row.studentId} className="hover:bg-gray-50/40">
                        <td className="p-3.5 font-bold">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="p-3.5 font-semibold text-gray-900">{row.name}</td>
                        <td className="p-3.5">{row.quizzesAttempted}</td>
                        <td className="p-3.5">{row.totalPoints} pts</td>
                        <td className="p-3.5 font-bold text-green-600">{row.averageScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* Upload PDF Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload Study Material (PDF)"
        >
          <form onSubmit={handleUploadPdf} className="space-y-4">
            <div className="p-6 border-2 border-dashed border-gray-200 hover:border-purple-500 rounded-2xl text-center cursor-pointer transition-all bg-white/50">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="hidden"
                id="pdf-input"
              />
              <label htmlFor="pdf-input" className="cursor-pointer block">
                <FileText className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-900">
                  {selectedFile ? selectedFile.name : 'Click or Drag PDF file here'}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">PDF documents up to 50MB</p>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Upload & Process</span>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Generate Quiz Modal */}
        <Modal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          title="Generate AI Quiz"
        >
          <form onSubmit={handleGenerateQuiz} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Source Document</label>
              <select
                required
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="">-- Choose uploaded PDF --</option>
                {classroom.documents?.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.documentName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Quiz Title (Optional)</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g. Chapter 3 Concepts Test"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-500 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">MCQ Count ({numMcq})</label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={numMcq}
                  onChange={(e) => setNumMcq(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Descriptive Count ({numDescriptive})</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={numDescriptive}
                  onChange={(e) => setNumDescriptive(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsQuizModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating || !selectedDocId}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Generate Quiz</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default ClassroomDetail;
