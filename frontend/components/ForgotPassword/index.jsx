import React, { useState } from 'react';
import toast, { Toaster } from "react-hot-toast";
import api from "@/utils/apiSetup";
import { motion, AnimatePresence } from "framer-motion";

const EmailModal = ({
    showModal,
    setShowModal
}) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return toast.error("Please enter your email");
        setLoading(true);
        try {
            await api.post('/auth/request-password-reset', { email });
            toast.success('Password reset link sent to your email');
            setShowModal(false);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {showModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-md mx-4 bg-white/40 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.18)] rounded-3xl p-8"
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-2xl font-normal text-blue-900 text-center mb-6">
                            Forgot Password?
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-sm font-normal text-gray-700 block mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/60 font-normal"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-xl text-white font-medium text-lg shadow-lg transition-all bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EmailModal;
