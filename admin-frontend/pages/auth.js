import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { setUser } from '../store/features/userSlice';
import { setCreatorId } from '../store/features/createSessionSlice';
import api from '@/utils/apiSetup';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import { FaUsers, FaLock } from 'react-icons/fa';
import Image from 'next/image';
import store from '../store/store';

function Auth() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();

    // Auto-login redirect
    useEffect(() => {
        const jwt = localStorage.getItem('ifca-jwt');
        const userType = localStorage.getItem('ifca-userType');
        const currentPath = router.pathname;
        console.log('Auto-login check:', { jwt: !!jwt, userType, currentPath });
        if (jwt && userType) {
            if (userType === 'admin' && currentPath !== '/admin') {
                console.log('Auto-login: Redirecting to admin dashboard');
                router.replace('/admin');
            } else if (userType === 'partner' && currentPath !== '/partner') {
                console.log('Auto-login: Redirecting to partner dashboard');
                router.replace('/partner');
            } else if (userType === 'expert' && currentPath !== '/expert') {
                console.log('Auto-login: Redirecting to expert dashboard');
                router.replace('/expert');
            } else if (userType === 'user' && currentPath !== '/home/feed') {
                console.log('Auto-login: Redirecting to user feed');
                router.replace('/home/feed');
            }
        }
    }, [router]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Helper to get environment URLs
    function getEnvUrls() {
        return {
            user: process.env.NEXT_PUBLIC_USER_URL || 'http://localhost:3001',
            admin: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3005',
        };
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
                    const res = await api.post('/auth/signin', formData);
        const { jwt, user } = res.data;
        console.log('Login response:', { jwt: !!jwt, userType: user.userType, user: !!user });
        // Save to localStorage
        localStorage.setItem('ifca-jwt', jwt);
        localStorage.setItem('ifca-userType', user.userType);
        localStorage.setItem('ifca-user', JSON.stringify(user));
        if (["admin", "partner", "expert"].includes(user.userType)) {
          dispatch(setUser(user));
        }
        // Redux - Force immediate state update
        console.log('About to dispatch setUser with:', user);
        
        // Force the dispatch to be synchronous
        const setUserAction = setUser(user);
        dispatch(setUserAction);
        
        // Also dispatch creator ID
        dispatch(setCreatorId(user.id));
        
        // Force a re-render by dispatching again after a micro-task
        setTimeout(() => {
          dispatch(setUser(user));
        }, 0);
        
        toast.success('Successfully logged in');
        
        // Add a small delay to ensure Redux state is set before navigation
        setTimeout(() => {
            // Role-based redirect
            const urls = getEnvUrls();
            if (user.userType === 'admin') {
                const params = new URLSearchParams({
                    jwt,
                    userType: user.userType,
                    user: encodeURIComponent(JSON.stringify(user)),
                });
                window.location.href = `${urls.admin}/admin?${params.toString()}`;
            } else if (user.userType === 'partner') {
                const params = new URLSearchParams({
                    jwt,
                    userType: user.userType,
                    user: encodeURIComponent(JSON.stringify(user)),
                });
                window.location.href = `${urls.admin}/partner?${params.toString()}`;
            } else if (user.userType === 'expert') {
                const params = new URLSearchParams({
                    jwt,
                    userType: user.userType,
                    user: encodeURIComponent(JSON.stringify(user)),
                });
                window.location.href = `${urls.admin}/expert?${params.toString()}`;
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
        }, 100);
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
            {/* Floating Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-12 w-96 h-96">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                    >
                        <div className="w-full h-full bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-full blur-3xl"></div>
                    </motion.div>
                </div>
                <div className="absolute bottom-1/4 -right-12 w-96 h-96">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }}
                    >
                        <div className="w-full h-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-full blur-3xl"></div>
                    </motion.div>
                </div>
            </div>
            {/* Code Lines Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.03] z-0">
                <div className="absolute inset-0 overflow-hidden">
                    <pre className="text-xs leading-6 text-black">
                        {Array(100).fill('const ifca = { Where Chefs and Food belong }').join('\n')}
                    </pre>
                </div>
            </div>
            <div className="relative w-full max-w-4xl mx-auto flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden bg-white">
                {/* Left Panel - Decorative */}
                <div className="relative md:w-1/2 bg-gradient-to-br from-orange-600 to-orange-800 p-8 text-white flex flex-col">
                    <div className="absolute inset-0 overflow-hidden opacity-10">
                        <svg width="100%" height="100%">
                            <pattern id="pattern-circles" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
                                <circle cx="25" cy="25" r="12" fill="none" stroke="white" strokeWidth="1"/>
                            </pattern>
                            <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)">
                                <animate attributeName="x" from="0" to="50" dur="20s" repeatCount="indefinite"/>
                                <animate attributeName="y" from="0" to="50" dur="20s" repeatCount="indefinite"/>
                            </rect>
                        </svg>
                    </div>
                    <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                            <div className="flex justify-center mb-6">
                                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <FaUsers className="text-4xl" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Welcome to IFCA India Admin Portal</h2>
                            <p className="mb-6 text-white/80">Manage communities, courses, and culinary experiences with our powerful admin tools.</p>
                            <div className="space-y-4 mt-8">
                                <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                    <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg">
                                        <FaUsers className="text-xl" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-medium">Manage Communities</h3>
                                        <p className="text-sm text-white/70">Create and moderate culinary communities</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                    <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg">
                                        <FaLock className="text-xl" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-medium">Secure Access</h3>
                                        <p className="text-sm text-white/70">Role-based permissions for administrators</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
                {/* Right Panel - Login Form */}
                <div className="md:w-1/2 p-8 bg-white flex flex-col justify-center">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Log Into Your Account</h1>
                            <p className="text-gray-600">Enter your credentials to access the admin dashboard</p>
                        </div>
                        <div className="w-full max-w-sm mx-auto">
                            <form className="space-y-5" onSubmit={handleLogin}>
                                <div className="space-y-2">
                                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
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
                            <div className="mt-6 text-center text-sm text-gray-600">
                                <p>Having trouble logging in?</p>
                                <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                                    Contact support
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}

export default Auth;
