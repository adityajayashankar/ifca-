// Modern People Management Page - Real-time Community Member Management
// Features: Real-time updates, modern UI, optimized performance, proper error handling
// Last updated: 2025-01-15

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "react-toastify";
import PersonIcon from '@mui/icons-material/Person';
import VerifiedIcon from '@mui/icons-material/Verified';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { DataGrid } from '@mui/x-data-grid';
import {
  selectCommunity,
  selectCommunityUsers,
  setCommunityById,
  setCommunityUsers,
} from "@/store/features/communitySlice";
import { selectAllExperts, setAllExperts } from "@/store/features/expert";
import { selectAllPartners, setAllPartners } from "@/store/features/partnerSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";

const PeoplePage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const community = useSelector(selectCommunity);
  const user = useSelector(selectUser);
  const communityUsers = useSelector(selectCommunityUsers);
  const allExperts = useSelector(selectAllExperts);
  const allPartners = useSelector(selectAllPartners);

  // Core state management
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Context menu state
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedUserForContext, setSelectedUserForContext] = useState(null);
  const contextMenuAnchor = useRef(null);

  // Modal states
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState({
    remove: false,
    roleChange: false,
    addMembers: false
  });
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Add member modal state
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [localCommunityUsers, setLocalCommunityUsers] = useState({
    subscribers: [],
    nonSubscribers: [],
    total: { all: 0, subscribed: 0, nonSubscribed: 0 }
  });

  // Get community ID with proper validation
  const comId = useMemo(() => {
    const id = router.query.communityId || 
               router.query.id || 
               community?.id || 
               (router.asPath.includes('/community/') ? router.asPath.split('/community/')[1]?.split('/')[0] : null);
    return id && typeof id === 'string' && id !== '[object Object]' ? id : null;
  }, [router.query, router.asPath, community?.id]);

  // Real-time data fetching with error handling
  const fetchCommunityUsers = useCallback(async (communityId, showRefreshIndicator = false) => {
    if (!communityId) return;
    
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
      setIsLoading(true);
      }
      setError(null);
      
      console.log('Fetching community users for ID:', communityId);
      const response = await api.get(`/community/${communityId}/userss`);
      
      if (response.data.success) {
        setLocalCommunityUsers(response.data.data);
        // Update Redux store for consistency
        if (typeof communityId === 'string' && communityId !== '[object Object]') {
          dispatch(setCommunityUsers(communityId));
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch community users');
      }
    } catch (error) {
      console.error('Error fetching community users:', error);
      setError(error.response?.data?.message || 'Failed to load community members');
      toast.error(error.response?.data?.message || 'Failed to load community members');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dispatch]);

  // Auto-refresh functionality
  const refreshInterval = useRef(null);
  useEffect(() => {
    if (comId) {
      // Set up auto-refresh every 30 seconds
      refreshInterval.current = setInterval(() => {
        fetchCommunityUsers(comId, true);
      }, 30000);
      
      return () => {
        if (refreshInterval.current) {
          clearInterval(refreshInterval.current);
        }
      };
    }
  }, [comId, fetchCommunityUsers]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    if (comId) {
      fetchCommunityUsers(comId, true);
    }
  }, [comId, fetchCommunityUsers]);

  // Toggle add user function
  const toggleAddUser = useCallback((userId) => {
    setSelectedToAdd(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }, []);

  // Handle add selected members with proper error handling
  const handleAddSelectedMembers = useCallback(async () => {
    if (selectedToAdd.length === 0) return;
    
    try {
      setActionLoading(prev => ({ ...prev, addMembers: true }));
      
      const response = await api.post(`/admin/community/${comId}/subscriptions`, {
        action: 'add',
        userIds: selectedToAdd,
        durationInMonths: 12
      });
      
      if (response.data.success) {
        toast.success(`Successfully added ${selectedToAdd.length} member${selectedToAdd.length > 1 ? 's' : ''}!`);
        await fetchCommunityUsers(comId);
        setShowAddMemberModal(false);
        setSelectedToAdd([]);
        setAddMemberSearch('');
      } else {
        throw new Error(response.data.message || 'Failed to add members');
      }
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error(error.response?.data?.message || 'Failed to add members');
    } finally {
      setActionLoading(prev => ({ ...prev, addMembers: false }));
    }
  }, [selectedToAdd, comId, fetchCommunityUsers]);

  // Context menu handlers
  const openContextMenu = useCallback((user, event) => {
    if (!user || showContextMenu) return;
    setSelectedUserForContext(user);
    contextMenuAnchor.current = event.currentTarget;
    setShowContextMenu(true);
  }, [showContextMenu]);

  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false);
    setSelectedUserForContext(null);
    contextMenuAnchor.current = null;
  }, []);

  // Role change handler with optimistic updates
  const handleRoleChange = useCallback(async (role) => {
    if (!selectedUserForContext) {
      toast.error("No user selected for role change.");
      return;
    }

    closeContextMenu();
    setUpdatingUserId(selectedUserForContext.id);
    
    try {
      setActionLoading(prev => ({ ...prev, roleChange: true }));
      
      const response = await api.put(
        `/community/${comId}/members/${selectedUserForContext.subscription.id}/role`,
        { userId: selectedUserForContext.id, role }
      );
      
      if (response.data.success) {
        // Optimistic update
        setLocalCommunityUsers(prev => ({
          ...prev,
          subscribers: prev.subscribers.map(sub => 
            sub.id === selectedUserForContext.subscription.id 
              ? { ...sub, role }
              : sub
          )
        }));
        
        const roleText = role === "ADMIN" ? "Administrator" : 
                        role === "MODERATOR" ? "Moderator" : "Member";
        toast.success(`Successfully made ${selectedUserForContext.name} a ${roleText}`);
        
        // Refresh data to ensure consistency
        await fetchCommunityUsers(comId);
      } else {
        throw new Error(response.data.message || "Failed to update role");
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.message || "Failed to update role");
      // Revert optimistic update on error
      await fetchCommunityUsers(comId);
    } finally {
      setActionLoading(prev => ({ ...prev, roleChange: false }));
      setUpdatingUserId(null);
    }
  }, [selectedUserForContext, comId, closeContextMenu, fetchCommunityUsers]);

  // Remove member handler
  const handleRemoveFromGroup = useCallback(async () => {
    if (!selectedUserForContext) return;
    
    try {
      setActionLoading(prev => ({ ...prev, remove: true }));
      
      const response = await api.post(`/admin/community/${comId}/subscriptions`, {
        action: "remove",
        userIds: [selectedUserForContext.id],
      });
      
      if (response.data.success) {
        toast.success(`Successfully removed ${selectedUserForContext.name} from the community`);
        await fetchCommunityUsers(comId);
        setShowRemoveConfirmModal(false);
        closeContextMenu();
      } else {
        throw new Error(response.data.message || "Failed to remove member");
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.response?.data?.message || "Failed to remove member");
    } finally {
      setActionLoading(prev => ({ ...prev, remove: false }));
    }
  }, [selectedUserForContext, comId, closeContextMenu, fetchCommunityUsers]);

  // Process and filter users with memoization
  const processedUsers = useMemo(() => {
    let users = (localCommunityUsers.subscribers || [])
        .map((sub) => {
          const user = sub.unifiedUser?.user;
          if (!user) return null;
        
        return {
            ...user,
            role: sub.role || "MEMBER",
            activeSince: sub.createdAt,
            email: user.email,
            phone: sub.unifiedUser?.user?.phone,
            userType: "user",
            subscription: sub,
            unifiedUserId: sub.unifiedUser?.id,
          };
      })
      .filter(Boolean);

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      users = users.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (roleFilter !== 'ALL') {
      users = users.filter(user => user.role === roleFilter);
    }

    // Apply sorting
    users.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (sortBy === 'activeSince') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
    } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return users;
  }, [localCommunityUsers.subscribers, searchTerm, roleFilter, sortBy, sortOrder]);

  // Filtered non-members for add modal
  const filteredNonMembers = useMemo(() => {
    return (localCommunityUsers.nonSubscribers || [])
      .filter(user =>
        user.userType !== 'partner' && user.userType !== 'expert' &&
        (
          addMemberSearch === '' ||
          user.name?.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
          user.email?.toLowerCase().includes(addMemberSearch.toLowerCase())
        )
      );
  }, [localCommunityUsers.nonSubscribers, addMemberSearch]);

  // Initial data loading
  useEffect(() => {
    if (router.isReady && comId) {
      console.log('Making API calls with community ID:', comId);
      dispatch(setCommunityById({ communityId: comId }));
      fetchCommunityUsers(comId);
    }
  }, [router.isReady, comId, dispatch, fetchCommunityUsers]);

  // Load experts and partners
  useEffect(() => {
    if (user?.id) {
      dispatch(setAllPartners(user.id));
    }
    dispatch(setAllExperts());
  }, [user, dispatch]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showContextMenu && contextMenuAnchor.current && !contextMenuAnchor.current.contains(event.target)) {
        closeContextMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu, closeContextMenu]);

  // Loading state with better UX
  if (isLoading || !comId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-170px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community data...</p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
          <button
                onClick={() => fetchCommunityUsers(comId)}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
              >
                Retry
          </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{community?.title || "Community"} - People Management</title>
        <meta name="description" content="Manage community members, roles, and permissions" />
      </Head>
      
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Modern Header with Real-time Indicators */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-orange-50"
                >
                  <ArrowBackIcon fontSize="small" />
                  <span className="font-medium">Back</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                <h1 className="text-2xl font-bold text-gray-900">People Management</h1>
                  <p className="text-sm text-gray-500">{community?.title}</p>
              </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Real-time Status Indicator */}
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">Live</span>
                </div>
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 text-gray-600 hover:text-orange-600 transition-colors rounded-lg hover:bg-orange-50 disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshIcon 
                    fontSize="small" 
                    className={isRefreshing ? 'animate-spin' : ''} 
                  />
                </button>
                
                {/* Modern Search Input */}
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-72 bg-white shadow-sm transition-all duration-200"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Administrators</option>
                  <option value="MODERATOR">Moderators</option>
                  <option value="MEMBER">Members</option>
                </select>
                
                {/* Add Member Button */}
              <button
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                  onClick={() => {
                    setShowAddMemberModal(true);
                    fetchCommunityUsers(comId);
                  }}
                >
                  <PersonAddIcon fontSize="small" />
                  Add Member
              </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Modern DataGrid Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Community Members</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {processedUsers.length} member{processedUsers.length !== 1 ? 's' : ''} found
                    {searchTerm && ` for "${searchTerm}"`}
                    {roleFilter !== 'ALL' && ` with role "${roleFilter}"`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Real-time</span>
                </div>
                  {isRefreshing && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <RefreshIcon className="animate-spin w-4 h-4" />
                      <span className="text-sm">Updating...</span>
              </div>
                  )}
            </div>
              </div>
            </div>
            
            <div style={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={processedUsers.map((user, idx) => ({
                  id: user.unifiedUserId || idx,
                  index: idx + 1,
                  name: user.name,
                  email: user.email,
                  phone: user.phone || '-',
                  activeSince: user.activeSince ? new Date(user.activeSince).toLocaleDateString() : '-',
                  role: user.role,
                  lastUpdated: user.subscription?.updatedAt ? new Date(user.subscription.updatedAt).toLocaleDateString() : '-',
                  user: user
                }))}
                columns={[
                  { 
                    field: 'index', 
                    headerName: '#', 
                    width: 60,
                    sortable: false
                  },
                  { 
                    field: 'name', 
                    headerName: 'Name', 
                    width: 200,
                    sortable: true
                  },
                  { 
                    field: 'email', 
                    headerName: 'Email', 
                    width: 250,
                    sortable: true
                  },
                  { 
                    field: 'phone', 
                    headerName: 'Phone', 
                    width: 180,
                    sortable: false
                  },
                  { 
                    field: 'activeSince', 
                    headerName: 'Active Since', 
                    width: 150,
                    sortable: true
                  },
                  { 
                    field: 'role', 
                    headerName: 'Role', 
                    width: 120,
                    sortable: true,
                    renderCell: (params) => (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        params.value === 'ADMIN' ? 'bg-red-100 text-red-700' : 
                        params.value === 'MODERATOR' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {params.value.charAt(0) + params.value.slice(1).toLowerCase()}
                      </span>
                    )
                  },
                  { 
                    field: 'lastUpdated', 
                    headerName: 'Last Updated', 
                    width: 150,
                    sortable: true
                  },
                  { 
                    field: 'actions', 
                    headerName: 'Manage', 
                    width: 100,
                    sortable: false,
                    renderCell: (params) => (
                          <button
                        className="px-3 py-1 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition text-xs disabled:opacity-50"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                          openContextMenu(params.row.user, e);
                            }}
                        disabled={actionLoading.roleChange || actionLoading.remove || updatingUserId === params.row.user.id}
                          >
                        {updatingUserId === params.row.user.id ? 'Updating...' : 'Manage'}
                          </button>
                    )
                  }
                ]}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '16px',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8fafc',
                    borderBottom: '2px solid #e2e8f0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#475569',
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#fef3c7',
                    transition: 'background-color 0.2s ease',
                  },
                  '& .MuiDataGrid-row': {
                    borderBottom: '1px solid #f1f5f9',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                  },
                }}
                components={{
                  NoRowsOverlay: () => (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      {localCommunityUsers.subscribers?.length === 0 ? (
                        <div className="max-w-md">
                          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <PersonIcon style={{ fontSize: 40, color: '#f97316' }} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">No Members Yet</h3>
                          <p className="text-gray-600 mb-6">Start building your community by adding members and creating meaningful connections.</p>
                          <button
                            onClick={() => {
                              setShowAddMemberModal(true);
                              fetchCommunityUsers(comId);
                            }}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto"
                          >
                            <PersonAddIcon fontSize="small" />
                            Add First Member
                          </button>
                        </div>
                      ) : (
                        <div className="max-w-md">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <SearchIcon style={{ fontSize: 40, color: '#6b7280' }} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">No Results Found</h3>
                          <p className="text-gray-600 mb-6">No members match your current search criteria. Try adjusting your search terms or filters.</p>
                          <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setSearchTerm('')}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all duration-200"
                          >
                            Clear Search
                          </button>
                            <button
                              onClick={() => setRoleFilter('ALL')}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all duration-200"
                            >
                              Clear Filter
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ),
                }}
              />
            </div>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-[9999] flex justify-end">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowAddMemberModal(false)} />
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                <button 
                  onClick={() => setShowAddMemberModal(false)} 
                  className="text-gray-500 hover:text-orange-500 text-2xl font-bold"
                >
                  <ArrowBackIcon fontSize="medium" />
                </button>
                <h2 className="font-bold text-lg ml-2">Add Members</h2>
                {selectedToAdd.length > 0 && (
                  <span className="ml-auto bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                    {selectedToAdd.length} selected
                  </span>
                )}
              </div>
              
              <div className="px-6 pt-4 pb-2 bg-white sticky top-[56px] z-10">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={addMemberSearch}
                  onChange={e => setAddMemberSearch(e.target.value)}
                />
              </div>
              
              <div className="text-xs text-gray-500 px-6 py-2">Available Users</div>
              
              <div className="flex-1 overflow-y-auto px-2 pb-4">
                {filteredNonMembers.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {addMemberSearch ? 'No users found matching your search.' : 'No available users to add.'}
                  </div>
                ) : filteredNonMembers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 px-6 py-2 hover:bg-orange-50 transition">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-10 h-10 object-cover rounded-full" />
                      ) : (
                        <PersonIcon style={{ color: '#bdbdbd', fontSize: 28 }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-900 text-15px whitespace-nowrap overflow-x-auto">{user.name}</span>
                      <div className="text-gray-500 text-13px whitespace-nowrap overflow-x-auto">
                        {user.phone ? user.phone : user.email}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedToAdd.includes(user.id)}
                      onChange={() => toggleAddUser(user.id)}
                      className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                    />
                  </div>
                ))}
              </div>
              
              <div className="p-6 border-t flex justify-between items-center bg-white sticky bottom-0 z-10">
                <span className="text-sm text-gray-600">
                  {selectedToAdd.length} user{selectedToAdd.length !== 1 ? 's' : ''} selected
                </span>
              <button
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddSelectedMembers}
                  disabled={selectedToAdd.length === 0 || actionLoading.addMembers}
                >
                  {actionLoading.addMembers ? 'Adding...' : `Add ${selectedToAdd.length} Member${selectedToAdd.length !== 1 ? 's' : ''}`}
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {showContextMenu && selectedUserForContext && contextMenuAnchor.current && (
          <div
            ref={contextMenuAnchor}
            className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[220px]"
            style={{
              left: contextMenuAnchor.current.getBoundingClientRect().left,
              top: contextMenuAnchor.current.getBoundingClientRect().bottom + 6,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="font-semibold text-gray-900 text-sm">{selectedUserForContext?.name}</div>
              <div className="text-gray-500 text-xs">{selectedUserForContext?.email}</div>
            </div>
            
            {selectedUserForContext?.subscription?.role === "ADMIN" ? (
              <button
                onClick={() => handleRoleChange("MEMBER")}
                disabled={actionLoading.roleChange}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
              >
                <VerifiedIcon fontSize="small" style={{ color: "#dc2626" }} />
                Remove Administrator
              </button>
            ) : (
              <button
                onClick={() => handleRoleChange("ADMIN")}
                disabled={actionLoading.roleChange}
                className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 disabled:opacity-50"
              >
                <VerifiedIcon fontSize="small" style={{ color: "#dc2626" }} />
                Make Administrator
              </button>
            )}
            
            {selectedUserForContext?.subscription?.role === "MODERATOR" ? (
              <button
                onClick={() => handleRoleChange("MEMBER")}
                disabled={actionLoading.roleChange}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
              >
                <SupervisorAccountIcon fontSize="small" style={{ color: "#2563eb" }} />
                Remove Moderator
              </button>
            ) : (
              <button
                onClick={() => handleRoleChange("MODERATOR")}
                disabled={actionLoading.roleChange}
                className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 disabled:opacity-50"
              >
                <SupervisorAccountIcon fontSize="small" style={{ color: "#2563eb" }} />
                Make Moderator
              </button>
            )}
            
                <button
              onClick={() => {
                setShowRemoveConfirmModal(true);
                closeContextMenu();
              }}
              disabled={actionLoading.roleChange}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
            >
              <RemoveCircleIcon fontSize="small" />
              Remove from Group
            </button>
          </div>
        )}

        {/* Remove Confirmation Modal */}
        {showRemoveConfirmModal && selectedUserForContext && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Remove Member</h2>
                <button
                  onClick={() => setShowRemoveConfirmModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedUserForContext.photoURL ? (
                      <img
                        src={selectedUserForContext.photoURL}
                        alt={selectedUserForContext.name}
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    ) : (
                      <PersonIcon style={{ color: "#dc2626", fontSize: 24 }} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{selectedUserForContext.name}</h3>
                    <p className="text-sm text-gray-600">{selectedUserForContext.email}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">⚠️ Warning</h4>
                  <p className="text-xs text-red-700">
                    Removing {selectedUserForContext.name} will:
                  </p>
                  <ul className="text-xs text-red-700 mt-2 space-y-1">
                    <li>• Revoke their access to this community</li>
                    <li>• Remove their role and permissions</li>
                    <li>• Cancel their subscription</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  onClick={() => setShowRemoveConfirmModal(false)}
                  disabled={actionLoading.remove}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    actionLoading.remove
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                  }`}
                  onClick={handleRemoveFromGroup}
                  disabled={actionLoading.remove}
                >
                  {actionLoading.remove ? "Removing..." : "Remove Member"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PeoplePage;