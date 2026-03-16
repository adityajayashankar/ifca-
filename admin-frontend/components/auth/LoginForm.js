import api from '@/utils/apiSetup';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { setCreatorId } from '../../store/features/createSessionSlice';
import { setUser } from '../../store/features/userSlice';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';

function LoginForm(props) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch();

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/signin', formData);
            const { jwt, user } = res.data;
            localStorage.setItem('ifca-jwt', jwt);
            localStorage.setItem('ifca-userType', user.userType);
            localStorage.setItem('ifca-user', JSON.stringify(user));
            if (["admin", "partner", "expert"].includes(user.userType)) {
                dispatch(setUser(user));
                dispatch(setCreatorId(user.id));
            }
            toast.success('Successfully logged in');
            // Role-based redirect
            if (["admin", "partner", "expert"].includes(user.userType)) {
                router.push('/dashboard');
            } else if (user.userType === 'user') {
                // Do NOT dispatch setUser for userType 'user' in admin-frontend
                const userUrl = 'http://localhost:3001';
                const params = new URLSearchParams({
                    jwt,
                    userType: user.userType,
                    user: encodeURIComponent(JSON.stringify(user)),
                });
                window.location.href = `${userUrl}/home/feed?${params.toString()}`;
            } else {
                toast.error('Unauthorized role for this portal.');
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <form className="space-y-5" onSubmit={handleLogin}>
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <FaEnvelope className="mr-2 text-orange-500" />
                        Email
                    </label>
                    <div className="relative">
                        <input
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            required
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <FaLock className="mr-2 text-orange-500" />
                        Password
                    </label>
                    <div className="relative">
                        <input
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            required
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className={`w-full mt-6 py-3 px-4 rounded-lg text-white font-medium relative overflow-hidden group ${loading ? 'cursor-not-allowed bg-orange-400' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600'}`}
                    disabled={loading}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                    <span className="relative flex items-center justify-center">
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </span>
                </motion.button>
            </form>
        </div>
    );
}

export default LoginForm;
