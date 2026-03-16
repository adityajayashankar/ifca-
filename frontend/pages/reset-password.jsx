import { useState } from 'react';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import api from '@/utils/apiSetup';

const ResetPassword = () => {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pw) => {
    if (!pw || pw.trim() === '') return 'Password is required';
    if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(pw))
      return 'Password must be 6-16 chars, include a number and special character';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passErr = validatePassword(password);
    if (passErr) return toast.error(passErr);
    if (password !== confirm) return toast.error('Passwords do not match');
    if (!token) return toast.error('Invalid or missing token');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      toast.success('Password changed! You can now log in.');
      setTimeout(() => router.push('/onBoard'), 2000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <Toaster position="top-center" />
      <Head>
        <title>Reset Password | IFCA</title>
      </Head>
      <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.18)] rounded-3xl p-8 sm:p-12 animate-fade-in">
        <h2 className="text-2xl font-normal text-blue-900 text-center mb-6">Reset Your Password</h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-normal text-gray-700 block mb-1">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/60 font-normal"
              placeholder="Enter new password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-normal text-gray-700 block mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/60 font-normal"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl text-white font-medium text-lg shadow-lg transition-all bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
};

export default ResetPassword; 