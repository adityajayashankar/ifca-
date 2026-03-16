import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '@/utils/apiSetup';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import {
  Book as BookIcon,
  Lock as LockIcon,
  PlayCircle as PlayIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Language as LanguageIcon,
  ContactMail as ContactIcon,
  Image as ImageIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Assignment as AssignmentIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  LiveHelp as LiveHelpIcon
} from '@mui/icons-material';
import Head from 'next/head';
import Topbar from '@/components/topbar/Topbar';
import CommunityCard from '@/components/communityCard';
import Script from 'next/script';

const CourseDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const user = useSelector(selectUser);
  const [course, setCourse] = useState(null);
  const [moodleCourseDetails, setMoodleCourseDetails] = useState(null);
  const [moodleCourseContents, setMoodleCourseContents] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [courseEnrolledUsers, setCourseEnrolledUsers] = useState(0);
  const [expandedSections, setExpandedSections] = useState({});
  const [courseLanguage, setCourseLanguage] = useState('');
  const [courseContact, setCourseContact] = useState({});
  const [userInCommunity, setUserInCommunity] = useState(false);
  const [moodleSessionUrl, setMoodleSessionUrl] = useState(null);
  const [showCourseContent, setShowCourseContent] = useState(false);
  const [courseUrl, setCourseUrl] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    if (id && user?.id) {
      checkEnrollmentAndFetchCourse();
    }
  }, [id, user]);

  const checkEnrollmentAndFetchCourse = async () => {
    try {
      setLoading(true);
      const [courseRes, detailsRes, contentsRes, courseEnrolledUsersRes, userEnrollmentStatusRes] = await Promise.all([
        api.get(`/course/courses/${id}`),
        api.get(`/course/courses/${id}/details`),
        api.get(`/course/courses/${id}/contents`),
        api.get(`/course/courses/${id}/users?count=true`),
        api.get(`/course/courses/${id}/users/${user.id}/status`)
      ]);

      setIsEnrolled(userEnrollmentStatusRes.data.isEnrolled === true ? true : false);
      setCourseEnrolledUsers(courseEnrolledUsersRes.data.count);
      setCourse(courseRes.data);
      setMoodleCourseDetails(detailsRes.data);
      setMoodleCourseContents(contentsRes.data);
      setCourseLanguage(detailsRes.data.lang || 'en');
      setCourseContact({
        name: detailsRes.data.contacts?.[0]?.fullname || '',
        email: detailsRes.data.contacts?.[0]?.email || '',
        role: detailsRes.data.contacts?.[0]?.role || ''
      });

      // Check if user is in any of the course's communities
      if (courseRes.data.communities.length > 0) {
        const communityId = courseRes.data.communities[0].id;
        const communityMembersRes = await api.get(`/community/${communityId}/people`);
        const isUserInCommunity = communityMembersRes.data?.users?.some(member => member.unifiedUserId === user?.unifiedUser?.id);
        setUserInCommunity(isUserInCommunity);
      }
    } catch (error) {
      console.error('Failed to fetch course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleEnroll = async () => {
    try {
      // Check if course has a community and user is not subscribed
      if (course.communities?.length > 0) {
        const communityId = course.communities[0].id;
        const communityMembersRes = await api.get(`/community/${communityId}/people`);
        const isUserInCommunity = communityMembersRes.data?.users?.some(member => member.unifiedUserId === user?.unifiedUser?.id);
        
        if (!isUserInCommunity) {
          router.push(`/communityDetails/${communityId}`);
          return;
        }
      }

      // If course has a price, open Razorpay modal
      if (course.price > 0) {
        // Calculate discounted price
        const finalPrice = course.price > 0 && course.discount > 0
          ? course.price - (course.price * course.discount) / 100
          : course.price;
        // 1. Create order
        const { data } = await api.post('/course/courses/payment/order', {
          userId: user.id,
          courseId: course.id,
          amount: finalPrice // use discounted price
        });

        // 2. Wait for Razorpay script to be loaded
        if (typeof window.Razorpay === 'undefined') {
          alert('Payment system is still loading. Please try again in a moment.');
          return;
        }

        // 3. Open Razorpay modal
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: `Payment for ${course.name} - ${course.discount}% off`,
          description: `Payment for ${course.name} - ${course.discount}% off -  In platform IFCA`,
          order_id: data.orderId,
          handler: async function (response) {
            // 4. Verify payment and enroll
            const verifyRes = await api.post('/course/courses/payment/verify', {
              userId: user.id,
              courseId: course.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verifyRes.data && verifyRes.data.message) {
              setIsEnrolled(true);
              alert('Enrollment successful!');
              await handleCourseAccess();
            } else {
              alert('Payment verification failed.');
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone
          },
          theme: { color: '#2563EB' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // If no price and no community, proceed with direct enrollment
      setEnrolling(true);
      await api.post('/course/courses/enroll', {
        userId: user.id,
        courseId: course.id
      });
      setIsEnrolled(true);
      await handleCourseAccess();
    } catch (error) {
      console.error('Failed to enroll:', error);
      alert('Failed to enroll in course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const fetchMoodleLoginUrl = async () => {
    try {
      // First try with user's actual username
      let res = await api.post('/course/auth/userkey/request_login_url', {
        user: { 
          username: user.moodleUsername || user.phone
        }
      });
      return res.data;
    } catch (error) {
      console.error('Failed to get Moodle login URL with user credentials:', error);
      
      // If user credentials fail, try with admin credentials as fallback
      try {
        console.log('Trying with admin credentials as fallback...');
        const res = await api.post('/course/auth/userkey/request_login_url', {
          user: { 
            username: 'admin'
          }
        });
        return res.data;
      } catch (adminError) {
        console.error('Failed to get Moodle login URL with admin credentials:', adminError);
        alert('Could not get Moodle login URL');
        return null;
      }
    }
  };

  const handleCourseAccess = async (page) => {
    try {
      const moodleData = await fetchMoodleLoginUrl();
      if (moodleData && moodleData.loginurl) {
        // Construct the full Moodle URL with iframe parameter
        const courseId = course.moodleCourseId;
        const baseUrl = moodleData.baseUrl || 'https://ifcaifcalms.cocreate.ventures';
        const wantsUrl = page ? page : `${baseUrl}/course/view.php?id=${courseId}&iframe=1`;
        const finalUrl = `${moodleData.loginurl}&wantsurl=${encodeURIComponent(wantsUrl)}`;
        console.log('Final URL:', finalUrl);
        console.log('Base URL:', baseUrl);
        console.log('Wants URL:', wantsUrl);
        setCourseUrl(finalUrl);
        setShowCourseContent(true);
      }
    } catch (error) {
      console.error('Failed to access course:', error);
      alert('There was an issue accessing the course. Please try again.');
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Course Details - IFCA</title>
        </Head>
        <Topbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Head>
          <title>Course Not Found - IFCA</title>
        </Head>
        <Topbar />
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-3xl mx-auto text-center py-12">
            <WarningIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Course Not Found</h1>
            <p className="text-gray-600 mt-2">The course you're looking for doesn't exist or you don't have access.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{course.name} - IFCA</title>
      </Head>
      <Topbar />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className={`min-h-screen bg-gray-50 mt-[65px] ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* Course Banner */}
        {!isFullScreen && (
          <div className="relative h-48">
            {course.image || course?.moodleDetails?.courseimage ? (
              <div className="relative h-full">
                <img
                  src={course?.image || course?.moodleDetails?.courseimage}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 mix-blend-multiply" />
              </div>
            ) : course.communities?.length > 0 && course.communities[0]?.bannerImg ? (
              <div className="relative h-full">
                <img
                  src={course.communities[0].bannerImg}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-purple-600/80 mix-blend-multiply" />
              </div>
            ) : (
              <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-[16px] md:text-[20px] font-bold text-white mb-2">{course.name}</h1>
                <div className="flex items-center gap-4 text-white/90">
                  <span className="flex items-center gap-2 text-[12px]">
                    <LanguageIcon className="w-4 h-4" />
                    {courseLanguage.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-2 text-[12px]">
                    <PeopleIcon className="w-4 h-4" />
                    {courseEnrolledUsers} enrolled
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[12px] ${course.status === 'active' ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>{course.status}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${isFullScreen ? 'h-screen' : 'max-w-7xl mx-auto p-6'}`}>
          {showCourseContent ? (
            <div className={`bg-white ${isFullScreen ? 'h-full' : 'rounded-lg shadow-md'} overflow-hidden`}>
              <div className="p-4 border-b flex items-center justify-between bg-white">
                <h2 className="text-[16px] font-bold">{course.name}</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleFullScreen}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                    title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                  >
                    {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </button>
                  <button
                    onClick={() => {
                      setShowCourseContent(false);
                      setIsFullScreen(false);
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
              <div className={`w-full ${isFullScreen ? 'h-[calc(100vh-65px)]' : 'h-[calc(100vh-400px)]'}`}>
                <iframe
                  src={courseUrl}
                  className="w-full h-full border-0"
                  title="Course Content"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="origin-when-cross-origin"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {/* Tabs Navigation */}
                <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
                  <div className="flex border-b overflow-x-auto">
                    <button
                      onClick={() => setActiveTab('about')}
                      className={`px-6 py-4 font-medium text-[14px] flex items-center gap-2 whitespace-nowrap transition-colors ${
                        activeTab === 'about'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <DescriptionIcon className="w-4 h-4" />
                      About
                    </button>
                    <button
                      onClick={() => setActiveTab('curriculum')}
                      className={`px-6 py-4 font-medium text-[14px] flex items-center gap-2 whitespace-nowrap transition-colors ${
                        activeTab === 'curriculum'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <BookIcon className="w-4 h-4" />
                      Curriculum
                    </button>
                    <button
                      onClick={() => setActiveTab('learn')}
                      className={`px-6 py-4 font-medium text-[14px] flex items-center gap-2 whitespace-nowrap transition-colors ${
                        activeTab === 'learn'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <SchoolIcon className="w-4 h-4" />
                      What You'll Learn
                    </button>
                    <button
                      onClick={() => setActiveTab('requirements')}
                      className={`px-6 py-4 font-medium text-[14px] flex items-center gap-2 whitespace-nowrap transition-colors ${
                        activeTab === 'requirements'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <AssignmentIcon className="w-4 h-4" />
                      Requirements
                    </button>
                    <button
                      onClick={() => setActiveTab('instructor')}
                      className={`px-6 py-4 font-medium text-[14px] flex items-center gap-2 whitespace-nowrap transition-colors ${
                        activeTab === 'instructor'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <ContactIcon className="w-4 h-4" />
                      Instructor
                    </button>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="p-6">
                    {/* About Tab */}
                    {activeTab === 'about' && (
                      <div>
                        <h2 className="text-[16px] font-bold mb-4">About This Course</h2>
                        <div className="prose max-w-none text-[14px]" dangerouslySetInnerHTML={{ __html: course.description }} />
                      </div>
                    )}

                    {/* Curriculum Tab */}
                    {activeTab === 'curriculum' && (
                      <div>
                        <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                          <BookIcon className="w-4 h-4" /> Course Contents
                        </h2>
                        <div className="space-y-4">
                          {moodleCourseContents?.map((section, index) => (
                            <div key={index} className="border rounded-lg overflow-hidden">
                              <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-[12px] font-medium text-gray-500">Section {index + 1}</span>
                                  <h3 className="font-semibold text-[14px]">{section.name}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] text-gray-500">
                                    {section.modules?.length || 0} {section.modules?.length === 1 ? 'item' : 'items'}
                                  </span>
                                  {expandedSections[section.id] ? <ExpandLessIcon className="w-4 h-4" /> : <ExpandMoreIcon className="w-4 h-4" />}
                                </div>
                              </button>

                              {expandedSections[section.id] && (
                                <div className="p-4 space-y-3 bg-white">
                                  {section.modules?.map((module, mIndex) => (
                                    <div
                                      key={mIndex}
                                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                                        isEnrolled 
                                          ? 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer' 
                                          : 'border-gray-100'
                                      } transition-all duration-200`}
                                      onClick={() => isEnrolled && handleCourseAccess(module.url)}
                                    >
                                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100">
                                        {module.modicon ? (
                                          <img
                                            src={module.modicon}
                                            alt={module.name}
                                            className="w-6 h-6 object-contain"
                                          />
                                        ) : (
                                          <PlayIcon className="w-6 h-6 text-gray-500" />
                                        )}
                                      </div>
                                      <div className="flex-grow">
                                        <h4 className="font-medium text-gray-900">{module.name}</h4>
                                        {module.description && (
                                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{module.description}</p>
                                        )}
                                        {isEnrolled && module.completionstatus !== undefined && (
                                          <div className="mt-2 flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                              module.completionstatus === 1 ? 'bg-green-500' : 'bg-gray-300'
                                            }`} />
                                            <span className="text-xs text-gray-500">
                                              {module.completionstatus === 1 ? 'Completed' : 'Not completed'}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {!isEnrolled && (
                                        <LockIcon className="w-5 h-5 text-gray-400" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* What You'll Learn Tab */}
                    {activeTab === 'learn' && (
                      <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <SchoolIcon /> What You'll Learn
                        </h2>
                        <div className="space-y-4">
                          {moodleCourseDetails?.learningoutcomes ? (
                            <div>
                              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: moodleCourseDetails.learningoutcomes }} />
                            </div>
                          ) : (
                            moodleCourseContents?.slice(0, 6).map((section, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="flex-shrink-0 text-green-500 mt-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">{section.name}</h3>
                                  {section.summary ? (
                                    <div className="text-sm text-gray-500 mt-1 prose prose-sm max-w-none">
                                      {section.summary.includes('<') ? (
                                        <div dangerouslySetInnerHTML={{ __html: section.summary }} />
                                      ) : (
                                        <p>{section.summary}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Complete {section.modules?.length || 0} learning items in this section
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Requirements Tab */}
                    {activeTab === 'requirements' && (
                      <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <AssignmentIcon /> Requirements
                        </h2>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-green-500 mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">Basic Understanding</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                A basic understanding of the subject matter is recommended but not required.
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-green-500 mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">Time Commitment</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {moodleCourseDetails?.timecommitment || 'Dedicate time to complete all course modules and assignments.'}
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-green-500 mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">Course Access</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                Enroll in the course to access all materials and track your progress.
                              </p>
                            </div>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Instructor Tab */}
                    {activeTab === 'instructor' && (
                      <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <ContactIcon /> Course Instructor
                        </h2>
                        <div className="flex items-start gap-6 mb-6">
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            {courseContact.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{courseContact.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{courseContact.role}</p>
                            <a href={`mailto:${courseContact.email}`} className="text-orange-500 hover:underline flex items-center gap-1 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {courseContact.email}
                            </a>
                          </div>
                        </div>
                        <p className="text-gray-700">
                          {moodleCourseDetails?.instructorbio || 
                           'The instructor is an expert in this field with extensive experience in teaching and professional practice.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Enrollment Card */}
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                  {isEnrolled ? (
                    <div className="text-center">
                      <SchoolIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h2 className="text-[16px] font-bold text-gray-800 mb-2">You're Enrolled!</h2>
                      <p className="text-[14px] text-gray-600 mb-6">Continue your learning journey</p>
                      <button
                        onClick={() => handleCourseAccess()}
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 text-[14px]"
                      >
                        <PlayIcon className="w-4 h-4" />
                        Go to Course
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <LockIcon className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                      <h2 className="text-[16px] font-bold text-gray-800 mb-2">
                        {course.communities?.length > 0 && !userInCommunity ? 'Join Community First' : 'Enroll Now'}
                      </h2>
                      <p className="text-[14px] text-gray-600 mb-4">
                        {course.communities?.length > 0 && !userInCommunity
                          ? 'You need to join the community before enrolling in this course'
                          : 'Join this course to start learning'
                        }
                      </p>

                      {/* Price Display */}
                      {course.price > 0 && (
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                          {course.discount > 0 ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[14px] text-gray-500 line-through">₹{course.price}</span>
                                <span className="text-[16px] text-green-600 font-bold">₹{course.price - (course.price * course.discount / 100)}</span>
                              </div>
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[12px] font-medium">
                                {course.discount}% OFF
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[16px] text-gray-800 font-bold">₹{course.price}</span>
                              <span className="text-[12px] text-gray-500">One-time payment</span>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full bg-primary-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 text-[14px]"
                      >
                        {enrolling ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <SchoolIcon className="w-4 h-4" />
                            {course.communities?.length > 0 && !userInCommunity ? 'Join Community' : 'Enroll in Course'}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Communities */}
                {course.communities?.length > 0 && (
                  <div className="bg-white rounded-lg border p-6">
                    <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                      <SchoolIcon className="w-4 h-4" /> Associated Community
                    </h2>
                    <div className="space-y-4">
                      {course.communities.map(community => (
                        <div key={community.id}>
                          <CommunityCard 
                            details={community}
                            enroll={userInCommunity}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CourseDetailPage; 