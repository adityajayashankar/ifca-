import Card from "@/components/common/Card";
import { useRouter } from "next/router";
import api from "@/utils/apiSetup";
import { MdSearch, MdAdd, MdRecommend, MdHome, MdChevronRight } from "react-icons/md";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  allPartnerSessions,
  selectCompletedPartnerSessions,
  selectPartnerSessionStats,
  setPartnerSessions,
  clearPartnerSessions,
} from "@/store/features/partnerSlice";
import { clearForm } from "@/store/features/createSessionSlice";
import { motion } from "framer-motion";

function SessionsHomePage() {
  const sessions = useSelector(allPartnerSessions);
  const completedSessions = useSelector(selectCompletedPartnerSessions);
  const sessionStats = useSelector(selectPartnerSessionStats);
  const router = useRouter();
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [filteredCompletedSessions, setFilteredCompletedSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);

  useEffect(() => {
    // Fetch sessions that the partner has purchased/participated in
    dispatch(setPartnerSessions());
    dispatch(clearForm());
    
    // Cleanup on unmount
    return () => {
      dispatch(clearPartnerSessions());
    };
  }, []);

  useEffect(() => {
    if (sessions) {
      let filtered = sessions.filter(session =>
        session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.SessionSlot[0]?.speakers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filter) {
        filtered = filtered.filter(session =>
          filter === "online"
            ? session.isVideoChannel || session.SessionSlot[0]?.isOnline
            : filter === "offline"
              ? !(session.isVideoChannel || session.SessionSlot[0]?.isOnline)
              : true
        );
      }
      if (sort) {
        filtered = [...filtered].sort((a, b) => {
          if (sort === "date-asc") {
            return new Date(a.SessionSlot[0]?.startTime) - new Date(b.SessionSlot[0]?.startTime);
          } else if (sort === "date-desc") {
            return new Date(b.SessionSlot[0]?.startTime) - new Date(a.SessionSlot[0]?.startTime);
          } else if (sort === "title-asc") {
            return a.title.localeCompare(b.title);
          } else if (sort === "title-desc") {
            return b.title.localeCompare(a.title);
          }
          return 0;
        });
      }
      setFilteredSessions(filtered);
    }
  }, [searchQuery, filter, sort, sessions]);

  useEffect(() => {
    if (completedSessions) {
      let filtered = completedSessions.filter(session =>
        session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.SessionSlot[0]?.speakers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filter) {
        filtered = filtered.filter(session =>
          filter === "online"
            ? session.isVideoChannel || session.SessionSlot[0]?.isOnline
            : filter === "offline"
              ? !(session.isVideoChannel || session.SessionSlot[0]?.isOnline)
              : true
        );
      }
      if (sort) {
        filtered = [...filtered].sort((a, b) => {
          if (sort === "date-asc") {
            return new Date(a.SessionSlot[0]?.startTime) - new Date(b.SessionSlot[0]?.startTime);
          } else if (sort === "date-desc") {
            return new Date(b.SessionSlot[0]?.startTime) - new Date(a.SessionSlot[0]?.startTime);
          } else if (sort === "title-asc") {
            return a.title.localeCompare(b.title);
          } else if (sort === "title-desc") {
            return b.title.localeCompare(a.title);
          }
          return 0;
        });
      }
      setFilteredCompletedSessions(filtered);
    }
  }, [searchQuery, filter, sort, completedSessions]);

  // Handlers for loading state demo (optional, can be removed if not needed)
  const handleAddSession = () => {
    setLoadingAdd(true);
    setTimeout(() => {
      setLoadingAdd(false);
      router.push("/partner/session/create");
    }, 400); // Simulate loading
  };
  const handleViewRec = () => {
    setLoadingRec(true);
    setTimeout(() => {
      setLoadingRec(false);
      router.push("/partner/speakerRecommendations");
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push('/partner')}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <MdHome className="w-4 h-4" />
            </button>
            <MdChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 font-medium">Sessions</span>
          </div>

        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 ">


        {/* Search and Tabs Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 ">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'active'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Active Sessions ({filteredSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'completed'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Completed Sessions ({filteredCompletedSessions.length})
              </button>
            </div>
            {/* Filter, Sort, Search */}
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-stretch md:items-center flex-1 justify-end">
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-stretch md:items-center flex-1">
                {/* Combined Search Bar */}
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdSearch className="text-gray-400 text-xl" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by session title or expert name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {/* Filter Dropdown */}
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
                {/* Sort Dropdown */}
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
                  className={`relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-white font-medium transition-colors w-full md:w-auto ${loadingAdd ? 'cursor-not-allowed bg-orange-400' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600'}`}
                  disabled={loadingAdd}
                  onClick={handleAddSession}
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
                        <span>Add Session</span>
                      </>
                    )}
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-white font-medium transition-colors w-full md:w-auto ${loadingRec ? 'cursor-not-allowed bg-orange-400' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600'}`}
                  disabled={loadingRec}
                  onClick={handleViewRec}
                  type="button"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                  <span className="relative flex items-center justify-center">
                    {loadingRec ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <MdRecommend className="text-lg" />
                        <span>View Recommendations</span>
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </div>


          </div>

          {/* Sessions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeTab === 'active' ? (
              filteredSessions?.length > 0 ? (
                filteredSessions.map((session, index) => (
                  <Card
                    session={session}
                    key={"session-" + index}
                    view={true}
                    edit={true}
                    baseURL={"partner"}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500">No active sessions found</p>
                </div>
              )
            ) : (
              filteredCompletedSessions?.length > 0 ? (
                filteredCompletedSessions.map((session, index) => (
                  <Card
                    session={session}
                    key={"completed-session-" + index}
                    view={true}
                    edit={true}
                    baseURL={"partner"}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500">No completed sessions found</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionsHomePage;

