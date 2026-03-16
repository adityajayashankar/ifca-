import ResourceCarousel from "@/components/common/ResourceCarousel";
import CategoryCard from "@/components/community/categorycard";
import {
  selectAllResources,
  selectAllResourcesGlobal,
  setAllCommunities,
  setAllResources,
  setAllResourcesGlobal,
  setAllSessions,
  setResourceIdvl,
} from "@/store/features/resourceSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { CloseOutlined } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import LinkIcon from "@mui/icons-material/Link";
import { MdChevronRight, MdHome } from "react-icons/md";
import Head from "next/head";

const DeleteModal = ({ item, setModal }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [deleteInput, setDeleteInput] = useState("");
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleYes = async () => {
    if (deleteInput !== item.name) return;
    setLoadingDelete(true);
    const res = await api.delete(`/resources/${item.id}`);
    if (res.data.success) {
      dispatch(setAllResourcesGlobal());
      setModal(false);
      toast.success('Resource deleted Successfully');
    }
    setLoadingDelete(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
        <button onClick={() => setModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold">&times;</button>
        <h2 className="text-xl font-bold text-orange-700">Delete Resource</h2>
        <p className="text-gray-700">To confirm deletion, please type the resource name below:</p>
        <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded font-semibold text-center select-all cursor-pointer" onClick={() => navigator.clipboard.writeText(item.name)}>
          {item.name}
        </div>
        <input
          type="text"
          className="border border-orange-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
          placeholder="Type resource name to confirm..."
          value={deleteInput}
          onChange={e => setDeleteInput(e.target.value)}
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <button
            className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={() => setModal(false)}
            disabled={loadingDelete}
          >
            Cancel
          </button>
          <button
            className={`relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300 ${loadingDelete || deleteInput !== item.name ? 'cursor-not-allowed opacity-60' : ''}`}
            onClick={handleYes}
            disabled={loadingDelete || deleteInput !== item.name}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
            <span className="relative flex items-center justify-center z-10">
              {loadingDelete ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ item, setModal }) => {
  const router = useRouter();
  
  const handleClick = () => {
    setModal(false);
  };

  const handleCommunityClick = (communityId) => {
    router.push(`/admin/community/${communityId}`);
  };

  const handleSessionClick = (sessionId) => {
    router.push(`/admin/session/${sessionId}`);
  };

  // Safe URL parsing for favicon
  const getFaviconUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
      return '/notImg.svg';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] backdrop-blur-sm flex items-center justify-center bg-black bg-opacity-40 max-w-[1920px] mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-auto flex flex-col gap-6 relative max-h-[90vh] overflow-hidden">
        <button onClick={handleClick} className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold z-10">&times;</button>
        <div className="flex flex-col gap-6 overflow-y-auto p-6">
          {/* Header Section */}
          <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
            <div className="flex-shrink-0">
              <img
                src={getFaviconUrl(item.link)}
                alt={`${item.name} favicon`}
                className="w-12 h-12 rounded-lg shadow-sm"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/notImg.svg';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 m-0">{item.name}</h2>
              <a 
                href={item.link} 
                target="_blank" 
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-medium m-0 break-all"
              >
                {item.link}
                <LinkIcon className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* Communities Section */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {item?.community?.length > 0 ? 'Present in Communities' : 'Not present in any community'}
            </h3>
            {item?.community?.length > 0 ? (
              <div className="bg-white rounded-xl p-4 shadow-md border border-orange-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {item.community.map((community, index) => (
                    <div 
                      key={community.id} 
                      className="group flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 cursor-pointer"
                      onClick={() => handleCommunityClick(community.id)}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-200 border-2 border-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <img
                          src={community.bannerImg || community.photoURL || "/notImg.svg"}
                          alt={community.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/notImg.svg";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate text-sm group-hover:text-orange-700 transition-colors duration-300">{community.title}</h4>
                        {community.desc && (
                          <p className="text-xs text-gray-600 truncate mt-1">{community.desc}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
          </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-xl border border-orange-100 shadow-sm">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">This resource hasn't been added to any communities yet.</p>
              </div>
            )}
          </div>

          {/* Sessions Section */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {item?.session?.length > 0 ? 'Present in Sessions' : 'Not present in any session'}
            </h3>
            {item?.session?.length > 0 ? (
              <div className="bg-white rounded-xl p-4 shadow-md border border-orange-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {item.session.map((session, index) => (
                    <div 
                      key={session.id} 
                      className="group flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 cursor-pointer"
                      onClick={() => handleSessionClick(session.id)}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-200 border-2 border-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <img
                          src={session.bannerImg || session.photoURL || "/notImg.svg"}
                          alt={session.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/notImg.svg";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate text-sm group-hover:text-orange-700 transition-colors duration-300">{session.title}</h4>
                        {session.desc && (
                          <p className="text-xs text-gray-600 truncate mt-1">{session.desc}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-xl border border-orange-100 shadow-sm">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">This resource hasn't been added to any sessions yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Resources = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const router = useRouter();
  const resources = useSelector(selectAllResourcesGlobal);
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currResource, setCurrResource] = useState();

  useEffect(() => {
    dispatch(setAllResourcesGlobal());
    dispatch(setAllCommunities());
    dispatch(setAllSessions());
  }, []);

  const handleAdd = () => {
    router.push(`/admin/resources/add`);
  };

  const handleView = (item) => {
    setCurrResource(item);
    setModal(true);
  };

  const handleEdit = (id) => {
    dispatch(setResourceIdvl(id));
    router.push(`/admin/resources/${id}`);
  };

  const handleDelete = (item) => {
    setDeleteModal(true);
    setCurrResource(item);
  };

  return (
    <>
      <Head>
        <title>Resources Management</title>
      </Head>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
        <button
            onClick={() => router.push('/admin')}
            className="flex items-center hover:text-orange-700"
        >
            <MdHome className="w-4 h-4" />
        </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">Resources</span>
        </div>
      </div>

      <div className="min-h-[calc(100vh-138px)] bg-gray-50 mx-auto px-2 md:px-4 lg:px-0 max-w-[1920px]">
        <div className="flex flex-col gap-8 min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] max-w-[1920px] mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900  m-0">Resources</h1>
                <p className="text-gray-600">Manage and organize your learning resources</p>
              </div>
              <button
                className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300"
                onClick={handleAdd}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                <span className="relative z-10">Add Resource</span>
              </button>
            </div>
          </div>

          {/* Resources Grid */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
            {!resources || resources.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No Resources Yet</h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    Start building your resource library by adding valuable content that will help your community members learn and grow together.
                  </p>
                  <button
                    className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                    onClick={handleAdd}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add First Resource
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {resources.map((item) => {
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
                    <div key={item.id} className="group bg-white rounded-xl p-4 border border-gray-200 hover:border-orange-300 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-orange-100">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-shrink-0">
                            <img
                              src={getFavicon(item.link)}
                              alt={`${item.name} favicon`}
                              className="w-8 h-8 rounded-lg group-hover:scale-110 transition-transform duration-300 border-2 border-gray-100 group-hover:border-orange-200"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/notImg.svg';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold m-0 text-gray-900 truncate group-hover:text-orange-600 transition-colors duration-300">{item.name}</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <span className="truncate">{getDomain(item.link)}</span>
                              <LinkIcon className="w-3 h-3 flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <div className="flex gap-2">
                    <button
                      onClick={() => handleView(item)}
                              className="flex-1 px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all duration-300 hover:shadow-sm border border-orange-200 hover:border-orange-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(item.id)}
                              className="flex-1 px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all duration-300 hover:shadow-sm border border-orange-200 hover:border-orange-300"
                    >
                              Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                              className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-300 hover:shadow-sm border border-red-200 hover:border-red-300"
                    >
                      Delete
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
        </div>
      </div>
     
      {modal && <Modal item={currResource} setModal={setModal} />}
      {deleteModal && <DeleteModal item={currResource} setModal={setDeleteModal} />}
    </>
  );
};

export default Resources;
