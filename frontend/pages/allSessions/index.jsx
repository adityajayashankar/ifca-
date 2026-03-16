import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAllSessions, setSessions, selectAllCompletedSessions } from '@/store/features/sessionSlice';
import { selectUser, selectUserSessions, setUserSessions } from '@/store/features/userSlice';
import Head from 'next/head';
import { useRouter } from 'next/router';
import moment from 'moment';
import Footer from '@/components/footer';
import Topbar from '@/components/topbar/Topbar';
import ClassCard from '@/components/classCard';
import { Skeleton } from '@mui/material';
import api from '@/utils/apiSetup';
import { MagnifyingGlassIcon, CalendarIcon } from '@heroicons/react/24/outline';

const AllSessions = () => {
  const sessions = useSelector(selectAllSessions);
  const completedSessions = useSelector(selectAllCompletedSessions);
  const user = useSelector(selectUser);
  const userSessions = useSelector(selectUserSessions);
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [searchString, setSearchString] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [communityImages, setCommunityImages] = useState({});
  const [loadingCommunities, setLoadingCommunities] = useState({});
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [completedSessionsData, setCompletedSessionsData] = useState([]);
  const [filteredCompletedSessions, setFilteredCompletedSessions] = useState([]);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'title'
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'completed'

  // Initialize search from URL query
  useEffect(() => {
    const query = router.query.q || '';
    setSearchString(query.toLowerCase());
  }, [router.query]);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        await dispatch(setSessions()).unwrap();
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!sessions?.length) {
      fetchSessions();
    } else {
      setLoading(false);
    }
  }, [dispatch, sessions?.length]);

  // Fetch user sessions to check registration status
  useEffect(() => {
    const fetchUserSessions = async () => {
      if (user?.id) {
        try {
          await dispatch(setUserSessions(user.id)).unwrap();
        } catch (error) {
          console.error('Error fetching user sessions:', error);
        }
      }
    };

    fetchUserSessions();
  }, [dispatch, user?.id]);

  // Fetch completed sessions
  useEffect(() => {
    const fetchCompletedSessions = async () => {
      if (activeTab === 'completed') {
        try {
          setLoadingCompleted(true);
          // Fetch completed sessions from API
          const response = await api.get('/session/slots', {
            params: {
              view: 'completed',
              startDate: moment().subtract(1, 'year').format('YYYY-MM-DD'),
              endDate: moment().format('YYYY-MM-DD'),
              userId: user?.id
            }
          });
          
          // Extract unique sessions from slots
          const slots = response.data?.data?.slots || [];
          const uniqueSessions = {};
          slots.forEach(slot => {
            if (slot.session && !uniqueSessions[slot.session.id]) {
              uniqueSessions[slot.session.id] = {
                ...slot.session,
                SessionSlot: [slot],
                isRegistered: slot.isRegistered || false
              };
            } else if (slot.session && uniqueSessions[slot.session.id]) {
              // Add slot to existing session
              uniqueSessions[slot.session.id].SessionSlot.push(slot);
            }
          });
          
          const sessionsArray = Object.values(uniqueSessions);
          setCompletedSessionsData(sessionsArray);
          // Also set filtered initially
          setFilteredCompletedSessions(sessionsArray);
        } catch (error) {
          console.error('Error fetching completed sessions:', error);
        } finally {
          setLoadingCompleted(false);
        }
      }
    };

    fetchCompletedSessions();
  }, [activeTab, user?.id]);

  // Fetch community images for fallback
  const fetchCommunityImage = useCallback(async (communityId) => {
    if (!communityId || communityImages[communityId] || loadingCommunities[communityId]) {
      return;
    }

    setLoadingCommunities(prev => ({ ...prev, [communityId]: true }));
    
    try {
      const response = await api.get(`/community/${communityId}`);
      const bannerImg = response.data?.community?.bannerImg || response.data?.bannerImg;
      
      if (bannerImg) {
        setCommunityImages(prev => ({
          ...prev,
          [communityId]: bannerImg
        }));
      }
    } catch (error) {
      console.error('Error fetching community image:', error);
    } finally {
      setLoadingCommunities(prev => {
        const newState = { ...prev };
        delete newState[communityId];
        return newState;
      });
    }
  }, [communityImages, loadingCommunities]);

  // Pre-fetch community images
  useEffect(() => {
    if (sessions?.length > 0) {
      sessions.forEach(session => {
        if (session?.communityId && !communityImages[session.communityId] && !loadingCommunities[session.communityId]) {
          fetchCommunityImage(session.communityId);
        }
      });
    }
  }, [sessions, communityImages, loadingCommunities, fetchCommunityImage]);


  // Check if user is registered for a session
  const isUserRegistered = useCallback((sessionId) => {
    if (!userSessions?.sessions) return false;
    return userSessions.sessions.some(session => session.id === sessionId);
  }, [userSessions]);

  // Filter and sort completed sessions
  useEffect(() => {
    if (activeTab === 'completed') {
      // Filter completed sessions
      let filtered = completedSessionsData.filter((session) => {
        const titleMatch = session?.title?.toLowerCase().includes(searchString);
        const descMatch = session?.desc?.toLowerCase().includes(searchString);
        const topicMatch = session?.SessionSlot?.[0]?.topicName?.toLowerCase().includes(searchString);
        return titleMatch || descMatch || topicMatch;
      });

      // Sort completed sessions
      filtered = filtered.sort((a, b) => {
        if (sortBy === 'date') {
          const dateA = moment(a?.SessionSlot?.[0]?.endTime);
          const dateB = moment(b?.SessionSlot?.[0]?.endTime);
          return dateB.diff(dateA); // Most recent first
        } else if (sortBy === 'title') {
          return (a?.title || '').localeCompare(b?.title || '');
        }
        return 0;
      });

      setFilteredCompletedSessions(filtered);
      return;
    }
  }, [activeTab, completedSessionsData, searchString, sortBy]);

  // Filter and sort upcoming sessions
  useEffect(() => {
    if (activeTab !== 'upcoming') return;

    // Filter upcoming sessions
    if (!sessions?.length) {
      setFilteredSessions([]);
      return;
    }

    let filtered = sessions.flat().filter((session) => {
      const titleMatch = session?.title?.toLowerCase().includes(searchString);
      const descMatch = session?.desc?.toLowerCase().includes(searchString);
      const topicMatch = session?.SessionSlot?.[0]?.topicName?.toLowerCase().includes(searchString);
      return titleMatch || descMatch || topicMatch;
    });

    // Sort sessions
    filtered = filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = moment(a?.SessionSlot?.[0]?.startTime);
        const dateB = moment(b?.SessionSlot?.[0]?.startTime);
        return dateA.diff(dateB);
      } else if (sortBy === 'title') {
        return (a?.title || '').localeCompare(b?.title || '');
      }
      return 0;
    });

    setFilteredSessions(filtered);
  }, [sessions, searchString, sortBy, activeTab]);

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchString(value);
    // Update URL without page reload
    router.push({
      pathname: router.pathname,
      query: { ...router.query, q: value }
    }, undefined, { shallow: true });
  };

  // Loading skeleton
  const SessionCardSkeleton = () => (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
      <Skeleton variant="rectangular" width="100%" height={128} />
      <div className="p-3">
        <Skeleton variant="text" width="60%" height={16} className="mb-2" />
        <Skeleton variant="text" width="80%" height={20} className="mb-1" />
        <Skeleton variant="text" width="50%" height={16} />
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>All Sessions | IFCA</title>
        <meta name="description" content="Browse all available sessions and find the perfect learning opportunity for you." />
      </Head>
      <header>
        <Topbar searchBarVal={searchString} />
      </header>
      <main className="min-h-screen bg-gray-50 mt-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Sessions</h1>
            <p className="text-gray-600">Discover and join sessions that interest you</p>
            
            {/* Tab Navigation */}
            <div className="flex gap-2 mt-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'upcoming'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Upcoming Sessions
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'completed'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed Sessions
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sessions by title, description, or topic..."
                  value={searchString}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E795E] focus:border-transparent"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E795E] focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            {!loading && !loadingCompleted && (
              <div className="mt-4 text-sm text-gray-600">
                {activeTab === 'completed' 
                  ? `${filteredCompletedSessions.length} ${filteredCompletedSessions.length === 1 ? 'session' : 'sessions'} found`
                  : `${filteredSessions.length} ${filteredSessions.length === 1 ? 'session' : 'sessions'} found`
                }
              </div>
            )}
          </div>

          {/* Sessions Grid */}
          {loading || (activeTab === 'completed' && loadingCompleted) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SessionCardSkeleton key={i} />
              ))}
            </div>
          ) : activeTab === 'completed' ? (
            filteredCompletedSessions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredCompletedSessions.map((session, index) => (
                  <ClassCard 
                    key={session.id || index} 
                    details={session}
                    communityImage={session.communityId && communityImages[session.communityId] ? communityImages[session.communityId] : null}
                    isRegistered={session.isRegistered || isUserRegistered(session.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Completed Sessions Found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchString
                      ? `No completed sessions match "${searchString}". Try a different search term.`
                      : 'No completed sessions are available.'}
                  </p>
                  {searchString && (
                    <button
                      onClick={() => {
                        setSearchString('');
                        router.push({ pathname: router.pathname }, undefined, { shallow: true });
                      }}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>
            )
          ) : filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredSessions.map((session, index) => (
                <ClassCard 
                  key={session.id || index} 
                  details={session}
                  communityImage={session.communityId && communityImages[session.communityId] ? communityImages[session.communityId] : null}
                  isRegistered={isUserRegistered(session.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchString
                    ? `No sessions match "${searchString}". Try a different search term.`
                    : 'No sessions are available at the moment. Check back later!'}
                </p>
                {searchString && (
                  <button
                    onClick={() => {
                      setSearchString('');
                      router.push({ pathname: router.pathname }, undefined, { shallow: true });
                    }}
                    className="text-[#4E795E] hover:text-[#3a5e47] font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AllSessions;
