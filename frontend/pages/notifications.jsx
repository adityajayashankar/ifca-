import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/utils/apiSetup';
import { selectUser } from '@/store/features/userSlice';
import Topbar from '@/components/topbar/Topbar';

// Icons
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import MessageIcon from "@mui/icons-material/Message";
import EventIcon from "@mui/icons-material/Event";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BookIcon from "@mui/icons-material/Book";
import ArticleIcon from "@mui/icons-material/Article";
import GroupIcon from "@mui/icons-material/Group";
import PostAddIcon from "@mui/icons-material/PostAdd";
import SchoolIcon from "@mui/icons-material/School";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PersonIcon from "@mui/icons-material/Person";
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';

const NotificationIcon = ({ type }) => {
  const iconClass = "w-6 h-6";
  switch (type) {
    case 'CONNECTION_REQUEST':
      return <PersonAddIcon className={`${iconClass} text-orange-500`} />
    case 'CONNECTION_ACCEPTED':
      return <CheckCircleIcon className={`${iconClass} text-green-500`} />
    case 'NEW_MESSAGE':
      return <MessageIcon className={`${iconClass} text-purple-500`} />
    case 'EVENT_REMINDER':
      return <EventIcon className={`${iconClass} text-orange-500`} />
    case 'SESSION_REGISTRATION':
      return <EventIcon className={`${iconClass} text-blue-500`} />
    case 'COMMUNITY_UPDATE':
      return <GroupIcon className={`${iconClass} text-blue-500`} />
    case 'POST_LIKE':
    case 'NEW_POST': // Handle like notifications
      return <PostAddIcon className={`${iconClass} text-red-500`} />
    case 'POST_COMMENT':
      return <PostAddIcon className={`${iconClass} text-green-500`} />
    case 'COURSE_UPDATE':
      return <SchoolIcon className={`${iconClass} text-orange-500`} />
    case 'COMPETITION_UPDATE':
      return <EmojiEventsIcon className={`${iconClass} text-yellow-500`} />
    case 'RESOURCE_UPDATE':
      return <ArticleIcon className={`${iconClass} text-purple-500`} />
    case 'PURCHASE_COMPLETE':
      return <ShoppingCartIcon className={`${iconClass} text-green-500`} />
    // Huddle notification types
    case 'HUDDLE_CREATED':
    case 'HUDDLE_REMINDER_1_DAY':
    case 'HUDDLE_REMINDER_2_HOURS':
    case 'HUDDLE_REMINDER_10_MIN':
      return <GroupIcon className={`${iconClass} text-purple-500`} />
    case 'HUDDLE_STARTED':
      return <GroupIcon className={`${iconClass} text-green-500`} />
    case 'HUDDLE_ENDED':
      return <GroupIcon className={`${iconClass} text-gray-500`} />
    case 'HUDDLE_AI_HOOK':
      return <GroupIcon className={`${iconClass} text-purple-500`} />
    case 'HUDDLE_USER_JOINED':
    case 'HUDDLE_USER_LEFT':
      return <PersonIcon className={`${iconClass} text-blue-500`} />
    default:
      return <NotificationsIcon className={`${iconClass} text-gray-500`} />
  }
};

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const router = useRouter();

  const handleNotificationClick = () => {
    // Mark as read when clicked
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'CONNECTION_REQUEST':
        if (notification.sender?.id) {
          router.push(`/user/${notification.sender.id}`);
        } else {
          // Fallback to myCommunities if no sender info
          router.push('/myCommunities');
        }
        break;
      case 'CONNECTION_ACCEPTED':
        // Use the actionUrl from metadata if available
        if (notification.metadata?.actionUrl) {
          // Check if it's a relative URL or full URL
          if (notification.metadata.actionUrl.startsWith('/')) {
            router.push(notification.metadata.actionUrl);
          } else {
            // If it's a full URL, open in new tab
            window.open(notification.metadata.actionUrl, '_blank');
          }
        } else if (notification.sender?.id) {
          // Fallback: navigate to sender's profile
          router.push(`/user/${notification.sender.id}`);
        } else {
          // Fallback to myCommunities if no actionUrl or sender info
          router.push('/myCommunities');
        }
        break;
      case 'POST_LIKE':
      case 'POST_COMMENT':
      case 'NEW_POST': // Handle like notifications (backend uses NEW_POST type)
        // Use the actionUrl from metadata if available
        if (notification.metadata?.actionUrl) {
          // Check if it's a relative URL or full URL
          if (notification.metadata.actionUrl.startsWith('/')) {
            router.push(notification.metadata.actionUrl);
          } else {
            // If it's a full URL, open in new tab
            window.open(notification.metadata.actionUrl, '_blank');
          }
        } else if (notification.metadata?.postId && notification.metadata?.communityId) {
          // Fallback: construct URL from postId and communityId
          const actionUrl = `/comHome/${notification.metadata.communityId}?postId=${notification.metadata.postId}`;
          router.push(actionUrl);
        } else {
          // Fallback to myCommunities if no actionUrl
          router.push('/myCommunities');
        }
        break;
      case 'NEW_MESSAGE':
        if (notification.messageId) {
          router.push(`/messaging?messageId=${notification.messageId}`);
        } else {
          router.push('/messaging');
        }
        break;
      case 'SESSION_REGISTRATION':
        // Use actionUrl from metadata if available, otherwise construct from sessionId
        if (notification.metadata?.actionUrl) {
          if (notification.metadata.actionUrl.startsWith('/')) {
            router.push(notification.metadata.actionUrl);
          } else {
            window.open(notification.metadata.actionUrl, '_blank');
          }
        } else if (notification.sessionId) {
          router.push(`/classDetails/${notification.sessionId}`);
        } else {
          router.push('/mySchedule');
        }
        break;
      case 'COMMUNITY_UPDATE':
        if (notification.communityId) {
          router.push(`/comHome/${notification.communityId}`);
        } else {
          router.push('/myCommunities');
        }
        break;
      case 'COURSE_UPDATE':
        if (notification.courseId) {
          router.push(`/courses/${notification.courseId}`);
        } else {
          router.push('/courses');
        }
        break;
      case 'COMPETITION_UPDATE':
        if (notification.competitionId) {
          router.push(`/competitions/${notification.competitionId}`);
        } else {
          router.push('/competitions');
        }
        break;
      case 'RESOURCE_UPDATE':
        if (notification.resourceId) {
          router.push(`/resource/${notification.resourceId}`);
        } else {
          router.push('/myCommunities');
        }
        break;
      // Huddle notification types
      case 'HUDDLE_CREATED':
      case 'HUDDLE_REMINDER_1_DAY':
      case 'HUDDLE_REMINDER_2_HOURS':
      case 'HUDDLE_REMINDER_10_MIN':
      case 'HUDDLE_STARTED':
      case 'HUDDLE_ENDED':
      case 'HUDDLE_AI_HOOK':
      case 'HUDDLE_USER_JOINED':
      case 'HUDDLE_USER_LEFT':
        if (notification.huddleId && notification.communityId) {
          // Navigate to huddle detail page if available
          router.push(`/comHome/${notification.communityId}/huddle/${notification.huddleId}`);
        } else if (notification.communityId) {
          // Fallback to community page
          router.push(`/comHome/${notification.communityId}?tab=huddles`);
        } else {
          router.push('/myCommunities');
        }
        break;
      default:
        // For other notification types, navigate to myCommunities
        router.push('/myCommunities');
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`p-4 border-b border-gray-100 hover:bg-orange-50/30 transition-all duration-200 cursor-pointer relative group ${
        notification.isRead ? 'bg-white' : 'bg-orange-50/40 border-l-4 border-l-orange-500'
      }`}
      onClick={handleNotificationClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div className="flex-shrink-0 mt-0.5">
          <div className={`p-2.5 rounded-lg transition-all ${
            notification.isRead 
              ? 'bg-gray-100' 
              : 'bg-orange-100 shadow-sm ring-1 ring-orange-200'
          }`}>
            <NotificationIcon type={notification.type} />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold mb-1.5 line-clamp-1 ${
                notification.isRead ? 'text-gray-900' : 'text-gray-900'
              }`}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2">
                {notification.message}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                </span>
                {!notification.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-all duration-200 border border-orange-200 hover:border-orange-300"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Read/Unread indicator */}
        <div className="flex-shrink-0 mt-1">
          {notification.isRead ? (
            <DoneAllIcon 
              className="text-orange-500 text-base" 
              title="Read"
            />
          ) : (
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const NotificationsPage = () => {
  const currentUser = useSelector(selectUser);
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      router.push('/onBoard');
      return;
    }
    if (mounted && pagination && pagination.page) {
      fetchNotifications();
    }
  }, [currentUser, filter, typeFilter, pagination?.page, mounted]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const currentPage = pagination?.page || 1;
      const currentLimit = pagination?.limit || 20;
      
      const params = new URLSearchParams({
        userId: currentUser?.unifiedUser?.id,
        page: currentPage,
        limit: currentLimit,
        includeRelations: 'true'
      });

      if (filter !== 'all') {
        params.append('status', filter === 'unread' ? 'UNREAD' : 'READ');
      }

      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const response = await api.get(`/notifications?${params}`);
      setNotifications(response.data.notifications);
      setPagination(response.data.pagination || {
        page: currentPage,
        limit: currentLimit,
        total: 0,
        pages: 0
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read?userId=${currentUser?.unifiedUser?.id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch(`/notifications/read-all?userId=${currentUser?.unifiedUser?.id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearFilters = () => {
    setFilter('all');
    setTypeFilter('all');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!currentUser) {
    return null;
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Topbar />
        <div className="pt-16 pb-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header - White header with orange accents */}
          <div className="bg-white rounded-t-lg shadow-lg border-b-2 border-orange-500">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-100 rounded-lg border border-orange-200">
                  <NotificationsIcon className="text-orange-600 text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-orange-600 text-sm mt-0.5 font-semibold">
                    {unreadCount} unread
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 font-semibold border border-orange-200 hover:border-orange-300"
                >
                  <MarkEmailReadIcon className="text-base" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border-x border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FilterListIcon className="text-orange-500 text-lg" />
                  <span className="text-sm font-semibold text-gray-700">Filter:</span>
                </div>
                
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white font-medium text-gray-700 hover:border-orange-300 transition-colors"
                >
                  <option value="all">All notifications</option>
                  <option value="unread">Unread only</option>
                  <option value="read">Read only</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white font-medium text-gray-700 hover:border-orange-300 transition-colors"
                >
                  <option value="all">All types</option>
                  <option value="CONNECTION_REQUEST">Connection requests</option>
                  <option value="CONNECTION_ACCEPTED">Connection accepted</option>
                  <option value="NEW_MESSAGE">Messages</option>
                  <option value="SESSION_REGISTRATION">Session updates</option>
                  <option value="COMMUNITY_UPDATE">Community updates</option>
                  <option value="POST_LIKE">Post likes</option>
                  <option value="POST_COMMENT">Post comments</option>
                  <option value="COURSE_UPDATE">Course updates</option>
                  <option value="COMPETITION_UPDATE">Competition updates</option>
                  <option value="RESOURCE_UPDATE">Resource updates</option>
                  <option value="PURCHASE_COMPLETE">Purchase updates</option>
                  <option value="HUDDLE_CREATED">Huddle created</option>
                  <option value="HUDDLE_STARTED">Huddle started</option>
                  <option value="HUDDLE_REMINDER_10_MIN">Huddle reminders</option>
                </select>

                {(filter !== 'all' || typeFilter !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors border border-orange-200 hover:border-orange-300"
                  >
                    <ClearIcon className="text-base" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-b-lg shadow-lg border-x border-b border-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #f97316;
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #ea580c;
              }
            `}</style>
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <NotificationsIcon className="text-orange-500 text-3xl" />
                </div>
                <p className="text-gray-700 text-lg font-semibold mb-1">No notifications found</p>
                <p className="text-gray-500 text-sm">
                  {filter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'You\'re all caught up!'}
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
                {/* View all notifications button */}
                {notifications.length > 0 && pagination.page < pagination.pages && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                      }}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.01]"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 hover:border-orange-300 transition-colors text-gray-700"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600 font-medium px-4">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 hover:border-orange-300 transition-colors text-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 