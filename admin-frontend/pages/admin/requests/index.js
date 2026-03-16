import { 
  fetchAllPendingRequests, 
  fetchAllRequests,
  fetchAllApprovedRequests,
  respondToRequests,
  pendingRequests,
  approvedRequests,
  allRequests,
  requestLoading, 
  requestError 
} from "@/store/features/requestSlice";
import api from "@/utils/apiSetup";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Head from "next/head";
import { MdGroups, MdChevronRight, MdHome, MdSearch, MdSort, MdCheckCircle, MdExpandMore, MdExpandLess, MdPersonOutline } from "react-icons/md";
import { selectUser } from "@/store/features/userSlice";

const fallbackAvatar = "/default-avatar.png";
const fallbackBanner = "/default-banner.png";

const Requests = () => {
  const user = useSelector(selectUser);
  const userId = user?.unifiedUser?.id;
  const dispatch = useDispatch();
  
  // Use different selectors based on view type
  const pendingReq = useSelector(pendingRequests);
  const approvedReq = useSelector(approvedRequests);
  const allReq = useSelector(allRequests);
  
  const loading = useSelector(requestLoading);
  const error = useSelector(requestError);
  const [expandedRows, setExpandedRows] = useState({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [loadingIds, setLoadingIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [viewType, setViewType] = useState("pending"); // pending, approved, all

  // Get the correct data based on view type
  const getCurrentRequests = () => {
    let requests = [];
    switch (viewType) {
      case "pending":
        requests = Array.isArray(pendingReq) ? pendingReq : [];
        break;
      case "approved":
        requests = Array.isArray(approvedReq) ? approvedReq : [];
        break;
      case "all":
        requests = Array.isArray(allReq) ? allReq : [];
        break;
      default:
        requests = Array.isArray(pendingReq) ? pendingReq : [];
    }
    
    // Debug logging
    console.log(`View Type: ${viewType}`);
    console.log(`Pending Requests Count: ${Array.isArray(pendingReq) ? pendingReq.length : 0}`);
    console.log(`Approved Requests Count: ${Array.isArray(approvedReq) ? approvedReq.length : 0}`);
    console.log(`All Requests Count: ${Array.isArray(allReq) ? allReq.length : 0}`);
    console.log(`Current Requests Count: ${requests.length}`);
    console.log('Current Requests Type:', typeof requests);
    console.log('Is Array:', Array.isArray(requests));
    
    return requests;
  };

  useEffect(() => {
    // Fetch all pending requests for admin view by default
    dispatch(fetchAllPendingRequests());
  }, []);

  // Debug effect to monitor data changes
  useEffect(() => {
    console.log('=== REQUEST DATA UPDATE ===');
    console.log('View Type:', viewType);
    console.log('Pending Requests:', pendingReq?.length || 0);
    console.log('Approved Requests:', approvedReq?.length || 0);
    console.log('All Requests:', allReq?.length || 0);
    console.log('Loading:', loading);
    console.log('Error:', error);
  }, [pendingReq, approvedReq, allReq, viewType, loading, error]);

  // Handle view type change
  const handleViewChange = (type) => {
    setViewType(type);
    setSelectedRequests(new Set());
    setExpandedRows({});
    
    switch (type) {
      case "pending":
        dispatch(fetchAllPendingRequests());
        break;
      case "approved":
        dispatch(fetchAllApprovedRequests());
        break;
      case "all":
        dispatch(fetchAllRequests());
        break;
      default:
        dispatch(fetchAllPendingRequests());
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCheckboxChange = (id) => {
    const updatedSelected = new Set(selectedRequests);
    if (updatedSelected.has(id)) {
      updatedSelected.delete(id);
    } else {
      updatedSelected.add(id);
    }
    setSelectedRequests(updatedSelected);
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    const idsToApprove = Array.from(selectedRequests);
    const currentRequests = getCurrentRequests();
    const payload = idsToApprove.map((id) => {
      const req = currentRequests.find((r) => r.id === id);
      return {
        requestId: req.id,
        userId: req.userId,
        communityId: req.communityId,
      };
    });
    
    try {
      // Use the Redux action instead of direct API call
      const result = await dispatch(respondToRequests(payload)).unwrap();
      if (result.success) {
        toast(`${result.message || "Requests approved successfully!"}`, { type: "success" });
        // Refresh the data after successful approval
        handleViewChange(viewType);
      } else {
        toast("Some requests failed to approve.", { type: "error" });
      }
    } catch (err) {
      console.error("Bulk approve error:", err);
      toast("An error occurred during bulk approval.", { type: "error" });
    }
    setBulkLoading(false);
    setSelectedRequests(new Set());
  };

  const handleIndividualApprove = async (item) => {
    setLoadingIds((prev) => [...prev, item.id]);
    const payload = [{
      requestId: item.id,
      userId: item.userId,
      communityId: item.communityId,
    }];
    
    try {
      // Use the Redux action instead of direct API call
      const result = await dispatch(respondToRequests(payload)).unwrap();
      if (result.success) {
        toast(`${result.message || "Request approved successfully!"}`, { type: "success" });
        // Refresh the data after successful approval
        handleViewChange(viewType);
      } else {
        toast("Failed to approve request.", { type: "error" });
      }
    } catch (err) {
      console.error("Individual approve error:", err);
      toast("An error occurred while approving the request.", { type: "error" });
    }
    setLoadingIds((prev) => prev.filter((id) => id !== item.id));
  };

  // Filter and sort requests using the correct data source
  const currentRequests = getCurrentRequests();
  const filtered = Array.isArray(currentRequests) ? currentRequests
    .filter((r) => {
      const userName = r.unifiedUser?.user?.name || r.unifiedUser?.partner?.name || r.unifiedUser?.expert?.name || r.unifiedUser?.admin?.name || r.name || '';
      const userEmail = r.unifiedUser?.email || r.email || '';
      const communityTitle = r.Community?.title || '';
      
      return userName.toLowerCase().includes(search.toLowerCase()) ||
             userEmail.toLowerCase().includes(search.toLowerCase()) ||
             communityTitle.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const aName = a.unifiedUser?.user?.name || a.unifiedUser?.partner?.name || a.unifiedUser?.expert?.name || a.unifiedUser?.admin?.name || a.name || '';
      const bName = b.unifiedUser?.user?.name || b.unifiedUser?.partner?.name || b.unifiedUser?.expert?.name || b.unifiedUser?.admin?.name || b.name || '';
      
      if (sort === "az") return aName.localeCompare(bName);
      if (sort === "za") return bName.localeCompare(aName);
      if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    }) : [];

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Handle error display
  if (error) {
    toast.error(`Error loading requests: ${error.message || error}`, { type: "error" });
  }

  const getViewTitle = () => {
    switch (viewType) {
      case "pending": return "Pending Requests";
      case "approved": return "Approved Requests";
      case "all": return "All Requests";
      default: return "Requests";
    }
  };

  const getViewDescription = () => {
    switch (viewType) {
      case "pending": return "Review and approve incoming community join requests.";
      case "approved": return "View all approved community join requests.";
      case "all": return "View all community join requests (pending and approved).";
      default: return "Manage community join requests.";
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Head>
        <title>{getViewTitle()}</title>
      </Head>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button
            onClick={() => window.location.href='/admin'}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">{getViewTitle()}</span>
        </div>
      </div>
      <div className="w-full flex flex-col items-center bg-gray-50 min-h-screen py-8">
        <div className="w-full px-0 max-w-full">
          {/* Search and Sort Card */}
          <div className="bg-white rounded-2xl shadow-lg px-6 py-4 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center flex-1">
              <h2 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
                <MdGroups className="text-orange-500 text-3xl" />
                {getViewTitle()}
              </h2>
              
              {/* View Type Tabs */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewChange("pending")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewType === "pending" 
                      ? "bg-white text-orange-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleViewChange("approved")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewType === "approved" 
                      ? "bg-white text-orange-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => handleViewChange("all")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewType === "all" 
                      ? "bg-white text-orange-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdSearch className="text-gray-400 text-xl" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Search by name, email, or community..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <MdSort className="text-xl text-gray-400" />
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="az">A-Z</option>
                  <option value="za">Z-A</option>
                </select>
              </div>
            </div>
            {/* Bulk Approve Button - Only show for pending requests */}
            {viewType === "pending" && selectedRequests.size > 0 && (
              <button
                className={`relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-white font-medium transition-colors w-full md:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 ${bulkLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={handleBulkApprove}
                type="button"
                disabled={bulkLoading}
                tabIndex={0}
                title="Approve all selected requests"
              >
                {bulkLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : <MdCheckCircle className="text-lg" />}
                Approve Selected
              </button>
            )}
          </div>
          
          {/* Description */}
          <div className="bg-white rounded-2xl shadow-lg px-6 py-4 mb-8">
            <p className="text-gray-600 text-base">{getViewDescription()}</p>
          </div>
          
          {/* Requests Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-0 overflow-x-auto w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <svg className="animate-spin text-orange-500 text-7xl mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h2 className="text-3xl font-bold text-gray-700 mb-2">Loading {getViewTitle()}...</h2>
                <p className="text-gray-500 mb-4">Please wait while we fetch the latest requests.</p>
              </div>
            ) : filtered.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {viewType === "pending" && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-tl-2xl">
                        <input
                          type="checkbox"
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedRequests(new Set(filtered.map(row => row.id)));
                            } else {
                              setSelectedRequests(new Set());
                            }
                          }}
                          checked={filtered.length > 0 && selectedRequests.size === filtered.length}
                          tabIndex={0}
                          aria-label="Select all requests"
                        />
                      </th>
                    )}
                    <th className={`px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${viewType !== "pending" ? "rounded-tl-2xl" : ""}`}>User</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Community</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created Date</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-tr-2xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filtered.map((row, idx) => (
                    <React.Fragment key={row.id}>
                      <tr
                        className={`transition-all duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${selectedRequests.has(row.id) ? 'ring-2 ring-orange-200' : ''} hover:bg-orange-50 group`}
                        tabIndex={0}
                        aria-selected={selectedRequests.has(row.id)}
                      >
                        {viewType === "pending" && (
                          <td className="px-4 py-4 align-middle">
                            <input
                              type="checkbox"
                              checked={selectedRequests.has(row.id)}
                              onChange={() => handleCheckboxChange(row.id)}
                              className="accent-orange-500 w-5 h-5 rounded focus:ring-2 focus:ring-orange-300"
                              tabIndex={0}
                              aria-label={`Select request from ${row.unifiedUser?.user?.name || row.unifiedUser?.partner?.name || row.unifiedUser?.expert?.name || row.unifiedUser?.admin?.name || row.name}`}
                            />
                          </td>
                        )}
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            {(() => {
                              const photoUrl = row.unifiedUser?.user?.photoURL || row.unifiedUser?.partner?.photoURL || row.unifiedUser?.expert?.photoURL || row.unifiedUser?.admin?.photoURL || row.photoUrl;
                              return photoUrl ? (
                                <img src={photoUrl} alt={row.unifiedUser?.user?.name || row.unifiedUser?.partner?.name || row.unifiedUser?.expert?.name || row.unifiedUser?.admin?.name || row.name} className="w-11 h-11 rounded-full object-cover border shadow-sm" onError={e => e.target.src = fallbackAvatar} />
                              ) : (
                                <span className="w-11 h-11 flex items-center justify-center rounded-full bg-orange-100 text-orange-400 border shadow-sm"><MdPersonOutline className="text-2xl" /></span>
                              );
                            })()}
                            <div>
                              <div className="font-semibold text-gray-900 text-base">
                                {row.unifiedUser?.user?.name || row.unifiedUser?.partner?.name || row.unifiedUser?.expert?.name || row.unifiedUser?.admin?.name || row.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {row.unifiedUser?.email || row.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <img src={row.Community?.bannerImg || fallbackBanner} alt={row.Community?.title} className="w-11 h-11 rounded object-cover border shadow-sm" onError={e => e.target.src = fallbackBanner} />
                            <span className="text-gray-900 font-medium text-base">{row.Community?.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-700 min-w-[120px] text-base align-middle">{formatDate(row.createdAt)}</td>
                        <td className="px-4 py-4 text-gray-700 min-w-[120px] text-base align-middle">
                          {row.unifiedUser?.user?.phone || row.unifiedUser?.partner?.phone || row.unifiedUser?.expert?.phone || row.unifiedUser?.admin?.phone || row.phone}
                        </td>
                        <td className="px-4 py-4 flex items-center gap-2 min-w-[180px] align-middle">
                          <button
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-50 text-orange-600 font-semibold hover:bg-orange-100 transition focus:outline-none focus:ring-2 focus:ring-orange-300"
                            onClick={() => toggleRow(row.id)}
                            type="button"
                            tabIndex={0}
                            title={expandedRows[row.id] ? 'Hide questions' : 'Show questions'}
                            aria-expanded={expandedRows[row.id]}
                          >
                            {expandedRows[row.id] ? <MdExpandLess /> : <MdExpandMore />}
                            {expandedRows[row.id] ? 'Hide' : 'Show'}
                          </button>
                          {viewType === "pending" && (
                            <button
                              className={`flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-orange-600 transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${loadingIds.includes(row.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                              onClick={() => handleIndividualApprove(row)}
                              type="button"
                              tabIndex={0}
                              title="Approve this request"
                              disabled={loadingIds.includes(row.id)}
                            >
                              {loadingIds.includes(row.id) ? (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : <MdCheckCircle />}
                              Approve
                            </button>
                          )}
                          {viewType === "approved" && (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-50 text-green-600 font-semibold">
                              <MdCheckCircle />
                              Approved
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Animated expandable row */}
                      <tr style={{ transition: 'all 0.3s' }}>
                        <td colSpan={viewType === "pending" ? 6 : 5} className={`overflow-hidden p-0 ${expandedRows[row.id] ? 'h-auto' : 'h-0'}`}>
                          <div className={`transition-all duration-300 ${expandedRows[row.id] ? 'max-h-96 opacity-100 p-6' : 'max-h-0 opacity-0 p-0'} bg-orange-50 rounded-b-2xl`}
                            style={{ pointerEvents: expandedRows[row.id] ? 'auto' : 'none' }}
                          >
                            {expandedRows[row.id] && (
                              <div className="flex flex-col gap-2">
                                {row.Community?.questions?.map((q, idx) => (
                                  <div key={idx}>
                                    <div className="font-semibold text-gray-700 text-base">{q}</div>
                                    <div className="text-gray-500 text-sm">{row[`q${idx+1}`]}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <MdGroups className="text-orange-300 text-7xl mb-4" />
                <h2 className="text-3xl font-bold text-gray-700 mb-2">No {getViewTitle()} Yet!</h2>
                <p className="text-gray-500 mb-4">{getViewDescription()}</p>
                <button
                  className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-orange-600 transition"
                  onClick={() => handleViewChange(viewType)}
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Requests;
