import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '@/utils/apiSetup';
import {
  Book as BookIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Language as LanguageIcon,
  ContactMail as ContactIcon,
  Image as ImageIcon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  School as SchoolIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectAllCommunities } from '@/store/features/communitySlice';
import { selectUser } from '@/store/features/userSlice';
import Image from 'next/image';
import { motion } from 'framer-motion';

const CourseDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const user = useSelector(selectUser);
  const [course, setCourse] = useState(null);
  const [moodleCourseDetails, setMoodleCourseDetails] = useState(null);
  const [moodleCourseContents, setMoodleCourseContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const communities = useSelector(selectAllCommunities);
  const [selectedCommunities, setSelectedCommunities] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [courseImage, setCourseImage] = useState('');
  const [courseLanguage, setCourseLanguage] = useState('');
  const [courseContact, setCourseContact] = useState({});
  const [courseEnrolledUsers, setCourseEnrolledUsers] = useState([]);
  const [showMoodleIframe, setShowMoodleIframe] = useState(false);
  const [moodleIframeUrl, setMoodleIframeUrl] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (id && user?.id) {
      fetchCourseData();
    }
  }, [id, user]);

  // Open Moodle settings in fullscreen if requested
  useEffect(() => {
    if (router.query.openMoodleSettings && (router.query.moodleCourseId || course?.moodleCourseId)) {
      const moodleId = router.query.moodleCourseId || course?.moodleCourseId;
      const moodleUrl = `https://ifcaifcalms.cocreate.ventures/course/edit.php?id=${moodleId}`;
      console.log('Moodle Settings URL:', moodleUrl);
      setMoodleIframeUrl(moodleUrl);
      setShowMoodleIframe(true);
      setIsFullScreen(true);
      setTimeout(() => {
        const iframeSection = document.getElementById('moodle-iframe-section');
        if (iframeSection) {
          iframeSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [router.query.openMoodleSettings, router.query.moodleCourseId, course]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, detailsRes, contentsRes, usersRes] = await Promise.all([
        api.get(`/course/courses/${id}`),
        api.get(`/course/courses/${id}/details`),
        api.get(`/course/courses/${id}/contents`),
        api.get(`/course/courses/${id}/users`)
      ]);

      setCourse(courseRes.data);
      setMoodleCourseDetails(detailsRes.data);
      setMoodleCourseContents(contentsRes.data);
      setCourseEnrolledUsers(usersRes.data || []);
      setSelectedCommunities(courseRes.data.communities.map(c => c.id));
      setCourseImage(detailsRes.data.courseimage || '');
      setCourseLanguage(detailsRes.data.lang || 'en');
      setCourseContact({
        name: detailsRes.data.contacts?.[0]?.fullname || '',
        email: detailsRes.data.contacts?.[0]?.email || '',
        role: detailsRes.data.contacts?.[0]?.role || ''
      });
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

  const handleMoodleAccess = async (moduleUrl = null) => {
    try {
      const response = await api.post('/course/auth/userkey/request_login_url', {
        user: { 
          username:'ifca',
        }
      });
      
      if (response.data.loginurl) {
        const courseId = course.moodleCourseId;
        const baseUrl = response.data.baseUrl || 'https://ifcaifcalms.cocreate.ventures';
        const wantsUrl = moduleUrl || `${baseUrl}/course/view.php?id=${courseId}`;
        const finalUrl = `${response.data.loginurl}&wantsurl=${encodeURIComponent(wantsUrl)}`;
        console.log('Admin Final URL:', finalUrl);
        console.log('Admin Base URL:', baseUrl);
        console.log('Admin Wants URL:', wantsUrl);
        setMoodleIframeUrl(finalUrl);
        setShowMoodleIframe(true);
        setIsFullScreen(true);
        if (moduleUrl) {
          setSelectedModule(moduleUrl);
        }
        setTimeout(() => {
          const iframeSection = document.getElementById('moodle-iframe-section');
          if (iframeSection) {
            iframeSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Failed to get Moodle access:', error);
      alert('Failed to access Moodle course. Please try again later.');
    }
  };

  const handleModuleClick = (module) => {
    if (module.url) {
      handleMoodleAccess(module.url);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isFullScreen ? 'fixed inset-0 z-50 pt-[70px]' : ''}`}>
      {/* Breadcrumbs - Hide in fullscreen */}
      {!isFullScreen && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <HomeIcon className="w-4 h-4" />
            </button>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => router.push('/admin/courses')}
              className="text-gray-500 hover:text-gray-700"
            >
              Courses
            </button>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 font-medium">{course?.name}</span>
          </div>
        </div>
      )}

      <div className={`${isFullScreen ? 'h-[calc(100vh-70px)]' : 'max-w-[1920px] mx-auto px-4 py-6'}`}>
        {/* Course Banner - Hide in fullscreen */}
        {!isFullScreen && (
          <div className="relative h-40 rounded-xl overflow-hidden mb-6">
            {course?.image ? (
              <img src={course.image} alt={course.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-orange-500 to-orange-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h1 className="md:text-2xl text-xl font-bold text-white mb-2">{course?.name}</h1>
                <div className="flex items-center gap-4 text-white/90">
                  <span className="flex items-center gap-2 text-[12px]">
                    <LanguageIcon className="w-3 h-3 text-[10px]" />
                    {courseLanguage.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[12px] ${course?.status === 'active' ? 'bg-orange-500/20' : 'bg-gray-500/20'}`}>
                    {course?.status}
                  </span>
                  <button
                    onClick={() => handleMoodleAccess()}
                    className="bg-orange-500 hover:bg-orange-600 text-[12px] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                  >
                    <SchoolIcon className="w-3 h-3 text-[10px]" /> Open Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${isFullScreen ? 'col-span-full' : 'lg:col-span-2'}`}>
            {/* Course Description - Hide in fullscreen */}
            {!isFullScreen && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: course?.description }} />
              </div>
            )}

            {/* Course Contents or Moodle Iframe */}
            {showMoodleIframe ? (
              <div id="moodle-iframe-section" className={`bg-white ${isFullScreen ? 'h-[calc(100vh-70px)]' : 'rounded-lg shadow-md'} overflow-hidden`}>
                <div className="p-4 border-b flex items-center justify-between bg-white">
                  <h2 className="text-xl font-bold">{course.name}</h2>
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
                        setShowMoodleIframe(false);
                        setSelectedModule(null);
                        setIsFullScreen(false);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                </div>
                <div className={`w-full ${isFullScreen ? 'h-[calc(100vh-134px)]' : 'h-[calc(100vh-400px)]'}`}>
                  <iframe
                    src={moodleIframeUrl}
                    className="w-full h-full border-0"
                    title="Moodle Course"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BookIcon /> Course Contents
                </h2>
                <div className="space-y-4">
                  {moodleCourseContents.map((section, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
                      >
                        <h3 className="font-semibold text-lg">{section.name}</h3>
                        {expandedSections[section.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </button>

                      {expandedSections[section.id] && (
                        <div className="p-4 space-y-2">
                          {section.modules?.map((module, mIndex) => (
                            <motion.div
                              key={mIndex}
                              whileHover={{ scale: 1.01 }}
                              onClick={() => handleModuleClick(module)}
                              className={`flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 ${
                                module.url ? 'hover:bg-orange-50 cursor-pointer' : 'hover:bg-gray-50'
                              }`}
                            >
                              {module.modicon ? (
                                <img
                                  src={module.modicon}
                                  alt={module.name}
                                  className="w-8 h-8 object-contain mt-1"
                                />
                              ) : (
                                <ImageIcon className="w-8 h-8 mt-1 text-gray-500" />
                              )}
                              <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                  <h4 className={`font-medium ${module.url ? 'text-orange-600' : ''}`}>
                                    {module.name}
                                  </h4>
                                  {module.url && (
                                    <span className="text-xs text-orange-500">Click to view</span>
                                  )}
                                </div>
                                {module.description && (
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Hide in fullscreen */}
          {!isFullScreen && (
            <div className="space-y-6">
              {/* Course Contact Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <ContactIcon /> Course Contact
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                      {courseContact.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="font-semibold">{courseContact.name}</h3>
                      <p className="text-sm text-gray-600">{courseContact.role}</p>
                      <a href={`mailto:${courseContact.email}`} className="text-sm text-orange-500 hover:underline">
                        {courseContact.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connected Communities */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <PeopleIcon /> Communities
                  </h2>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-orange-500 hover:text-orange-600"
                  >
                    <EditIcon />
                  </button>
                </div>

                <div className="space-y-4">
                  {course?.communities.map(community => (
                    <motion.div
                      key={community.id}
                      whileHover={{ scale: 1.02 }}
                      className="relative rounded-lg overflow-hidden h-32"
                    >
                      {community.bannerImg ? (
                        <Image
                          src={community.bannerImg}
                          alt={community.title}
                          layout="fill"
                          objectFit="cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-orange-500 to-orange-600" />
                      )}
                      <div className="absolute inset-0 bg-black/50 p-4 flex flex-col justify-end">
                        <h3 className="font-semibold text-white">{community.title}</h3>
                        <p className="text-sm text-white/80 line-clamp-2">{community.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
