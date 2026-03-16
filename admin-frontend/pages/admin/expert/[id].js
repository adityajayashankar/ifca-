import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import LinkIcon from "@mui/icons-material/Link";
// import { NextSeo } from 'next-seo';
import Card from "@/components/common/Card";
import CategoryCard from "@/components/community/categorycard";
import {
  selectExpert,
  setAllExperts,
  setExpert,
} from "@/store/features/expert";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
import Head from "next/head";
import { MdChevronRight, MdHome, MdPerson, MdPersonAdd } from "react-icons/md";

function ExpertPage() {
  const dispatch = useDispatch();
  const selectedExpert = useSelector(selectExpert);
  const [expertData, setExpertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (router.isReady && router.query.id) {
      const expertId = router.query.id;
      
      api.get(`/expert/${expertId}`).then(res => {
        setExpertData(res.data.expert);
        dispatch(setExpert(res.data.expert));
        setLoading(false);
      }).catch(err => {
        console.log("Error loading expert:", err);
        setLoading(false);
      });
    }
  }, [router.isReady, router.query.id]);

  const handleEditExpert = (e) => {
    e.preventDefault();
    router.push(`/admin/expert/add/${selectedExpert?.id}`);
  };

  const handleDeleteExpert = (e) => {
    e.preventDefault();
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setIsDeleting(true);
    api.delete(`/expert/${selectedExpert?.id}`).then((res) => {
        if (res.data) {
          toast("Expert Deleted");
          dispatch(setAllExperts());
          router.replace(`/admin/expert`);
        }
    }).catch((error) => {
      console.error('Error deleting expert:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to delete expert';
      toast.error(errorMessage);
    }).finally(() => {
      setIsDeleting(false);
      setShowDeleteModal(false);
      });
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    toast.info('Expert deletion cancelled');
  };

  // Separate active and completed session slots
  const activeSessionSlots = expertData?.SessionSlots?.filter(slot => 
    new Date(slot.endTime) > new Date()
  ) || [];

  const completedSessionSlots = expertData?.SessionSlots?.filter(slot => 
    new Date(slot.endTime) <= new Date()
  ) || [];

  // Create session objects from slots for Card component
  const createSessionFromSlot = (slot) => {
    return {
      ...slot.session,
      SessionSlot: [slot], // Card component expects SessionSlot array
      speakers: slot.speakers, // Include speaker information
      topicName: slot.topicName // Include topic name from slot
    };
  };

  const activeSessions = activeSessionSlots.map(createSessionFromSlot);
  const completedSessions = completedSessionSlots.map(createSessionFromSlot);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-138px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600" style={{ fontSize: '14px' }}>Loading expert details...</p>
        </div>
      </div>
    );
  }

  if (!expertData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-138px)]">
        <div className="text-center">
          <h1 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>Expert not found</h1>
          <p className="text-gray-500 mt-2" style={{ fontSize: '14px' }}>Please try again or go back to the experts list</p>
          <button
            onClick={() => router.push('/admin/expert')}
            className="mt-4 inline-flex items-center px-4 py-2 font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200"
            style={{ fontSize: '14px' }}
          >
            Back to Experts
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{expertData?.name || "Expert Details"}</title>
      </Head>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center hover:text-orange-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => router.push('/admin/expert')}
            className="text-gray-500 hover:text-orange-700"
          >
            Experts
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium truncate max-w-[200px] md:max-w-xs" title={expertData?.name}>{expertData?.name}</span>
        </div>
      </div>

      <div className="min-h-[calc(100vh-138px)] bg-gray-50 mx-auto px-2 md:px-4 lg:px-0 max-w-[1920px]">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] max-w-[1920px] mx-auto">
          {/* Left Section: 30% width */}
          <section className="flex flex-col gap-6 p-0 w-full lg:w-[30%] lg:sticky lg:top-24 bg-transparent z-10 h-fit">
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-6">
              {/* Small 1:1 Image */}
              <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden bg-orange-50">
                <Image
                  src={expertData?.photoURL || "/notImg.svg"}
                  alt={expertData?.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-xl"
                />
              </div>
              
              {/* Basic Information */}
              <div className="flex flex-col gap-3 text-center">
                <h1 className="font-bold text-gray-900" style={{ fontSize: '16px' }}>{expertData?.name}</h1>
                <p className="text-gray-600" style={{ fontSize: '14px' }}>{expertData?.desc}</p>
                
                {/* Contact Info */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: '12px' }}>Email:</span>
                    <span className="text-gray-700" style={{ fontSize: '12px' }}>{expertData?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: '12px' }}>Phone:</span>
                    <span className="text-gray-700" style={{ fontSize: '12px' }}>{expertData?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: '12px' }}>Address:</span>
                    <span className="text-gray-700" style={{ fontSize: '12px' }}>{expertData?.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: '12px' }}>Pincode:</span>
                    <span className="text-gray-700" style={{ fontSize: '12px' }}>{expertData?.pincode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: '12px' }}>Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${expertData?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {expertData?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operations Section */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button 
                  onClick={handleEditExpert}
                  className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300"
                  style={{ fontSize: '14px' }}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                  <span className="relative z-10">Edit Expert</span>
                </button>
                <button
                  onClick={handleDeleteExpert}
                  className="relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300"
                  style={{ fontSize: '14px' }}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                  <span className="relative z-10">Delete Expert</span>
                </button>
              </div>
            </div>
          </section>

          {/* Right Section: 70% width */}
          <section className="flex flex-col gap-8 p-0 w-full lg:w-[70%] lg:overflow-y-auto lg:max-h-[calc(100vh-7rem)]">
            
            {/* Active Sessions Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="font-bold flex items-center gap-2 text-orange-700" style={{ fontSize: '16px' }}>
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Active Sessions ({activeSessions.length})
              </p>
              {activeSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>No Active Sessions</h3>
                  <p className="text-gray-500 max-w-sm" style={{ fontSize: '14px' }}>
                    This expert doesn't have any active sessions.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSessions.map((session, index) => (
                    <Card
                      session={session}
                      key={`active-session-${index}`}
                      baseURL={"admin"}
                      view
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Completed Sessions Section */}
            <div className="bg-gray-100 rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="font-bold flex items-center gap-2 text-gray-600" style={{ fontSize: '16px' }}>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Completed Sessions ({completedSessions.length})
              </p>
              {completedSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-2" style={{ fontSize: '16px' }}>No Completed Sessions</h3>
                  <p className="text-gray-500 max-w-sm" style={{ fontSize: '14px' }}>
                    This expert doesn't have any completed sessions yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedSessions.map((session, index) => (
                    <div key={`completed-session-${index}`} className="opacity-75">
                      <Card
                        session={session}
                        baseURL={"admin"}
                        view
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Communities Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="font-bold flex items-center gap-2 text-orange-700" style={{ fontSize: '16px' }}>
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
                Communities ({expertData?.unifiedUserId?.subscriptions?.length || 0})
              </p>
              {!expertData?.unifiedUserId?.subscriptions || expertData.unifiedUserId.subscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>No Communities Yet</h3>
                  <p className="text-gray-500 max-w-sm" style={{ fontSize: '14px' }}>
                    This expert hasn't joined any communities yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expertData.unifiedUserId.subscriptions.map((subscription, index) => (
                    <CategoryCard
                      category={subscription.community}
                      key={`community-${index}`}
                      baseURL={"admin"}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Resources Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="font-bold flex items-center gap-2 text-orange-700" style={{ fontSize: '16px' }}>
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
                Resources ({expertData?.unifiedUserId?.resource?.length || 0})
              </p>
              {!expertData?.unifiedUserId?.resource || expertData.unifiedUserId.resource.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>No Resources Yet</h3>
                  <p className="text-gray-500 max-w-sm" style={{ fontSize: '14px' }}>
                    This expert hasn't shared any resources yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expertData.unifiedUserId.resource.map((item, idx) => {
                    const getDomain = (url) => {
                      try {
                        const domain = new URL(url).hostname.replace('www.', '');
                        return domain;
                      } catch {
                        return url;
                      }
                    };

                    const getFavicon = (url) => {
                      try {
                        const domain = new URL(url).hostname;
                        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                      } catch {
                        return '/notImg.svg';
                      }
                    };

                    return (
                      <div key={`resource-${idx}`} className="group bg-white rounded-lg p-3 border border-gray-100 hover:border-orange-200 transition-all duration-200 shadow-sm hover:shadow-md">
                        <div className="flex flex-col h-full">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-shrink-0">
                              <img
                                src={getFavicon(item.link)}
                                alt={`${item.name} favicon`}
                                className="w-6 h-6 rounded group-hover:scale-110 transition-transform duration-200"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/notImg.svg';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium m-0 text-gray-900 truncate group-hover:text-orange-600 transition-colors duration-200">{item.name}</h4>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span className="truncate">{getDomain(item.link)}</span>
                                <LinkIcon className="w-3 h-3 flex-shrink-0" />
                              </div>
                            </div>
                          </div>
                          <div className="mt-auto pt-2 border-t border-gray-100">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-full px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded hover:bg-orange-100 transition-colors duration-200 group-hover:bg-orange-100"
                            >
                              Visit Resource
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Posts Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="font-bold flex items-center gap-2 text-orange-700" style={{ fontSize: '16px' }}>
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Posts ({expertData?.unifiedUserId?.post?.length || 0})
              </p>
              {!expertData?.unifiedUserId?.post || expertData.unifiedUserId.post.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>No Posts Yet</h3>
                  <p className="text-gray-500 max-w-sm" style={{ fontSize: '14px' }}>
                    This expert hasn't created any posts yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {expertData.unifiedUserId.post.map((post, index) => (
                    <div key={`post-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2" style={{ fontSize: '14px' }}>{post.title || 'Untitled Post'}</h4>
                      <p className="text-gray-600 mb-3" style={{ fontSize: '12px' }}>{post.content}</p>
                      <div className="space-y-1">
                        <p className="text-gray-600" style={{ fontSize: '12px' }}>
                          <strong>Created:</strong> {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600" style={{ fontSize: '12px' }}>
                          <strong>Status:</strong> {post.isApproved ? 'Approved' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Expert</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{expertData?.name}</strong>? This will permanently remove the expert and all associated data.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This action is irreversible and will delete all expert data including sessions, resources, and posts.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Expert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExpertPage;
