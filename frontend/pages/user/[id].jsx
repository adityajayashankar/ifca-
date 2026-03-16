import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Box, Typography, Grid, Card, CardContent, Chip, IconButton, Button, Divider, Tabs, Tab } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import PublicIcon from '@mui/icons-material/Public';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import api from '@/utils/apiSetup';
import Topbar from "@/components/topbar/Topbar"
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Footer from '@/components/footer';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ConnectionsModal from '@/components/ConnectionsModal';
import { toast } from 'react-toastify';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import BuildIcon from '@mui/icons-material/Build';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// Add EmptyState component
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
    <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 15h8M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <div className="mt-2">{message || "This user's detailed information is private."}</div>
  </div>
);

const UserProfile = () => {
  const currentUser = useSelector(selectUser);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const [profileProgress, setProfileProgress] = useState(null)
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('following'); // 'following' or 'followers'
  const [connectionStats, setConnectionStats] = useState({
    following: 0,
    followers: 0,
    pending: 0
  });
  const [selectedTab, setSelectedTab] = useState("personal");
  const [loadingStates, setLoadingStates] = useState({});
  const tabBarRef = useRef(null);
  const tabRefs = useRef([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tabs = [
    { id: "personal", label: "Personal Info", icon: <PersonIcon fontSize="small" /> },
    { id: "professional", label: "Professional", icon: <BusinessIcon fontSize="small" /> },
    { id: "culinary", label: "Culinary", icon: <RestaurantMenuIcon fontSize="small" /> },
    { id: "contributions", label: "Contributions", icon: <EmojiEventsIcon fontSize="small" /> },
    { id: "content", label: "Content", icon: <MenuBookIcon fontSize="small" /> },
    { id: "networking", label: "Networking", icon: <PeopleIcon fontSize="small" /> },
    { id: "digital", label: "Digital Presence", icon: <LanguageIcon fontSize="small" /> },
    { id: "availability", label: "Availability", icon: <EventAvailableIcon fontSize="small" /> },
    { id: "skills", label: "Skills", icon: <BuildIcon fontSize="small" /> },
  ];

  // Mappings for icons based on edit page values
  const iconMappings = {
    ifcaInvolvement: {
      "Committee Member": "👥",
      "Event Organizer": "📅",
      "Speaker": "🎤",
      "Mentor": "📚",
      "Workshop Facilitator": "🎯",
      "Judge": "⚖️"
    },
    industryContributions: {
      "Publications": "📚",
      "Conference Speaker": "🎤",
      "Workshop Conductor": "🎯",
      "Research": "🔬",
      "Industry Consultant": "💼",
      "Educational Programs": "🎓"
    },
    interests: {
      "Sustainable Cooking": "🌱",
      "Food Innovation": "🔬",
      "Traditional Cuisine": "🏺",
      "Food Safety": "🛡️",
      "Restaurant Management": "🏢",
      "Food Photography": "📸",
      "Menu Development": "📋",
      "Food Technology": "💻"
    },
    technologySkills: {
      "Restaurant POS Systems": "💻",
      "Inventory Management Software": "📦",
      "Menu Planning Tools": "📋",
      "Social Media Management": "📱",
      "Food Photography": "📸",
      "Digital Marketing": "🎯",
      "Recipe Management Software": "📝",
      "Food Cost Calculator": "🧮"
    }
  };

  // Helper function to get icon
  const getIcon = (category, value) => {
    return iconMappings[category]?.[value] || <CheckCircleOutlineIcon fontSize="small" className="text-gray-500" />; // Default icon
  };

  useEffect(() => {
    if (currentUser?.unifiedUser?.id === Number(id)) {
      api
        .get(`user/${currentUser?.id}/profile-progress`)
        .then((response) => {
          setProfileProgress(response.data)
        })
        .catch((error) => {
          console.error("Error fetching profile progress:", error)
        })
    }
  }, [id, currentUser])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!id || !currentUser?.id) return;

        const [profileRes] = await Promise.all([
          api.get(`connections/profile/${id}?currentUserId=${currentUser?.unifiedUser?.id}`),
        ]);

        setProfile(profileRes.data.user || profileRes.data.partner || profileRes.data.expert || profileRes.data.admin);
        setConnectionStatus(profileRes.data.connectionStatus);
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id && currentUser?.id) {
      fetchUserProfile();
    }
  }, [id, currentUser]);

  useEffect(() => {
    const fetchConnectionStats = async () => {
      if (currentUser?.unifiedUser?.id === parseInt(id)) {
        try {
          const [connectionsRes, pendingRes] = await Promise.all([
            api.get(`connections/${id}/connections`),
            api.get(`connections/${id}/pending-requests`)
          ]);

          setConnectionStats({
            following: connectionsRes.data.following?.length || 0,
            followers: connectionsRes.data.followers?.length || 0,
            pending: pendingRes.data?.length || 0
          });
        } catch (error) {
          console.error('Error fetching connection stats:', error);
        }
      }
    };

    fetchConnectionStats();
  }, [id, currentUser]);

  const handleConnect = async () => {
    setLoadingStates(prev => ({ ...prev, connect: true }));
    try {
      await api.post('connections/send-request', {
        senderId: currentUser?.unifiedUser?.id,
        receiverId: parseInt(id),
        message: `Hi, I'd like to connect with you on IFCA.`
      });
      // Refresh connection status
      const profileRes = await api.get(`connections/profile/${id}?currentUserId=${currentUser?.unifiedUser?.id}`);
      setConnectionStatus(profileRes.data.connectionStatus);
      toast.success('Connection request sent');
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast.error('Failed to send connection request');
    } finally {
      setLoadingStates(prev => ({ ...prev, connect: false }));
    }
  };

  const handleAcceptConnection = async (connectionId) => {
    setLoadingStates(prev => ({ ...prev, accept: true }));
    try {
      await api.put(`connections/accept/${connectionId}`);
      // Refresh connection status
      const profileRes = await api.get(`connections/profile/${id}?currentUserId=${currentUser?.unifiedUser?.id}`);
      setConnectionStatus(profileRes.data.connectionStatus);
      toast.success('Connection accepted');
    } catch (error) {
      console.error("Error accepting connection:", error);
      toast.error('Failed to accept connection');
    } finally {
      setLoadingStates(prev => ({ ...prev, accept: false }));
    }
  };

  const handleRejectConnection = async (connectionId) => {
    setLoadingStates(prev => ({ ...prev, reject: true }));
    try {
      await api.delete(`connections/reject/${connectionId}`);
      // Refresh connection status
      const profileRes = await api.get(`connections/profile/${id}?currentUserId=${currentUser?.unifiedUser?.id}`);
      setConnectionStatus(profileRes.data.connectionStatus);
      toast.success('Connection request rejected');
    } catch (error) {
      console.error("Error rejecting connection:", error);
      toast.error('Failed to reject connection');
    } finally {
      setLoadingStates(prev => ({ ...prev, reject: false }));
    }
  };

  console.log("connectionStatus-------", connectionStatus)

  const getConnectionButton = () => {
    const isConnecting = loadingStates.connect;
    const isAccepting = loadingStates.accept;
    const isRejecting = loadingStates.reject;

    if (connectionStatus?.status === 'connect') {
      return (
        <Button
          variant="contained"
          className="bg-primary-500 hover:bg-blue-600"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            'Connect'
          )}
        </Button>
      )
    }

    if (connectionStatus?.status === 'request_sent') {
      return (
        <Button
          variant="contained"
          sx={{ backgroundColor: '#0a66c2', color: 'white' }}
          disabled
        >
          Pending Request
        </Button>
      )
    }

    if (connectionStatus?.status === 'request_received') {
      return (
        <div className='flex gap-2'>
          <Button
            variant="contained"
            className="bg-primary-500 hover:bg-blue-600"
            onClick={() => handleAcceptConnection(connectionStatus?.connectionId)}
            disabled={isAccepting || isRejecting}
          >
            {isAccepting ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Accepting...
              </>
            ) : (
              'Accept Request'
            )}
          </Button>
          <Button
            variant="contained"
            className="bg-red-500 hover:bg-red-600"
            onClick={() => handleRejectConnection(connectionStatus?.connectionId)}
            disabled={isAccepting || isRejecting}
          >
            {isRejecting ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Rejecting...
              </>
            ) : (
              'Reject'
            )}
          </Button>
        </div>
      )
    }

    if (connectionStatus?.status === 'connect_back') {
      return (
        <Button
          variant="contained"
          className="bg-primary-500 hover:bg-blue-600"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            'Connect Back'
          )}
        </Button>
      )
    }

    if (connectionStatus?.status === 'connected') {
      return (
        <Button
          variant="contained"
          sx={{ backgroundColor: '#0a66c2', color: 'white' }}
          disabled
        >
          Connected
        </Button>
      )
    }
    return null;
  };

  const getProfileButton = () => {
    if (currentUser?.unifiedUser?.id === parseInt(id)) {
      return (
        <Button
          variant="contained"
          className="bg-primary-500 hover:bg-blue-600"
          onClick={() => router.push(`/user/edit/${currentUser?.id}`)}
        >
          Edit Profile
        </Button>
      );
    }

    return getConnectionButton();
  };

  // Helper: can the current user view detailed info?
  const canViewDetails = () => {
    if (!profile || !currentUser) return false;
    // Show details to everyone (except sensitive info like email/phone)
    return true;
  };

  // Helper: can view sensitive info (email, phone)
  const canViewSensitiveInfo = () => {
    if (!profile || !currentUser) return false;
    return currentUser.unifiedUser.id === parseInt(id); // only owner can see email/phone
  };


  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  };

  const renderConnectionStats = () => {
    if (currentUser?.unifiedUser?.id === parseInt(id)) {
      return (
        <div className="flex items-center gap-6 m-0 p-0">
          <div
            className="flex items-center gap-4 text-[#0a66c2] "
          >
            <span
              onClick={() => {
                setActiveTab('following');
                setIsConnectionsModalOpen(true);
              }}
              className="cursor-pointer hover:underline"
            >{connectionStats.following} Following</span>
            <span>•</span>
            <span
              onClick={() => {
                setActiveTab('followers');
                setIsConnectionsModalOpen(true);
              }}
              className="cursor-pointer hover:underline"
            >{connectionStats.followers} Followers</span>
          </div>
          {connectionStats.pending > 0 && (
            <div
              className="flex items-center text-blue-600 font-semibold cursor-pointer hover:underline"
              onClick={() => setIsPendingModalOpen(true)}
            >
              <span>{connectionStats.pending} Pending Requests</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Helper to check if users are connected
  const isConnected = () => {
    return (
      connectionStatus?.incoming?.status === 'accepted' ||
      connectionStatus?.outgoing?.status === 'accepted'
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "personal":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            {canViewDetails() ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-gray-900">{profile?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Name</label>
                  <p className="mt-1 text-gray-900">{profile?.preferredName}</p>
                </div>
                {canViewSensitiveInfo() && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-gray-900">{profile?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-gray-900">{profile?.phone}</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-gray-900">{profile?.location}, {profile?.state}, {profile?.nationality} - {profile?.pincode}</p>
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        );

      case "professional":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Professional Background</h2>
            {profile?.careerHistory?.length > 0 || profile?.specializations?.length > 0 || profile?.certifications?.length > 0 ? (
              <div className="space-y-4">
                {profile?.careerHistory?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Career History</h3>
                    <div className="space-y-6">
                      {profile.careerHistory.map((history, index) => (
                        <div key={index} className="flex gap-4 items-start border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center">
                            <WorkIcon className="text-blue-600" />
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-md font-semibold text-gray-800">{history.jobTitle}</h4>
                            <p className="text-sm text-gray-600">{history.companyName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {history.startDate} - {history.isCurrentPosition ? "Present" : history.endDate}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile?.specializations?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.specializations.map((spec, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile?.certifications?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Certifications</h3>
                    <div className="space-y-4">
                      {profile.certifications.map((cert, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Name</label>
                              <p className="mt-1 text-gray-900">{cert.name}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Organization</label>
                              <p className="mt-1 text-gray-900">{cert.organization}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                              <p className="mt-1 text-gray-900">{cert.issueDate}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Expiration</label>
                              <p className="mt-1 text-gray-900">{cert.noExpiration ? "No Expiration" : cert.expirationDate}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="No professional background added yet." />
            )}
          </div>
        );

      case "culinary":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Culinary Philosophy</h2>
            {profile?.culinaryPhilosophy || profile?.vision || profile?.sustainability ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Philosophy</label>
                  <p className="mt-1 text-gray-900">{profile?.culinaryPhilosophy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vision</label>
                  <p className="mt-1 text-gray-900">{profile?.vision}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sustainability</label>
                  <p className="mt-1 text-gray-900">{profile?.sustainability}</p>
                </div>
              </div>
            ) : (
              <EmptyState message="No culinary philosophy added yet." />
            )}
          </div>
        );

      case "contributions":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold mb-6">Professional Contributions</h2>

            {profile?.ifcaInvolvement?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">IFCA Involvement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.ifcaInvolvement.map((role, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-xl">{getIcon('ifcaInvolvement', role)}</span>
                      <span className="text-sm text-gray-700">{role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile?.industryContributions?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Industry Contributions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.industryContributions.map((contribution, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-xl">{getIcon('industryContributions', contribution)}</span>
                      <span className="text-sm text-gray-700">{contribution}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile?.interests?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Areas of Interest (Related to Contributions)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.interests.map((interest, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-xl">{getIcon('interests', interest)}</span>
                      <span className="text-sm text-gray-700">{interest}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "content":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold mb-6">Content & Publications</h2>

            {profile?.publications?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Publications</h3>
                <div className="space-y-4">
                  {profile.publications.map((pub, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <p className="mt-1 text-gray-900">{pub.title}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Publisher</label>
                          <p className="mt-1 text-gray-900">{pub.publisher}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date</label>
                          <p className="mt-1 text-gray-900">{pub.date}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">URL</label>
                          <a href={pub.url} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 hover:underline">
                            {pub.url}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile?.recipes?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recipes</h3>
                <div className="space-y-2">
                  {profile.recipes.map((recipe, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-700">{recipe}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile?.tutorials?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tutorials</h3>
                <div className="space-y-4">
                  {profile.tutorials.map((tutorial, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <p className="mt-1 text-gray-900">{tutorial.title}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Platform</label>
                          <p className="mt-1 text-gray-900">{tutorial.platform}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">URL</label>
                          <a href={tutorial.url} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 hover:underline">
                            {tutorial.url}
                          </a>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <p className="mt-1 text-gray-900">{tutorial.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "networking":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold mb-6">Professional Networking</h2>

            {profile?.professionalNetworks?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Networks</h3>
                <div className="space-y-4">
                  {profile.professionalNetworks.map((network, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Organization</label>
                          <p className="mt-1 text-gray-900">{network.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Role</label>
                          <p className="mt-1 text-gray-900">{network.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile?.collaborations?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Collaborations</h3>
                <div className="space-y-4">
                  {profile.collaborations.map((collab, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Partner</label>
                          <p className="mt-1 text-gray-900">{collab.partner}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Project</label>
                          <p className="mt-1 text-gray-900">{collab.project}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <p className="mt-1 text-gray-900">{collab.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile?.eventsParticipation?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Events Participation</h3>
                <div className="space-y-4">
                  {profile.eventsParticipation.map((event, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Event Name</label>
                          <p className="mt-1 text-gray-900">{event.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Role</label>
                          <p className="mt-1 text-gray-900">{event.role}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date</label>
                          <p className="mt-1 text-gray-900">{event.date}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Location</label>
                          <p className="mt-1 text-gray-900">{event.location}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "digital":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold mb-6">Digital Presence</h2>

            {profile?.website && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Website</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website URL</label>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 hover:underline">
                    {profile.website}
                  </a>
                </div>
              </div>
            )}

            {profile?.socialMediaLinks?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Profiles</h3>
                <div className="space-y-4">
                  {profile.socialMediaLinks.map((link, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Platform</label>
                          <p className="mt-1 text-gray-900">{link.platform}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Profile URL</label>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 hover:underline">
                            {link.url}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile?.onlinePortfolios?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Online Portfolios</h3>
                <div className="space-y-4">
                  {profile.onlinePortfolios.map((portfolio, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <p className="mt-1 text-gray-900">{portfolio.title}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">URL</label>
                          <a href={portfolio.url} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 hover:underline">
                            {portfolio.url}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "availability":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold mb-6">Availability & Interests</h2>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Participation Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Availability for Events</label>
                  <p className="mt-1 text-gray-900">{profile?.availability}</p>
                </div>
              </div>
            </div>

            {profile?.interests?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Areas of Interest</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.interests.map((interest, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-xl">{getIcon('interests', interest)}</span>
                      <span className="text-sm text-gray-700">{interest}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Mentorship Availability</h3>
                  <p className="text-sm text-gray-500 mt-1">Are you available to mentor other chefs?</p>
                </div>
                <div className="text-sm text-gray-900">
                  {profile?.mentorshipAvailability ? "Available" : "Not Available"}
                </div>
              </div>
            </div>
          </div>
        );

      case "skills":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-semibold mb-6">Skills & Proficiency</h2>

            {profile?.languageProficiency?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Language Proficiency</h3>
                <div className="space-y-4">
                  {profile.languageProficiency.map((lang, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Language</label>
                          <p className="mt-1 text-gray-900">{lang.language}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Proficiency Level</label>
                          <p className="mt-1 text-gray-900">{lang.level}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile?.technologySkills?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Technology Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.technologySkills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-xl">{getIcon('technologySkills', skill)}</span>
                      <span className="text-sm text-gray-700">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Check scroll position for arrow enable/disable
  const checkScroll = () => {
    if (!tabBarRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabBarRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };
  useEffect(() => {
    checkScroll();
    if (!tabBarRef.current) return;
    tabBarRef.current.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      tabBarRef.current?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  // Scroll bar left/right
  const scrollTabs = (dir) => {
    if (!tabBarRef.current) return;
    const amount = 180;
    tabBarRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  // Scroll to center selected tab
  useEffect(() => {
    if (!tabBarRef.current || !tabRefs.current[selectedTab]) return;
    const tabNode = tabRefs.current[selectedTab];
    const barNode = tabBarRef.current;
    if (tabNode && barNode) {
      const tabRect = tabNode.getBoundingClientRect();
      const barRect = barNode.getBoundingClientRect();
      const scrollLeft = barNode.scrollLeft;
      const offset = tabRect.left - barRect.left - (barRect.width / 2) + (tabRect.width / 2);
      barNode.scrollTo({ left: scrollLeft + offset, behavior: 'smooth' });
    }
  }, [selectedTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }


  return (
    <>
      <Head>
        <title>{profile?.name || 'Profile'} | IFCA</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="font-['Inter'] bg-[#f3f2f1]">
        <header>
          <Topbar />
        </header>

        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="container mx-auto px-4 py-8 min-h-[calc(100vh-120px)] mt-[64px] max-w-[1200px]"
        >
          <div className="grid grid-cols-12 gap-6">
            {/* Left Card - 25% */}
            <div className="col-span-12 lg:col-span-3">
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-lg h-full shadow-sm overflow-hidden mb-6"
              >
                <div
                  className="relative h-[100px] md:h-[120px] w-full bg-[#B22222]"
                  style={{
                    backgroundImage: `url(${profile?.bannerImage || "/user_banner.png"})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute -bottom-12 md:-bottom-16 left-8 z-10">
                    <div className="relative">
                      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                        <Image
                          src={profile?.photoURL || "/t6.svg"}
                          alt="Profile picture"
                          width={150}
                          height={150}
                          className="object-cover"
                        />
                      </div>
                      {currentUser?.unifiedUser?.id === parseInt(id) && <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                        <div className="relative w-8 h-8">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-gray-200"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray="175.93"
                              strokeDashoffset={
                                175.93 - (175.93 * (profileProgress?.profileProgress || 0)) / 100
                              }
                              className="text-[#0a66c2] transition-all duration-500"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">
                            {profileProgress?.profileProgress ?? 0}%
                          </span>
                        </div>
                      </div>}
                    </div>
                  </div>
                </div>

                <div className="pt-20 px-8 pb-6">
                  <div className="flex flex-col gap-4">
                    <div className='flex flex-col gap-2'>
                      <h1 className="text-2xl font-bold text-gray-900 capitalize">
                        {profile?.name} {profile?.preferredName && `(${profile?.preferredName})`}
                      </h1>
                      {renderConnectionStats()}
                      {
                        profile?.workHistory?.length > 0 && (
                          <div className="flex items-center md:gap-4 mt-2 text-gray-600 flex-wrap">
                            <span className="flex items-center gap-1">
                              {profile?.workHistory[0].jobTitle} at {profile?.workHistory[0].companyName}
                            </span>
                          </div>
                        )
                      }
                      <div className="flex items-center md:gap-4 mt-2 text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <PublicIcon fontSize="small" />
                          {profile?.location}, {profile?.state}, {profile?.nationality} - {profile?.pincode}
                        </span>
                        <span className="flex items-center gap-1">
                          <WorkIcon fontSize="small" />
                          {profile?.careerHistory?.length || 0} experiences
                        </span>
                        <span className="flex items-center gap-1">
                          <SchoolIcon fontSize="small" />
                          {profile?.certifications?.length || 0} certifications
                        </span>
                      </div>
                    </div>
                    {(connectionStatus?.outgoing?.status === 'accepted' || currentUser?.unifiedUser?.id === parseInt(id)) && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800">Contact Info</h2>
                        {canViewDetails() ? (
                          <div className="space-y-2">
                            {canViewSensitiveInfo() && profile?.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <EmailIcon fontSize="small" className="text-[#0a66c2]" />
                                <span>{profile.email}</span>
                              </div>
                            )}
                            {canViewSensitiveInfo() && profile?.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <PhoneIcon fontSize="small" className="text-[#0a66c2]" />
                                <span>{profile.phone}</span>
                              </div>
                            )}
                            {profile?.website && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <LanguageIcon fontSize="small" className="text-[#0a66c2]" />
                                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-[#0a66c2]">
                                  {profile.website}
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <EmptyState />
                        )}
                      </div>
                    )}

                    {(profile?.socialMediaLinks?.length > 0 && (isConnected() || currentUser?.unifiedUser?.id === parseInt(id))) && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800">Digital Presence</h2>
                        {canViewDetails() ? (
                          <div className="flex flex-wrap gap-4">
                            {profile?.socialMediaLinks?.map((link, index) => (
                              <a key={index} href={link?.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#0a66c2]" title={link?.platform}>
                                {link?.platform === 'Instagram' && <InstagramIcon />}
                                {link?.platform === 'Facebook' && <FacebookIcon />}
                                {link?.platform === 'Twitter' && <TwitterIcon />}
                                {link?.platform === 'LinkedIn' && <LinkedInIcon />}
                                {link?.platform === 'YouTube' && <YouTubeIcon />}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <EmptyState />
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 border-t border-gray-200 pt-4">
                      {getProfileButton()}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Content - 75% */}
            <div className="col-span-12 lg:col-span-9">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Tabs */}
                {/* Tabs Container */}
                <div className="relative w-full">
                  {/* Left Arrow */}
                  <button
                    type="button"
                    className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 transition disabled:opacity-40`}
                    onClick={() => scrollTabs('left')}
                    aria-label="Scroll left"
                    disabled={!canScrollLeft}
                    style={{ pointerEvents: canScrollLeft ? 'auto' : 'none' }}
                  >
                    <ArrowBackIosNewIcon fontSize="small" />
                  </button>
                  {/* Tab Bar */}
                  <div
                    ref={tabBarRef}
                    className="flex border-b border-gray-200 w-full overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 no-scrollbar bg-white shadow rounded-xl"
                    style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', minHeight: 56, padding: '0 48px' }}
                  >
                    {tabs.map((tab, idx) => (
                      <button
                        key={tab.id}
                        ref={el => tabRefs.current[tab.id] = el}
                        onClick={() => setSelectedTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2 mx-2 my-2 rounded-md min-w-fit font-semibold transition-all duration-200
          ${selectedTab === tab.id
                            ? "bg-orange-50 border border-[#ff6600] text-[#ff6600] font-bold shadow"
                            : "bg-gray-50 border border-transparent text-gray-700 hover:bg-orange-50 hover:text-[#ff6600]"
                          }`}
                        style={{ fontSize: 14 }}
                      >
                        {tab.icon}
                        <span className="block">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                  {/* Right Arrow */}
                  <button
                    type="button"
                    className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 transition disabled:opacity-40`}
                    onClick={() => scrollTabs('right')}
                    aria-label="Scroll right"
                    disabled={!canScrollRight}
                    style={{ pointerEvents: canScrollRight ? 'auto' : 'none' }}
                  >
                    <ArrowForwardIosIcon fontSize="small" />
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  <motion.div
                    key={selectedTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderTabContent()}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <footer>
          <Footer />
        </footer>
      </div>

      {/* Modals */}
      <ConnectionsModal
        open={isConnectionsModalOpen}
        onClose={() => setIsConnectionsModalOpen(false)}
        userId={id}
        activeTab={activeTab}
      />
      <ConnectionsModal
        open={isPendingModalOpen}
        onClose={() => setIsPendingModalOpen(false)}
        userId={id}
        activeTab="pending"
      />
    </>
  );
};

export default UserProfile;
