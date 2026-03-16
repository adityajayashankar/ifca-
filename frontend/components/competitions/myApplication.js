import React, { useEffect, useState } from "react";
import { QuestionField } from "@/components/competitions/incubator/micro/PublicPageApplyButton"
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { motion, AnimatePresence } from "framer-motion";

function MyApplications() {
  const user = useSelector(selectUser);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    if (user) {
      getUserSubmissions();
    }
  }, [user]);

  useEffect(() => {
    let filtered = applications;

    // Search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(app =>
        app.competitionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.stageName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(app => {
        const status = app.evaluatorResult?.status?.toLowerCase() || "not_evaluated";
        switch (selectedFilter) {
          case "qualified":
            return status === "qualified";
          case "not_qualified":
            return status === "not_qualified";
          case "pending":
            return status === "pending" || status === "not_evaluated";
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.fieldResponses?.[0]?.createdAt || 0) - new Date(a.fieldResponses?.[0]?.createdAt || 0);
        case "oldest":
          return new Date(a.fieldResponses?.[0]?.createdAt || 0) - new Date(b.fieldResponses?.[0]?.createdAt || 0);
        case "name":
          return (a.competitionName || "").localeCompare(b.competitionName || "");
        case "stage":
          return (a.stageNumber || 0) - (b.stageNumber || 0);
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  }, [searchTerm, applications, selectedFilter, sortBy]);

  const getUserSubmissions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await api.get(`/competitions/getUserSubmissions/${user?.unifiedUser?.id}`);
      console.log('res', res);
      setApplications(res.data);
      setFilteredApplications(res.data);
    } catch (err) {
      console.log('err', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    getUserSubmissions(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'qualified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'not_qualified':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500"></div>
          <p className="text-gray-600 font-medium">Loading your applications...</p>
      </div>
      </motion.div>
    );
  }

    return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      {/* Modern Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
              <p className="text-gray-600">Track your competition journey</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg 
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </motion.button>
        </div>

        {/* Modern Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">Total</p>
                <p className="text-3xl font-bold text-orange-900">{applications.length}</p>
                <p className="text-xs text-orange-600 mt-1">Applications</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Qualified</p>
                <p className="text-3xl font-bold text-green-900">
                  {applications.filter(app => app.evaluatorResult?.status === 'QUALIFIED').length}
                </p>
                <p className="text-xs text-green-600 mt-1">Success</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {applications.filter(app => !app.evaluatorResult || app.evaluatorResult.status === 'PENDING').length}
                </p>
                <p className="text-xs text-yellow-600 mt-1">In Review</p>
          </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
      </div>
    </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Not Qualified</p>
                <p className="text-3xl font-bold text-red-900">
                  {applications.filter(app => app.evaluatorResult?.status === 'NOT_QUALIFIED').length}
                </p>
                <p className="text-xs text-red-600 mt-1">Rejected</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Modern Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search competitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white"
              >
                <option value="all">All Status</option>
                <option value="qualified">Qualified</option>
                <option value="not_qualified">Not Qualified</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name A-Z</option>
                <option value="stage">Stage Number</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <AnimatePresence mode="wait">
        {filteredApplications.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-600">
              {searchTerm ? "No applications match your search." : "You haven't applied to any competitions yet."}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
                        {filteredApplications.map((application, index) => (
              <motion.div 
                key={application.stageId || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {application.competitionName || "Unknown Competition"}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Stage {application.stageNumber}
                          </span>
                          <span className="text-sm text-gray-600">
                            {application.stageName}
                          </span>
      </div>
      </div>
    </div>
                    
                    {application.evaluatorResult && (
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${getStatusColor(application.evaluatorResult.status)}`}>
                            {application.evaluatorResult.status || "Not Evaluated"}
                          </span>
                          {application.evaluatorResult.score && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 font-medium">Score:</span>
                              <span className="text-lg font-bold text-gray-900">{application.evaluatorResult.score}</span>
                            </div>
                          )}
                        </div>
                        {application.evaluatorResult.feedback && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {application.evaluatorResult.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!application.evaluatorResult && (
                      <div className="mb-4">
                        <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          Not Yet Evaluated
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setResponse(application);
                        setOpenModal(true);
                      }}
                      className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      View Details
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Custom Modal */}
      <AnimatePresence>
        {openModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Application Details
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setOpenModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {response && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-orange-50 border border-orange-200 rounded-lg p-4"
                  >
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">
                      {response.competitionName}
                    </h3>
                    <p className="text-orange-700">
                      Stage {response.stageNumber} • {response.stageName}
                    </p>
                  </motion.div>
                  
                  {response.evaluatorResult && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">Evaluation Result</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(response.evaluatorResult.status)}`}
                          >
                            {response.evaluatorResult.status}
                          </motion.span>
                          {response.evaluatorResult.score && (
                            <motion.span 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4 }}
                              className="text-sm text-gray-600"
                            >
                              Score: {response.evaluatorResult.score}
                            </motion.span>
                          )}
                        </div>
                        {response.evaluatorResult.feedback && (
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-sm text-gray-700"
                          >
                            {response.evaluatorResult.feedback}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  )}
                  
                  {response.fieldResponses && response.fieldResponses.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h4 className="font-semibold text-gray-900 mb-4">Your Responses</h4>
                      <div className="space-y-4">
                        {response.fieldResponses.map((field, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <h5 className="font-medium text-gray-900 mb-2">
                              Question {index + 1}
                            </h5>
                            <p className="text-sm text-gray-600 mb-2">
                              {field.question || "Question text not available"}
                            </p>
                            <div className="bg-gray-50 rounded p-3">
                              <p className="text-sm text-gray-700">
                                {field.answer || "No answer provided"}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
</div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}

export default MyApplications;
