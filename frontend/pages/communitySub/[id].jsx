import Footer from "@/components/footer";
import SubscriptionDetails from "@/components/subscriptionDetails";
import Topbar from "@/components/topbar/Topbar";
import {
  selectCommunity,
  setCommunityById,
} from "@/store/features/communitySlice";
import {
  addToCart,
  selectFromDetails,
  selectUser,
  setUserCommunities,
} from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Script from "next/script";
import { useForm, Controller } from "react-hook-form";

const ModalForm = ({ comId, setModal, userId, user, router, price, comTitle, image, questions }) => {
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user?.phone,
    q1: "",
    q2: "",
    q3: "",
  });

  const { handleSubmit, control, formState: { errors }, setValue, watch, trigger } = useForm({
    defaultValues: formData,
    mode: 'onChange', // Real-time validation
  });

  const watchedValues = watch();

  const onSubmit = async (data) => {
    const res = await api.post(`/requests/`, {
      communityDetails: {
        ...data,
        communityId: parseInt(comId),
        userId: parseInt(userId),
      },
    });
  
    if (res.success || res.data.success === true) {
      toast("Your request has been sent");
      setModal(false);
      router.push(`/communityDetails/${comId}`);
    } else {
      toast("Request Failed", { type: "error" });
    }
  };

  const handleQuestionChange = (questionIndex, value) => {
    setValue(`q${questionIndex + 1}`, value);
    setFormData(prev => ({
      ...prev,
      [`q${questionIndex + 1}`]: value
    }));
    // Trigger real-time validation
    trigger(`q${questionIndex + 1}`);
  };

  const getQuestionStatus = (questionIndex) => {
    const value = watchedValues[`q${questionIndex + 1}`];
    return value && value.trim() ? 'completed' : 'pending';
  };

  const isFormComplete = () => {
    if (!questions || questions.length === 0) return true;
    
    return questions.every((_, index) => {
      const value = watchedValues[`q${index + 1}`];
      return value && value.trim().length > 0;
    });
  };

  const getCompletedCount = () => {
    if (!questions || questions.length === 0) return 0;
    
    return questions.filter((_, index) => {
      const value = watchedValues[`q${index + 1}`];
      return value && value.trim().length > 0;
    }).length;
  };
  

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setModal(false)} />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl mx-auto relative animate-fadeInUp max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 md:p-8 bg-gradient-to-r from-orange-50 to-white rounded-t-xl sm:rounded-t-2xl border-b border-gray-200">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Join Community</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">Complete the form to join {comTitle}</p>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl font-light hover:bg-gray-100 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-colors flex-shrink-0"
              onClick={() => setModal(false)}
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* User Info Section */}
              <div className="mb-6 sm:mb-8 bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Name</label>
                        <input
                          {...field}
                          className="w-full border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          placeholder="Your name"
                          readOnly
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email</label>
                        <input
                          {...field}
                          className="w-full border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          placeholder="Your email"
                          readOnly
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Phone</label>
                        <input
                          {...field}
                          className="w-full border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          placeholder="Your phone"
                          readOnly
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

                            {/* Questions Section */}
              {questions && questions.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Community Questions ({questions.length})</h3>
                      <p className="text-sm text-gray-500 mt-1">All questions are required</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                       {questions.map((_, index) => {
                         const status = getQuestionStatus(index);
                         return (
                           <div
                             key={index}
                             className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300 ${
                               status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                             }`}
                             title={`Question ${index + 1}: ${status}`}
                           />
                         );
                       })}
                     </div>
                  </div>
                  
                  {/* Questions List */}
                  <div className="space-y-4 sm:space-y-6">
                    {questions.map((question, index) => {
                      const status = getQuestionStatus(index);
                      return (
                        <div
                          key={index}
                          className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 border ${
                            status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold ${
                              status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                            }`}>
                              {status === 'completed' ? '✓' : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-base sm:text-lg mb-2 break-words">
                                {typeof question === 'string' 
                                  ? question 
                                  : question.question || question.text || `Question ${index + 1}`
                                }
                              </h4>
                              <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                                status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {status === 'completed' ? 'Completed' : 'Required'}
                              </span>
                            </div>
                          </div>
                          
                          <textarea
                            value={watchedValues[`q${index + 1}`] || ''}
                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                            className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 min-h-[100px] sm:min-h-[120px] resize-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base ${
                              status === 'completed' ? 'bg-white border-green-300' : 'bg-white border-gray-300'
                            }`}
                            placeholder="Type your answer here..."
                            required
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                                 <div className="p-6 bg-gray-50 rounded-2xl text-gray-700">
                   <div className="flex items-center gap-2 mb-2">
                     <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                     </svg>
                     <strong>No Questions Required</strong>
                   </div>
                   <p className="text-sm">This community doesn't require additional questions. You can proceed with your basic information.</p>
                 </div>
              )}
            </form>
          </div>

                    {/* Footer - Fixed at Bottom */}
          <div className="border-t border-gray-200 p-4 sm:p-6 md:p-8 bg-white rounded-b-xl sm:rounded-b-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-500">
                {questions && questions.length > 0 && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {getCompletedCount()} of {questions.length} questions completed
                  </span>
                )}
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors text-sm sm:text-base"
                  onClick={() => setModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isFormComplete()}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                    !isFormComplete()
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isFormComplete()) return;
                    
                    if (price > 0) {
                      const formData = {
                        name: user?.name,
                        email: user?.email,
                        phone: user?.phone,
                        communityId: comId,
                        userId: userId,
                        q1: watchedValues.q1,
                        q2: watchedValues.q2,
                        q3: watchedValues.q3,
                      };
                      let existingCartData = localStorage.getItem("cartData");
                      let cartArray = existingCartData ? JSON.parse(existingCartData) : [];
                      cartArray.push(formData);
                      localStorage.setItem("cartData", JSON.stringify(cartArray));
                      dispatch(addToCart({ comId, comTitle, price, image }));
                      toast.success("Added to cart!");
                      setModal(false);
                    } else {
                      handleSubmit(onSubmit)();
                    }
                  }}
                >
                  {!isFormComplete() 
                    ? `Complete ${questions?.length - getCompletedCount()} more question${questions?.length - getCompletedCount() !== 1 ? 's' : ''}`
                    : price <= 0 ? "Submit Request" : "Add to Cart"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const CommunitySub = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const router = useRouter();
  const { id } = router.query;
  const comId = id ? parseInt(id) : null;
  const [modal, setModal] = useState(false);
  const fromPage = useSelector(selectFromDetails);
  const currentCommunity = useSelector(selectCommunity);
  const bg = currentCommunity?.bannerImg;
  const price = currentCommunity?.price;
  const subscriptionObj = [
    {
      id: 1,
      name: "Free",
      limit: 1,
      access: "Limited",
      exclusive: false,
      isCurrent: true,
      price: 0,
    },
    {
      id: 2,
      name: "Silver",
      limit: 2,
      access: "Complete",
      exclusive: false,
      isCurrent: false,
      img: "/silver.svg",
      price: currentCommunity?.silver_price,
    },
    {
      id: 3,
      name: "Gold",
      limit: 3,
      access: "Complete",
      exclusive: true,
      isCurrent: false,
      img: "/gold.svg",
      price: currentCommunity?.gold_price,
    },
  ];
  const [selectedId, setSelectedId] = useState(2);
  const [questions, setQuestions] = useState([]);
  const [isRequested, setIsRequested] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleVerify = async (response) => {
    toast.success("Payment Successful!!", { duration: 5000 });
    let now = new Date();
    let expiry = new Date(
      now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
      (now.getMonth() + 1) % 12,
      now.getDate()
    );
    let obj = {
      userId: user.id,
      communityId: comId,
      expiresAt: expiry,
      startsAt: now,
      amount: currentCommunity.price,
      transactionId: `xSxssdefg`,
      paymentId: "sauasevgr2133",
    };
    toast(`Enrolled successfully!`, { type: "success", delay: 250 });
    dispatch(setUserCommunities(user.id));
    const res = await api.post(`/pay/`, obj);
    fromPage.from === "sessionBuyPage"
      ? router.push(`/classDetails/${fromPage.id}`)
      : router.push(`/comHome/${comId}`);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (selectedId === 1) {
      let now = new Date();
      let expiry = new Date(
        now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
        (now.getMonth() + 1) % 12,
        now.getDate()
      );
      let obj = {
        userId: user.id,
        communityId: comId,
        expiresAt: expiry,
        startsAt: now,
        amount: 0,
        transactionId: `xSxssdefg`,
        paymentId: "sauasevgr2133",
      };
      const res = await api.post(`/pay/`, obj);
      toast(`Enrolled successfully!`, { type: "success", delay: 250 });
      dispatch(setUserCommunities(user.id));
      fromPage.from === "sessionBuyPage"
        ? router.push(`/classDetails/${fromPage.id}`)
        : router.push(`/comHome/${comId}`);
    } else {
      const rz_key = process.env.RAZORPAY_API_KEY;
      let choosenprice = 0;
      selectedId === 2
        ? (choosenprice = currentCommunity.silver_price)
        : (choosenprice = currentCommunity.gold_price);
      const {
        data: { order },
      } = await api.post("/order/createOrder", {
        amount: Number(choosenprice * 100),
      });
      const options = {
        key: rz_key,
        amount: choosenprice * 100,
        currency: "INR",
        name: "IFCA",
        description: "Paying for Order",
        order_id: order.id,
        handler: (response) => handleVerify(response),
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
          // address: 
        },
        notes: {
          address: "IFCA",
        },
        theme: {
          color: "#3399cc",
        },
      };
      const razor = new window.Razorpay(options);
      razor.open();
    }
  };

  const handleForm = () => {
    setModal(true);
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get(`/community/${comId}/questions`);
        if (res.data && res.data.success && Array.isArray(res.data.questions)) {
          setQuestions(res.data.questions);
        } else if (res.data && Array.isArray(res.data.questions)) {
          setQuestions(res.data.questions);
        } else if (res.data && res.data.success && typeof res.data.questions === 'string') {
          try {
            const parsedQuestions = JSON.parse(res.data.questions);
            setQuestions(Array.isArray(parsedQuestions) ? parsedQuestions : []);
          } catch (e) {
            setQuestions([]);
          }
        } else if (res.data && typeof res.data.questions === 'string') {
          try {
            const parsedQuestions = JSON.parse(res.data.questions);
            setQuestions(Array.isArray(parsedQuestions) ? parsedQuestions : []);
          } catch (e) {
            setQuestions([]);
          }
        } else if (res.data && Array.isArray(res.data)) {
          setQuestions(res.data);
        } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
          setQuestions(res.data.data);
        } else {
          setQuestions([]);
        }
      } catch (error) {
        setQuestions([]);
      }
    };
    if (comId) fetchQuestions();
  }, [comId]);

  // Check subscription and request status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user || !user.id || !comId) return;

      try {
        // Check if user is already subscribed
        const subscriptionResponse = await api.get(`/user/${user.id}/community/${comId}/subscribed`);
        setIsSubscribed(!!subscriptionResponse.data.subscribed);
        
        // Check if they have a pending request
        const requestResponse = await api.get(`/user/${user.id}/community/${comId}/requested`);
        setIsRequested(!!requestResponse.data.requested);
        
      } catch (err) {
        console.error('Error checking status:', err);
        setIsSubscribed(false);
        setIsRequested(false);
      }
    };

    checkStatus();
  }, [user, comId]);

  return (
    <>
      <Head>
        <title>Plans</title>
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeInUp {
            animation: fadeInUp 0.3s ease-out;
          }
          .question-transition {
            transition: all 0.3s ease-in-out;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </Head>
      <header>
        <Topbar />
      </header>
      <main className="min-h-[calc(100vh-65px)] bg-gray-50 overflow-x-hidden w-full">
        <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          
          {/* Request Pending Message */}
          {isRequested && !isSubscribed && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 rounded-lg p-4 sm:p-5 md:p-6 shadow-md mb-4 sm:mb-6 animate-fadeInUp">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-yellow-900 mb-2">
                    Request Pending
                  </h3>
                  <p className="text-sm sm:text-base text-yellow-800 leading-relaxed break-words mb-3">
                    Your request to join <strong className="font-semibold">{currentCommunity?.title}</strong> has been submitted and is currently under review. 
                    You'll receive a notification once your request is approved.
                  </p>
                  <div className="flex items-center gap-2 text-yellow-700 text-xs sm:text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse flex-shrink-0"></div>
                    <span className="break-words">Request submitted on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            
            {/* Banner */}
            <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-end p-4 sm:p-6 md:p-8 overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative z-10 w-full">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-lg break-words leading-tight flex-1">
                    {currentCommunity?.title || 'Community'}
                  </h1>
                  {/* Pending Badge */}
                  {isRequested && !isSubscribed && (
                    <span className="bg-yellow-400 text-yellow-900 text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full whitespace-nowrap flex-shrink-0 shadow-md">
                      Request Pending
                    </span>
                  )}
                  {isSubscribed && (
                    <span className="bg-green-500 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full whitespace-nowrap flex-shrink-0 shadow-md">
                      Member
                    </span>
                  )}
                  {!isRequested && !isSubscribed && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full whitespace-nowrap flex-shrink-0 shadow-md">
                      Not a Member
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="p-4 sm:p-6 md:p-8">
              
              {/* Header Section */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    Community Subscription
                  </h2>
                </div>

                {/* Features and Price Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                  {/* Features */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17 20h5v-2a4 4 0 0 0-3-3.87"/><path d="M9 20H4v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">1 Member</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M13 16h-1v-4h-1m4 0h-1v-4h-1"/><rect x="3" y="4" width="18" height="18" rx="2"/>
                      </svg>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Access to Resources</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/>
                      </svg>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Exclusive Content</span>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-1 sm:gap-2 flex-shrink-0 bg-orange-50 px-4 py-3 rounded-xl border border-orange-200">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 whitespace-nowrap">
                      Rs.{price || 0}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
                      (Incl. all access)
                    </span>
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              {questions && questions.length > 0 && (
                <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="font-bold text-orange-900 text-base sm:text-lg">
                      Community Questions ({questions.length})
                    </h3>
                  </div>
                  <ol className="space-y-3 ml-2">
                    {questions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-800">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-200 text-orange-800 text-xs font-bold flex items-center justify-center mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-sm sm:text-base font-medium break-words flex-1 leading-relaxed">
                          {typeof q === 'string' ? q : q.question || q.text || `Question ${idx + 1}`}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={handleForm}
                disabled={isRequested || isSubscribed}
                className={`w-full py-3.5 sm:py-4 md:py-4 rounded-xl text-white text-base sm:text-lg font-bold shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed ${
                  isRequested 
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600' 
                    : isSubscribed 
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {isRequested ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Request Pending
                    </>
                  ) : isSubscribed ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Already Joined
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                      </svg>
                      Continue to Join
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
        {modal && (
          <ModalForm
            comId={comId}
            image={currentCommunity?.bannerImg}
            comTitle={currentCommunity?.title}
            router={router}
            setModal={setModal}
            userId={user.unifiedUser?.id}
            user={user}
            price={price}
            questions={questions}
          />
        )}
      </main>
      {!modal && (
        <footer>
          <Footer />
        </footer>
      )}
      <Script src="https://checkout.razorpay.com/v1/checkout.js"></Script>
    </>
  );
};

export default CommunitySub;
