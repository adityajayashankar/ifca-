import { useRouter } from "next/router";
import api from "@/utils/apiSetup";
import { MdSearch, MdAdd, MdHome, MdChevronRight, MdForum, MdGroups } from "react-icons/md";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";

function ExpertHuddlesPage() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [huddles, setHuddles] = useState([]);
  const [filteredHuddles, setFilteredHuddles] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchHuddles();
    }
  }, [user?.id]);

  const fetchHuddles = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/huddle/user/${user.id}/upcoming`);
      if (response.data && response.data.huddles) {
        setHuddles(response.data.huddles);
        setFilteredHuddles(response.data.huddles);
      }
    } catch (error) {
      console.error('Error fetching huddles:', error);
      toast.error('Failed to load huddles');
      setHuddles([]);
      setFilteredHuddles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (huddles) {
      let filtered = huddles.filter(huddle =>
        huddle.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        huddle.community?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (activeTab === 'upcoming') {
        filtered = filtered.filter(huddle => huddle.isScheduled && !huddle.isLive);
      } else if (activeTab === 'live') {
        filtered = filtered.filter(huddle => huddle.isLive);
      } else if (activeTab === 'completed') {
        filtered = filtered.filter(huddle => !huddle.isScheduled && !huddle.isLive && huddle.endTime);
      }

      if (filter) {
        filtered = filtered.filter(huddle =>
          filter === "digital" ? huddle.locationType === "DIGITAL" :
          filter === "offline" ? huddle.locationType === "OFFLINE" : true
        );
      }

      if (sort) {
        filtered = [...filtered].sort((a, b) => {
          if (sort === "date-asc") {
            return new Date(a.scheduledTime || a.startTime) - new Date(b.scheduledTime || b.startTime);
          } else if (sort === "date-desc") {
            return new Date(b.scheduledTime || b.startTime) - new Date(a.scheduledTime || a.startTime);
          } else if (sort === "title-asc") {
            return a.title.localeCompare(b.title);
          } else if (sort === "title-desc") {
            return b.title.localeCompare(a.title);
          }
          return 0;
        });
      }

      setFilteredHuddles(filtered);
    }
  }, [searchQuery, filter, sort, huddles, activeTab]);

  const handleAddHuddle = () => {
    setLoadingAdd(true);
    setTimeout(() => {
      setLoadingAdd(false);
      router.push("/expert/huddle/create");
    }, 400);
  };

  const getHuddleStatus = (huddle) => {
    if (huddle.isLive) return { label: 'Live', color: 'bg-green-100 text-green-700' };
    if (huddle.isScheduled) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    if (huddle.endTime) return { label: 'Completed', color: 'bg-gray-100 text-gray-700' };
    return { label: 'Draft', color: 'bg-yellow-100 text-yellow-700' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push('/expert')}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <MdHome className="w-4 h-4" />
            </button>
            <MdChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 font-medium">Huddles</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upcoming ({huddles.filter(h => h.isScheduled && !h.isLive).length})
              </button>
              <button
                onClick={() => setActiveTab('live')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'live'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Live ({huddles.filter(h => h.isLive).length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'completed'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed ({huddles.filter(h => !h.isScheduled && !h.isLive && h.endTime).length})
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-stretch md:items-center flex-1 justify-end">
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-stretch md:items-center flex-1">
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdSearch className="text-gray-400 text-xl" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by title or community..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="digital">Digital</option>
                  <option value="offline">Offline</option>
                </select>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                >
                  <option value="">Sort By</option>
                  <option value="date-asc">Date (Asc)</option>
                  <option value="date-desc">Date (Desc)</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                </select>
              </div>

              <div className="flex gap-3 flex-wrap md:flex-nowrap">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-white font-medium transition-colors w-full md:w-auto ${
                    loadingAdd ? 'cursor-not-allowed bg-orange-400' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600'
                  }`}
                  disabled={loadingAdd}
                  onClick={handleAddHuddle}
                  type="button"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                  <span className="relative flex items-center justify-center">
                    {loadingAdd ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <MdAdd className="text-lg" />
                        <span>Create Huddle</span>
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 text-orange-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-500">Loading huddles...</p>
            </div>
          ) : filteredHuddles?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredHuddles.map((huddle, index) => {
                const status = getHuddleStatus(huddle);
                const isLive = huddle.isLive;
                const attendeeCount = huddle._count?.attendances || 0;
                const bannerImage = huddle.community?.bannerImg || "/logoifca.png";
                const imageSrc = bannerImage.startsWith('http') ? bannerImage : bannerImage;
                
                return (
                  <motion.div
                    key={`huddle-${huddle.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative h-[280px] sm:h-[320px] cursor-pointer"
                    onClick={() => router.push(`/expert/huddle/${huddle.id}`)}
                    style={{ perspective: '1000px' }}
                  >
                    {/* Flip Card Container */}
                    <div className="flip-card-inner relative w-full h-full transition-transform duration-700 transform-style-preserve-3d">
                      {/* Front Side - Image with Name */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl overflow-hidden shadow-md border border-gray-200">
                        <div className="relative w-full h-full">
                          {/* Image */}
                          <img
                            src={imageSrc}
                            alt={huddle.community?.title || 'Huddle'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "/logoifca.png";
                            }}
                          />
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          
                          {/* Date/Time Badge - Top Left */}
                          <div className="absolute top-2 left-2 z-10">
                            <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-md">
                              <div className="text-[10px] font-semibold text-gray-900 whitespace-nowrap">
                                {formatDate(huddle.scheduledTime).split(',')[0]}
                              </div>
                              <div className="text-[9px] text-gray-600">
                                {formatDate(huddle.scheduledTime).split(',')[1]?.trim() || ''}
                              </div>
                            </div>
                          </div>
                          
                          {/* Status Badge - Top Right */}
                          <div className="absolute top-2 right-2 z-10">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-md ${
                              isLive ? 'bg-green-500 text-white animate-pulse' :
                              status.label === 'Upcoming' ? 'bg-orange-500 text-white' :
                              status.label === 'Completed' ? 'bg-gray-500 text-white' :
                              'bg-yellow-500 text-white'
                            }`}>
                              {isLive && <span className="w-1 h-1 bg-white rounded-full mr-1"></span>}
                              {status.label}
                            </span>
                          </div>
                          
                          {/* Huddle Name - Bottom */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                            <h3 className="text-white font-bold text-sm mb-1 line-clamp-1 drop-shadow-lg">
                              {huddle.title}
                            </h3>
                            {huddle.community?.title && (
                              <div className="flex items-center gap-1 text-white/90 text-xs">
                                <MdGroups className="w-3 h-3" />
                                <span className="truncate">{huddle.community.title}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Back Side - Details */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white">
                        <div className="h-full flex flex-col p-4 overflow-y-auto">
                          {/* Title */}
                          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">
                            {huddle.title}
                          </h3>
                          
                          {/* Community */}
                          {huddle.community?.title && (
                            <div className="flex items-center gap-1.5 mb-3">
                              <MdGroups className="w-4 h-4 text-orange-600" />
                              <span className="text-xs text-gray-700 font-medium">{huddle.community.title}</span>
                            </div>
                          )}
                          
                          {/* Description */}
                          {huddle.description && (
                            <p className="text-xs text-gray-600 mb-3 line-clamp-3 leading-relaxed flex-shrink-0">
                              {huddle.description}
                            </p>
                          )}
                          
                          {/* Info Section */}
                          <div className="space-y-2 mb-3 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="text-xs text-gray-700">{formatDate(huddle.scheduledTime)}</span>
                            </div>
                            
                            {huddle.frequency && (
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-700 capitalize">{huddle.frequency.toLowerCase()}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Footer */}
                          <div className="mt-auto pt-2 border-t border-gray-200">
                            {attendeeCount > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex -space-x-1.5">
                                  {[...Array(Math.min(attendeeCount, 3))].map((_, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                                      {String.fromCharCode(65 + i)}
                                    </div>
                                  ))}
                                </div>
                                <span className="text-[10px] text-gray-600 font-medium">
                                  {attendeeCount} {attendeeCount === 1 ? 'attendee' : 'attendees'}
                                </span>
                              </div>
                            )}
                            <button className="w-full text-orange-600 hover:text-orange-700 font-bold text-xs uppercase tracking-wide transition-colors text-center py-1">
                              VIEW DETAILS
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <MdForum className="text-5xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No huddles found</p>
              <p className="text-gray-400 text-sm mt-2">Create your first huddle to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpertHuddlesPage;

