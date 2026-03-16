import {
  selectAllCommunities,
  selectAllSessions,
  selectCurrResourceLink,
  selectCurrResourceName,
  selectCurrentResource,
  setCurrentLink,
  setCurrentName,
} from "@/store/features/resourceSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { 
  MdChevronRight, 
  MdHome, 
  MdSearch, 
  MdAdd, 
  MdLink, 
  MdGroups, 
  MdVideoLibrary, 
  MdClose, 
  MdArrowForward, 
  MdInfo,
  MdCloudUpload,
  MdFileUpload,
  MdImage,
  MdVideoFile,
  MdPictureAsPdf,
  MdLink as MdLinkIcon,
  MdCheck,
  MdExpandMore,
  MdExpandLess,
  MdDownload,
  MdUpload,
  MdRemove,
  MdEdit,
  MdSave
} from "react-icons/md";
import Head from "next/head";

const MultiSelectDropdown = ({ 
  options, 
  selectedItems, 
  onSelect, 
  onRemove, 
  placeholder, 
  searchValue, 
  onSearchChange,
  isLoading = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filteredOptions = options?.filter(option => 
    !selectedItems?.some(item => item.id === option.id) &&
    option.title?.toLowerCase().includes(searchValue.toLowerCase())
  ) || [];

  const handleSelect = (item) => {
    onSelect(item);
  };

  const handleRemove = (item) => {
    onRemove(item);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="min-h-[40px] border border-gray-300 rounded-lg px-3 py-2 bg-white">
        {selectedItems?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs"
              >
                <span className="truncate max-w-[100px]">{item.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="hover:bg-orange-200 rounded-full p-0.5"
                >
                  <MdClose className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 text-xs">{placeholder}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
      >
        {isOpen ? <MdExpandLess className="w-4 h-4" /> : <MdExpandMore className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <MdSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="max-h-36 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-1 text-xs">Loading...</p>
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-3 py-2 text-left hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={option.bannerImg || option.photoURL || "/notImg.svg"}
                      alt={option.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/notImg.svg";
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-xs">{option.title}</p>
                    {option.desc && (
                      <p className="text-xs text-gray-500 truncate">{option.desc}</p>
                    )}
                  </div>
                  <MdAdd className="w-4 h-4 text-orange-500 flex-shrink-0" />
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">
                <p className="text-xs">{searchValue ? 'No results found' : 'No options available'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const EditResource = () => {
  const form = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const resource = useSelector(selectCurrentResource);
  const allCommunities = useSelector(selectAllCommunities);
  const allSessions = useSelector(selectAllSessions);
  const resName = useSelector(selectCurrResourceName);
  const resLink = useSelector(selectCurrResourceLink);

  const [isLoading, setIsLoading] = useState(false);
  const [searchCommunity, setSearchCommunity] = useState("");
  const [searchSession, setSearchSession] = useState("");
  
  // Current resource data
  const [resourceData, setResourceData] = useState({
    name: "",
    link: "",
    communityArr: [],
    sessionArr: [],
    isPreSession: false,
    isPostSession: false,
  });

  // Available options (not currently selected)
  const [availableCommunities, setAvailableCommunities] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);

  useEffect(() => {
    if (resource) {
      setResourceData({
        name: resource.name || "",
        link: resource.link || "",
        communityArr: resource.community || [],
        sessionArr: resource.session || [],
        isPreSession: resource.isPreSession || false,
        isPostSession: resource.isPostSession || false,
      });
    }
  }, [resource]);

  useEffect(() => {
    if (allCommunities && resourceData.communityArr) {
      const available = allCommunities.filter(
        community => !resourceData.communityArr.some(selected => selected.id === community.id)
      );
      setAvailableCommunities(available);
    }
  }, [allCommunities, resourceData.communityArr]);

  useEffect(() => {
    if (allSessions && resourceData.sessionArr) {
      const available = allSessions.filter(
        session => !resourceData.sessionArr.some(selected => selected.id === session.id)
      );
      setAvailableSessions(available);
    }
  }, [allSessions, resourceData.sessionArr]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setResourceData({
      ...resourceData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSelectCommunity = (item) => {
    setResourceData({
      ...resourceData,
      communityArr: [...resourceData.communityArr, item]
    });
  };

  const handleDeleteCommunity = (item) => {
    setResourceData({
      ...resourceData,
      communityArr: resourceData.communityArr.filter((x) => x.id !== item.id),
    });
  };

  const handleSelectSession = (item) => {
    setResourceData({
      ...resourceData,
      sessionArr: [...resourceData.sessionArr, item]
    });
  };

  const handleDeleteSession = (item) => {
    setResourceData({
      ...resourceData,
      sessionArr: resourceData.sessionArr.filter((x) => x.id !== item.id),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
    const res = await api.patch(`/resources/${resource.id}`, {
      data: {
          name: resourceData.name,
          communityArr: resourceData.communityArr,
          sessionArr: resourceData.sessionArr,
          isPreSession: resourceData.isPreSession,
          isPostSession: resourceData.isPostSession,
      },
    });
      
    if (res.data.success) {
        toast.success('Resource updated successfully!');
        setTimeout(() => {
          router.push('/admin/resources');
        }, 2000);
      }
    } catch (error) {
      console.error('Resource update error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearForm = (e) => {
    e.preventDefault();
    form.current.reset();
    if (resource) {
      setResourceData({
        name: resource.name || "",
        link: resource.link || "",
        communityArr: resource.community || [],
        sessionArr: resource.session || [],
        isPreSession: resource.isPreSession || false,
        isPostSession: resource.isPostSession || false,
      });
    }
  };

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resource...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Edit Resource - Admin Dashboard</title>
      </Head>
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/resources')}
                className="text-gray-500 hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-orange-50"
                title="Back to Resource List"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Resource</h1>
                <p className="text-sm text-gray-500">Update resource information and associations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/admin/resources')}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>View All Resources</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Resource</h2>
              <p className="text-gray-600 mb-6">Update resource details and manage associations</p>

              {/* Instructions */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2 flex items-center space-x-2">
                  <MdInfo className="w-4 h-4" />
                  <span>Edit Features:</span>
                </h4>
                <ul className="text-orange-800 space-y-1 text-sm">
                  <li>• Update resource name</li>
                  <li>• Link cannot be modified (read-only)</li>
                  <li>• Add/remove communities</li>
                  <li>• Add/remove sessions</li>
                  <li>• Real-time validation</li>
                  <li>• Immediate feedback</li>
                  <li>• Preserve existing data</li>
                </ul>
              </div>

              {/* Loading Indicator */}
              {isLoading && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-900">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Updating...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <form ref={form} onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                      <MdLink className="text-orange-500" />
                      Resource Information
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="name" className="text-xs font-medium text-gray-700">
                          Resource Name <span className="text-red-500">*</span>
                        </label>
              <input
                type="text"
                id="name"
                name="name"
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
                          value={resourceData.name || ""}
                          onChange={handleChange}
                          placeholder="Enter resource name"
              />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label htmlFor="link" className="text-xs font-medium text-gray-700">
                          Resource Link <span className="text-gray-400">(Read-only)</span>
            </label>
              <input
                          type="url"
                id="link"
                name="link"
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                          disabled
                          value={resourceData.link || ""}
                          placeholder="Resource link (cannot be edited)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Communities */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <MdGroups className="text-orange-500" />
                        Communities
                      </h3>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>{resourceData.communityArr.length} selected</span>
                        <MdInfo className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>

                    {/* Selected Communities */}
                    {resourceData.communityArr.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Communities:</h4>
                        <MultiSelectDropdown
                          options={resourceData.communityArr}
                          selectedItems={resourceData.communityArr}
                          onSelect={() => {}}
                          onRemove={handleDeleteCommunity}
                          placeholder="No communities selected"
                          searchValue=""
                          onSearchChange={() => {}}
                        />
                      </div>
                    )}

                    {/* Available Communities */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Available Communities:</h4>
                      <MultiSelectDropdown
                        options={availableCommunities}
                        selectedItems={[]}
                        onSelect={handleSelectCommunity}
                        onRemove={() => {}}
                        placeholder="Select communities to add..."
                        searchValue={searchCommunity}
                        onSearchChange={setSearchCommunity}
                      />
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <MdVideoLibrary className="text-orange-500" />
                        Sessions
                      </h3>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>{resourceData.sessionArr.length} selected</span>
                        <MdInfo className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>

                    {/* Selected Sessions */}
                    {resourceData.sessionArr.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Sessions:</h4>
                        <MultiSelectDropdown
                          options={resourceData.sessionArr}
                          selectedItems={resourceData.sessionArr}
                          onSelect={() => {}}
                          onRemove={handleDeleteSession}
                          placeholder="No sessions selected"
                          searchValue=""
                          onSearchChange={() => {}}
                        />
                      </div>
                    )}

                    {/* Available Sessions */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Available Sessions:</h4>
                      <MultiSelectDropdown
                        options={availableSessions}
                        selectedItems={[]}
                        onSelect={handleSelectSession}
                        onRemove={() => {}}
                        placeholder="Select sessions to add..."
                        searchValue={searchSession}
                        onSearchChange={setSearchSession}
            />
          </div>

                    {/* Session Display Options */}
                    {resourceData.sessionArr.length > 0 && (
                      <div className="mt-4 bg-orange-50 rounded-lg p-3">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Display Options</h3>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              name="isPreSession"
                              checked={resourceData.isPreSession}
                              onChange={handleChange}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                            />
                            <span className="text-xs text-gray-700">Pre-Session</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              name="isPostSession"
                              checked={resourceData.isPostSession}
                              onChange={handleChange}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                            />
                            <span className="text-xs text-gray-700">Post-Session</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <MdSave className="w-4 h-4" />
                          Update Resource
                        </>
                      )}
                    </button>
            <button
                      type="button"
              onClick={handleClearForm}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                      Reset
            </button>
          </div>
        </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditResource;
