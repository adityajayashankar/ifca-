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
import { MdSupervisorAccount, MdPerson, MdPersonAdd } from "react-icons/md";
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

// Add CommunityCard component
const CommunityCard = ({ community, onClick }) => {
  return (
    <div className="w-full cursor-pointer h-auto" onClick={onClick}>
      <div className="bg-white hover:bg-gray-50/50 transition-all duration-300 rounded-3xl border-2 border-gray-200 hover:border-orange-500 hover:shadow-xl overflow-hidden group h-auto">
        {/* Banner Image with Overlay */}
        <div className="relative w-full h-[180px] overflow-hidden">
          {/* Background blur layer */}
          <div
            className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-70"
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
            {community?.price && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 backdrop-blur-sm border border-white/20 shadow-lg">
                <span className="text-[10px] font-semibold text-orange-600">₹{community.price}/m</span>
              </div>
            )}
          </div>
          {/* Title */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
            <span className="text-lg font-bold text-white mb-1 line-clamp-1">
              {community?.title}
            </span>
          </div>
        </div>
        {/* Bottom Section */}
        <div className="px-4 pt-2 pb-3 bg-white flex flex-col gap-2">
          {/* Description */}
          <div className="pt-2">
            <span className="text-gray-600 text-xs leading-relaxed line-clamp-2 h-10">
              {community?.desc}
            </span>
          </div>
          {/* Member Count Chip */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="flex items-center gap-1 bg-orange-50 text-orange-600 text-[10px] font-medium h-5 px-2 rounded-full">
              <People className="h-3 w-3 text-orange-500" />
              {(community?.subscriptions?.length || community?.subscriptionTrue?.length || 0)} Members
            </span>
          </div>
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

  const handleDeleteCommunity = (e) => {
    e.preventDefault();
    setShowDeleteModal(true);
  };

  const confirmDeleteCommunity = () => {
    api.delete(`/community/${community2.id}`).then((res) => {
      if (res.data) {
        toast(`Community Deleted`);
        dispatch(setCommunities());
        router.replace(`/partner/community`);
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
      const response = await api.get(`/admin/community/${communityId}/users`);
      if (response.data.success) {
        setCommunityUsers(response.data.data);
        dispatch(setCommunityUsers(response.data.data));
      }
    } catch (error) {
      console.error('Error fetching community users:', error);
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
        dispatch(setResourcesCommunity(communityId))
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
            onClick={() => router.push('/partner/community')}
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
        <div className="mx-auto px-4 py-3 flex items-center space-x-2 text-sm ">
          <button
            onClick={() => router.push('/partner')}
            className="flex items-center hover:text-orange-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => router.push('/partner/community')}
            className="text-gray-500 hover:text-orange-700"
          >
            Communities
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium truncate max-w-[200px] md:max-w-xs" title={community2?.title}>{community2?.title}</span>
        </div>
      </div>
      <div className="min-h-[calc(100vh-138px)] bg-gray-50 mx-auto px-2 md:px-4 lg:px-0 max-w-[1920px]">
        {community2 && creatorName ? (
          <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] max-w-[1920px] mx-auto">
            {/* Left Section: 35% width */}
            <section className="flex flex-col gap-6 p-0 w-full lg:w-[35%] lg:sticky lg:top-24 bg-transparent z-10 h-fit">
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-6">
                <Image
                  src={community2.bannerImg ? community2.bannerImg : "/notImg.svg"}
                  width={1024}
                  height={600}
                  layout="responsive"
                  className="rounded-xl shadow object-contain bg-orange-50"
                />
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold text-gray-900 line-clamp-2">{community2.title}</h1>
                  <div className="flex items-center gap-3 text-base text-gray-500">
                    {community2?.parentCommunities?.length > 0 && (
                      <span>Parent: {community2?.parentCommunities[0]?.title}</span>
                    )}
                  </div>
                  <p className="text-gray-600 line-clamp-2 mt-1 text-lg">{community2.desc}</p>
                  <p className="font-semibold px-4 py-1 bg-primary-500 text-white w-max rounded-full">
                    Subscription Price: {community2.price}/m
                  </p>
                </div>
                {/* Operations Section */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <Link href={`/partner/community/add/${community2.id}`} passHref>
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
            <section className="flex flex-col gap-8 p-0 w-full lg:w-[65%] lg:overflow-y-auto lg:max-h-[calc(100vh-7rem)]">
              {/* About Section */}
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
                  About
                </p>
                <p className="text-base text-gray-700">{community2.desc}</p>
              </div>
                    {/* Child Communities Section */}
                    <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
                  Check out these communities
                </p>
                {!community2.childCommunities || community2.childCommunities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Child Communities</h3>
                    <p className="text-gray-500 max-w-sm">
                      Create specialized communities to better serve different segments of your audience.
                    </p>
                    <button
                      onClick={() => setShowSubcommunityPopup(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Create Subcommunity
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {community2.childCommunities.length} subcommunity{community2.childCommunities.length !== 1 ? 'ies' : ''}
                      </span>
                      <button
                        onClick={() => setShowSubcommunityPopup(true)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Subcommunity
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(community2?.childCommunities || [])
                        .filter(community => community !== null && community !== undefined && community.id !== null && community.id !== undefined)
                        .map((community) => (
                        <CommunityCard
                          key={community.id}
                          community={community}
                          onClick={() => router.push(`/partner/community/${community.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Members Section */}
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <p className="text-lg font-bold flex items-center gap-4 justify-between text-orange-700">
                  <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
                  Our Members
                  </div>
                  <div className="flex items-center gap-2">
                    {users?.length !== 0 && <Link href={`/partner/community/people`} passHref>
                      <button className="ring-[1px] ring-orange-500 hover:bg-orange-50 rounded-md w-34 px-2" title="View all people">
                        <div className="flex items-center">
                          <MdSupervisorAccount /> View Members
                        </div>
                      </button>
                    </Link>}
                    <button 
                      className="ring-[1px] ring-orange-500 hover:bg-orange-50 rounded-md w-34 px-2" 
                      title="Subscription to new member"
                      onClick={() => setShowSubscriptionModal(true)}
                    >
                      <div className="flex items-center">
                        <MdPersonAdd /> Add Member
                      </div>
                    </button>
                    <Link href={"/partner/community/subscription"} passHref>
                      <button className="ring-[1px] ring-orange-500 hover:bg-orange-50 rounded-md w-34 px-2">+ Subscriptions</button>
                  </Link>
                  </div>
                </p>
                {communityUsers.subscribers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <MdSupervisorAccount className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Members Yet</h3>
                    <p className="text-gray-500 max-w-sm">
                      Start building your community by adding members and creating meaningful connections.
                    </p>
                    <Link href="/partner/people/add" passHref>
                      <button className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
                        <MdPersonAdd className="w-5 h-5 mr-2" />
                        Add First Member
                      </button>
                    </Link>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2 mb-4">
                    {communityUsers.subscribers.slice(0, 10).map((user, index) => {
                      const userName = user.name;
                      const userRole = user.userType;
                      const userEmail = user.email;
                      const userPhoto = user.photoURL;
                      const userId = user.id;
                      
                      // Determine the correct detail page URL based on role
                      let detailPageUrl = '';
                      if (userRole === 'user') detailPageUrl = `/admin/people/${userId}`;
                      else if (userRole === 'expert') detailPageUrl = `/admin/expert/${userId}`;
                      else if (userRole === 'partner') detailPageUrl = `/admin/partner/${userId}`;
                      else if (userRole === 'admin') detailPageUrl = `/admin/admin/${userId}`;
                      
                      return (
                        <Link href={detailPageUrl} key={`user-${index}`} passHref>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer group">
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
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                                {userName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {userRole}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    </div>
                  )}
              </div>
                {/* Resources Section */}
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
                  Resources
                </p>
                {resources?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resources Yet</h3>
                    <p className="text-gray-500 max-w-sm">
                      Add valuable resources to help your community members learn and grow together.
                    </p>
                    <Link href="/partner/resources/add" passHref>
                      <button className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Resource
                      </button>
                    </Link>
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
                        <div key={`resource-${idx}`} className="group bg-white rounded-lg p-3 border border-gray-100 hover:border-orange-200 transition-all duration-200 shadow-sm hover:shadow-md">
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
                                <h4 className="text-sm font-medium m-0 text-gray-900 truncate group-hover:text-orange-600 transition-colors duration-200">{item.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
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
                                className="inline-flex items-center justify-center w-full px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded hover:bg-orange-100 transition-colors duration-200 group-hover:bg-orange-100"
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
                <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
                    <p className="text-gray-500 max-w-sm">
                      Create engaging sessions to help your community members learn and interact.
                    </p>
                    <Link href="/admin/session/add" passHref>
                      <button className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
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
              {/* Groups Section */}
              {/* <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Yet</h3>
                    <p className="text-gray-500 max-w-sm">
                      Create interest groups to help members connect and collaborate on specific topics.
                    </p>
                    <Link href="/community/group/add" passHref>
                      <button className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
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
            <h1>Try logging out</h1>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {
          showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
              <button onClick={() => setShowDeleteModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold">&times;</button>
              <h2 className="text-xl font-bold text-orange-700">Delete Community</h2>
              <p className="text-gray-700">To confirm deletion, please type the community name below:</p>
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl mx-auto flex flex-col gap-2 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowSubscriptionModal(false)} 
                className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold"
              >
                &times;
              </button>
              
              <h2 className="text-2xl font-bold text-orange-700 m-0 p-0">Manage Subscriptions</h2>
              
              {/* Tabs */}
              <div className="flex gap-4 border-b border-gray-200">
                <button
                  className={`px-4 py-2 font-medium ${
                    activeTab === 'nonSubscribers'
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-500 hover:text-orange-600'
                  }`}
                  onClick={() => {
                    setActiveTab('nonSubscribers');
                    setSelectedUsers([]);
                  }}
                >
                  Add Subscribers ({communityUsers.total.nonSubscribed})
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    activeTab === 'subscribers'
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-500 hover:text-orange-600'
                  }`}
                  onClick={() => {
                    setActiveTab('subscribers');
                    setSelectedUsers([]);
                  }}
                >
                  Remove Subscribers ({communityUsers.total.subscribed})
                </button>
              </div>

              {activeTab === 'nonSubscribers' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription Duration (months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={subscriptionDuration}
                    onChange={(e) => setSubscriptionDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              )}

              <div className="max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(activeTab === 'nonSubscribers' ? communityUsers.nonSubscribers : communityUsers.subscribers).map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-3
                        ${selectedUsers.includes(user.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                        }`}
                      onClick={() => {
                        setSelectedUsers(prev =>
                          prev.includes(user.id)
                            ? prev.filter(id => id !== user.id)
                            : [...prev, user.id]
                        );
                      }}
                    >
                      {/* Avatar with photoURL */}
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.name}
                            className="w-12 h-12 object-cover rounded-full"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M6 20c0-2.21 3.58-4 6-4s6 1.79 6 4" />
                          </svg>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold m-0 p-0 text-gray-900 truncate">{user.name || 'No Name'}</h1>
                        <h2 className="text-base font-normal m-0 p-0 text-gray-600 truncate">{user.email}</h2>
                        <h3 className="text-sm font-medium m-0 p-0 text-gray-500">{user.userType}</h3>
                        {activeTab === 'subscribers' && user.subscription && (
                          <div className="mt-1 text-xs text-gray-500">
                            <h4 className="m-0 p-0">Start: {new Date(user.subscription.startDate).toLocaleDateString()}</h4>
                            <h4 className="m-0 p-0">End: {new Date(user.subscription.endDate).toLocaleDateString()}</h4>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {subscriptionError && (
                <div className="text-red-500 text-sm mt-2">{subscriptionError}</div>
              )}

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                    onClick={() => setShowSubscriptionModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300 ${
                      isLoading ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                    onClick={handleSubscriptionSubmit}
                    disabled={isLoading}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                    <span className="relative z-10">
                      {isLoading ? 'Processing...' : `${activeTab === 'nonSubscribers' ? 'Add' : 'Remove'} Subscriptions`}
                    </span>
                  </button>
                </div>
              </div>
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
                <h2 className="text-2xl font-bold text-gray-900">Create Subcommunity</h2>
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
                  <p className="text-blue-700 text-sm">
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
    </>
  );
};

export default CommunityPage;
