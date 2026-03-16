import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCommunity,
  selectCommunitySessions,
  selectCommunityUsers,
  setCommunities,
  setCommunityById,
  setCommunitySessions,
  setCommunityUsers,
} from "@/store/features/communitySlice";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Card from "@/components/common/Card";
import LinkIcon from "@mui/icons-material/Link";
import {
  selectSubcommunities,
  setCommunityGroups,
} from "@/store/features/subCommunitySlice";
import GroupCard from "@/components/community/groupCard";
import { MdSupervisorAccount, MdPerson, MdPersonAdd, MdAdd, MdGroups, MdEvent } from "react-icons/md";
import {
  selectCommunityResources,
  setResourcesCommunity,
} from "@/store/features/resourceSlice";
import Head from "next/head";
import { MdChevronRight, MdHome } from "react-icons/md";
import { selectUser } from "@/store/features/userSlice";
import { Groups, People } from '@mui/icons-material';
import CreateCommunityForm from "@/components/community/CreateCommunityForm";
import GroupsIcon from "@mui/icons-material/Groups";
import CloseIcon from '@mui/icons-material/Close';
import ResourceAddModal from "@/components/common/ResourceAddModal";
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GroupIcon from '@mui/icons-material/Group';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Add CommunityCard component
const CommunityCard = ({ community, onClick }) => {
  return (
    <div className="w-full cursor-pointer h-auto" onClick={onClick}>
      <div className="bg-white hover:bg-gray-50/50 transition-all duration-300 rounded-3xl border-2 border-gray-200 hover:border-orange-500 hover:shadow-xl overflow-hidden group h-auto">
        {/* Banner Image with Overlay */}
        <div className="relative w-full h-[180px] overflow-hidden">
          {/* Background blur layer */}
          <div
            className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-700"
            style={{ backgroundImage: `url(${community?.bannerImg || "/communityCardImg.svg"})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          {/* Main image */}
          <div className="relative h-full w-full z-10">
            <Image
              src={community?.bannerImg || "/communityCardImg.svg"}
              alt={community?.title}
              layout="fill"
              objectFit="contain"
              className="transition-transform duration-700 group-hover:scale-110"
            />
          </div>
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
            {/* Community Badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 backdrop-blur-sm border border-white/20 shadow-lg">
              <Groups className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-[10px] font-semibold text-gray-800">Community</span>
            </div>
            {/* Price Badge */}
            {/* {community?.price && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 backdrop-blur-sm border border-white/20 shadow-lg">
                <span className="text-[10px] font-semibold text-orange-600">₹{community.price}/m</span>
              </div>
            )} */}
          </div>
          {/* Title */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
            <span className="text-16px font-bold text-white mb-1 line-clamp-1">
              {community?.title}
            </span>
          </div>
        </div>
        {/* Bottom Section */}
        <div className="px-4 pt-2 pb-3 bg-white flex flex-col gap-2">
          {/* Description */}
          <div className="pt-2">
            <span className="text-gray-600 text-12px leading-relaxed line-clamp-2 h-12">
              {community?.desc}
            </span>
          </div>
          {/* Member Count Chip */}
          {/* <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="flex items-center gap-1 bg-orange-50 text-orange-600 text-[10px] font-medium h-5 px-2 rounded-full">
              <People className="h-3 w-3 text-orange-500" />
              {(community?.subscriptions?.length || community?.subscriptionTrue?.length || 0)} Members
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
};

const CommunityPage = () => {
  const community2 = useSelector(selectCommunity);
  const [creatorName, setCreatorName] = useState("Bhaskar");
  const sessions = useSelector(selectCommunitySessions);
  const users = useSelector(selectCommunityUsers) || [];
  const groups = useSelector(selectSubcommunities);
  const resources = useSelector(selectCommunityResources);
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const dispatch = useDispatch();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [subscriptionDuration, setSubscriptionDuration] = useState(1);
  const [activeTab, setActiveTab] = useState('nonSubscribers');
  const [subscriptionError, setSubscriptionError] = useState('');
  const [communityUsers, setCommunityUsers] = useState({
    subscribers: [],
    nonSubscribers: [],
    total: { all: 0, subscribed: 0, nonSubscribed: 0 }
  });
  const [showSubcommunityPopup, setShowSubcommunityPopup] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState('MEMBER');
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [sidebarView, setSidebarView] = useState('members'); // 'members' or 'add-members'
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [huddles, setHuddles] = useState([]);
  const [loadingHuddles, setLoadingHuddles] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedUserForContext, setSelectedUserForContext] = useState(null);
  const [hoveredMemberId, setHoveredMemberId] = useState(null);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  const toggleAddUser = (userId) => {
    setSelectedToAdd(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddSelectedMembers = async () => {
    if (selectedToAdd.length === 0) return;
    try {
      setIsLoading(true);
      const response = await api.post(`/admin/community/${community2.id}/subscriptions`, {
        action: 'add',
        userIds: selectedToAdd,
        durationInMonths: 12
      });
      if (response.data.success) {
        toast.success('Members added!');
        fetchCommunityUsers(community2.id);
        setSidebarView('members');
        setSelectedToAdd([]);
        setAddMemberSearch('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCommunity = (e) => {
    e.preventDefault();
    setShowDeleteModal(true);
  };

  const confirmDeleteCommunity = () => {
    api.delete(`/community/${community2.id}`).then((res) => {
      if (res.data) {
        toast(`Community Deleted`);
        dispatch(setCommunities());
        router.replace(`/admin/community`);
      }
    });
    setShowDeleteModal(false);
  };

  const handleCloseSubcommunityPopup = () => {
    setShowSubcommunityPopup(false);
  };

  const handleSubcommunityCreated = () => {
    setShowSubcommunityPopup(false);
    // Refresh the community data to show the new subcommunity
    if (router && router.query["communityId"]) {
      const communityId = router.query["communityId"];
      dispatch(setCommunityById({ communityId }));
    }
  };

  const fetchCommunityUsers = async (communityId) => {
    try {
      const response = await api.get(`/community/${communityId}/userss`);
      if (response.data.success) {
        setCommunityUsers(response.data.data);
        dispatch(setCommunityUsers(response.data.data));
      }
    } catch (error) {
      console.error('Error fetching community users:', error);
    }
  };

  const fetchCommunityHuddles = async (communityId) => {
    try {
      setLoadingHuddles(true);
      const response = await api.get(`/huddle/community/${communityId}`);
      console.log('Community huddles response:', response.data);
      if (response.data && response.data.success) {
        setHuddles(response.data.huddles || []);
      } else {
        setHuddles([]);
      }
    } catch (error) {
      console.error('Error fetching community huddles:', error);
      setHuddles([]);
    } finally {
      setLoadingHuddles(false);
    }
  };

  useEffect(() => {
    if (router && router.query["communityId"]) {
      const communityId = router.query["communityId"];
      setIsLoading(true);
      Promise.all([
        dispatch(setCommunityById({ communityId })),
        dispatch(setCommunitySessions(communityId)),
        fetchCommunityUsers(communityId),
        dispatch(setCommunityGroups(communityId)),
        dispatch(setResourcesCommunity(communityId)),
        fetchCommunityHuddles(communityId)
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [router]);

  useEffect(() => {
    if (community2 && community2.creator?.name) {
      setCreatorName(community2.creator?.name);
    } else if (community2 && !community2.creator) {
      setCreatorName("Admin Team");
    }
  }, [community2]);

  useEffect(() => {
    if (showSubscriptionModal && community2?.id) {
      fetchCommunityUsers(community2.id);
    }
  }, [showSubscriptionModal, community2]);

  // Define filteredNonMembers based on search and current members
  const filteredNonMembers = (communityUsers.nonSubscribers || [])
    .filter(user =>
      user.userType !== 'partner' && user.userType !== 'expert' &&
      (
        addMemberSearch === '' ||
        user.name?.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(addMemberSearch.toLowerCase())
      )
    );

  const handleSubscriptionSubmit = async () => {
    try {
      setIsLoading(true);
      setSubscriptionError('');

      if (selectedUsers.length === 0) {
        setSubscriptionError('Please select at least one user');
        return;
      }

      const response = await api.post(`/admin/community/${community2.id}/subscriptions`, {
        action: activeTab === 'nonSubscribers' ? 'add' : 'remove',
        userIds: selectedUsers,
        durationInMonths: activeTab === 'nonSubscribers' ? subscriptionDuration : undefined
      });

      if (response.data.success) {
        toast.success(`Successfully ${activeTab === 'nonSubscribers' ? 'added' : 'removed'} subscriptions`);
        fetchCommunityUsers(community2.id);
        setSelectedUsers([]);
        setSubscriptionDuration(1);
      }
    } catch (error) {
      setSubscriptionError(error.response?.data?.message || 'Failed to manage subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async () => {
    try {
      setRoleChangeLoading(true);

      const response = await api.put(`/community/${community2.id}/members/${selectedUserForRole.id}/role`, {
        userId: selectedUserForRole.userId,
        role: newRole
      });

      if (response.data.success) {
        toast.success(`Successfully updated ${selectedUserForRole.name}'s role to ${newRole}`);
        fetchCommunityUsers(community2.id);
        setShowRoleModal(false);
        setSelectedUserForRole(null);
        setNewRole('MEMBER');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUserForRole(user);
    setNewRole(user.subscription?.role || 'MEMBER');
    setShowRoleModal(true);
  };

  const handleAddMember = async (userId) => {
    try {
      setIsLoading(true);
      const response = await api.post(`/admin/community/${community2.id}/subscriptions`, {
        action: 'add',
        userIds: [userId],
        durationInMonths: 12
      });
      if (response.data.success) {
        toast.success('Member added!');
        fetchCommunityUsers(community2.id);
        setAddMemberSearch('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextMenu = (event, user) => {
    event.preventDefault();
    setSelectedUserForContext(user);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  };

  const handleThreeDotClick = (event, user) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedUserForContext(user);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
    setSelectedUserForContext(null);
  };

  const handleMakeAdmin = async () => {
    if (!selectedUserForContext) return;

    try {
      setRoleChangeLoading(true);


      const response = await api.put(`/community/${community2.id}/members/${selectedUserForContext.userId}/role`, {
        userId: selectedUserForContext.userId,
        role: 'ADMIN'
      });

      if (response.data.success) {
        toast.success(`Successfully made ${selectedUserForContext.name} an Administrator`);
        fetchCommunityUsers(community2.id);
        closeContextMenu();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleMakeModerator = async () => {
    if (!selectedUserForContext) return;

    try {
      setRoleChangeLoading(true);

      const response = await api.put(`/community/${community2.id}/members/${selectedUserForContext.userId}/role`, {
        userId: selectedUserForContext.userId,
        role: 'MODERATOR'
      });

      if (response.data.success) {
        toast.success(`Successfully made ${selectedUserForContext.name} a Moderator`);
        fetchCommunityUsers(community2.id);
        closeContextMenu();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedUserForContext) return;

    try {
      setRoleChangeLoading(true);

      const response = await api.put(`/community/${community2.id}/members/${selectedUserForContext.userId}/role`, {
        userId: selectedUserForContext.userId,
        role: 'MEMBER'
      });

      if (response.data.success) {
        toast.success(`Successfully removed ${selectedUserForContext.name}'s Administrator role`);
        fetchCommunityUsers(community2.id);
        closeContextMenu();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleRemoveModerator = async () => {
    if (!selectedUserForContext) return;

    try {
      setRoleChangeLoading(true);

      const response = await api.put(`/community/${community2.id}/members/${selectedUserForContext.userId}/role`, {
        userId: selectedUserForContext.userId,
        role: 'MEMBER'
      });

      if (response.data.success) {
        toast.success(`Successfully removed ${selectedUserForContext.name}'s Moderator role`);
        fetchCommunityUsers(community2.id);
        closeContextMenu();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleRemoveFromGroup = async () => {
    if (!selectedUserForContext) return;

    try {
      setRemoveLoading(true);

      const response = await api.post(`/admin/community/${community2.id}/subscriptions`, {
        action: 'remove',
        userIds: [selectedUserForContext.userId]
      });

      if (response.data.success) {
        toast.success(`Successfully removed ${selectedUserForContext.name} from the community`);
        fetchCommunityUsers(community2.id);
        setShowRemoveConfirmModal(false);
        closeContextMenu();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemoveLoading(false);
    }
  };

  const openRemoveConfirmModal = () => {
    setShowRemoveConfirmModal(true);
    closeContextMenu();
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showContextMenu) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showContextMenu]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!community2) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Community Not Found</h1>
          <p className="text-gray-600 mb-4">The community you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/admin/community')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{community2?.title || "Community Details"}</title>
      </Head>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-2 ">
        <div className="mx-auto px-4  flex items-center space-x-2 text-sm ">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center hover:text-orange-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => router.push('/admin/community')}
            className="text-gray-500 hover:text-orange-700"
          >
            Communities
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium  md:max-w-xs" title={community2?.title}>{community2?.title}</span>
        </div>
      </div>
      <div className=" bg-gray-50 mx-auto ">
        {community2 && creatorName ? (
          <div className="flex flex-col lg:flex-row  md:min-h-[calc(100vh-10rem)] md:max-h-[calc(100vh-10rem)] max-w-[1920px] mx-auto">
            {/* Left Section: 35% width */}
            <section className="flex flex-col gap-6 p-0 w-full lg:w-[35%] lg:sticky lg:top-0 bg-transparent z-10  h-full">
              <div className="bg-white shadow p-6 flex flex-col gap-6 h-full min-h-[calc(100vh-110px)]">
                <Image
                  src={community2.bannerImg ? community2.bannerImg : "/notImg.svg"}
                  width={1024}
                  height={600}
                  layout="responsive"
                  className="rounded-xl shadow object-contain bg-orange-50"
                />
                <div className="flex flex-col gap-2">
                  <h1 className="text-16px font-bold text-gray-900 line-clamp-2">{community2.title}</h1>
                  <div className="flex items-center gap-3 text-14px text-gray-500">
                    {community2?.parentCommunities?.length > 0 && (
                      <span>Parent: {community2?.parentCommunities[0]?.title}</span>
                    )}
                  </div>
                  <p className="text-14px text-gray-600 line-clamp-2 mt-1">{community2.desc}</p>
                  <p className="font-semibold px-4 py-1 bg-primary-500 text-white w-max rounded-full text-14px">
                    Subscription Price: {community2.price}/m
                  </p>
                </div>
                {/* Operations Section */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <Link href={`/admin/community/add/${community2.id}`} passHref>
                    <button className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300">
                      <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                      <span className="relative z-10">Edit</span>
                    </button>
                  </Link>
                  <Link href={`/comHome/${community2.id}`} passHref>
                    <button className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300">
                      <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                      <span className="relative z-10">View Community</span>
                    </button>
                  </Link>
                  <button
                    className="relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300"
                    onClick={handleDeleteCommunity}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                    <span className="relative flex items-center justify-center z-10">Delete</span>
                  </button>
                </div>
              </div>
            </section>
            {/* Right Section: 65% width */}
            <section className="flex flex-col gap-8 p-0 md:p-4 w-full lg:w-[65%] lg:overflow-y-auto lg:max-h-[calc(100vh-110px)] bg-orange-50 lg:min-h-[calc(100vh-110px)]">
              {/* About Section */}
              {/* <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <p className="text-16px font-bold flex items-center gap-2 text-orange-700">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
                  About
                </p>
                <p className="text-14px text-gray-700">{community2.desc}</p>
              </div> */}

              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4 min-w-0">
                <h2 className="text-base font-bold text-gray-900 mb-0.5 truncate">{community2?.title}</h2>
                {(() => {
                  const desc = community2?.desc || '';
                  const lines = desc.split(/\r?\n/);
                  const showSeeMore = lines.length > 2;
                  const visibleLines = descExpanded ? lines : lines.slice(0, 2);
                  return (
                    <>
                      <p className="text-xs text-gray-600 whitespace-pre-line truncate">
                        {lines}
                        {visibleLines.map((line, idx) => (
                          <React.Fragment key={idx}>

                            {idx < visibleLines.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                        {showSeeMore && !descExpanded && <span>... </span>}
                      </p>
                      {showSeeMore && (
                        <button
                          className="text-orange-600 text-xs font-semibold mt-0.5 focus:outline-none"
                          onClick={() => setDescExpanded((v) => !v)}
                        >
                          {descExpanded ? 'See less' : 'See more'}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Child Communities Section */}
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-16px font-bold flex items-center gap-2 text-orange-700 m-0">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
                    Check out these communities and add subcommunity
                  </p>
                  <button
                    className="relative overflow-hidden group bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-100 text-orange-600 px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300"
                    onClick={() => setShowSubcommunityPopup(true)}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <MdAdd /> Add Subcommunity</span>
                  </button>
                </div>
                {!community2.childCommunities || community2.childCommunities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-16px font-semibold text-gray-900 mb-2">No Child Communities</h3>
                    <p className="text-14px text-gray-500 max-w-sm">
                      Create specialized communities to better serve different segments of your audience.
                    </p>
                    <button
                      onClick={() => setShowSubcommunityPopup(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 text-14px font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Create Subcommunity
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(community2?.childCommunities || [])
                        .filter(community => community !== null && community !== undefined && community.id !== null && community.id !== undefined)
                        .map((community) => (
                          <CommunityCard
                            key={community.id}
                            community={community}
                            onClick={() => router.push(`/admin/community/${community.id}`)}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Members Section */}
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <p className="text-16px font-bold flex items-center gap-4 justify-between text-orange-700">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
                    Our Members
                  </div>
                  <div className="flex items-center gap-2">
                    {users?.length !== 0 && <Link href={`/admin/community/people`} passHref>
                      <button className="relative overflow-hidden group bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-100 text-orange-600 px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300" title="View Members">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <MdSupervisorAccount />
                          <span className="hidden md:inline">View Members</span>
                        </span>
                      </button>
                    </Link>}
                    <button
                      className="relative overflow-hidden group bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-100 text-orange-600 px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300"
                      title="Add Member"
                      onClick={() => setShowSubscriptionModal(true)}
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <MdPersonAdd />
                        <span className="hidden md:inline">Add Member</span>
                      </span>
                    </button>
                    <Link href={"/admin/community/subscription"} passHref>
                      <button className="relative overflow-hidden group bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-100 text-orange-600 px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300" title="Subscriptions">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <MdAdd />
                          <span className="hidden md:inline">Subscriptions</span>
                        </span>
                      </button>
                    </Link>
                  </div>
                </p>
                {communityUsers.subscribers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <MdSupervisorAccount className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-16px font-semibold text-gray-900 mb-2">No Members Yet</h3>
                    <p className="text-14px text-gray-500 max-w-sm">
                      Start building your community by adding members and creating meaningful connections.
                    </p>
                    <Link href="/admin/people/add" passHref>
                      <button className="mt-4 inline-flex items-center px-4 py-2 text-14px font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
                        <MdPersonAdd className="w-5 h-5 mr-2" />
                        Add First Member
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2 mb-4">
                    {communityUsers.subscribers.filter(user => user.userType !== 'partner' && user.userType !== 'expert').map((user, index) => {
                      const userName = user.name;
                      const userRole = user.userType;
                      const userEmail = user.email;
                      const userPhoto = user.photoURL;
                      const userId = user.id;
                      const navUserId = user.userId;

                      // Determine the correct detail page URL based on role
                      let detailPageUrl = '';
                      if (userRole === 'user') detailPageUrl = `/admin/people/${navUserId}`;
                      else if (userRole === 'expert') detailPageUrl = `/admin/expert/${navUserId}`;
                      else if (userRole === 'partner') detailPageUrl = `/admin/partner/${navUserId}`;
                      else if (userRole === 'admin') detailPageUrl = `/admin/admin/${navUserId}`;

                      return (
                        <div
                          key={`user-${index}`}
                          className="relative flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer group"
                          onClick={() => router.push(detailPageUrl)}
                          onMouseEnter={() => setHoveredMemberId(userId)}
                          onMouseLeave={() => setHoveredMemberId(null)}
                        >
                          <div className="relative w-10 h-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                            {userPhoto ? (
                              <img
                                src={userPhoto}
                                alt={userName}
                                className="w-10 h-10 object-cover rounded-full"
                              />
                            ) : (
                              <MdPerson className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-14px font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                                {userName}
                              </p>
                            </div>
                            <div className="flex items-start gap-2 my-0.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1
                                ${user.subscription?.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                  user.subscription?.role === 'MODERATOR' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'}`}
                              >
                                {user.subscription?.role === 'ADMIN' ? (
                                  <VerifiedIcon fontSize="inherit" style={{ verticalAlign: 'middle' }} />
                                ) : user.subscription?.role === 'MODERATOR' ? (
                                  <SupervisorAccountIcon fontSize="inherit" style={{ verticalAlign: 'middle' }} />
                                ) : (
                                  <PersonIcon fontSize="inherit" style={{ verticalAlign: 'middle' }} />
                                )}
                                {user.subscription?.role ?
                                  user.subscription.role.charAt(0) + user.subscription.role.slice(1).toLowerCase() :
                                  "Member"}
                              </span>
                            </div>
                          </div>
                          {/* 3-dot menu button - only show on hover */}
                          {hoveredMemberId === userId && (
                            <button
                              onClick={(e) => handleThreeDotClick(e, user)}
                              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 z-10"
                              title="More options"
                            >
                              <MoreVertIcon className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Resources Section */}
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-16px font-bold flex items-center gap-2 text-orange-700">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
                    Resources
                  </p>
                  <button
                    className="inline-flex items-center px-4 py-2 text-14px font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                    onClick={() => setShowResourceModal(true)}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Resource
                  </button>
                </div>
                {resources?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" />
                      </svg>
                    </div>
                    <h3 className="text-16px font-semibold text-gray-900 mb-2">No Resources Yet</h3>
                    <p className="text-14px text-gray-500 max-w-sm">
                      Add valuable resources to help your community members learn and grow together.
                    </p>
                    {/* <Link href="/admin/resource/add" passHref>
                      <button className="mt-4 inline-flex items-center px-4 py-2 text-14px font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Resource
                      </button>
                    </Link> */}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources?.map((item, idx) => {
                      // Extract domain from URL for preview
                      const getDomain = (url) => {
                        try {
                          const domain = new URL(url).hostname.replace('www.', '');
                          return domain;
                        } catch {
                          return url;
                        }
                      };

                      // Get favicon URL
                      const getFavicon = (url) => {
                        try {
                          const domain = new URL(url).hostname;
                          return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                        } catch {
                          return '/notImg.svg';
                        }
                      };

                      return (
                        <div key={`resource-${idx}`} className="group bg-white rounded-lg p-3 border border-gray-100 hover:border-orange-200 transition-all duration-200 shadow-sm hover:shadow-md" style={{ minWidth: '300px', maxWidth: '300px' }}>
                          <div className="flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-shrink-0">
                                <img
                                  src={getFavicon(item.link)}
                                  alt={`${item.name} favicon`}
                                  className="w-6 h-6 rounded group-hover:scale-110 transition-transform duration-200"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/notImg.svg';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-14px font-medium m-0 text-gray-900 truncate group-hover:text-orange-600 transition-colors duration-200">{item.name}</h4>
                                <div className="flex items-center gap-1 text-12px text-gray-500">
                                  <span className="truncate">{getDomain(item.link)}</span>
                                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                </div>
                              </div>
                            </div>
                            <div className="mt-auto pt-2 border-t border-gray-100">
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-full px-2 py-1 text-12px font-medium text-orange-600 bg-orange-50 rounded hover:bg-orange-100 transition-colors duration-200 group-hover:bg-orange-100"
                              >
                                Visit Resource
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sessions Section */}
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <p className="text-16px font-bold flex items-center gap-2 text-orange-700">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Sessions
                </p>
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-16px font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
                    <p className="text-14px text-gray-500 max-w-sm">
                      Create engaging sessions to help your community members learn and interact.
                    </p>
                    <Link href="/admin/session/add" passHref>
                      <button className="mt-4 inline-flex items-center px-4 py-2 text-14px font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create Session
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-row flex-wrap gap-4 py-4">
                    {sessions?.map((session, index) => (
                      <Card session={session} baseURL={"partner"} view key={`session-${index}`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Huddles Section */}
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-16px font-bold flex items-center gap-2 text-orange-700">
                    <MdGroups className="w-5 h-5 text-orange-400" />
                    Huddles
                  </p>
                  <Link href={`/admin/huddle/create?communityId=${router.query.communityId || ''}`} passHref>
                    <button className="inline-flex items-center px-3 py-1.5 text-12px font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
                      <MdAdd className="w-4 h-4 mr-1" />
                      Create Huddle
                    </button>
                  </Link>
                </div>
                {loadingHuddles ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                ) : huddles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <MdGroups className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-16px font-semibold text-gray-900 mb-2">No Huddles Yet</h3>
                    <p className="text-14px text-gray-500 max-w-sm">
                      Create interactive huddles to engage your community members with activities and discussions.
                    </p>
                    <Link href={`/admin/huddle/create?communityId=${router.query.communityId || ''}`} passHref>
                      <button className="mt-4 inline-flex items-center px-4 py-2 text-14px font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
                        <MdAdd className="w-5 h-5 mr-2" />
                        Create First Huddle
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {huddles.map((huddle, index) => {
                      const bannerImage = huddle.community?.bannerImg || community2?.bannerImg || "/logoifca.png";
                      const imageSrc = bannerImage.startsWith('http') ? bannerImage : bannerImage;
                      const status = huddle.isLive ? 'Live' : huddle.isScheduled ? 'Upcoming' : huddle.endTime ? 'Completed' : 'Draft';
                      const statusColor = huddle.isLive ? 'bg-green-500' : huddle.isScheduled ? 'bg-orange-500' : huddle.endTime ? 'bg-gray-500' : 'bg-yellow-500';
                      
                      const formatHuddleDate = (dateString) => {
                        if (!dateString) return 'N/A';
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        });
                      };

                      const formatHuddleTime = (dateString) => {
                        if (!dateString) return 'N/A';
                        const date = new Date(dateString);
                        return date.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      };

                      return (
                        <div
                          key={`huddle-${huddle.id}-${index}`}
                          className="group relative h-[280px] sm:h-[320px] cursor-pointer"
                          onClick={() => router.push(`/admin/huddle/${huddle.id}`)}
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
                                      {formatHuddleDate(huddle.scheduledTime)}
                                    </div>
                                    <div className="text-[9px] text-gray-600">
                                      {formatHuddleTime(huddle.scheduledTime)}
                                    </div>
                                  </div>
                                </div>

                                {/* Status Badge - Top Right */}
                                <div className="absolute top-2 right-2 z-10">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold text-white ${statusColor}`}>
                                    {status}
                                  </span>
                                </div>

                                {/* Bottom Overlay with Title */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                                  <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 drop-shadow-lg">
                                    {huddle.title}
                                  </h3>
                                  {huddle.community?.title && (
                                    <p className="text-[10px] text-white/90 line-clamp-1">
                                      {huddle.community.title}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Back Side - Details */}
                            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white p-4 flex flex-col">
                              <div className="flex-1">
                                <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                                  {huddle.title}
                                </h3>
                                {huddle.description && (
                                  <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                                    {huddle.description}
                                  </p>
                                )}
                                
                                <div className="space-y-2 mb-3">
                                  {huddle.frequency && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <MdEvent className="w-4 h-4 text-orange-500" />
                                      <span className="capitalize">{huddle.frequency.toLowerCase()}</span>
                                    </div>
                                  )}
                                  {huddle.locationType && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span className="capitalize">{huddle.locationType.toLowerCase()}</span>
                                    </div>
                                  )}
                                  {huddle.attendeesCount !== undefined && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <MdGroups className="w-4 h-4 text-orange-500" />
                                      <span>{huddle.attendeesCount || 0} attendees</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-gray-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/admin/huddle/${huddle.id}`);
                                  }}
                                  className="w-full text-xs font-medium text-orange-600 hover:text-orange-700 text-center"
                                >
                                  View Details →
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Groups Section */}
              {/* <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <p className="text-16px font-bold flex items-center gap-2 text-orange-700">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Interest Groups
                </p>
                {!groups || groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-16px font-semibold text-gray-900 mb-2">No Groups Yet</h3>
                    <p className="text-14px text-gray-500 max-w-sm">
                      Create interest groups to help members connect and collaborate on specific topics.
                    </p>
                    <Link href="/community/group/add" passHref>
                      <button className="mt-4 inline-flex items-center px-4 py-2 text-14px font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create First Group
                      </button>
                    </Link>
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups?.slice(0, 10).map((item, index) => (
                    <GroupCard key={`group-${index}`} category={item} baseURL={"admin"} />
                  ))}
                    </div>
                )}
              </div>
             */}

            </section>
          </div >
        ) : (
          <div>
            <h1 className="text-16px font-bold text-gray-900 mb-4">Try logging out</h1>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {
          showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
                <button onClick={() => setShowDeleteModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold">&times;</button>
                <h2 className="text-16px font-bold text-orange-700">Delete Community</h2>
                <p className="text-14px text-gray-700">To confirm deletion, please type the community name below:</p>
                <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded font-semibold text-center select-all cursor-pointer" onClick={() => navigator.clipboard.writeText(community2.title)}>
                  {community2.title}
                </div>
                <input
                  type="text"
                  className="border border-orange-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                  placeholder="Type community name to confirm..."
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button
                    className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300 ${deleteInput !== community2.title ? 'cursor-not-allowed opacity-60' : ''}`}
                    onClick={confirmDeleteCommunity}
                    disabled={deleteInput !== community2.title}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                    <span className="relative flex items-center justify-center z-10">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )
        }
        {/* Subscription Management Modal */}
        {showSubscriptionModal && (
          <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowSubscriptionModal(false)} />
            {/* Sidebar */}
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
              {sidebarView === 'members' && (
                <>
                  {/* Sidebar Header and Actions */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <h2 className="font-bold text-lg text-gray-900">Members ({communityUsers?.subscribers?.filter(user => user.userType !== 'partner' && user.userType !== 'expert')?.length})</h2>
                    <button onClick={() => setShowSubscriptionModal(false)} className="text-gray-400 hover:text-orange-500 text-2xl font-bold">&times;</button>
                  </div>
                  {/* Search and Actions */}
                  <div className="px-6 pt-4 pb-2 bg-white sticky top-[56px] z-10 flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSidebarView('add-members')}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow transition w-1/2 justify-center"
                      >
                        <PersonAddIcon fontSize="small" />
                        Add Members
                      </button>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition w-1/2 justify-center"
                      >
                        <LinkIcon fontSize="small" />
                        Invite via Link
                      </button>
                    </div>
                  </div>
                  {/* Member List */}
                  <div className="flex-1 overflow-y-auto px-2 pb-4">
                    {(() => {
                      const filteredUsers = communityUsers.subscribers.filter(user => {
                        if (user.userType !== 'user') return false;
                        if (!userSearchQuery) return true;
                        const query = userSearchQuery.toLowerCase();
                        return (
                          (user.name && user.name.toLowerCase().includes(query)) ||
                          (user.email && user.email.toLowerCase().includes(query)) ||
                          (user.userType && user.userType.toLowerCase().includes(query))
                        );
                      });
                      if (filteredUsers.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <GroupIcon style={{ fontSize: 64, color: '#e0e0e0', marginBottom: 16 }} />
                            <h3 className="text-16px font-semibold text-gray-900 mb-2">No members found</h3>
                            <p className="text-14px text-gray-500">Try a different search term.</p>
                          </div>
                        );
                      }
                      return (
                        <ul className="divide-y divide-gray-100">
                          {filteredUsers.map((user, idx) => (
                            <li
                              key={user.id}
                              className="relative flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition group cursor-pointer"
                              onClick={() => openRoleModal(user)}
                              onMouseEnter={() => setHoveredMemberId(user.id)}
                              onMouseLeave={() => setHoveredMemberId(null)}
                            >
                              {/* Avatar */}
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {user.photoURL ? (
                                  <img src={user.photoURL} alt={user.name} className="w-12 h-12 object-cover rounded-full" />
                                ) : (
                                  <PersonIcon style={{ color: '#bdbdbd', fontSize: 32 }} />
                                )}
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-semibold text-gray-900 text-base truncate">{user.name}</span>
                                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1
                                    ${user.subscription?.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                      user.subscription?.role === 'MODERATOR' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'}`}
                                  >
                                    {user.subscription?.role === 'ADMIN' ? (
                                      <VerifiedIcon fontSize="inherit" style={{ verticalAlign: 'middle' }} />
                                    ) : user.subscription?.role === 'MODERATOR' ? (
                                      <SupervisorAccountIcon fontSize="inherit" style={{ verticalAlign: 'middle' }} />
                                    ) : (
                                      <PersonIcon fontSize="inherit" style={{ verticalAlign: 'middle' }} />
                                    )}
                                    {user.subscription?.role ?
                                      user.subscription.role.charAt(0) + user.subscription.role.slice(1).toLowerCase() :
                                      "Member"}
                                  </span>
                                </div>
                                <div className="text-gray-500 text-sm truncate">{user.email}</div>
                              </div>
                              {/* 3-dot menu button - only show on hover */}
                              {hoveredMemberId === user.id && (
                                <button
                                  onClick={(e) => handleThreeDotClick(e, user)}
                                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 z-10"
                                  title="More options"
                                >
                                  <MoreVertIcon className="w-4 h-4 text-gray-500" />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                  {/* Add/Remove Members Footer (if needed) */}
                  <div className="px-6 py-4 border-t border-gray-100 bg-white flex gap-3 justify-end sticky bottom-0 z-10">
                    <button
                      className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                      onClick={() => setShowSubscriptionModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
              {sidebarView === 'add-members' && (
                <>
                  {/* Add Members Header */}
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <button onClick={() => setSidebarView('members')} className="text-gray-500 hover:text-orange-500 text-2xl font-bold">
                      <ArrowBackIcon fontSize="medium" />
                    </button>
                    <h2 className="font-bold text-lg ml-2">Add members</h2>
                  </div>
                  <div className="px-6 pt-4 pb-2 bg-white sticky top-[56px] z-10">
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={addMemberSearch}
                      onChange={e => setAddMemberSearch(e.target.value)}
                    />
                  </div>
                  <div className="text-xs text-gray-500 px-6 py-2">All contacts</div>
                  <div className="flex-1 overflow-y-auto px-2 pb-4">
                    {filteredNonMembers.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">No users found.</div>
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
                          className="w-5 h-5"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="p-6 border-t flex justify-end bg-white sticky bottom-0 z-10">
                    <button
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
                      onClick={handleAddSelectedMembers}
                      disabled={selectedToAdd.length === 0 || isLoading}
                    >
                      {isLoading ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </>
              )}
              {/* Invite via Link Modal (unchanged) */}
              {showInviteModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto flex flex-col items-center gap-4">
                    <span className="material-icons text-5xl text-orange-400">lock</span>
                    <h2 className="text-lg font-bold text-gray-900">Invite via Link</h2>
                    <p className="text-gray-600 text-center">This feature is <span className="font-semibold text-orange-600">coming soon</span>! You'll be able to invite anyone with a link.</p>
                    <button onClick={() => setShowInviteModal(false)} className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition">Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div >

      {/* Subcommunity Creation Popup */}
      {showSubcommunityPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center gap-3">
                <GroupsIcon className="text-2xl text-orange-500" />
                <h2 className="text-16px font-bold text-gray-900">Create Subcommunity</h2>
              </div>
              <button
                onClick={handleCloseSubcommunityPopup}
                className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors"
              >
                <CloseIcon fontSize="medium" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6">
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-blue-800">Parent Community</span>
                  </div>
                  <p className="text-blue-700 text-12px">
                    Creating a subcommunity for: <strong>{community2?.title}</strong>
                  </p>
                </div>

                <CreateCommunityForm
                  isEdit={false}
                  baseURL="admin"
                  parentCommunityId={community2?.id}
                  onSuccess={handleSubcommunityCreated}
                  onCancel={handleCloseSubcommunityPopup}
                  isPopup={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Resource Add Modal */}
      {showResourceModal && (
        <ResourceAddModal
          open={showResourceModal}
          onClose={() => setShowResourceModal(false)}
          community={community2}
          onSuccess={() => {
            setShowResourceModal(false);
            dispatch(setResourcesCommunity(community2.id));
          }}
        />
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUserForRole && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-18px font-bold text-gray-900">Change User Role</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedUserForRole.photoURL ? (
                    <img
                      src={selectedUserForRole.photoURL}
                      alt={selectedUserForRole.name}
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M6 20c0-2.21 3.58-4 6-4s6 1.79 6 4" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-16px font-semibold text-gray-900">{selectedUserForRole.name}</h3>
                  <p className="text-14px text-gray-600">{selectedUserForRole.email}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-14px font-medium text-gray-700 mb-2">
                  Current Role
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className={`text-14px px-3 py-1 rounded-full font-medium ${selectedUserForRole.subscription?.role === 'ADMIN'
                    ? 'bg-red-100 text-red-700'
                    : selectedUserForRole.subscription?.role === 'MODERATOR'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                    }`}>
                    {selectedUserForRole.subscription?.role || 'MEMBER'}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-14px font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="MEMBER">Member</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="text-14px font-semibold text-blue-800 mb-2">Role Permissions:</h4>
                {newRole === 'ADMIN' && (
                  <ul className="text-12px text-blue-700 space-y-1">
                    <li>• Full administrative control</li>
                    <li>• Manage members and roles</li>
                    <li>• Control community settings</li>
                    <li>• Access all features</li>
                  </ul>
                )}
                {newRole === 'MODERATOR' && (
                  <ul className="text-12px text-blue-700 space-y-1">
                    <li>• Moderate discussions</li>
                    <li>• Manage posts and comments</li>
                    <li>• Help maintain guidelines</li>
                    <li>• Assist with member management</li>
                  </ul>
                )}
                {newRole === 'MEMBER' && (
                  <ul className="text-12px text-blue-700 space-y-1">
                    <li>• Participate in discussions</li>
                    <li>• Access community resources</li>
                    <li>• Connect with members</li>
                    <li>• Engage in activities</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setShowRoleModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium text-white ${roleChangeLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                onClick={handleRoleChange}
                disabled={roleChangeLoading}
              >
                {roleChangeLoading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Add Members</h2>
              <button onClick={() => setShowAddMembersModal(false)} className="text-gray-400 hover:text-orange-500 text-2xl font-bold">&times;</button>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={addMemberSearch}
              onChange={e => setAddMemberSearch(e.target.value)}
            />
            <div className="max-h-80 overflow-y-auto">
              {filteredNonMembers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No users found.</div>
              ) : filteredNonMembers.map(user => (
                <div key={user.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-orange-50 transition">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="w-10 h-10 object-cover rounded-full" />
                    ) : (
                      <span className="text-lg font-bold text-gray-500">{user.name?.[0] || "?"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-900 text-15px whitespace-nowrap overflow-x-auto">{user.name}</span>
                    <span className="ml-2 text-gray-500 text-13px whitespace-nowrap overflow-x-auto">{user.phone || user.email}</span>
                  </div>
                  <button
                    className="px-3 py-1 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
                    onClick={() => handleAddMember(user.id)}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite via Link Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto flex flex-col items-center gap-4">
            <span className="material-icons text-5xl text-orange-400">lock</span>
            <h2 className="text-lg font-bold text-gray-900">Invite via Link</h2>
            <p className="text-gray-600 text-center">This feature is <span className="font-semibold text-orange-600">coming soon</span>! You'll be able to invite anyone with a link.</p>
            <button onClick={() => setShowInviteModal(false)} className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition">Close</button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && selectedUserForContext && (
        <div
          className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="font-semibold text-gray-900 text-sm">{selectedUserForContext.name}</div>
            <div className="text-gray-500 text-xs">{selectedUserForContext.email}</div>
          </div>

          {selectedUserForContext.subscription?.role === 'ADMIN' ? (
            <button
              onClick={handleRemoveAdmin}
              disabled={roleChangeLoading}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
            >
              <VerifiedIcon fontSize="small" style={{ color: '#dc2626' }} />
              Remove Administrator
            </button>
          ) : (
            <button
              onClick={handleMakeAdmin}
              disabled={roleChangeLoading}
              className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 disabled:opacity-50"
            >
              <VerifiedIcon fontSize="small" style={{ color: '#dc2626' }} />
              Make Administrator
            </button>
          )}

          {selectedUserForContext.subscription?.role === 'MODERATOR' ? (
            <button
              onClick={handleRemoveModerator}
              disabled={roleChangeLoading}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
            >
              <SupervisorAccountIcon fontSize="small" style={{ color: '#2563eb' }} />
              Remove Moderator
            </button>
          ) : (
            <button
              onClick={handleMakeModerator}
              disabled={roleChangeLoading}
              className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 disabled:opacity-50"
            >
              <SupervisorAccountIcon fontSize="small" style={{ color: '#2563eb' }} />
              Make Moderator
            </button>
          )}

          <button
            onClick={openRemoveConfirmModal}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
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
              <h2 className="text-18px font-bold text-gray-900">Remove Member</h2>
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
                    <PersonIcon style={{ color: '#dc2626', fontSize: 24 }} />
                  )}
                </div>
                <div>
                  <h3 className="text-16px font-semibold text-gray-900">{selectedUserForContext.name}</h3>
                  <p className="text-14px text-gray-600">{selectedUserForContext.email}</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="text-14px font-semibold text-red-800 mb-2">⚠️ Warning</h4>
                <p className="text-12px text-red-700">
                  Removing {selectedUserForContext.name} will:
                </p>
                <ul className="text-12px text-red-700 mt-2 space-y-1">
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
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium text-white ${removeLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
                  }`}
                onClick={handleRemoveFromGroup}
                disabled={removeLoading}
              >
                {removeLoading ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommunityPage;