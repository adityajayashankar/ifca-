import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import CommunityCard from "@/components/communityCard";
import Head from "next/head";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress, Skeleton } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import {
  setCommunities,
  selectAllCommunities,
  selectTotalCommunities,
  getCommunityTagsFromCommunitySlice,
  selectCommunityTagsFromCommunitySlice,
  selectCommunityTagsLoadingFromCommunitySlice,
  selectCommunityTagsErrorFromCommunitySlice,
  fetchCommunitiesByTagId,
} from "@/store/features/communitySlice";
import { useSelector as useUserSelector } from "react-redux";
import { selectNonSubscribedCommunities } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";

const Communities = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { tag: selectedTag } = router.query;
  
  // Redux selectors
  const communities = useSelector(selectAllCommunities);
  const totalCommunities = useSelector(selectTotalCommunities);
  const tags = useSelector(selectCommunityTagsFromCommunitySlice);
  const tagsLoading = useSelector(selectCommunityTagsLoadingFromCommunitySlice);
  const tagsError = useSelector(selectCommunityTagsErrorFromCommunitySlice);
  const nonSubscribedCommunities = useUserSelector(selectNonSubscribedCommunities);
  
  // Local state for pagination and UI
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTag, setActiveTag] = useState(selectedTag || "all");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(true);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchTotalCount, setSearchTotalCount] = useState(0);
  const [showEndMessage, setShowEndMessage] = useState(false);
  const [sortBy, setSortBy] = useState("recent"); // recent, name, price, members
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [priceFilter, setPriceFilter] = useState("all"); // all, free, paid
  const observerRef = useRef();
  const tagBarRef = useRef();
  const searchTimeoutRef = useRef();
  const endMessageTimeoutRef = useRef();
  const sortMenuRef = useRef();

  // Intersection Observer for infinite scroll
  const lastElementRef = useCallback(node => {
    if (loadingCommunities || isSearching || searchLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (showSearchResults && searchHasMore && !searchLoadingMore) {
          loadMoreSearchResults();
        } else if (!showSearchResults && hasMore && !loadingMore) {
          loadMoreCommunities();
        }
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loadingCommunities, hasMore, loadingMore, isSearching, showSearchResults, searchHasMore, searchLoadingMore]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tags on mount using communitySlice
  useEffect(() => {
    dispatch(getCommunityTagsFromCommunitySlice());
  }, [dispatch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (endMessageTimeoutRef.current) {
        clearTimeout(endMessageTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search communities function
  const searchCommunities = useCallback(async (query, page = 1, append = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchPage(1);
      setSearchHasMore(true);
      setSearchTotalCount(0);
      return;
    }

    if (page === 1) {
      setIsSearching(true);
    } else {
      setSearchLoadingMore(true);
    }

    try {
      // Try public endpoint first
      const publicUrl = `http://localhost:5000/api/v1/community/search-communities-public?q=${encodeURIComponent(query)}&page=${page}&limit=12`;
      const publicResponse = await fetch(publicUrl);
      
      if (publicResponse.ok) {
        const data = await publicResponse.json();
        if (data.success) {
          if (append) {
            setSearchResults(prev => [...prev, ...data.communities]);
          } else {
            setSearchResults(data.communities);
          }
          setSearchPage(page);
          setSearchHasMore(data.pagination?.hasNextPage || false);
          setSearchTotalCount(data.pagination?.totalCount || 0);
          setShowSearchResults(true);
          return;
        }
      }
      
      // Fallback to authenticated endpoint
      const response = await api.get(`/community/search-communities?q=${encodeURIComponent(query)}&page=${page}&limit=12`);
      if (response.data.success) {
        if (append) {
          setSearchResults(prev => [...prev, ...response.data.communities]);
        } else {
          setSearchResults(response.data.communities);
        }
        setSearchPage(page);
        setSearchHasMore(response.data.pagination?.hasNextPage || false);
        setSearchTotalCount(response.data.pagination?.totalCount || 0);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching communities:', error);
      if (!append) {
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
      setSearchLoadingMore(false);
    }
  }, []);

  // Handle search input change with debouncing
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        searchCommunities(query);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);
  }, [searchCommunities]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchPage(1);
    setSearchHasMore(true);
    setSearchTotalCount(0);
    setShowEndMessage(false);
    if (endMessageTimeoutRef.current) {
      clearTimeout(endMessageTimeoutRef.current);
    }
  }, []);

  // Load more communities for infinite scroll
  const loadMoreCommunities = async () => {
    if (loadingMore || !hasMore || showSearchResults) return;
    
    setLoadingMore(true);
    try {
      const result = await dispatch(setCommunities());
      if (result.payload && result.payload.communities) {
        const newCommunities = result.payload.communities;
        if (newCommunities.length > 0) {
          setPage(prev => prev + 1);
          setHasMore(newCommunities.length === 12);
        } else {
          setHasMore(false);
          setShowEndMessage(true);
          if (endMessageTimeoutRef.current) {
            clearTimeout(endMessageTimeoutRef.current);
          }
          endMessageTimeoutRef.current = setTimeout(() => {
            setShowEndMessage(false);
          }, 30000);
        }
      }
    } catch (error) {
      console.error('Error loading more communities:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load more search results
  const loadMoreSearchResults = async () => {
    if (searchLoadingMore || !searchHasMore || !searchQuery.trim()) return;
    
    const nextPage = searchPage + 1;
    await searchCommunities(searchQuery, nextPage, true);
  };


  // Fetch communities when tag changes
  useEffect(() => {
    if (activeTag === 'my' || showSearchResults) return;
    
    setLoadingCommunities(true);
    setError("");
    setPage(1);
    setHasMore(true);
    
    const fetchCommunities = async () => {
      if (!activeTag || activeTag === 'all') {
        try {
          const response = await api.get('/community/');
          if (response.data.success) {
            dispatch(setCommunities(response.data.communities));
            setHasMore(response.data.communities.length === 12);
          }
        } catch (error) {
          console.error('Error fetching all communities:', error);
          setError("Failed to load communities.");
        } finally {
          setLoadingCommunities(false);
        }
      } else {
        dispatch(fetchCommunitiesByTagId(activeTag))
          .then((result) => {
            if (result.payload) {
              const fetchedCommunities = result.payload;
              setHasMore(fetchedCommunities.length === 12);
            }
            setLoadingCommunities(false);
          })
          .catch(() => {
            setError("Failed to load communities.");
            setLoadingCommunities(false);
          });
      }
    };

    fetchCommunities();
  }, [activeTag, dispatch, showSearchResults]);

  // Sync activeTag with URL
  useEffect(() => {
    if (selectedTag && selectedTag !== activeTag) {
      setActiveTag(selectedTag);
    }
  }, [selectedTag]);

  // Auto-scroll to center selected tag
  useEffect(() => {
    if (activeTag && tagBarRef.current && !showSearchResults) {
      const tagBar = tagBarRef.current;
      const selectedTagElement = tagBar.querySelector(`[data-tag-id="${activeTag}"]`);
      if (selectedTagElement) {
        const tagBarRect = tagBar.getBoundingClientRect();
        const tagRect = selectedTagElement.getBoundingClientRect();
        const scrollLeft = selectedTagElement.offsetLeft - (tagBarRect.width / 2) + (tagRect.width / 2);
        tagBar.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [activeTag, showSearchResults]);

  // Handle arrow navigation
  const handleArrowClick = (direction) => {
    if (!tagBarRef.current) return;
    const tagBar = tagBarRef.current;
    const scrollAmount = direction === 'left' ? -200 : 200;
    tagBar.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  // Handle tag click
  const handleTagClick = (tagName) => {
    if (tagName === 'my') {
      router.push('/communities/myCommunities');
      return;
    }
    setActiveTag(tagName);
    setShowSearchResults(false);
    setSearchQuery("");
    setShowEndMessage(false);
    if (endMessageTimeoutRef.current) {
      clearTimeout(endMessageTimeoutRef.current);
    }
    if (tagName === 'all') {
      router.push({ pathname: "/communities" }, undefined, { shallow: true });
    } else {
      router.push({ pathname: "/communities", query: { tag: tagName } }, undefined, { shallow: true });
    }
  };

  // Prepare tags with default tags
  const allTags = [
    { id: 'all', name: 'All' },
    { id: 'my', name: 'My Communities' },
    ...(Array.isArray(tags) ? tags : [])
  ];

  // Filter out DEFAULT communities
  const filterDefaultCommunities = (communities) => {
    if (!Array.isArray(communities)) {
      return [];
    }
    return communities.filter(community => community.communityType !== 'DEFAULT');
  };

  // Sort and filter communities
  const sortedAndFilteredCommunities = useMemo(() => {
    let filtered = showSearchResults 
      ? filterDefaultCommunities(searchResults || []) 
      : filterDefaultCommunities(communities || []);

    // Apply price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(c => c.price === 0 || !c.price);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(c => c.price > 0);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.title || '').localeCompare(b.title || '');
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'members':
          const aMembers = a.subscriptionTrue?.length || 0;
          const bMembers = b.subscriptionTrue?.length || 0;
          return bMembers - aMembers;
        case 'recent':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return sorted;
  }, [showSearchResults, searchResults, communities, sortBy, priceFilter]);

  const displayLoading = showSearchResults ? isSearching : loadingCommunities;
  const displayTitle = showSearchResults 
    ? `Search Results for "${searchQuery}"`
    : (activeTag && activeTag !== 'all' ? `Communities for "${allTags.find(t => String(t.id) === String(activeTag))?.name || activeTag}"` : "All Communities");

  // Enhanced skeleton loader
  const CommunitySkeleton = () => (
    <div className="bg-white rounded-2xl md:rounded-3xl border-2 border-gray-200 overflow-hidden">
      <Skeleton variant="rectangular" width="100%" height={140} className="md:h-[160px]" />
      <div className="p-3 md:p-4">
        <Skeleton variant="text" width="80%" height={20} className="mb-2 md:h-6" />
        <Skeleton variant="text" width="100%" height={14} className="mb-1 md:h-4" />
        <Skeleton variant="text" width="60%" height={14} className="md:h-4" />
      </div>
    </div>
  );

  // Enhanced empty state
  const EmptyState = ({ message, subMessage, icon: Icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8 md:py-16 px-4"
    >
      {Icon && (
        <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
          <Icon className="w-8 h-8 md:w-12 md:h-12 text-orange-500" />
        </div>
      )}
      <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">{message}</h3>
      <p className="text-sm md:text-base text-gray-600 max-w-md mx-auto">{subMessage}</p>
    </motion.div>
  );

  return (
    <>
      <Head>
        <title>IFCA - Explore Communities</title>
        <meta name="description" content="Discover and join communities that match your interests" />
      </Head>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header>
          <Topbar />
        </header>
        <main className="flex-grow mt-[60px] md:mt-[64px] pb-16 md:pb-0">
          {/* Sticky Header Container */}
          <div className="sticky top-[60px] md:top-[64px] z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
            {/* Tag Bar - Only show when not searching */}
            {!showSearchResults && (
              <div className="container mx-auto px-2 md:px-4 py-3 md:py-4 max-w-[1400px] relative">
                {/* Left Arrow - Hidden on mobile */}
                <button 
                  onClick={() => handleArrowClick('left')}
                  className="hidden md:flex absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 hover:border-orange-400 transition-all"
                  aria-label="Scroll tags left"
                >
                  <ChevronLeftIcon className="text-gray-600" />
                </button>

                {/* Right Arrow - Hidden on mobile */}
                <button
                  onClick={() => handleArrowClick('right')}
                  className="hidden md:flex absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 hover:border-orange-400 transition-all"
                  aria-label="Scroll tags right"
                >
                  <ChevronRightIcon className="text-gray-600" />
                </button>
                
                <div 
                  ref={tagBarRef}
                  className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide py-2 px-1 md:px-12 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {tagsLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} variant="rectangular" width={100} height={36} className="rounded-full" />
                    ))
                  ) : (
                    allTags.length > 0 ? (
                      allTags.map(tag => (
                        <motion.button
                          key={tag.id}
                          data-tag-id={tag.id}
                          onClick={() => handleTagClick(tag.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full border text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm flex-shrink-0 min-w-fit
                            ${String(activeTag) === String(tag.id) || (!activeTag && tag.id === 'all')
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 scale-105 shadow-lg ring-2 ring-orange-200'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700'}
                          `}
                        >
                          {tag.name}
                        </motion.button>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm">No tags found.</div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Title, Search Bar, and Filters */}
            <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 max-w-[1400px]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {displayTitle}
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                  {/* Search Bar and Sort - Side by side on mobile */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Search Bar - 80% width on mobile */}
                    <div className="relative flex-[0.8] sm:flex-initial sm:w-80">
                      <SearchIcon className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg md:text-xl" />
                      <input
                        type="text"
                        placeholder="Search communities..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 md:pl-12 pr-10 md:pr-12 py-2.5 md:py-3 border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm md:text-base font-medium bg-white"
                      />
                      {searchQuery && (
                        <button
                          onClick={clearSearch}
                          className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Clear search"
                        >
                          <ClearIcon className="text-lg md:text-xl" />
                        </button>
                      )}
                    </div>

                    {/* Sort Menu - 20% width on mobile */}
                    <div className="relative flex-[0.2] sm:flex-initial" ref={sortMenuRef}>
                      <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className="flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2.5 md:py-3 bg-white border-2 border-gray-300 rounded-lg md:rounded-xl hover:border-orange-400 transition-all font-medium text-xs md:text-sm w-full"
                      >
                        <SortIcon className="text-gray-600 text-base md:text-xl" />
                        <span className="hidden sm:inline">Sort</span>
                      </button>
                      <AnimatePresence>
                        {showSortMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                          >
                            {[
                              { value: 'recent', label: 'Most Recent', icon: AccessTimeIcon },
                              { value: 'name', label: 'Name (A-Z)', icon: SortIcon },
                              { value: 'price', label: 'Price (Low-High)', icon: TrendingUpIcon },
                              { value: 'members', label: 'Most Members', icon: GroupsIcon },
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setSortBy(option.value);
                                  setShowSortMenu(false);
                                }}
                                className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-orange-50 transition-colors ${
                                  sortBy === option.value ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-700'
                                }`}
                              >
                                <option.icon className="w-4 h-4" />
                                {option.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div className="flex items-center gap-1.5 md:gap-2 bg-gray-100 rounded-lg md:rounded-xl p-1">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'free', label: 'Free' },
                      { value: 'paid', label: 'Paid' },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setPriceFilter(filter.value)}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-medium transition-all flex-1 sm:flex-initial ${
                          priceFilter === filter.value
                            ? 'bg-white text-orange-600 shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {/* Count Badge */}
                  {!showSearchResults && totalCommunities > 0 && (
                    <div className="hidden sm:flex items-center justify-center px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-50 rounded-xl border border-orange-200">
                      <span className="text-sm font-semibold text-orange-700">
                        {totalCommunities} {totalCommunities === 1 ? 'community' : 'communities'}
                      </span>
                    </div>
                  )}
                  {showSearchResults && (
                    <div className="hidden sm:flex items-center justify-center px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-50 rounded-xl border border-orange-200">
                      <span className="text-sm font-semibold text-orange-700">
                        {searchTotalCount > 0 ? `${searchResults.length} of ${searchTotalCount}` : searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Container */}
          <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-[1400px]">
            <AnimatePresence mode="wait">
              {displayLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <CommunitySkeleton key={i} />
                  ))}
                </motion.div>
              ) : error || tagsError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 md:py-16 px-4"
                >
                  <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-red-100 rounded-full flex items-center justify-center">
                    <ClearIcon className="w-8 h-8 md:w-12 md:h-12 text-red-500" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Something went wrong</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">{error || tagsError || "Failed to load data."}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-5 md:px-6 py-2.5 md:py-3 bg-orange-500 text-white rounded-lg md:rounded-xl hover:bg-orange-600 transition-colors font-medium text-sm md:text-base"
                  >
                    Refresh Page
                  </button>
                </motion.div>
              ) : sortedAndFilteredCommunities.length > 0 ? (
                <motion.div
                  key="communities"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
                >
                  {sortedAndFilteredCommunities.map((item, index) => (
                    <motion.div
                      key={item.id}
                      ref={index === sortedAndFilteredCommunities.length - 1 ? lastElementRef : null}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-full"
                    >
                      <CommunityCard 
                        details={item} 
                        className="w-full" 
                      />
                    </motion.div>
                  ))}
                  
                  {/* Loading indicator for infinite scroll */}
                  {!showSearchResults && loadingMore && (
                    <div className="col-span-full flex justify-center py-6 md:py-8">
                      <CircularProgress size={32} className="md:w-10 md:h-10 text-orange-500" />
                    </div>
                  )}
                  
                  {/* End of results indicator */}
                  {!showSearchResults && !hasMore && sortedAndFilteredCommunities.length > 0 && showEndMessage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full text-center text-gray-500 py-6 md:py-8"
                    >
                      <p className="text-xs md:text-sm">No more communities to load.</p>
                    </motion.div>
                  )}
                  
                  {/* Search results pagination */}
                  {showSearchResults && searchHasMore && (
                    <div className="col-span-full flex justify-center py-6 md:py-8">
                      <button
                        onClick={loadMoreSearchResults}
                        disabled={searchLoadingMore}
                        className="px-6 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg md:rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold shadow-lg text-sm md:text-base"
                      >
                        {searchLoadingMore ? (
                          <div className="flex items-center gap-2">
                            <CircularProgress size={18} className="md:w-5 md:h-5" color="inherit" />
                            <span>Loading...</span>
                          </div>
                        ) : (
                          'Load More Results'
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* End of search results indicator */}
                  {showSearchResults && !searchHasMore && searchResults.length > 0 && showEndMessage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full text-center text-gray-500 py-6 md:py-8"
                    >
                      <p className="text-xs md:text-sm">No more search results to load.</p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyState
                    message={showSearchResults 
                      ? `No communities found for "${searchQuery}"` 
                      : (activeTag && activeTag !== 'all' ? 'No communities in this category' : 'No communities found')}
                    subMessage={showSearchResults
                      ? "Try adjusting your search terms or browse different categories"
                      : "Check back later or explore other categories"}
                    icon={GroupsIcon}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        <footer>
          <Footer />
        </footer>
      </div>
    </>
  );
};

export default Communities;