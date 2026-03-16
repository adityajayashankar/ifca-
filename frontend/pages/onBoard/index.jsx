import Footer from "@/components/footer";
import Head from "next/head";
import GoogleIcon from "@mui/icons-material/Google";
import FacebookOutlinedIcon from "@mui/icons-material/FacebookOutlined";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import api, { urls } from "@/utils/apiSetup";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setUser, selectNextPage, resetNextPage } from "@/store/features/userSlice";
import { useRouter } from "next/router";
import companyData from "@/utils/data";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailModal from "@/components/ForgotPassword";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GoogleLogin } from '@react-oauth/google';
import AnimatedButton from "@/components/common/AnimatedButton";


const OnBoard = () => {
  const [showCodeOfConduct, setShowCodeOfConduct] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isClientSide, setIsClientSide] = useState(false);
  const [showSignupOptions, setShowSignupOptions] = useState(false); // New state for signup options
  const [details, setDetails] = useState({
    userType: "user",
    pincode: "",
    photoURL: "",
    desc: "",
    phone: "",
    name: "",
    email: "",
    password: "",
  });
  const [err, setErr] = useState({});
  const [cPass, setCPass] = useState();
  const [nameErr, setNameErr] = useState();
  const [emailErr, setEmailErr] = useState();
  const [passErr, setPassErr] = useState();
  const [cPassErr, setCPassErr] = useState();
  const [phoneErr, setPhoneErr] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowPasswordConfirm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuestions, setIsQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [detail, setDetail] = useState({
    q_id: null,
    answer: null,
  });
  const [array, setArray] = useState([]);
  const [isAgreed, setIsAgreed] = useState(false); // New state for checkbox
  const [isLoading, setIsLoading] = useState(false); // Loading state for button
  const [signupStep, setSignupStep] = useState('options'); // 'options' | 1 | 2 | 3 | 4
  const [manualSignup, setManualSignup] = useState({ email: '', name: '', password: '', confirm: '', phone: '' });
  const [manualSignupErr, setManualSignupErr] = useState({});
  const [manualSignupLoading, setManualSignupLoading] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [googleSignupData, setGoogleSignupData] = useState(null); // Stores idToken, email, name, picture
  const [googlePhone, setGooglePhone] = useState('');
  const [googlePhoneErr, setGooglePhoneErr] = useState('');
  const [showManualPassword, setShowManualPassword] = useState(false);
  const [showManualConfirmPassword, setShowManualConfirmPassword] = useState(false);
  const [manualSignupAgreed, setManualSignupAgreed] = useState(false);

  const openModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const closeModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const passwordRef = useRef();

  const dispatch = useDispatch();
  const nextPage = useSelector(selectNextPage);

  const router = useRouter();

  // Auto-login redirect
  useEffect(() => {
    const jwt = localStorage.getItem('ifca-jwt');
    const userType = localStorage.getItem('ifca-userType');
    console.log('Auto-login check:', { jwt: !!jwt, userType });
    if (jwt && userType) {
      if (userType === 'user') {
        console.log('Auto-login: Redirecting to user feed');
        router.replace('/home/feed');
      } else if (userType === 'admin') {
        console.log('Auto-login: Redirecting to admin dashboard');
        router.replace('/admin');
      } else if (userType === 'partner') {
        console.log('Auto-login: Redirecting to partner dashboard');
        router.replace('/partner');
      } else if (userType === 'expert') {
        console.log('Auto-login: Redirecting to expert dashboard');
        router.replace('/expert');
      }
    }
  }, [router]);

  const isValidEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  };

  const handlePasswordChange = (e) => {
    setDetails({ ...details, password: e.target.value });
  };

  // Validation helpers
  const validateName = (name) => {
    if (!name || name.trim() === "") return "Name is required";
    if (!/^[a-zA-Z ]+$/.test(name)) return "Name can have letters and whitespaces only";
    return "";
  };
  const validateEmail = (email) => {
    if (!email || email.trim() === "") return "Email is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Email format is invalid";
    return "";
  };
  const validatePassword = (password) => {
    if (!password || password.trim() === "") return "Password is required";
    if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(password))
      return "Password must be 6-16 chars, include a number and special character";
    return "";
  };
  const validateConfirmPassword = (password, confirm) => {
    if (!confirm || confirm.trim() === "") return "Please confirm your password";
    if (password !== confirm) return "Passwords do not match";
    return "";
  };
  const validatePhone = (phone) => {
    if (!phone || phone.trim() === "") return "Phone number is required";
    if (!/^[0-9]{10}$/.test(phone)) return "Enter phone number in the correct format";
    return "";
  };

  // Enhanced handleChange for real-time validation
  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    let error = "";
    switch (name) {
      case "name":
        error = validateName(value);
        setNameErr(error);
        setDetails({ ...details, name: value });
        break;
      case "email":
        error = validateEmail(value);
        setEmailErr(error);
        setDetails({ ...details, email: value });
        break;
      case "password":
        error = validatePassword(value);
        setPassErr(error);
        setDetails({ ...details, password: value });
        break;
      case "confirm":
        error = validateConfirmPassword(details.password, value);
        setCPassErr(error);
        setCPass(value);
        break;
      case "phone":
        error = validatePhone(value);
        setPhoneErr(error);
        setDetails({ ...details, phone: value });
        break;
      default:
        break;
    }
  };

  // Enhanced handleRegister with validation check
  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    
    // Set loading state
    setIsLoading(true);
    
    const nameError = validateName(details.name);
    const emailError = validateEmail(details.email);
    const passError = validatePassword(details.password);
    const confirmError = validateConfirmPassword(details.password, cPass);
    const phoneError = validatePhone(details.phone);
    setNameErr(nameError);
    setEmailErr(emailError);
    setPassErr(passError);
    setCPassErr(confirmError);
    setPhoneErr(phoneError);
    
    if (nameError || emailError || passError || confirmError || phoneError || !isAgreed) {
      const firstError = nameError || emailError || passError || confirmError || phoneError || (!isAgreed && "You must agree to the terms.");
      toast.error(firstError);
      setIsLoading(false);
      return;
    }
    
    try {
      // First create the user account
      const res = await api.post(`/auth/signup`, details);
      
      // If user creation is successful, create question details
      if (res.data && array.length > 0) {
        try {
          await api.post(
        `/questions/details/create/${details.email}`,
        { details: array }
      );
        } catch (questionErr) {
          console.error("Error creating question details:", questionErr);
          // Don't fail the signup if question details fail
        }
      }
      
      toast.success("Successfully Registered", { duration: 2000 });
      setIsLogin(true);
      
      // Clear form data
      setDetails({
        userType: "user",
        pincode: "",
        photoURL: "",
        desc: "",
        phone: "",
        name: "",
        email: "",
        password: "",
      });
      setCPass("");
      setIsAgreed(false);
      
    } catch (err) {
      console.error("Registration error:", err);
      const backendMsg = err.response?.data?.message;
      if (backendMsg) {
        toast.error(backendMsg);
      } else if (err.response?.status === 400) {
        toast.error("Invalid input or duplicate entry");
      } else if (err.response?.status === 409) {
        toast.error("Email or phone number already registered");
      } else {
        toast.error("Something went wrong! Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!details.email || !details.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (isValidEmail(details.email) !== true) {
      toast.error("Invalid Email");
      return;
    }

    // Set loading state
    setIsLoading(true);

    const loginDetails = {
      email: details.email,
      password: details.password,
    };

    // Create an abort controller for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000); // 10 seconds timeout

    try {
      const res = await api.post(`/auth/signin`, loginDetails, {
        signal: controller.signal,
        timeout: 10000
      });

      if (res.data) {
        const { jwt, user } = res.data;
        console.log('Login response:', { jwt: !!jwt, userType: user.userType, user: !!user });
        // Save to localStorage
        localStorage.setItem('ifca-jwt', jwt);
        localStorage.setItem('ifca-userType', user.userType);
        localStorage.setItem('ifca-unifiedUser', JSON.stringify(user.unifiedUser));
        localStorage.setItem('ifca-user', JSON.stringify(user));
        // Redux - Only set if userType is 'user'
        if (user.userType === 'user') {
          dispatch(setUser(user));
          setTimeout(() => {
            dispatch(setUser(user));
            router.replace('/home/feed'); // Navigate after Redux is set
          }, 0);
        }
        // Clear form data
        setDetails({
          pincode: "",
          photoURL: "",
          desc: "",
          phone: "",
          name: "",
          email: "",
          password: "",
        });
        
        // Add a small delay to ensure Redux state is set before navigation
        setTimeout(() => {
          // Navigation based on userType
          const urls = getEnvUrls();
          if (user.userType === 'user') {
            const isFromSession = router.query.fromSession;
            if (nextPage && !isFromSession) {
              // Redirect to the saved page if available
              router.push(nextPage);
              dispatch(resetNextPage());
            } else if (isFromSession) {
              router.back();
            } else {
              router.push("/home/feed");
            }
          } else if (user.userType === 'admin') {
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
          } else {
            toast.error('Unauthorized role for this portal.');
          }
        }, 100);
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.name === 'AbortError') {
        toast.error("Login request timed out. Please try again.");
      } else if (err.response?.status === 403) {
        toast.error(err.response?.data?.message || "Your account is disabled. Contact admin.");
      } else if (err.response?.status === 400) {
        toast.error(err.response?.data?.message || "Invalid credentials");
      } else if (err.response?.status === 404) {
        toast.error("User not found");
      } else {
        toast.error(err.response?.data?.message || "Invalid Username or Password");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };







  

  const handleFetchQuestions = async () => {
    if (!isClientSide) return; // Don't fetch on server-side

    try {
      const res = await api.get(`/questions/show/select`);
      if (res.data.success) {
        setQuestions(res.data.questions);

        const newArray = res.data.questions.map((ele) => ({
          q_id: ele.id,
          question: ele.question,
          answer: "",
        }));
        setArray(newArray);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const handleNext = () => {
    if (!isLoading) {
    setIsQuestions(true);
    }
  };

  const handleBack = () => {
    if (!isLoading) {
    setIsQuestions(false);
    }
  };

  // New function to handle Google login
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setIsLoading(true);
      const idToken = credentialResponse.credential;
      
      const res = await api.post('/auth/google', { idToken });
      
      if (res.data) {
        const { jwt, user, isNewUser, phoneRequired, email, name, picture, directLogin } = res.data;
        
        if (phoneRequired) {
          setGoogleSignupData({ idToken, email, name, picture }); // Store Google data for later
          setShowPhoneModal(true);
          setIsLoading(false);
          return;
        }
        
        // Existing login/signup success logic
        console.log('Google login response:', { jwt: !!jwt, userType: user.userType, user: !!user, isNewUser, directLogin });
        
        // Save to localStorage
        localStorage.setItem('ifca-jwt', jwt);
        localStorage.setItem('ifca-userType', user.userType);
        localStorage.setItem('ifca-unifiedUser', JSON.stringify(user.unifiedUser));
        localStorage.setItem('ifca-user', JSON.stringify(user));
        
        // Show success message
        if (isNewUser) {
          toast.success('Welcome to IFCA! Account created successfully via Google.');
        } else if (directLogin) {
          toast.success('Welcome back! Successfully signed in via Google.');
        } else {
          toast.success('Welcome back! Successfully signed in via Google.');
        }
        
        // Redux - Only set if userType is 'user'
        if (user.userType === 'user') {
          dispatch(setUser(user));
        }
        
        // Clear form data
        setDetails({
          userType: "user",
          pincode: "",
          photoURL: "",
          desc: "",
          phone: "",
          name: "",
          email: "",
          password: "",
        });
        
        // Navigation based on userType
        setTimeout(() => {
          const urls = getEnvUrls();
          if (user.userType === 'user') {
            router.replace('/home/feed');
          } else if (user.userType === 'admin') {
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
          }
        }, 100);
      }
    } catch (err) {
      console.error("Google login error:", err);
      toast.error(err.response?.data?.message || 'Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickLogin = () => {
    if (!isLoading) {
    setIsLogin(true);
    setIsQuestions(false);
    setShowSignupOptions(false);
    setSignupStep('options'); // Reset to options when switching to login
    }
  };
  const handleChangeAnswer = (ele) => (e) => {
    const addArray = array.map((item) => {
      if (item.q_id == ele.q_id)
        return {
          ...item,
          answer: e.target.value,
        };
      else return item;
    });
    setArray(addArray);
  };

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    if (isClientSide) {
      handleFetchQuestions();
    }
  }, [isClientSide]);

  // New function to check if email exists
  const checkEmailExists = async (email) => {
    try {
      const response = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return { exists: false };
    }
  };

  // New function to check if phone exists
  const checkPhoneExists = async (phone) => {
    try {
      const response = await api.get(`/auth/check-phone?phone=${encodeURIComponent(phone)}`);
      return response.data;
    } catch (error) {
      console.error('Error checking phone existence:', error);
      return { exists: false };
    }
  };


  // Don't render sensitive content until client-side hydration is complete
  if (!isClientSide) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Helper to get environment URLs
  function getEnvUrls() {
    return {
      user: process.env.NEXT_PUBLIC_USER_URL || 'http://localhost:3001',
      admin: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3005',
    };
  }

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
          },
        }}
      />
      <Head>
        <title>OnBoard | IFCA</title>
      </Head>
      <div className="min-h-screen w-full flex flex-col relative overflow-hidden">
        {/* Enhanced orange-themed background with multiple layers and effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-800 via-orange-700 to-amber-800"></div>
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-amber-600/20 animate-pulse"></div>
        
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(251, 146, 60, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, rgba(239, 68, 68, 0.2) 0%, transparent 50%),
              linear-gradient(45deg, transparent 30%, rgba(245, 158, 11, 0.1) 40%, rgba(251, 146, 60, 0.1) 50%, rgba(239, 68, 68, 0.1) 60%, transparent 70%),
              linear-gradient(-45deg, transparent 30%, rgba(245, 158, 11, 0.1) 40%, rgba(251, 146, 60, 0.1) 50%, rgba(239, 68, 68, 0.1) 60%, transparent 70%),
              repeating-linear-gradient(90deg, transparent, transparent 98px, rgba(245, 158, 11, 0.05) 98px, rgba(245, 158, 11, 0.05) 100px),
              repeating-linear-gradient(0deg, transparent, transparent 98px, rgba(251, 146, 60, 0.05) 98px, rgba(251, 146, 60, 0.05) 100px)
            `,
            backgroundSize: '300px 300px, 400px 400px, 250px 250px, 200px 200px, 200px 200px, 100px 100px, 100px 100px'
          }}></div>
        </div>
        
        {/* Enhanced scattered culinary icons with glow effects */}
        <div className="absolute inset-0 opacity-15">
          {/* Chef Hat with glow */}
          <div className="absolute top-20 left-16 w-16 h-16 animate-pulse" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6V4C19 2.9 18.1 2 17 2H7C5.9 2 5 2.9 5 4V6L3 7V9L5 10V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V10L21 9Z"/>
            </svg>
          </div>
          
          {/* Pizza Slice with glow */}
          <div className="absolute top-40 right-24 w-12 h-12 animate-pulse" style={{ filter: 'drop-shadow(0 0 6px rgba(251, 146, 60, 0.5))', animationDelay: '1s' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6V4C19 2.9 18.1 2 17 2H7C5.9 2 5 2.9 5 4V6L3 7V9L5 10V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V10L21 9Z"/>
            </svg>
          </div>
          
          {/* Rolling Pin with glow */}
          <div className="absolute bottom-32 left-20 w-14 h-14 animate-pulse" style={{ filter: 'drop-shadow(0 0 10px rgba(251, 146, 60, 0.4))', animationDelay: '2s' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6V4C19 2.9 18.1 2 17 2H7C5.9 2 5 2.9 5 4V6L3 7V9L5 10V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V10L21 9Z"/>
            </svg>
          </div>
          
          {/* Knife */}
          <div className="absolute top-1/2 left-1/4 w-10 h-10">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M22 2L20 4L18 2L16 4L14 6L12 8L10 10L8 12L6 14L4 16L2 18L4 20L6 22L8 20L10 18L12 16L14 14L16 12L18 10L20 8L22 6L24 4L22 2Z"/>
            </svg>
          </div>
          
          {/* Whisk */}
          <div className="absolute bottom-1/3 right-1/4 w-12 h-12">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6V4C19 2.9 18.1 2 17 2H7C5.9 2 5 2.9 5 4V6L3 7V9L5 10V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V10L21 9Z"/>
            </svg>
          </div>
          
          {/* Fork and Spoon */}
          <div className="absolute top-1/3 right-1/3 w-8 h-8">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6V4C19 2.9 18.1 2 17 2H7C5.9 2 5 2.9 5 4V6L3 7V9L5 10V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V10L21 9Z"/>
            </svg>
          </div>
          
          {/* Cooking Pot */}
          <div className="absolute bottom-16 right-16 w-10 h-10">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6V4C19 2.9 18.1 2 17 2H7C5.9 2 5 2.9 5 4V6L3 7V9L5 10V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V10L21 9Z"/>
            </svg>
          </div>
          
          {/* Spice Shaker */}
          <div className="absolute top-1/4 left-1/3 w-6 h-6">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6V4C19 2.9 18.1 2 17 2H7C5.9 2 5 2.9 5 4V6L3 7V9L5 10V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V10L21 9Z"/>
            </svg>
          </div>
          
          {/* Plate */}
          <div className="absolute top-2/3 left-2/3 w-8 h-8">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          
          {/* Additional scattered icons */}
          <div className="absolute top-1/6 right-1/6 w-4 h-4">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6V4C19 2.9 18.1 2 17 2H7C5.9 2 5 2.9 5 4V6L3 7V9L5 10V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V10L21 9Z"/>
            </svg>
          </div>
          
          <div className="absolute bottom-1/4 left-1/6 w-5 h-5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6V4C19 2.9 18.1 2 17 2H7C5.9 2 5 2.9 5 4V6L3 7V9L5 10V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V10L21 9Z"/>
            </svg>
          </div>
          
          <div className="absolute top-3/4 right-1/5 w-6 h-6">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-orange-200">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6V4C19 2.9 18.1 2 17 2H7C5.9 2 5 2.9 5 4V6L3 7V9L5 10V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V10L21 9Z"/>
            </svg>
          </div>
        </div>
        
        {/* Enhanced floating elements and decorative patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Glowing floating orbs */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full opacity-30 animate-pulse shadow-lg" style={{ filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.4))' }}></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-red-300 to-pink-400 rounded-full opacity-25 animate-pulse shadow-lg" style={{ filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.3))', animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-orange-200 to-yellow-300 rounded-full opacity-35 animate-pulse shadow-lg" style={{ filter: 'drop-shadow(0 0 18px rgba(251, 146, 60, 0.5))', animationDelay: '2s' }}></div>
          <div className="absolute bottom-40 right-10 w-28 h-28 bg-gradient-to-br from-red-200 to-orange-300 rounded-full opacity-20 animate-pulse shadow-lg" style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.3))', animationDelay: '0.5s' }}></div>
          
          {/* Culinary geometric patterns with glow */}
          <div className="absolute top-1/4 left-1/4 w-16 h-16 border-2 border-amber-400 border-dashed opacity-40 rotate-45 shadow-sm" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.3))' }}></div>
          <div className="absolute top-3/4 right-1/3 w-12 h-12 border-2 border-red-300 border-dashed opacity-35 -rotate-45 shadow-sm" style={{ filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.2))' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-20 h-20 border-2 border-orange-400 border-dashed opacity-30 rotate-12 shadow-sm" style={{ filter: 'drop-shadow(0 0 10px rgba(251, 146, 60, 0.4))' }}></div>
          
          {/* Additional glowing culinary elements */}
          <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full opacity-20 shadow-md" style={{ filter: 'drop-shadow(0 0 5px rgba(245, 158, 11, 0.3))' }}></div>
          <div className="absolute bottom-1/4 left-1/6 w-6 h-6 bg-gradient-to-br from-red-300 to-pink-400 rounded-full opacity-25 shadow-md" style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.2))' }}></div>
          <div className="absolute top-2/3 left-2/3 w-10 h-10 border border-amber-300 opacity-20 rotate-30 shadow-sm" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.2))' }}></div>
          
          {/* Glowing spice-like particles */}
          <div className="absolute top-1/6 left-1/3 w-3 h-3 bg-amber-400 rounded-full opacity-40 animate-bounce" style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))', animationDelay: '0.3s' }}></div>
          <div className="absolute top-2/3 right-1/6 w-2 h-2 bg-red-400 rounded-full opacity-35 animate-bounce" style={{ filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.4))', animationDelay: '1.2s' }}></div>
          <div className="absolute bottom-1/6 right-1/4 w-4 h-4 bg-orange-400 rounded-full opacity-30 animate-bounce" style={{ filter: 'drop-shadow(0 0 5px rgba(251, 146, 60, 0.4))', animationDelay: '0.8s' }}></div>
          
          {/* Chef hat inspired shapes with glow */}
          <div className="absolute top-1/5 left-1/5 w-20 h-12 bg-gradient-to-br from-white to-gray-100 rounded-full opacity-20 rotate-12 shadow-lg" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))' }}></div>
          <div className="absolute bottom-1/5 right-1/5 w-16 h-10 bg-gradient-to-br from-white to-gray-100 rounded-full opacity-15 -rotate-12 shadow-lg" style={{ filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.2))' }}></div>
          
          {/* Light circular patterns scattered around */}
          <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-orange-200 rounded-full opacity-20"></div>
          <div className="absolute top-1/3 right-1/5 w-1 h-1 bg-orange-200 rounded-full opacity-15"></div>
          <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-orange-200 rounded-full opacity-25"></div>
          <div className="absolute bottom-1/3 right-1/6 w-2 h-2 bg-orange-200 rounded-full opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-orange-200 rounded-full opacity-15"></div>
          <div className="absolute top-2/3 left-1/5 w-2 h-2 bg-orange-200 rounded-full opacity-20"></div>
          <div className="absolute bottom-1/2 right-1/3 w-1 h-1 bg-orange-200 rounded-full opacity-15"></div>
          <div className="absolute top-1/6 right-1/4 w-3 h-3 bg-orange-200 rounded-full opacity-25"></div>
        </div>

        <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 relative z-10">
          {/* Centered Form Container */}
          <motion.div
            className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 30px rgba(245, 158, 11, 0.2), 0 0 60px rgba(251, 146, 60, 0.1)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
              {/* Logo */}
              <div className="text-center mb-8">
                <Link href="/">
                  <div className="flex justify-center mb-6 cursor-pointer transform hover:scale-105 transition-transform duration-300">
                    <Image
                      src="/logoifca.png"
                      alt="IFCA Logo"
                      width={120}
                      height={48}
                      objectFit="contain"
                      priority
                      className="w-auto h-12 drop-shadow-sm"
                    />
                  </div>
                </Link>
              </div>

              {/* Auth Form */}
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                    {isLogin ? "Welcome back, Chef!" : "Join IFCA"}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {isLogin ? "Sign in to your culinary community" : "Create your account to connect with fellow chefs"}
                  </p>
                </div>

                {/* Signup Options Screen */}
                {!isLogin && signupStep === 'options' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-gray-600 mb-6">Choose how you'd like to create your account</p>
                    </div>
                    <div className="space-y-4">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => toast.error('Google login failed')}
                        width="100%"
                        text="continue_with"
                        shape="rectangular"
                        theme="outline"
                      />
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">or continue with email</span>
                        </div>
                      </div>
                      <AnimatedButton
                        onClick={() => setSignupStep(1)}
                        disabled={isLoading}
                        variant="outline"
                        size="md"
                        fullWidth
                        className="border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      >
                        Create account with email
                      </AnimatedButton>
                      <div className="text-center mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsLogin(true);
                            setSignupStep('options');
                            setManualSignup({ email: '', name: '', password: '', confirm: '', phone: '' });
                          }}
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium transition-colors"
                        >
                          Already have an account? Sign in
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Signup Stepper */}
                {!isLogin && signupStep !== 'options' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSignupStep('options')}
                        disabled={isLoading}
                        className={`text-sm font-medium transition-colors ${
                          isLoading 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-amber-600 hover:text-amber-800'
                        }`}
                      >
                        ← Back
                      </button>
                      <span className="text-sm text-gray-500">Step {signupStep} of 4</span>
                    </div>
                    <form onSubmit={async (e) => {
                      e.preventDefault(); 
                      if (signupStep === 1) {
                        if (!manualSignup.email || !/^\S+@\S+\.\S+$/.test(manualSignup.email)) {
                          setManualSignupErr({ email: 'Enter a valid email' });
                          return;
                        }
                        setManualSignupErr({});
                        setSignupStep(2);
                      } else if (signupStep === 2) {
                        if (!manualSignup.name || manualSignup.name.length < 2) {
                          setManualSignupErr({ name: 'Enter your name' });
                          return;
                        }
                        setManualSignupErr({});
                        setSignupStep(3);
                      } else if (signupStep === 3) {
                        if (!manualSignup.password || manualSignup.password.length < 6) {
                          setManualSignupErr({ password: 'Password must be at least 6 characters' });
                          return;
                        }
                        if (manualSignup.password !== manualSignup.confirm) {
                          setManualSignupErr({ confirm: 'Passwords do not match' });
                          return;
                        }
                        setManualSignupErr({});
                        setSignupStep(4);
                      } else if (signupStep === 4) {
                        // Remove spaces from phone number
                        const cleanPhone = manualSignup.phone.replace(/\s/g, '');
                        
                        if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
                          setManualSignupErr({ phone: 'Enter a valid 10-digit phone number' });
                          return;
                        }
                        if (!manualSignupAgreed) {
                          toast.error('You must agree to the terms and conditions');
                          return;
                        }
                        setManualSignupErr({});
                        setManualSignupLoading(true);
                        try {
                          await api.post('/auth/signup', {
                            email: manualSignup.email,
                            name: manualSignup.name,
                            password: manualSignup.password,
                            phone: cleanPhone, // Use cleaned phone number
                            userType: 'user',
                          });
                          toast.success('Signup successful!');
                          setIsLogin(true);
                          setSignupStep('options');
                          setManualSignup({ email: '', name: '', password: '', confirm: '', phone: '' });
                          setManualSignupAgreed(false);
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Signup failed');
                        } finally {
                          setManualSignupLoading(false);
                        }
                      }
                    }}>
                      {signupStep === 1 && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base shadow-sm hover:shadow-md"
                            value={manualSignup.email}
                            onChange={async (e) => {
                              const email = e.target.value;
                              setManualSignup({ ...manualSignup, email });
                              
                              // Check email existence in real-time
                              if (email && email.includes('@')) {
                                const emailCheck = await checkEmailExists(email);
                                if (emailCheck.exists) {
                                  setManualSignupErr({ email: 'This email is already registered. Please sign in instead.' });
                                } else {
                                  setManualSignupErr({});
                                }
                              }
                            }}
                            placeholder="Enter your email"
                            required
                          />
                          {manualSignupErr.email && <p className="text-sm text-red-500 mt-1">{manualSignupErr.email}</p>}
                        </div>
                      )}
                      {signupStep === 2 && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base shadow-sm hover:shadow-md"
                            value={manualSignup.name}
                            onChange={e => setManualSignup({ ...manualSignup, name: e.target.value })}
                            placeholder="Enter your name"
                            required
                          />
                          {manualSignupErr.name && <p className="text-sm text-red-500 mt-1">{manualSignupErr.name}</p>}
                        </div>
                      )}
                      {signupStep === 3 && (
                        <>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="relative">
                              <input
                                type={showManualPassword ? "text" : "password"}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base shadow-sm hover:shadow-md"
                                value={manualSignup.password}
                                onChange={e => setManualSignup({ ...manualSignup, password: e.target.value })}
                                placeholder="Enter your password"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowManualPassword(!showManualPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                {showManualPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </button>
                            </div>
                            {manualSignupErr.password && <p className="text-sm text-red-500 mt-1">{manualSignupErr.password}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                            <div className="relative">
                              <input
                                type={showManualConfirmPassword ? "text" : "password"}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base shadow-sm hover:shadow-md"
                                value={manualSignup.confirm}
                                onChange={e => setManualSignup({ ...manualSignup, confirm: e.target.value })}
                                placeholder="Confirm your password"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowManualConfirmPassword(!showManualConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                {showManualConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </button>
                            </div>
                            {manualSignupErr.confirm && <p className="text-sm text-red-500 mt-1">{manualSignupErr.confirm}</p>}
                          </div>
                        </>
                      )}
                      {signupStep === 4 && (
                        <>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input
                              type="tel"
                              maxLength="10"
                              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base shadow-sm hover:shadow-md"
                              value={manualSignup.phone}
                              onChange={async (e) => {
                                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                                setManualSignup({ ...manualSignup, phone: value });
                                
                                // Check phone existence in real-time
                                if (value && value.length === 10) {
                                  const phoneCheck = await checkPhoneExists(value);
                                  if (phoneCheck.exists) {
                                    setManualSignupErr({ phone: 'This phone number is already registered.' });
                                  } else {
                                    setManualSignupErr({});
                                  }
                                }
                              }}
                              placeholder="Enter your phone number"
                              required
                            />
                            {manualSignupErr.phone && <p className="text-sm text-red-500 mt-1">{manualSignupErr.phone}</p>}
                          </div>
                          <div className="mt-4">
                            <label className="flex items-start space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={manualSignupAgreed}
                                onChange={(e) => setManualSignupAgreed(e.target.checked)}
                                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">
                                I agree to the{" "}
                                <button
                                  type="button"
                                  onClick={() => setShowCodeOfConduct(true)}
                                  className="text-amber-600 hover:text-amber-800 font-medium"
                                >
                                  Terms and Conditions
                                </button>
                                {" "}and{" "}
                                <button
                                  type="button"
                                  onClick={() => setShowCodeOfConduct(true)}
                                  className="text-amber-600 hover:text-amber-800 font-medium"
                                >
                                  Privacy Policy
                                </button>
                              </span>
                            </label>
                          </div>
                        </>
                      )}
                      <div className="flex justify-end mt-4">
                        {signupStep > 1 && (
                          <button 
                            type="button" 
                            onClick={() => setSignupStep(signupStep - 1)} 
                            className="text-amber-600 mr-4 hover:text-amber-800 transition-colors"
                          >
                            Back
                          </button>
                        )}
                         <AnimatedButton
                           type="submit"
                           variant="primary"
                           size="md"
                           disabled={manualSignupLoading || (signupStep === 4 && !manualSignupAgreed)}
                           className={signupStep === 4 && !manualSignupAgreed ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : ''}
                         >
                           {signupStep === 4 ? (manualSignupLoading ? 'Creating account...' : 'Create account') : 'Next'}
                         </AnimatedButton>
                      </div>
                    </form>
                  </div>
                )}

                {/* Google Login for Login Screen */}
                {isLogin && !isQuestions && (
                  <div className="space-y-4">
                    <GoogleLogin
                      onSuccess={handleGoogleLogin}
                      onError={() => toast.error('Google login failed')}
                      width="100%"
                      text="continue_with"
                      shape="rectangular"
                      theme="outline"
                    />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or continue with email</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Login Form */}
                {isLogin && (
                  <form className="space-y-4" onSubmit={(e) => {
                    e.preventDefault(); 
                    if (!isLoading) {
                      handleLogin(e);
                    }
                  }}>
                    {/* Email ID field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        onChange={handleChange}
                        name="email"
                        type="email"
                        className={`w-full px-4 py-3.5 rounded-xl border-2 ${emailErr ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base shadow-sm hover:shadow-md`}
                        placeholder="Enter your email address"
                        value={details.email}
                        required
                      />
                    </div>

                    {/* Password field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                                              <div className="relative">
                          <input
                            ref={passwordRef}
                            onChange={handlePasswordChange}
                            name="password"
                            type={showPassword ? "text" : "password"}
                            className={`w-full px-4 py-3.5 rounded-xl border-2 ${passErr ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base shadow-sm hover:shadow-md`}
                            placeholder="Enter your password"
                            value={details.password}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </button>
                        </div>
                    </div>

                    {/* Submit button for login */}
                    <div className="space-y-4 pt-4">
                      <AnimatedButton
                        type="submit"
                        variant="primary"
                        size="md"
                        fullWidth
                        disabled={isLoading}
                        className={isLoading ? 'bg-gray-400 cursor-not-allowed' : ''}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Signing in...</span>
                          </div>
                        ) : (
                          <span>Sign in</span>
                        )}
                      </AnimatedButton>

                      <p className="text-center text-sm text-gray-600">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => !isLoading && setIsLogin(false)}
                          className={`font-medium transition-colors ${isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-amber-600 hover:text-amber-800'}`}
                          disabled={isLoading}
                        >
                          Sign up
                        </button>
                      </p>
                    </div>
                </form>
                )}

                {isLogin && (
                  <div className="text-center pt-2">
                    <button
                      onClick={openModal}
                                              className={`text-sm font-medium transition-colors ${isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-amber-600 hover:text-amber-800'}`}
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </main>
        </div>
      <EmailModal showModal={isModalOpen} setShowModal={setIsModalOpen} />
      
      {/* Code of Conduct Modal */}
      {showCodeOfConduct && (
        <div className="fixed inset-0 z-[9999] bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h3 className="text-xl font-semibold text-gray-900">IFCA Code of Conduct</h3>
            <button
              onClick={() => !isLoading && setShowCodeOfConduct(false)}
              className={`transition-colors p-2 ${isLoading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Iframe Content */}
          <div className="h-[calc(100vh-120px)]">
            <iframe
              src="https://drive.google.com/file/d/1KJZNElCyK3NGFH7wFifLv0Iex6yF0oXv/preview"
              className="w-full h-full border-0"
              title="IFCA Code of Conduct"
              allowFullScreen
            />
          </div>
          
          {/* Footer with Agree Button */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="flex justify-center">
              <AnimatedButton
                onClick={() => {
                  if (!isLoading) {
                    setIsAgreed(true);
                    setShowCodeOfConduct(false);
                  }
                }}
                variant="primary"
                size="lg"
                disabled={isLoading}
                className={isLoading ? 'bg-gray-400 cursor-not-allowed' : ''}
              >
                Agree and Accept
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Custom Google Phone Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Complete Your Profile</h2>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Pre-fetched Google Details */}
              {googleSignupData && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-3 text-sm">Google Account Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Name:</span>
                      <span className="font-medium text-gray-800">{googleSignupData.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Email:</span>
                      <span className="font-medium text-gray-800">{googleSignupData.email}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Phone Number Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-base shadow-sm hover:shadow-md"
                  value={googlePhone}
                  onChange={async (e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                    setGooglePhone(value);
                    
                    // Check phone existence in real-time
                    if (value && value.length === 10) {
                      const phoneCheck = await checkPhoneExists(value);
                      if (phoneCheck.exists) {
                        setGooglePhoneErr('This phone number is already registered.');
                      } else {
                        setGooglePhoneErr('');
                      }
                    }
                  }}
                  placeholder="Enter your 10-digit phone number"
                  maxLength={10}
                  required
                />
                {googlePhoneErr && (
                  <p className="text-sm text-red-500 font-normal">{googlePhoneErr}</p>
                )}
                <p className="text-xs text-gray-500">
                  We'll use this to verify your account and send important updates
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex space-x-3 p-6 border-t border-gray-200">
              <AnimatedButton
                onClick={() => setShowPhoneModal(false)}
                variant="outline"
                size="md"
                className="flex-1 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              >
                Cancel
              </AnimatedButton>
              <AnimatedButton
                onClick={async () => {
                  if (!/^\d{10}$/.test(googlePhone)) {
                    setGooglePhoneErr('Enter a valid 10-digit phone number');
                    return;
                  }
                  setGooglePhoneErr('');
                  // Complete Google signup with phone
                  try {
                    setIsLoading(true);
                    await api.post('/auth/google/complete', { 
                      idToken: googleSignupData.idToken, 
                      phone: googlePhone
                    });
                    toast.success('Account created successfully!');
                    setShowPhoneModal(false);
                    setIsLogin(true);
                    setGooglePhone('');
                    setGoogleSignupData(null);
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Signup failed. Please try again.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading || !googlePhone || googlePhone.length !== 10}
                variant="primary"
                size="md"
                className={`flex-1 ${isLoading || !googlePhone || googlePhone.length !== 10 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Creating Account...' : 'Complete Signup'}
              </AnimatedButton>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default OnBoard;
