import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Sparkles, Mail, ArrowLeft, KeyRound } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setMessage('Error processing request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 selection:bg-green-600 selection:text-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-7 h-7 text-gray-900" />
            </div>
            <span className="font-extrabold text-3xl tracking-tight text-gray-900 font-['Outfit']">
              VERIFY<span className="text-green-600">EDU</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight font-['Outfit']">Reset Password</h2>
          <p className="text-xs text-gray-500 mt-1">Enter your account email to receive a password reset link</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-gray-200 shadow-2xl">
          {message && (
            <div className="mb-6 p-4 rounded-xl bg-green-50/60 border border-purple-800/60 text-green-700 text-xs font-medium space-y-2">
              <p>{message}</p>
              {resetToken && (
                <div className="p-3 rounded-lg bg-white border border-gray-200 font-mono text-[11px] text-emerald-400 break-all">
                  <strong>Reset Token (Testing):</strong> {resetToken}
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="block mt-2 font-sans underline text-green-600 font-bold"
                  >
                    Proceed to Reset Password Page →
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@school.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 border border-gray-200 text-gray-900 placeholder-gray-500 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-gray-900 font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Send Reset Request</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
