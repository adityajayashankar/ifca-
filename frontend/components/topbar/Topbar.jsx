import React from "react"
import { useEffect, useState, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/router"
import { useDispatch, useSelector } from "react-redux"
import Image from "next/image"
import { logoutUser, selectUser, selectUserCart, setUser } from "@/store/features/userSlice"
import SearchIcon from "@mui/icons-material/Search"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import MenuIcon from "@mui/icons-material/Menu"
import HomeIcon from "@mui/icons-material/Home"
import DateRangeIcon from "@mui/icons-material/DateRange"
import PeopleAltIcon from "@mui/icons-material/PeopleAlt"
import UserEditModal from "../activeUser/userEditModal"
import Book from "@mui/icons-material/Book"
import Profile from "../profile"
import AnimatedButton from "@/components/common/AnimatedButton"
import api from "@/utils/apiSetup"
import CloseIcon from '@mui/icons-material/Close'
import AutoGraphIcon from '@mui/icons-material/AutoGraph'
import NotificationsIcon from "@mui/icons-material/Notifications"
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive"
import Badge from '@mui/material/Badge'
import { format } from 'date-fns'
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import PersonAddIcon from "@mui/icons-material/PersonAdd"
import MessageIcon from "@mui/icons-material/Message"
import EventIcon from "@mui/icons-material/Event"
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import BookIcon from "@mui/icons-material/Book"
import ArticleIcon from "@mui/icons-material/Article"
import GroupIcon from "@mui/icons-material/Group"
import PostAddIcon from "@mui/icons-material/PostAdd"
import SchoolIcon from "@mui/icons-material/School"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import PersonIcon from "@mui/icons-material/Person"
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import { SiGoogleplay, SiAppstore } from 'react-icons/si'

// Add NotificationDropdown component
const NotificationDropdown = ({ notifications, onMarkAsRead, onViewAll, onConnectionRequestClick, onNavigate, onClose }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CONNECTION_REQUEST':
        return <PersonAddIcon className="text-orange-500" />
      case 'CONNECTION_ACCEPTED':
        return <CheckCircleIcon className="text-green-500" />
      case 'NEW_MESSAGE':
        return <MessageIcon className="text-purple-500" />
      case 'EVENT_REMINDER':
        return <EventIcon className="text-orange-500" />
      case 'SESSION_REGISTRATION':
        return <EventIcon className="text-blue-500" />
      case 'COMMUNITY_UPDATE':
        return <GroupIcon className="text-blue-500" />
      case 'POST_LIKE':
      case 'NEW_POST': // Handle like notifications
        return <PostAddIcon className="text-red-500" />
      case 'POST_COMMENT':
        return <PostAddIcon className="text-green-500" />
      case 'COURSE_UPDATE':
        return <SchoolIcon className="text-orange-500" />
      case 'COMPETITION_UPDATE':
        return <EmojiEventsIcon className="text-yellow-500" />
      case 'RESOURCE_UPDATE':
        return <ArticleIcon className="text-purple-500" />
      case 'PURCHASE_COMPLETE':
        return <ShoppingCartIcon className="text-green-500" />
      // Huddle notification types
      case 'HUDDLE_CREATED':
      case 'HUDDLE_REMINDER_1_DAY':
      case 'HUDDLE_REMINDER_2_HOURS':
      case 'HUDDLE_REMINDER_10_MIN':
        return <EventIcon className="text-orange-500" />
      case 'HUDDLE_STARTED':
        return <GroupIcon className="text-green-500" />
      case 'HUDDLE_ENDED':
        return <GroupIcon className="text-gray-500" />
      case 'HUDDLE_AI_HOOK':
        return <GroupIcon className="text-purple-500" />
      case 'HUDDLE_USER_JOINED':
      case 'HUDDLE_USER_LEFT':
        return <PersonIcon className="text-blue-500" />
      default:
        return <NotificationsIcon className="text-gray-500" />
    }
  }

  const handleNotificationClick = (notification) => {
    // Mark as read first
    onMarkAsRead(notification.id)
    
    // Close the notification dropdown
    onClose()
    
    // Handle different notification types
    switch (notification.type) {
      case 'CONNECTION_REQUEST':
        if (notification.sender?.id) {
          onNavigate(`/user/${notification.sender.id}`)
        } else {
          // Fallback to myCommunities if no sender info
          onNavigate('/myCommunities')
        }
        break
      case 'CONNECTION_ACCEPTED':
        // Use the actionUrl from metadata if available
        if (notification.metadata?.actionUrl) {
          // Check if it's a relative URL or full URL
          if (notification.metadata.actionUrl.startsWith('/')) {
            onNavigate(notification.metadata.actionUrl)
          } else {
            // If it's a full URL, open in new tab
            window.open(notification.metadata.actionUrl, '_blank')
          }
        } else if (notification.sender?.id) {
          // Fallback: navigate to sender's profile
          onNavigate(`/user/${notification.sender.id}`)
        } else {
          // Fallback to myCommunities if no actionUrl or sender info
          onNavigate('/myCommunities')
        }
        break
      case 'SESSION_REGISTRATION':
        // Use actionUrl from metadata if available, otherwise construct from sessionId
        if (notification.metadata?.actionUrl) {
          if (notification.metadata.actionUrl.startsWith('/')) {
            onNavigate(notification.metadata.actionUrl)
          } else {
            window.open(notification.metadata.actionUrl, '_blank')
          }
        } else if (notification.sessionId) {
          onNavigate(`/classDetails/${notification.sessionId}`)
        } else {
          onNavigate('/mySchedule')
        }
        break
      case 'POST_LIKE':
      case 'POST_COMMENT':
      case 'NEW_POST': // Handle like notifications (backend uses NEW_POST type)
        // Use the actionUrl from metadata if available
        if (notification.metadata?.actionUrl) {
          // Check if it's a relative URL or full URL
          if (notification.metadata.actionUrl.startsWith('/')) {
            onNavigate(notification.metadata.actionUrl)
          } else {
            // If it's a full URL, open in new tab
            window.open(notification.metadata.actionUrl, '_blank')
          }
        } else if (notification.metadata?.postId && notification.metadata?.communityId) {
          // Fallback: construct URL from postId and communityId
          const actionUrl = `/comHome/${notification.metadata.communityId}?postId=${notification.metadata.postId}`
          onNavigate(actionUrl)
        } else {
          // Fallback to myCommunities if no actionUrl
          onNavigate('/myCommunities')
        }
        break
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
        if (notification.huddleId) {
          // Navigate to huddle detail page if available
          onNavigate(`/huddle/${notification.huddleId}`)
        } else if (notification.communityId) {
          // Fallback to community page
          onNavigate(`/comHome/${notification.communityId}`)
        } else {
          onNavigate('/myCommunities')
        }
        break
      default:
        // For other notification types, navigate to myCommunities
        onNavigate('/myCommunities')
        break
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100">
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-orange-500">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-orange-100 rounded-lg border border-orange-200">
            <NotificationsActiveIcon className="text-orange-600" />
          </div>
          <h3 className="text-gray-900 font-semibold">Notifications</h3>
        </div>
        <span className="text-sm text-orange-600 font-semibold">
          {notifications.filter(n => !n.isRead).length} unread
        </span>
      </div>
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
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
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <NotificationsIcon className="text-orange-500 text-3xl" />
            </div>
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`px-4 py-3 hover:bg-orange-50/30 transition-colors duration-200 cursor-pointer relative ${
                notification.isRead ? 'bg-white' : 'bg-orange-50/40 border-l-4 border-l-orange-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 mb-0.5 line-clamp-1">{notification.title}</p>
                  <p className="text-sm text-gray-600 mb-1 line-clamp-2">{notification.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500 font-medium">
                      {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                    </span>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onMarkAsRead(notification.id)
                        }}
                        className="text-[12px] text-orange-600 hover:text-orange-700 font-semibold px-2 py-0.5 rounded hover:bg-orange-100 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {notifications.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 text-center border-t border-gray-200">
          <button 
            onClick={onViewAll}
            className="text-[14px] text-orange-600 hover:text-orange-700 font-semibold transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}

// Highlight function for search term
function highlightMatch(text, query) {
  if (!text) return "";
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'ig');
  return String(text).split(regex).map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} className="font-bold bg-yellow-100">{part}</span>
      : part
  );
}

// Modify SearchDropdown component
const SearchDropdown = ({ results, onClose, onItemClick, searchTerm }) => {
  const getIconForType = (type) => {
    switch (type) {
      case 'community':
        return <GroupIcon className="text-blue-500" />
      case 'post':
        return <PostAddIcon className="text-green-500" />
      case 'resource':
        return <ArticleIcon className="text-purple-500" />
      case 'course':
        return <SchoolIcon className="text-orange-500" />
      case 'competition':
        return <EmojiEventsIcon className="text-red-500" />
      case 'user':
        return <PersonIcon className="text-indigo-500" />
      case 'session':
        return <EventIcon className="text-pink-500" />
      default:
        return <SearchIcon className="text-gray-500" />
    }
  }

  const getImageForItem = (item) => {
    const wrapperClass = "w-10 h-10 flex items-center justify-center bg-black border border-gray-500 rounded";
    if (item.type === 'community' && item.bannerImg) {
      return (
        <div className={wrapperClass}>
          <img src={item.bannerImg} alt="community" className="w-10 h-10 object-contain rounded" />
        </div>
      );
    }
    if (item.type === 'session' && item.infoImgs && item.infoImgs.length > 0) {
      return (
        <div className={wrapperClass}>
          <img src={item.infoImgs[0]} alt="session" className="w-10 h-10 object-contain rounded" />
        </div>
      );
    }
    if (item.type === 'user' && item.photoURL) {
      return (
        <div className={wrapperClass}>
          <img src={item.photoURL} alt="user" className="w-10 h-10 object-contain rounded-full" />
        </div>
      );
    }
    if (item.type === 'course' && item.image) {
      return (
        <div className={wrapperClass}>
          <img src={item.image} alt="course" className="w-10 h-10 object-contain rounded" />
        </div>
      );
    }
    if (item.type === 'post' && item.image) {
      return (
        <div className={wrapperClass}>
          <img src={item.image} alt="post" className="w-10 h-10 object-contain rounded" />
        </div>
      );
    }
    return (
      <div className={wrapperClass}>
        {getIconForType(item.type)}
      </div>
    );
  };

  const getTitleForType = (type) => {
    switch (type) {
      case 'community':
        return 'Communities'
      case 'post':
        return 'Posts'
      case 'resource':
        return 'Resources'
      case 'course':
        return 'Courses'
      case 'competition':
        return 'Events'
      case 'user':
        return 'Users'
      case 'session':
        return 'Sessions'
      default:
        return 'Other'
    }
  }

  const groupedResults = results.reduce((acc, result) => {
    const type = result.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(result)
    return acc
  }, {})

  return (
    <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg w-full z-50 border border-gray-200 max-h-[600px] overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Search Results</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <CloseIcon />
          </button>
        </div>
      </div>
      {Object.entries(groupedResults).map(([type, items]) => (
        <div key={type} className="border-b border-gray-100 last:border-b-0">
          <div className="px-4 py-2 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700">{getTitleForType(type)}</h4>
          </div>
          <div className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="px-4 py-3 text-gray-400 text-sm">No results found.</div>
            ) : (
              items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => onItemClick(item)}
                  className="w-full px-4 py-3 hover:bg-gray-50 text-left flex items-start space-x-3"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getImageForItem(item)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {highlightMatch(item.title || item.name, searchTerm)}
                    </p>
                    {item.desc && (
                      <p className="text-sm text-gray-500 truncate">{highlightMatch(item.desc, searchTerm)}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ))}
      {/* See all results button */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={() => onItemClick({ type: 'all', searchTerm })}
          className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-800 font-medium py-2"
        >
          <SearchIcon />
          <span>See all results</span>
        </button>
      </div>
    </div>
  )
}

// All navigation and icon logic in this Topbar uses Redux user state (currentUser?.userType)
const Navbar = ({ searchBarVal }) => {
  const currentUser = useSelector(selectUser)
  const dispatch = useDispatch()
  const router = useRouter()
  const [val, setVal] = useState(searchBarVal)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [rewards, setRewards] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationRef = useRef(null)
  const [pendingConnections, setPendingConnections] = useState([])
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const { scrollY } = useScroll()
  const isLandingPage = router.pathname === "/"
  const isOnBoard = router.pathname === "/onBoard"
  
  // Improved scroll-based background handling
  const backgroundColor = useTransform(
    scrollY,
    [0, 50],
    isLandingPage ? ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.95)"] : ["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.95)"]
  )
  
  const borderColor = useTransform(
    scrollY,
    [0, 50],
    isLandingPage ? ["rgba(255, 255, 255, 0)", "rgba(251, 146, 60, 0.2)"] : ["rgba(251, 146, 60, 0.2)", "rgba(251, 146, 60, 0.2)"]
  )
  
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (currentUser) {
      getRewards()
      fetchNotifications()
      fetchPendingRequests()
    } else {
      // Reset all state when user logs out
      setRewards(null)
      setUnreadCount(0)
      setPendingConnectionsCount(0)
      setNotifications([])
      setPendingConnections([])
      setShowNotifications(false)
      setShowConnectionModal(false)
    }
  }, [currentUser])

  // Refresh pending requests every 30 seconds
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        fetchPendingRequests()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser && isOnBoard) {
      router.push('/home/feed')
    }
  }, [currentUser, isOnBoard, router])
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => {
      if (val && val.length > 0) {
        performSearch()
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [val])
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    const handleEsc = (event) => {
      if (event.key === 'Escape') setShowSearchResults(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])
  const getRewards = async () => {
    try {
      const res = await api.get(`/rewards/user/${currentUser?.unifiedUser?.id}`)
      if (res?.data?.points !== undefined && res.data.points > 0) {
        setRewards(res.data.points)
      } else {
        setRewards(null) // Set to null if 0 or undefined
      }
    } catch (err) {
      console.error('Error fetching rewards:', err)
      setRewards(null) // Set to null on error instead of keeping 0
    }
  }
  const fetchPendingRequests = async () => {
    try {
      const response = await api.get(`/connections/${currentUser?.unifiedUser?.id}/pending-requests`)
      const incomingRequests = response.data.pendingRequests?.incoming || []
      const outgoingRequests = response.data.pendingRequests?.outgoing || []
      const counts = response.data.counts || { incoming: 0, outgoing: 0 }
      
      setPendingConnections(incomingRequests)
      setPendingConnectionsCount(counts.incoming || incomingRequests.length)
    } catch (error) {
      console.error('Error fetching pending connection requests:', error)
    }
  }
  const handleConnectionRequestClick = () => {
    setShowNotifications(false)
    router.push('/myCommunities')
  }

  const refreshPendingRequests = async () => {
    await fetchPendingRequests()
  }

  const handleLogout = () => {
    dispatch(logoutUser())
    router.push("/onBoard")
  }
  const handleSearch = (e) => {
    e.preventDefault()
    val && router.push(`/search?valuue=${val}`)
  }
  const cart = useSelector(selectUserCart)
  const fetchNotifications = async () => {
    try {
      const response = await api.get(`/notifications?userId=${currentUser?.unifiedUser?.id}`)
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.notifications.filter(n => !n.isRead).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }
  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read?userId=${currentUser?.unifiedUser?.id}`)
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }
  const performSearch = async () => {
    try {
      setIsSearching(true)
      const response = await api.get(`/search?query=${encodeURIComponent(val)}`)
      const results = []
      const data = response.data.data
      if (data.communities) {
        results.push(...data.communities.map(c => ({ ...c, type: 'community' })))
      }
      if (data.sessions) {
        results.push(...data.sessions.map(s => ({ ...s, type: 'session' })))
      }
      if (data.users) {
        results.push(...data.users.map(u => ({ ...u, type: 'user' })))
      }
      if (data.courses) {
        results.push(...data.courses.map(c => ({ ...c, type: 'course' })))
      }
      if (data.posts) {
        results.push(...data.posts.map(p => ({ ...p, type: 'post' })))
      }
      if (data.resources) {
        results.push(...data.resources.map(r => ({ ...r, type: 'resource' })))
      }
      if (data.competitions) {
        results.push(...data.competitions.map(c => ({ ...c, type: 'competition' })))
      }
      setSearchResults(results)
      setShowSearchResults(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }
  const handleSearchItemClick = (item) => {
    setShowSearchResults(false)
    setVal('')

    if (item.type === 'all') {
      // Navigate to search page with the search term
      router.push(`/search?query=${encodeURIComponent(item.searchTerm)}`)
      return
    }

    // Navigate based on item type
    switch (item.type) {
      case 'community':
        router.push(`/commHome/${item.id}`)
        break
      case 'user':
        router.push(`/user/${item?.unifiedUserId?.id}`)
        break
      case 'session':
        router.push(`/session/${item.id}`)
        break
      case 'course':
        router.push(`/courses/${item.id}`)
        break
      case 'post': {
        const communityId = item?.community?.id;
        if (item.isAsk) {
          router.push(`/comThreads/asks/${communityId}?postId=${item.id}`);
        } else if (item.isPoll) {
          router.push(`/comThreads/polls/${communityId}?postId=${item.id}`);
        } else if (item.isGreeting) {
          router.push(`/comThreads/greetings/${communityId}?postId=${item.id}`);
        } else {
          router.push(`/comThreads/${communityId}?postId=${item.id}`);
        }
        break;
      }
      case 'resource':
        router.push(`/resource/${item.id}`)
        break
      case 'competition':
        router.push(`/competitions/${item.id}`)
        break
      default:
        break
    }
  }
  // Don't render topbar on onboard page
  if (isOnBoard) {
    return null;
  }

  return (
    <>
    <motion.nav
      id="topbar"
      style={{
        backgroundColor: backgroundColor,
        borderBottomColor: borderColor,
      }}
      className={`flex items-center h-[60px] md:h-[64px] fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-md border-b shadow-sm`}
    >
      <div className="w-full max-w-[1400px] mx-auto px-3 md:px-4 flex items-center justify-between h-full">
        {/* Left: Logo + Search */}
        <div className="flex items-center flex-1 min-w-0 gap-2 md:gap-3">
          <Link href={currentUser ? "/home/feed" : "/"} className="flex-shrink-0">
            <a>
              <Image src="/logoifca.png" alt="logo" width={100} height={40} objectFit="contain" priority className="w-auto h-6 md:h-7 cursor-pointer" />
            </a>
          </Link>
        </div>
        {/* Center: Navigation Links (restored original nav) */}
        {currentUser ? (
          <div className="hidden md:flex items-center justify-center space-x-0.5 md:space-x-1">
            <ul className="flex items-center">
              <NavLink href="/home/feed" icon={<DynamicFeedIcon />} text="Feed" />
              <NavLink href="/communities" icon={<TravelExploreIcon />} text="Explore" />
              <NavLink href="/mySchedule" icon={<DateRangeIcon />} text="Schedule" />
              <NavLink href="/myCommunities" icon={
                <Badge
                  badgeContent={pendingConnectionsCount > 0 ? pendingConnectionsCount : null}
                  color="error"
                  invisible={pendingConnectionsCount === 0}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: '16px',
                      minWidth: '16px',
                      padding: '0 4px',
                      top: 2,
                      right: -4,
                      fontWeight: '700',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <PeopleAltIcon />
                </Badge>
              } text="Network" />
              <NavLink href="/courses" icon={<Book />} text="Courses" />
              <NavLink href="/competitions" icon={<EmojiEventsIcon />} text="Competitions" />
            </ul>
          </div>
        ) : <></>}
        {/* Right: Cart, Notification, Profile, Business, Premium, Hamburger */}
        <div className="flex items-center space-x-2 md:space-x-3 ml-2">
          {/* Cart */}
          {currentUser ? (
            <NavLink
              href="/cart"
              icon={
                <Badge
                  badgeContent={cart?.length > 0 ? cart.length : null}
                  color="error"
                  invisible={!cart?.length || cart.length === 0 || !currentUser}
                  max={99}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: '16px',
                      minWidth: '16px',
                      padding: '0 4px',
                      zIndex: 10,
                      top: 2,
                      right: -4,
                      fontWeight: '700',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <ShoppingCartIcon className="text-orange-800 hover:text-orange-900 transition-colors" />
                </Badge>
              }
              text="Cart"
            />
          ) : <></>}
          {/* Notification */}
          {currentUser ? (
            <div className="relative flex flex-col items-center justify-center min-w-[56px] overflow-visible" ref={notificationRef}>
              <Badge
                badgeContent={unreadCount > 0 ? unreadCount : null}
                color="error"
                invisible={unreadCount === 0 || !currentUser}
                max={99}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    height: '16px',
                    minWidth: '16px',
                    padding: '0 4px',
                    zIndex: 10,
                    top: 2,
                    right: -4,
                    fontWeight: '700',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  },
                }}
              >
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    // Refresh notifications when opening dropdown
                    if (!showNotifications) {
                      fetchNotifications()
                    }
                  }}
                  className="flex items-center justify-center text-orange-800 hover:text-orange-900 focus:text-orange-900 hover:bg-orange-50 rounded-lg transition-all duration-200 p-2 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
                  style={{ width: 40, height: 40 }}
                  aria-label="Notifications"
                >
                  {unreadCount > 0 ? (
                    <NotificationsActiveIcon className="text-[22px] text-orange-700" />
                  ) : (
                    <NotificationsIcon className={`text-[22px] ${showNotifications ? 'text-orange-700' : 'text-orange-800'}`} />
                  )}
                </button>
              </Badge>
              {showNotifications && (
                <div className="absolute top-[48px] right-0 w-[320px] md:w-[360px] z-[100] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <NotificationDropdown
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                    onViewAll={() => router.push('/notifications')}
                    onConnectionRequestClick={handleConnectionRequestClick}
                    onNavigate={router.push}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>
              )}
              <span className="text-orange-800 font-medium text-[10px] md:text-[12px] mt-0.5 leading-tight">Notifications</span>
            </div>
          ) : <></>}
          {/* Profile (Me) */}
          {currentUser ? (
            <Profile currentUser={currentUser} rewardPoints={rewards} setEditModal={setEditModal} />
          ) : <></>}

          {/* App Download buttons and Login button if not logged in */}
          {!currentUser ? (
            <div className="flex items-center gap-2 ml-2">
              {/* App Download Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <a
                  href="https://play.google.com/store/apps/details?id=com.app.ifca_flutter_app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-black hover:bg-gray-900 border border-gray-700 hover:border-orange-500 px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
                  title="Get it on Google Play"
                >
                  <SiGoogleplay className="text-base text-white group-hover:text-orange-400 transition-colors" />
                  <span className="text-xs font-semibold text-white group-hover:text-orange-400 transition-colors hidden md:inline">Play</span>
                </a>
                <a
                  href="https://apps.apple.com/app/ifca/id123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-black hover:bg-gray-900 border border-gray-700 hover:border-orange-500 px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
                  title="Download on the App Store"
                >
                  <SiAppstore className="text-base text-white group-hover:text-orange-400 transition-colors" />
                  <span className="text-xs font-semibold text-white group-hover:text-orange-400 transition-colors hidden md:inline">App Store</span>
                </a>
              </div>
              {router.pathname === '/' && (
                <AnimatedButton
                  href="/onBoard"
                  variant="primary"
                  size="md"
                  className="rounded-xl px-6 py-2.5 font-semibold"
                >
                  Login
                </AnimatedButton>
              )}
            </div>
          ) : <></>}
        </div>
      </div>
      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 top-[64px] z-[100] bg-white shadow-lg md:hidden">
          <div className="flex flex-col h-full">
            <form onSubmit={handleSearch} className="flex items-center bg-gray-100 rounded px-2 py-2 m-2">
              <SearchIcon className="text-gray-500 mr-2" />
              <input
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="bg-transparent outline-none w-full text-[15px]"
                placeholder="Search..."
              />
            </form>
            <ul className="flex flex-col space-y-2 px-4 py-2">
              <NavLink href="/home/feed" icon={<HomeIcon />} text="Home" mobile onClick={() => setShowMobileMenu(false)} />
              <NavLink href="/myCommunities" icon={
                <Badge
                  badgeContent={pendingConnectionsCount > 0 && currentUser ? pendingConnectionsCount : null}
                  color="error"
                  invisible={pendingConnectionsCount === 0 || !currentUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      height: '18px',
                      minWidth: '18px',
                      padding: '0 4px',
                      zIndex: 10,
                      top: 2,
                      right: -2,
                    },
                  }}
                >
                  <PeopleAltIcon />
                </Badge>
              } text="My Network" mobile onClick={() => setShowMobileMenu(false)} />
              <NavLink href="/jobs" icon={<ShoppingCartOutlinedIcon />} text="Jobs" mobile onClick={() => setShowMobileMenu(false)} />
              <NavLink href="/messaging" icon={<MoreVertIcon />} text="Messaging" mobile onClick={() => setShowMobileMenu(false)} />
              <li 
                className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                onClick={() => {
                  setShowMobileMenu(false)
                  router.push('/notifications')
                }}
              >
                <NotificationsIcon className="mr-2 text-orange-800" />
                <span className="text-orange-800">Notifications</span>
                {unreadCount > 0 && (
                  <Badge 
                    badgeContent={unreadCount > 0 ? unreadCount : null}
                    color="error" 
                    className="ml-2"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        height: '18px',
                        minWidth: '18px',
                        padding: '0 4px',
                      },
                    }}
                  />
                )}
              </li>
              <li>
                <Profile currentUser={currentUser} rewardPoints={rewards} setEditModal={setEditModal} />
              </li>
            </ul>
            <div className="mt-auto p-4 border-t">
              {currentUser ? (
                <AnimatedButton
                  onClick={handleLogout}
                  variant="primary"
                  size="md"
                  fullWidth
                  className="rounded-full text-[14px]"
                >
                  Logout
                </AnimatedButton>
              ) : (
                <AnimatedButton
                  href="/onBoard"
                  variant="primary"
                  size="md"
                  fullWidth
                  className="rounded-full text-[14px]"
                >
                  Login
                </AnimatedButton>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.nav>
    {currentUser && (
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:hidden"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0), 0px)',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
          <div className="flex justify-around items-center w-full h-16 px-1">
            {[
              { href: "/home/feed", icon: <DynamicFeedIcon />, label: "Feed" },
              { href: "/communities", icon: <TravelExploreIcon />, label: "Explore" },
              { href: "/mySchedule", icon: <DateRangeIcon />, label: "Schedule" },
              { href: "/myCommunities", icon: (
                <Badge
                  badgeContent={pendingConnectionsCount > 0 && currentUser ? pendingConnectionsCount : null}
                  color="error"
                  invisible={pendingConnectionsCount === 0 || !currentUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: '16px',
                      minWidth: '16px',
                      padding: '0 3px',
                      zIndex: 10,
                      top: -2,
                      right: -4,
                      fontWeight: '700',
                    },
                  }}
                >
                  <PeopleAltIcon />
                </Badge>
              ), label: "Network" },
              { href: "/courses", icon: <Book />, label: "Courses" },
              { href: "/competitions", icon: <EmojiEventsIcon />, label: "Competitions" },
            ].map(({ href, icon, label }) => {
              const isActive = router.pathname === href || 
                              (href === "/home/feed" && router.pathname.startsWith("/home/feed")) ||
                              (href === "/communities" && router.pathname.startsWith("/communities")) ||
                              (href === "/mySchedule" && router.pathname.startsWith("/mySchedule")) ||
                              (href === "/myCommunities" && router.pathname.startsWith("/myCommunities")) ||
                              (href === "/courses" && router.pathname.startsWith("/courses")) ||
                              (href === "/competitions" && router.pathname.startsWith("/competitions"));
              
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className={`relative flex-1 flex flex-col items-center justify-center min-w-0 px-1 py-1.5 transition-all duration-200 active:scale-95 ${
                    isActive 
                      ? "text-orange-600" 
                      : "text-gray-600 active:text-orange-600"
                  }`}
                  aria-label={label}
                >
                  {isActive && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-orange-600 rounded-full" />
                  )}
                  <div className={`flex items-center justify-center mb-0.5 transition-all duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}>
                    {React.cloneElement(icon, { 
                      className: `text-[22px] ${isActive ? "text-orange-600" : "text-gray-600"}`,
                      style: { fontSize: '22px' }
                    })}
                  </div>
                  <span
                    className={`text-[10px] font-medium leading-tight text-center truncate w-full ${
                      isActive ? "text-orange-600 font-semibold" : "text-gray-600"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  )
}

const NavLink = ({ href, icon, text, mobile, onClick }) => {
  const router = useRouter()
  const isActive = router.pathname === href || 
                  (href === "/home/feed" && router.pathname.startsWith("/home/feed")) ||
                  (href === "/communities" && router.pathname.startsWith("/communities")) ||
                  (href === "/mySchedule" && router.pathname.startsWith("/mySchedule")) ||
                  (href === "/myCommunities" && router.pathname.startsWith("/myCommunities")) ||
                  (href === "/courses" && router.pathname.startsWith("/courses")) ||
                  (href === "/competitions" && router.pathname.startsWith("/competitions"))

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
    
    router.push(href)
  }

  return (
      <motion.li
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      className={
        `
          ${isActive
            ? "text-orange-700 border-b-2 border-orange-600 font-semibold"
            : "text-orange-800 hover:text-orange-900"}
          ${mobile
            ? "px-4 py-3 flex items-center space-x-3 hover:bg-orange-50 rounded-lg"
            : "px-2 md:px-3 py-2 flex flex-col items-center justify-center text-center min-w-[70px] md:min-w-[80px] hover:bg-orange-50 rounded-lg"}
          cursor-pointer transition-all duration-200
      `
      }
      onClick={handleClick}
      >
        {icon && <span className={`${mobile ? "text-xl" : "text-[20px] md:text-[22px]"} ${isActive ? "text-orange-700" : "text-orange-800"}`}>{icon}</span>}
        <span className={`${mobile ? "text-[10px]" : "text-[11px] md:text-[12px]"} font-medium leading-tight mt-0.5`}>{text}</span>
      </motion.li>
  )
}

export default Navbar; // No React.memo, always re-render on Redux user change
