import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import CommunityCardList from "@/components/communityList";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import companyData from "@/utils/data";
import { useSelector } from "react-redux";
import { selectUser, selectUserCommunities, selectSubscribedCommunities } from "@/store/features/userSlice";
import CommunityCard from "@/components/communityCard";
import { motion } from "framer-motion";
import api from "@/utils/apiSetup";
import Image from "next/image";
import { getUserPhotoURL } from "@/utils/userUtils";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import PeopleIcon from '@mui/icons-material/People';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import { toast } from 'react-toastify';
import moment from 'moment';

// Connection Request Popup Component
const ConnectionRequestsModal = ({ open, handleClose, pendingRequests, onAccept, onReject, loadingStates, isLoadingRequests, router }) => {
  console.log('🔍 ConnectionRequestsModal props:', { open, pendingRequests, pendingRequestsLength: pendingRequests?.length, isLoadingRequests });
  
  if (!open) return null;
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[99998]" onClick={handleClose} />
      {/* Modal */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto p-2 sm:p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-lg mx-auto bg-white rounded-xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center flex-1 min-w-0">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <PersonAddIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg text-gray-900 truncate">Connection Requests</h3>
                <p className="text-sm text-gray-500">
                  {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 flex-shrink-0 ml-2"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4" style={{ maxHeight: '60vh' }}>
            {isLoadingRequests ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">Loading connection requests...</p>
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-2">
                {pendingRequests.map((request, index) => {
                  const isAccepting = loadingStates[`accept_${request.id}`];
                  const isRejecting = loadingStates[`reject_${request.id}`];
                  
                  return (
                    <motion.div 
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          {/* User info */}
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {/* Profile Picture */}
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                                <img 
                                  src={request.sender?.photoURL || "/t6.svg"} 
                                  alt={request.sender?.name || 'User'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "/t6.svg";
                                  }}
                                />
                              </div>
                            </div>
                            
                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <h4 
                                className="font-semibold text-gray-900 text-sm cursor-pointer hover:text-orange-600 transition-colors truncate"
                                onClick={() => router.push(`/user/${request.sender?.id}`)}
                              >
                                {request.sender?.name || 'Unknown User'}
                              </h4>
                              <div className="mt-1">
                                <span className="text-xs text-gray-500">
                                  Request sent on {moment(request.createdAt).format('DD MMM YYYY')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button 
                              onClick={() => onReject(request.id)}
                              disabled={isAccepting || isRejecting}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isRejecting 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                              }`}
                            >
                              {isRejecting ? (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span className="hidden sm:inline">Declining</span>
                                  <span className="sm:hidden">...</span>
                                </div>
                              ) : (
                                'Decline'
                              )}
                            </button>
                            
                            <button 
                              onClick={() => onAccept(request.id)}
                              disabled={isAccepting || isRejecting}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isAccepting 
                                  ? 'bg-orange-400 text-white cursor-not-allowed' 
                                  : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm'
                              }`}
                            >
                              {isAccepting ? (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span className="hidden sm:inline">Accepting</span>
                                  <span className="sm:hidden">...</span>
                                </div>
                              ) : (
                                'Accept'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <PeopleIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-500 text-sm">You're all caught up! No new connection requests at the moment.</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// Pending Connection Request Card
const PendingRequestCard = ({ request, onAccept, onReject, loadingStates }) => {
  const senderName = request.sender.user?.name || request.sender.partner?.name || request.sender.expert?.name || request.sender.admin?.name || 'Unknown User';
  const isAccepting = loadingStates[`accept_${request.id}`];
  const isRejecting = loadingStates[`reject_${request.id}`];

  return (
    <div className="flex items-center justify-between p-4 mb-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
            <img 
              src={getUserPhotoURL(request.sender)} 
              alt={senderName} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "/t6.svg";
              }}
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{senderName}</p>
          <div className="mt-1">
            <span className="text-xs text-gray-500">
              Request sent on {moment(request.createdAt).format('DD MMM YYYY')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex space-x-2 flex-shrink-0">
        <button 
          onClick={() => onReject(request.id)}
          disabled={isAccepting || isRejecting}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isRejecting 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
          }`}
          title="Reject"
        >
          {isRejecting ? (
            <div className="flex items-center">
              <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="hidden sm:inline">Declining</span>
              <span className="sm:hidden">...</span>
            </div>
          ) : (
            'Decline'
          )}
        </button>
        <button 
          onClick={() => onAccept(request.id)}
          disabled={isAccepting || isRejecting}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isAccepting 
              ? 'bg-orange-400 text-white cursor-not-allowed' 
              : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm'
          }`}
          title="Accept"
        >
          {isAccepting ? (
            <div className="flex items-center">
              <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="hidden sm:inline">Accepting</span>
              <span className="sm:hidden">...</span>
            </div>
          ) : (
            'Accept'
          )}
        </button>
      </div>
    </div>
  );
};

// Generate banner image based on user name
const generateBannerImage = (name) => {
  if (!name) return "https://images.unsplash.com/photo-1504674900240-9c9c0b1b0b0b?w=400&h=100&fit=crop";
  
  const firstLetter = name.charAt(0).toLowerCase();
  const bannerImages = {
    a: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop", // assorted vegetables
    b: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop", // pizza
    c: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=100&fit=crop", // food
    d: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop", // pizza
    e: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=100&fit=crop", // vegetables
    f: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=400&h=100&fit=crop", // fruits
    g: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop", // pizza
    h: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=100&fit=crop", // food
    i: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=100&fit=crop", // cooking
    j: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop", // pizza
    k: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=100&fit=crop", // food
    l: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop", // pizza
    m: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=100&fit=crop", // vegetables
    n: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=400&h=100&fit=crop", // fruits
    o: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop", // pizza
    p: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=100&fit=crop", // food
    q: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=100&fit=crop", // cooking
    r: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop", // pizza
    s: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=100&fit=crop", // food
    t: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop", // pizza
    u: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=100&fit=crop", // vegetables
    v: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=400&h=100&fit=crop", // fruits
    w: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop", // pizza
    x: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=100&fit=crop", // food
    y: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=100&fit=crop", // cooking
    z: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=100&fit=crop"  // pizza
  };
  
  return bannerImages[firstLetter] || bannerImages.a;
};

// Simple User Card for Network Tab - Cleaner Style
const UserNetworkCard = ({ user, currentUser, onConnect, loadingStates }) => {
  const name = user?.name || 'Unknown User';
  const title = user?.careerHistory?.[0]?.jobTitle || user?.currentPosition || 'Member';
  const photoURL = user?.photoURL || '/t6.svg';
  const bannerURL = user?.bannerImage || generateBannerImage(name);
  const connectionStatus = user?.connectionStatus || 'none';
  const isConnecting = loadingStates[`connect_${user.id}`];

  const handleConnectClick = (e) => {
    e.stopPropagation();
    console.log(`Connect with user ${user.id}`);
    
    // Different actions based on connection status
    if (connectionStatus === 'mutual' || connectionStatus === 'following' || connectionStatus === 'connected') {
      // Future functionality: Remove connection
      console.log("Already connected");
    } else if (connectionStatus === 'request_sent') {
      // Future functionality: Cancel request
      console.log("Request already sent");
    } else {
      onConnect(user.id);
    }
  };

  const router = useRouter();
  const handleCardClick = () => {
    router.push(`/user/${user.id}`);
  };

  // Connection status indicator (shown at top right)
  const renderConnectionStatus = () => {
    if (currentUser?.unifiedUser?.id === user.id) return null;
    
    switch(connectionStatus) {
      case 'mutual':
        return (
          <div className="absolute top-2 right-2 bg-orange-100 text-orange-600 rounded-full p-1.5 z-20 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'following':
      case 'connected':
        return (
          <div className="absolute top-2 right-2 bg-green-100 text-green-600 rounded-full p-1.5 z-20 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'follower':
        return (
          <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-600 rounded-full px-2 py-1 z-20 text-xs font-medium shadow-sm">
            Follows you
          </div>
        );
      case 'request_sent':
        return (
          <div className="absolute top-2 right-2 bg-orange-100 text-orange-600 rounded-full px-2 py-1 z-20 text-xs font-medium shadow-sm">
            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending
          </div>
        );
      case 'request_received':
        return (
          <div className="absolute top-2 right-2 bg-purple-100 text-purple-600 rounded-full px-2 py-1 z-20 text-xs font-medium shadow-sm">
            Respond
          </div>
        );
      default:
        return null;
    }
  };

  // Connect button text based on connection status
  const getConnectButtonText = () => {
    switch(connectionStatus) {
      case 'mutual':
      case 'connected':
        return 'Connected';
      case 'following':
        return 'Following';
      case 'follower':
        return 'Follow Back';
      case 'request_sent':
        return 'Request Sent';
      case 'request_received':
        return 'Respond';
      default:
        return 'Connect';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-lg transition-all flex flex-col text-center relative group"
    >
      {renderConnectionStatus()}
      
      {/* Banner Image */}
      <div className="h-16 w-full relative flex-shrink-0 overflow-hidden">
        <img 
            src={bannerURL}
            alt="User banner"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
         />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Profile Picture */}
      <div className="relative flex justify-center -mt-10 z-10 flex-shrink-0">
        <div 
          className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white bg-gray-300 cursor-pointer shadow-lg group-hover:scale-105 transition-transform duration-300"
           onClick={handleCardClick}
        >
          <img
            src={photoURL}
            alt={`${name}'s profile picture`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/t6.svg";
            }}
          />
        </div>
      </div>

      {/* Text Content */}
      <div 
        className="px-3 flex-grow cursor-pointer flex flex-col justify-start items-center min-h-[5rem]"
        onClick={handleCardClick}
      >
        <h3 className="text-base font-semibold text-gray-800 capitalize leading-tight mt-2 group-hover:text-orange-600 transition-colors">{name}</h3>
        <p className="text-xs text-gray-500 mt-1 px-1 flex-grow leading-tight">{title}</p>
        
        {/* Mutual connections indicator */}
        {user.mutualConnectionsCount > 0 && (
          <div className="text-xs text-gray-600 mt-1 font-medium flex items-center">
            {user.mutualConnections.length > 0 && (
              <div className="flex -space-x-2 mr-2">
                {user.mutualConnections.slice(0, 1).map(conn => (
                  <div className="h-5 w-5 rounded-full border border-white overflow-hidden" key={conn.id}>
                    <img 
                      src={conn.photoURL} 
                      alt={conn.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/t6.svg";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {user.mutualConnectionsCount === 1 
              ? `${user.mutualConnections[0].name.split(' ')[0]} is a mutual connection` 
              : user.mutualConnectionsCount > 1 
                ? `${user.mutualConnections[0].name.split(' ')[0]} and ${user.mutualConnectionsCount - 1} other mutual` 
                : ''}
          </div>
        )}
        
        {/* Connection type indicator */}
        {connectionStatus === 'mutual' && (
          <div className="text-xs text-orange-600 mt-1 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Mutual Connection
          </div>
        )}
      </div>

      {/* Connect Button */}
      <div className="px-4 pb-4 mt-2 flex justify-center flex-shrink-0">
        {currentUser?.unifiedUser?.id !== user.id && (
          <button
            onClick={handleConnectClick}
            disabled={connectionStatus === 'request_sent' || isConnecting}
            className={`rounded-full w-full px-4 py-2 text-sm font-medium border-2 flex items-center justify-center transition-all duration-200 ${
              connectionStatus === 'mutual' || connectionStatus === 'following' || connectionStatus === 'connected'
                ? 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
                : connectionStatus === 'request_sent'
                ? 'bg-orange-50 border-orange-200 text-orange-600 cursor-not-allowed opacity-75'
                : connectionStatus === 'request_received'
                ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                : isConnecting
                ? 'bg-orange-300 border-orange-300 text-white cursor-not-allowed'
                : 'border-orange-500 text-orange-500 hover:bg-orange-50 hover:border-orange-600 hover:shadow-md'
            }`}
          >
            {isConnecting ? (
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : connectionStatus === 'mutual' || connectionStatus === 'following' || connectionStatus === 'connected' ? (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : connectionStatus === 'request_sent' ? (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            )}
            {isConnecting ? 'Sending...' : getConnectButtonText()}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const MyCommunitiesNetworkPage = () => {
  const router = useRouter();
  const currentUser = useSelector(selectUser);
  const userCommunities = useSelector(selectUserCommunities);
  const subscribedCommunities = useSelector(selectSubscribedCommunities);
  const [activeNetworkTab, setActiveNetworkTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [networkUsers, setNetworkUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingRequestCounts, setPendingRequestCounts] = useState({ incoming: 0, outgoing: 0 });
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const handleOpenRequestsModal = () => {
    setRequestsModalOpen(true);
    // Refresh pending requests when modal opens
    fetchPendingRequests();
  };

  const handleCloseRequestsModal = () => {
    setRequestsModalOpen(false);
  };

  const handleConnectClick = (userId) => {
    console.log(`Connect request sent to user ${userId}`);
    
    // Set loading state for this specific user
    setLoadingStates(prev => ({ ...prev, [`connect_${userId}`]: true }));
    
    // Add connection request logic
    api.post('/connections/send-request', {
      senderId: currentUser?.unifiedUser?.id,
      receiverId: userId,
      message: "I'd like to connect with you!"
    })
    .then(response => {
      console.log("Connection request sent:", response.data);
      // Show success message
      toast.success("Connection request sent successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // Refresh network data to show updated status
      refreshNetworkData();
    })
    .catch(error => {
      console.error("Error sending connection request:", error);
      // Show error message
      if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.error("Failed to send connection request. Please try again.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
    }
    })
    .finally(() => {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [`connect_${userId}`]: false }));
    });
  };

  // Function to refresh network data
  const refreshNetworkData = () => {
      if (currentUser?.unifiedUser?.id) {
      setIsLoadingNetwork(true);
        api.get(`/connections/network-connections/${currentUser.unifiedUser.id}`)
          .then(response => {
            const data = response.data;
            
          // Include all user types (user, partner, admin, expert)
          const allUsers = data.allUsers;
            
            // Set initial filtered users based on active tab
            let initialUsers;
            switch(activeNetworkTab) {
              case 'following':
                initialUsers = allUsers.filter(user => user.connectionStatus === 'following');
                break;
              case 'followers':
                initialUsers = allUsers.filter(user => user.connectionStatus === 'follower');
                break;
              case 'mutual':
                initialUsers = allUsers.filter(user => user.connectionStatus === 'mutual');
                break;
            case 'pending':
              // Show both sent and received pending requests
              const pendingSent = allUsers.filter(user => user.connectionStatus === 'request_sent');
              const pendingReceived = allUsers.filter(user => user.connectionStatus === 'request_received');
              initialUsers = [...pendingReceived, ...pendingSent];
                break;
              default:
                // Show all users
                initialUsers = allUsers;
            }
            
            setNetworkUsers(initialUsers);
            setFilteredUsers(initialUsers);
            
            // Removed success toast to prevent showing on page load
          })
          .catch(error => {
            console.error("Error fetching network data:", error);
            // Fallback to old method if needed
            fetchAllUsers();
          })
          .finally(() => {
            setIsLoadingNetwork(false);
          });
    }
  };


  // Fetch pending connection requests
  useEffect(() => {
    if (currentUser?.unifiedUser?.id) {
      fetchPendingRequests();
    }
  }, [currentUser]);

  // Function to fetch pending connection requests
  const fetchPendingRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const response = await api.get(`/connections/${currentUser.unifiedUser.id}/pending-requests`);
      console.log('🔍 API Response:', response.data);
      
      // The API returns { pendingRequests: { incoming: [...], outgoing: [...] }, counts: {...} }
      const incomingRequests = response.data.pendingRequests?.incoming || [];
      const outgoingRequests = response.data.pendingRequests?.outgoing || [];
      const counts = response.data.counts || { incoming: 0, outgoing: 0 };
      
      console.log('🔍 Incoming requests:', incomingRequests);
      console.log('🔍 Outgoing requests:', outgoingRequests);
      console.log('🔍 Counts:', counts);
      
      // Set the incoming requests for the modal
      setPendingRequests(incomingRequests);
      // Store the counts for display purposes
      setPendingRequestCounts(counts);
      
      console.log('🔍 Set pendingRequests state to:', incomingRequests);
      console.log('🔍 Set pendingRequestCounts state to:', counts);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast.error("Failed to load connection requests. Please try again.");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Function to handle accepting a connection request
  const handleAcceptConnection = async (connectionId) => {
    // Set loading state for this specific action
    setLoadingStates(prev => ({ ...prev, [`accept_${connectionId}`]: true }));
    
    try {
      await api.put(`/connections/accept/${connectionId}`);
      fetchPendingRequests(); // Refresh the pending requests list
      // Also refresh network data
      refreshNetworkData();
      // Show success message
      toast.success("Connection request accepted successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error accepting connection:", error);
      // Show error message
      toast.error("Failed to accept connection request. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [`accept_${connectionId}`]: false }));
    }
  };

  // Function to handle rejecting a connection request
  const handleRejectConnection = async (connectionId) => {
    // Set loading state for this specific action
    setLoadingStates(prev => ({ ...prev, [`reject_${connectionId}`]: true }));
    
    try {
      await api.delete(`/connections/${connectionId}`);
      fetchPendingRequests(); // Refresh the pending requests list
      // Show success message
      toast.success("Connection request rejected successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error rejecting connection:", error);
      // Show error message
      toast.error("Failed to reject connection request. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [`reject_${connectionId}`]: false }));
    }
  };

  useEffect(() => {
    if (networkUsers.length === 0) {
      refreshNetworkData();
    }
  }, [currentUser?.unifiedUser?.id]);
  
  // Function to fetch all users (fallback)
  const fetchAllUsers = () => {
    api.get('/user')
      .then(response => {
        const usersData = response.data?.users || response.data || [];
        const allOtherUsers = usersData.filter(u => u.id !== currentUser?.unifiedUser?.id);
        setNetworkUsers(allOtherUsers);
        setFilteredUsers(allOtherUsers);
      })
      .catch(error => {
        console.error("Error fetching network users:", error);
      })
      .finally(() => {
        setIsLoadingNetwork(false);
      });
  };

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredUsers(networkUsers);
    } else {
      setFilteredUsers(
        networkUsers.filter(user =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, networkUsers]);

  // Helper to filter only users with userType === 'user'
  const onlyUserType = (user) => user.userType === 'user';

  // Create networkData object from current state for compatibility
  const networkData = {
    mutual: networkUsers.filter(user => user.connectionStatus === 'mutual'),
    following: networkUsers.filter(user => user.connectionStatus === 'following'),
    followers: networkUsers.filter(user => user.connectionStatus === 'follower'),
    others: networkUsers.filter(user => user.connectionStatus === 'none'),
    allUsers: networkUsers
  };

  // Compute counts for each tab, filtered by userType === 'user'
  const mutualCount = networkData.mutual.filter(onlyUserType).length;
  const followingCount = networkData.following.filter(onlyUserType).length;
  const followersCount = networkData.followers.filter(onlyUserType).length;
  const pendingSentCount = (networkData.allUsers || []).filter(u => u.connectionStatus === 'request_sent' && onlyUserType(u)).length;

  // When switching tabs, filter users by userType === 'user' for each tab
  useEffect(() => {
    if (networkUsers.length > 0) {
      let users;
      switch(activeNetworkTab) {
        case 'following':
          users = networkUsers.filter(user => user.connectionStatus === 'following' && onlyUserType(user));
          break;
        case 'followers':
          users = networkUsers.filter(user => user.connectionStatus === 'follower' && onlyUserType(user));
          break;
        case 'mutual':
          users = networkUsers.filter(user => user.connectionStatus === 'mutual' && onlyUserType(user));
          break;
        case 'pending':
          // Show only sent pending requests (received ones are shown in popup)
          users = networkUsers.filter(user => user.connectionStatus === 'request_sent' && onlyUserType(user));
          break;
        default:
          // "All" tab: Show all users filtered by userType
          users = networkUsers.filter(onlyUserType);
      }
      setFilteredUsers(
        searchTerm ? 
          users.filter(user => user.name?.toLowerCase().includes(searchTerm.toLowerCase())) 
          : users
      );
    }
  }, [activeNetworkTab, networkUsers, searchTerm]);

  // When rendering the network tab, filter users to only show 'user' type
  // This useEffect is now redundant as filtering is handled by the new useEffect above
  // useEffect(() => {
  //   if (networkData && Object.keys(networkData).length > 0) {
  //     let users;
  //     switch(activeNetworkTab) {
  //       case 'following':
  //         users = networkData.following;
  //         break;
  //       case 'followers':
  //         users = networkData.followers;
  //         break;
  //       case 'mutual':
  //         users = networkData.mutual;
  //         break;
  //       case 'pending':
  //         // Show only sent pending requests (received ones are shown in popup)
  //         const pendingSent = networkData.allUsers?.filter(user => user.connectionStatus === 'request_sent') || [];
  //         users = pendingSent;
  //         break;
  //       default:
  //         // "All" tab: Show non-followers first, then followers, following, and mutual
  //         users = [...networkData.others, ...networkData.followers, ...networkData.following, ...networkData.mutual];
  //     }
  //     setNetworkUsers(users);
  //     setFilteredUsers(
  //       searchTerm ? 
  //         users.filter(user => user.name?.toLowerCase().includes(searchTerm.toLowerCase())) 
  //         : users
  //     );
  //   }
  // }, [activeNetworkTab, networkData]);

  return (
    <>
      <Head>
        <title>IFCA - Communities & Network</title>
      </Head>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header>
          <Topbar />
        </header>
        <main className="flex-grow mt-[80px] container mx-auto px-4 py-6 max-w-[1400px]">
          <div>
            <div>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-bold text-gray-800">Network</h1>
                  {pendingRequestCounts.incoming > 0 ? (
                    <motion.button
                      onClick={handleOpenRequestsModal}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                    >
                      <div className="flex items-center">
                        {/* Notification Badge */}
                        <div className="relative mr-3">
                          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <PersonAddIcon className="w-4 h-4" />
                          </div>
                          {/* Pulse Animation */}
                          <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                        
                        {/* Profile Pictures */}
                        <div className="flex -space-x-2 mr-4">
                          {pendingRequests.slice(0, 3).map((request, index) => (
                            <motion.div 
                              key={request.id} 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="h-8 w-8 rounded-full border-2 border-white overflow-hidden bg-white shadow-sm ring-2 ring-orange-200"
                            >
                              <img 
                                src={request.sender?.photoURL || '/t6.svg'} 
                                alt="Profile" 
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.src = "/t6.svg";
                                }}
                              />
                            </motion.div>
                          ))}
                          {pendingRequestCounts.incoming > 3 && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 }}
                              className="h-8 w-8 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700 shadow-sm ring-2 ring-orange-200"
                            >
                              +{pendingRequestCounts.incoming - 3}
                            </motion.div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-sm">
                            Connection Requests
                          </span>
                          <span className="text-xs text-orange-100">
                            {pendingRequestCounts.incoming} new request{pendingRequestCounts.incoming !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {/* Count Badge */}
                        <div className="ml-3 bg-white bg-opacity-20 rounded-full px-2 py-1">
                          <span className="text-xs font-bold">
                            {pendingRequestCounts.incoming}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ) : (
                    <button
                      onClick={handleOpenRequestsModal}
                      className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <PersonAddIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-gray-600 font-medium">Manage Connections</span>
                    </button>
                  )}
                </div>
                
                <div className="mb-6 max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500 transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Network Tabs */}
                <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActiveNetworkTab("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeNetworkTab === "all"
                        ? "bg-orange-100 text-orange-600 shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveNetworkTab("mutual")}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeNetworkTab === "mutual"
                        ? "bg-orange-100 text-orange-600 shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Mutual ({mutualCount})
                  </button>
                  <button
                    onClick={() => setActiveNetworkTab("following")}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeNetworkTab === "following"
                        ? "bg-orange-100 text-orange-600 shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Following ({followingCount})
                  </button>
                  <button
                    onClick={() => setActiveNetworkTab("followers")}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeNetworkTab === "followers"
                        ? "bg-orange-100 text-orange-600 shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Followers ({followersCount})
                  </button>
                  {(pendingSentCount > 0) && (
                    <button
                      onClick={() => setActiveNetworkTab("pending")}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        activeNetworkTab === "pending"
                          ? "bg-orange-100 text-orange-600 shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Request Sent ({pendingSentCount})
                    </button>
                  )}
                </div>

                {activeNetworkTab === "pending" && (
                  <div className="space-y-4">
                    {pendingRequestCounts.incoming > 0 ? (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Connection Requests</h3>
                        {pendingRequests.map(request => (
                                                  <PendingRequestCard
                          key={request.id} 
                          request={request} 
                          onAccept={handleAcceptConnection} 
                          onReject={handleRejectConnection} 
                          loadingStates={loadingStates}
                        />
                        ))}
                      </div>
                    )  :null}
                  </div>
                )}

                {isLoadingNetwork ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600 text-sm">Loading network...</p>
                    </div>
                  </div>
                ) : filteredUsers.filter(onlyUserType).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                    {filteredUsers.filter(onlyUserType).map((user) => (
                      <UserNetworkCard 
                        key={user.id} 
                        user={user} 
                        currentUser={currentUser} 
                        onConnect={handleConnectClick} 
                        loadingStates={loadingStates}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-lg font-medium mb-2">
                      {searchTerm ? `No users found matching "${searchTerm}"` : "No users found in the network"}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {searchTerm ? "Try adjusting your search terms" : "Start connecting with other members to build your network"}
                    </p>
                  </div>
                )}
              </div>
          </div>
        </main>
        <footer className="mt-auto">
          <Footer />
        </footer>
        
        {/* Connection Requests Modal */}
        <ConnectionRequestsModal
          open={requestsModalOpen}
          handleClose={handleCloseRequestsModal}
          pendingRequests={pendingRequests}
          onAccept={handleAcceptConnection}
          onReject={handleRejectConnection}
          loadingStates={loadingStates}
          isLoadingRequests={isLoadingRequests}
          router={router}
        />
      </div>
    </>
  );
};

export default MyCommunitiesNetworkPage;
