import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useCallback } from "react";
import { MdCancel, MdSegment, MdApps, MdKeyboardArrowDown, MdLogout, MdPerson, MdHome, MdGroups, MdEvent, MdBusiness, MdPeople, MdSchool, MdLibraryBooks, MdRequestPage, MdFormatListBulleted, MdEmojiEvents, MdCardGiftcard, MdArticle, MdConfirmationNumber, MdVideocam, MdMenu, MdClose, MdShoppingCart, MdNotifications, MdExpandMore, MdLogin, MdForum } from "react-icons/md";
import { SiGoogleplay, SiAppstore } from 'react-icons/si';
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { logoutUser } from "../../store/features/userSlice";
import data from "@/utils/data";
import styles from "../../styles/common/Navbar.module.css";
import AnimatedButton from "./AnimatedButton";

// Get logo from data.js, fallback to default
const getLogo = () => data?.logo || "/logoifca.png";

const Navbar = () => {
  const [open, setOpen] = useState(true);
  const [showAppsDropdown, setShowAppsDropdown] = useState(false);
  const [visibleLinks, setVisibleLinks] = useState([]);
  const [overflowLinks, setOverflowLinks] = useState([]);
  const router = useRouter();
  const user = useSelector((state) => state.user.user);
  const isAuthenticated = !!user;
  const dispatch = useDispatch();
  const navbarRef = useRef(null);
  const navContainerRef = useRef(null);
  const appsDropdownRef = useRef(null);
  const moreButtonRef = useRef(null);
  const moreDropdownRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const [visibleNavItems, setVisibleNavItems] = useState([]);
  const [overflowNavItems, setOverflowNavItems] = useState([]);
  const navItemRefs = useRef({});

  // Authentication status is now handled by Redux user state

  // Calculate visible nav items based on available space
  const calculateResponsiveNavItems = useCallback(() => {
    if (!isAuthenticated) {
      setVisibleNavItems([]);
      setOverflowNavItems([]);
      return;
    }
    
    const { primary: primaryNavItems, more: moreNavItems } = getNavigationItems();
    const allItems = [...primaryNavItems];
    
    // Only calculate on desktop (md and above)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setVisibleNavItems([]);
      setOverflowNavItems([...allItems, ...moreNavItems]);
      return;
    }
    
    if (!navContainerRef.current || !navbarRef.current) {
      // If refs aren't ready, show all items as visible
      setVisibleNavItems(allItems);
      setOverflowNavItems([...moreNavItems]);
      return;
    }
    
    const container = navContainerRef.current;
    const navbar = navbarRef.current;
    const containerRect = container.getBoundingClientRect();
    const navbarRect = navbar.getBoundingClientRect();
    const containerWidth = navbarRect.width;
    
    // Get logo and button widths (more accurate measurements)
    const logoWidth = 200; // Approximate logo width
    const logoutButtonWidth = 140; // Approximate logout button width
    const moreButtonWidth = 80; // Approximate more button width
    const padding = 64; // Container padding (px-4 sm:px-6)
    
    // Calculate available width for nav items
    const availableWidth = containerWidth - logoWidth - logoutButtonWidth - moreButtonWidth - padding;
    
    let usedWidth = 0;
    const visible = [];
    const overflow = [];
    
    // Measure each item or use estimated width
    allItems.forEach((item, index) => {
      const itemRef = navItemRefs.current[`item-${index}`];
      let itemWidth = 80; // Base estimated width
      
      if (itemRef) {
        itemWidth = itemRef.offsetWidth || 80;
      } else {
        // Estimate based on text length
        itemWidth = Math.max(60, item.name.length * 7 + 40);
      }
      
      if (usedWidth + itemWidth <= availableWidth) {
        visible.push(item);
        usedWidth += itemWidth;
      } else {
        overflow.push(item);
      }
    });
    
    // Combine overflow items with moreNavItems
    setVisibleNavItems(visible);
    setOverflowNavItems([...overflow, ...moreNavItems]);
  }, [isAuthenticated, getNavigationItems]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && !open) {
        setOpen(true);
      } else if (window.innerWidth < 768) {
        setOpen(false);
      }
      calculateVisibleLinks();
      // Debounce the responsive calculation
      const timeoutId = setTimeout(() => {
        calculateResponsiveNavItems();
      }, 150);
      return () => clearTimeout(timeoutId);
    };
    
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial calculation
    
    // Also calculate after DOM is ready
    const timeoutId = setTimeout(() => {
      calculateResponsiveNavItems();
    }, 300);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [open, calculateResponsiveNavItems]);
  
  // Recalculate when user changes
  useEffect(() => {
    calculateResponsiveNavItems();
  }, [user?.userType, calculateResponsiveNavItems]);

  // Calculate which links should be visible vs overflow
  const calculateVisibleLinks = () => {
    if (!user?.userType) return;
    
    const paths = getPathsForUserType(user.userType);
    const navbarWidth = navbarRef.current?.offsetWidth || 1200;
    const logoWidth = 200; // Logo width
    const buttonWidth = 120; // Logout/Login button width
    const appsButtonWidth = 80; // Apps dropdown button width
    const linkPadding = 24; // Padding per link
    const availableWidth = navbarWidth - logoWidth - buttonWidth - appsButtonWidth - 100; // 100px for margins
    
    let currentWidth = 0;
    const visible = [];
    const overflow = [];
    
    paths.forEach((item, index) => {
      const linkWidth = item.name.length * 8 + linkPadding; // Approximate width
      if (currentWidth + linkWidth <= availableWidth) {
        visible.push(item);
        currentWidth += linkWidth;
      } else {
        overflow.push(item);
      }
    });
    
    setVisibleLinks(visible);
    setOverflowLinks(overflow);
  };

  const getPathsForUserType = (userType) => {
    const paths = {
      admin: [
        { name: "Home", path: "/admin", icon: <MdHome /> },
        { name: "Community", path: "/admin/community", icon: <MdGroups /> },
        { name: "Sessions", path: "/admin/session", icon: <MdEvent /> },
        { name: "Expert", path: "/admin/expert", icon: <MdPeople /> },
        { name: "Partner", path: "/admin/partner", icon: <MdBusiness /> },
        { name: "People", path: "/admin/people", icon: <MdPeople /> },
        { name: "Course", path: "/admin/courses", icon: <MdSchool /> },
        { name: "Resources", path: "/admin/resources", icon: <MdLibraryBooks /> },
        { name: "Requests", path: "/admin/requests", icon: <MdRequestPage /> },
        { name: "Forms", path: "/admin/forms", icon: <MdFormatListBulleted /> },
        { name: "Competitions", path: "/admin/competitions", icon: <MdEmojiEvents /> },
        { name: "Rewards", path: "/admin/rewardManagement", icon: <MdCardGiftcard /> },
        { name: "Blogs", path: "/admin/blog", icon: <MdArticle /> },
        { name: "Tickets", path: "/admin/ticket", icon: <MdConfirmationNumber /> },
        { name: "Video", path: "/admin/video", icon: <MdVideocam /> },
        { name: "Cart", path: "/admin/cart", icon: <MdShoppingCart /> },
        { name: "Notifications", path: "/admin/notifications", icon: <MdNotifications /> }
      ],
      expert: [
        { name: "Home", path: "/expert", icon: <MdHome /> },
        { name: "Community", path: "/expert/community", icon: <MdGroups /> },
        { name: "Sessions", path: "/expert/session", icon: <MdEvent /> },
        { name: "Resources", path: "/expert/resources", icon: <MdLibraryBooks /> },
        { name: "Competitions", path: '/expert/competitions', icon: <MdEmojiEvents /> },
        { name: "Requests", path: "/expert/requests", icon: <MdRequestPage /> },
        { name: "Forms", path: "/expert/forms", icon: <MdFormatListBulleted /> }
      ],
      partner: [
        { name: "Home", path: "/partner", icon: <MdHome /> },
        { name: "Community", path: "/partner/community", icon: <MdGroups /> },
        { name: "Sessions", path: "/partner/session", icon: <MdEvent /> },
        { name: "Resources", path: "/partner/resources", icon: <MdLibraryBooks /> },
        { name: "Requests", path: "/partner/requests", icon: <MdRequestPage /> },
        { name: "Forms", path: "/partner/forms", icon: <MdFormatListBulleted /> },
        { name: "Competitions", path: "/partner/competitions", icon: <MdEmojiEvents /> }
      ]
    };
    return paths[userType] || [];
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (appsDropdownRef.current && !appsDropdownRef.current.contains(event.target)) {
        setShowAppsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast("Logged Out!", { type: "success" });
    router.replace(`/auth`);
  };

  const handleLogin = () => {
    router.push('/auth');
  };

  if (router?.pathname === "/expert/community/chat") return null;

  // Example notification count (replace with real data if available)
  const notificationCount = 2;
  // Example user avatar (replace with user.profilePic if available)
  const avatarUrl = user?.profilePic || "https://randomuser.me/api/portraits/men/32.jpg";

  // All navigation logic below uses user?.userType
  const getNavigationItems = useCallback(() => {
    if (!user?.userType) return { primary: [], more: [] };
    
    const basePath = `/${user.userType}`;
    
    switch (user.userType) {
      case 'admin':
        return {
          primary: [
            { name: "Home", path: "/admin", icon: <MdHome /> },
            { name: "Community", path: "/admin/community", icon: <MdGroups /> },
            { name: "Sessions", path: "/admin/session", icon: <MdEvent /> },
            { name: "Huddles", path: "/admin/huddle", icon: <MdForum /> },
            { name: "Expert", path: "/admin/expert", icon: <MdPeople /> },
            { name: "Partner", path: "/admin/partner", icon: <MdBusiness /> },
            { name: "People", path: "/admin/people", icon: <MdPeople /> },
            { name: "Course", path: "/admin/courses", icon: <MdSchool /> },
            { name: "Resources", path: "/admin/resources", icon: <MdLibraryBooks /> },
            { name: "Requests", path: "/admin/requests", icon: <MdRequestPage /> },
          ],
          more: [
            { name: "Forms", path: "/admin/forms", icon: <MdFormatListBulleted /> },
            { name: "Competitions", path: "/admin/competitions", icon: <MdEmojiEvents /> },
            { name: "Rewards", path: "/admin/rewardManagement", icon: <MdCardGiftcard /> },
            { name: "Blogs", path: "/admin/blog", icon: <MdArticle /> },
            { name: "Tickets", path: "/admin/ticket", icon: <MdConfirmationNumber /> },
            { name: "Video", path: "/admin/video", icon: <MdVideocam /> },
          ]
        };
      
      case 'expert':
        return {
          primary: [
            { name: "Home", path: "/expert", icon: <MdHome /> },
            { name: "Community", path: "/expert/community", icon: <MdGroups /> },
            { name: "Sessions", path: "/expert/session", icon: <MdEvent /> },
            { name: "Huddles", path: "/expert/huddle", icon: <MdForum /> },
            { name: "Resources", path: "/expert/resources", icon: <MdLibraryBooks /> },
            { name: "Competitions", path: "/expert/competitions", icon: <MdEmojiEvents /> },
            { name: "Requests", path: "/expert/requests", icon: <MdRequestPage /> },
          ],
          more: [
            { name: "Forms", path: "/expert/forms", icon: <MdFormatListBulleted /> },
          ]
        };
      
      case 'partner':
        return {
          primary: [
            { name: "Home", path: "/partner", icon: <MdHome /> },
            { name: "Community", path: "/partner/community", icon: <MdGroups /> },
            { name: "Sessions", path: "/partner/session", icon: <MdEvent /> },
            { name: "Huddles", path: "/partner/huddle", icon: <MdForum /> },
            { name: "Resources", path: "/partner/resources", icon: <MdLibraryBooks /> },
            { name: "Requests", path: "/partner/requests", icon: <MdRequestPage /> },
            { name: "Competitions", path: "/partner/competitions", icon: <MdEmojiEvents /> },
          ],
          more: [
            { name: "Forms", path: "/partner/forms", icon: <MdFormatListBulleted /> },
          ]
        };
      
      default:
        return { primary: [], more: [] };
    }
  }, [user?.userType]);

  const { primary: primaryNavItems, more: moreNavItems } = getNavigationItems();

  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  useEffect(() => {
    if (!showMoreDropdown) return;
    function handleClickOutside(event) {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target)
      ) {
        setShowMoreDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreDropdown]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <nav ref={navbarRef} className="bg-orange-100 border-b border-orange-100 shadow-sm sticky top-0 z-50 rounded-xl min-h-[72px] px-4 sm:px-6 py-2">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center">
          <Link href={isAuthenticated ? (user?.userType ? `/${user.userType}` : '/') : '/'} className="flex-shrink-0">
            <Image
              src={getLogo()}
              alt={data?.companyName || "IFCA Logo"}
              width={120}
              height={40}
              className="w-auto h-6 md:h-7 cursor-pointer"
              priority
              unoptimized
            />
          </Link>
        </div>
        
        {/* Desktop Nav - Only show if authenticated */}
        {isAuthenticated && (
          <div 
            ref={navContainerRef}
            className={`flex-1 items-center justify-center gap-4 lg:gap-6 hidden md:flex ${styles.scrollbarHide}`}
          >
            {/* Visible Nav Items */}
            {visibleNavItems.length > 0 && visibleNavItems.map((item, idx) => {
              const isActive = router.pathname === item.path;
              return (
                <Link href={item.path} key={`visible-${item.name}-${idx}`}>
                  <span 
                    ref={(el) => {
                      if (el) navItemRefs.current[`item-${idx}`] = el;
                    }}
                    className={`flex flex-col items-center justify-center transition-all relative group min-w-[60px] cursor-pointer px-2 py-1 rounded-lg flex-shrink-0 ${
                      isActive 
                        ? 'text-orange-700 bg-orange-100' 
                        : 'text-orange-900 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <span className="text-xl lg:text-2xl mb-1 relative">{item.icon}</span>
                    <span className="text-xs font-medium tracking-wide whitespace-nowrap">{item.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-600 rounded-full" />
                    )}
                </span>
              </Link>
              );
            })}
            
            {/* More Dropdown - Show if there are overflow items */}
            {overflowNavItems.length > 0 && (
              <div className="relative flex-shrink-0">
              <button
                ref={moreButtonRef}
                  className={`flex flex-col items-center justify-center transition-all min-w-[60px] focus:outline-none cursor-pointer px-2 py-1 rounded-lg ${
                    showMoreDropdown
                      ? 'text-orange-700 bg-orange-100'
                      : 'text-orange-900 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                onClick={() => setShowMoreDropdown((prev) => !prev)}
                  aria-label="More options"
              >
                  <span className="text-xl lg:text-2xl mb-1 transform transition-transform duration-200" style={{ transform: showMoreDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <MdExpandMore />
                  </span>
                <span className="text-xs font-medium tracking-wide">More</span>
                  {overflowNavItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {overflowNavItems.length}
                    </span>
                  )}
              </button>
              {showMoreDropdown && (
                <div
                  ref={moreDropdownRef}
                    className={`absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-orange-100 py-2 z-[9999] ${styles.animateFadeIn} max-h-[70vh] overflow-y-auto`}
                >
                    {overflowNavItems.map((item, idx) => {
                      const isActive = router.pathname === item.path;
                      return (
                        <Link href={item.path} key={`overflow-${item.name}-${idx}`} onClick={() => setShowMoreDropdown(false)}>
                          <span className={`flex items-center gap-3 px-4 py-2 transition-colors relative ${
                            isActive
                              ? 'text-orange-700 bg-orange-50 border-l-4 border-orange-600'
                              : 'text-orange-900 hover:text-orange-600 hover:bg-orange-50'
                          }`}>
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                      </span>
                    </Link>
                      );
                    })}
                </div>
              )}
            </div>
            )}
          </div>
        )}
        
        {/* Desktop App Store Buttons & Login/Logout Button */}
        <div className="flex-shrink-0 items-center hidden md:flex gap-2">
          {!isAuthenticated && (
            <div className="flex items-center gap-2">
              <a
                href="https://play.google.com/store/apps/details?id=com.app.ifca_flutter_app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-black hover:bg-gray-900 border border-gray-700 hover:border-orange-500 px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
                title="Get it on Google Play"
              >
                <SiGoogleplay className="text-base text-white group-hover:text-orange-400 transition-colors" />
                <span className="text-xs font-semibold text-white group-hover:text-orange-400 transition-colors hidden lg:inline">Play</span>
              </a>
              <a
                href="https://apps.apple.com/in/app/ifca/id6740889552"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-black hover:bg-gray-900 border border-gray-700 hover:border-orange-500 px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
                title="Download on the App Store"
              >
                <SiAppstore className="text-base text-white group-hover:text-orange-400 transition-colors" />
                <span className="text-xs font-semibold text-white group-hover:text-orange-400 transition-colors hidden lg:inline">App Store</span>
              </a>
            </div>
          )}
          {isAuthenticated ? (
            <AnimatedButton
              onClick={handleLogout}
              variant="primary"
              size="md"
              className="flex items-center gap-2"
            >
              <MdLogout className="text-lg" />
              <span className="hidden lg:inline">Log Out</span>
            </AnimatedButton>
          ) : (
            <AnimatedButton
              onClick={handleLogin}
              variant="primary"
              size="md"
            >
              Log In
            </AnimatedButton>
          )}
        </div>
        
        {/* Mobile Menu Button & Actions - Only show if authenticated */}
        {isAuthenticated && (
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Menu Dropdown */}
            <div className="relative">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
                className="text-orange-900 hover:text-orange-600 focus:outline-none cursor-pointer p-2 rounded-lg hover:bg-orange-100 transition-colors"
                aria-label="Open menu"
            >
              <MdMenu className="text-3xl" />
              </button>
            </div>
            {/* Quick Logout Button on Mobile */}
            <AnimatedButton
              onClick={handleLogout}
              variant="primary"
              size="sm"
              className="flex items-center gap-1"
              aria-label="Logout"
            >
              <MdLogout className="text-lg" />
              <span className="hidden sm:inline">Log Out</span>
            </AnimatedButton>
          </div>
        )}
        
        {/* Mobile App Store Buttons & Login Button - Only show if not authenticated */}
        {!isAuthenticated && (
          <div className="md:hidden flex items-center gap-2">
            <a
              href="https://play.google.com/store/apps/details?id=com.app.ifca_flutter_app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-black hover:bg-gray-900 border border-gray-700 hover:border-orange-500 px-3 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
              title="Get it on Google Play"
            >
              <SiGoogleplay className="text-base text-white group-hover:text-orange-400 transition-colors" />
            </a>
            <a
              href="https://apps.apple.com/in/app/ifca/id6740889552"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-black hover:bg-gray-900 border border-gray-700 hover:border-orange-500 px-3 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
              title="Download on the App Store"
            >
              <SiAppstore className="text-base text-white group-hover:text-orange-400 transition-colors" />
            </a>
            <AnimatedButton
              onClick={handleLogin}
              variant="primary"
              size="sm"
            >
              Log In
            </AnimatedButton>
          </div>
        )}
      </div>
      
      {/* Mobile Drawer - Only show if authenticated */}
      {isAuthenticated && isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div 
            ref={mobileMenuRef} 
            className={`relative bg-white w-72 sm:w-80 h-full shadow-xl flex flex-col overflow-y-auto ${styles.animateSlideInLeft}`}
          >
            {/* Sticky Header with Logo and Close Button */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-4 border-b border-orange-100 shadow-sm">
              <Image
                src={getLogo()}
                alt={data?.companyName || "IFCA Logo"}
                width={120}
                height={32}
                className="h-8 w-auto"
                unoptimized
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-orange-900 hover:text-orange-600 focus:outline-none cursor-pointer p-2 rounded-lg hover:bg-orange-50 transition-colors"
                aria-label="Close menu"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>
            
            {/* Primary Nav Items Section */}
            {primaryNavItems.length > 0 && (
              <div className="px-3 py-4">
                <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2 px-2">
                  Main Menu
                </h3>
                <div className="flex flex-col gap-1">
                  {primaryNavItems.map((item, idx) => {
                    const isActive = router.pathname === item.path;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          router.push(item.path);
                        }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-base font-medium cursor-pointer w-full text-left ${
                          isActive 
                            ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-600' 
                            : 'text-orange-900 hover:text-orange-600 hover:bg-orange-50'
                        }`}
                      >
                        <span className={`text-xl ${isActive ? 'text-orange-700' : ''}`}>{item.icon}</span>
                        <span className="flex-1">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* More Nav Items Section */}
            {moreNavItems.length > 0 && (
              <div className="px-3 py-2 border-t border-orange-100">
                <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2 px-2">
                  More Options
                </h3>
                <div className="flex flex-col gap-1">
                  {moreNavItems.map((item, idx) => {
                    const isActive = router.pathname === item.path;
                    return (
                <button
                  key={item.name}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push(item.path);
                  }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-base font-medium cursor-pointer w-full text-left ${
                          isActive 
                            ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-600' 
                            : 'text-orange-900 hover:text-orange-600 hover:bg-orange-50'
                        }`}
                >
                        <span className={`text-xl ${isActive ? 'text-orange-700' : ''}`}>{item.icon}</span>
                        <span className="flex-1">{item.name}</span>
                </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* User Info & Logout at bottom */}
            <div className="mt-auto p-4 border-t border-orange-100 bg-orange-50">
              {user && (
                <div className="mb-3 px-2">
                  <div className="text-sm font-semibold text-orange-900 capitalize">
                    {user.userType || 'User'}
                  </div>
                  {user.email && (
                    <div className="text-xs text-orange-600 truncate">
                      {user.email}
                    </div>
                  )}
            </div>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-5 py-3 text-base font-semibold shadow-md flex items-center gap-2 justify-center cursor-pointer transition-all hover:shadow-lg"
              >
                <MdLogout className="text-lg" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; // No React.memo, always re-render on Redux user change