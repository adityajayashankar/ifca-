import CategoryCard from "@/components/community/categorycard";
import {
  selectAllCommunities,
  selectAllSessions,
} from "@/store/features/resourceSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import Card from "@/components/common/Card";
import { useRouter } from "next/router";
import React, { useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import ResourceCarousel from "@/components/common/ResourceCarousel";
import { toast } from "react-toastify";
import axios from "axios";
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
  MdRemove
} from "react-icons/md";
import Head from "next/head";

const EmptyStateCard = ({ title, description, icon: Icon }) => (
  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 text-center relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-orange-200/10 transform -skew-y-6 -translate-y-1/2"></div>
    <div className="relative z-10">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  </div>
);

const FileUploadZone = ({ onFileSelect, selectedFiles, fileType, multiple = false }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (files) => {
    if (files) {
      const fileArray = Array.from(files);
      const allowedTypes = {
        'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        'video': ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
        'pdf': ['application/pdf'],
        'all': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'application/pdf']
      };

      const types = allowedTypes[fileType] || allowedTypes.all;
      
      const validFiles = fileArray.filter(file => {
        if (!types.includes(file.type)) {
          toast.error(`Invalid file type: ${file.name}. Please select a valid ${fileType} file.`);
          return false;
        }
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
          toast.error(`File too large: ${file.name}. Please select a file smaller than 100MB.`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        // If multiple is false, only take the first file
        const filesToSet = multiple ? validFiles : [validFiles[0]];
        onFileSelect(filesToSet);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const getFileIcon = () => {
    return <MdCloudUpload className="w-6 h-6 text-orange-500" />;
  };

  const getFileTypeText = () => {
    switch (fileType) {
      case 'image': return 'Image files (JPG, PNG, GIF, WebP)';
      case 'video': return 'Video files (MP4, AVI, MOV, WMV)';
      case 'pdf': return 'PDF files';
      default: return 'All files (Images, Videos, PDFs)';
    }
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFileSelect(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 cursor-pointer ${
          isDragOver 
            ? 'border-orange-400 bg-orange-50' 
            : selectedFiles?.length > 0 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={fileType === 'image' ? 'image/*' : fileType === 'video' ? 'video/*' : fileType === 'pdf' ? '.pdf' : '*'}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        
        <div className="flex flex-col items-center gap-2">
          {getFileIcon()}
          
          {selectedFiles?.length > 0 ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-900">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </h3>
              <p className="text-xs text-gray-500">
                Total size: {(selectedFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-900">Upload File{multiple ? 's' : ''}</h3>
              <p className="text-xs text-gray-500">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400">
                {getFileTypeText()} • Max 100MB per file
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Selected Files:</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <MdImage className="w-4 h-4 text-green-500" />
                    ) : file.type.startsWith('video/') ? (
                      <MdVideoFile className="w-4 h-4 text-blue-500" />
                    ) : (
                      <MdPictureAsPdf className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 p-1 hover:bg-red-100 rounded text-red-600"
                >
                  <MdClose className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

const IndividualResourceForm = ({ onSuccess, onError, setIsLoading }) => {
  const form = useRef(null);
  const allCommunities = useSelector(selectAllCommunities);
  const allSessions = useSelector(selectAllSessions);
  const user = useSelector(selectUser);
  const router = useRouter();

  const partnerCommunities = allCommunities?.filter((com) => com.creatorId === user?.unifiedUser?.id) || [];
  const partnerSessions = allSessions?.filter((session) => session.creatorId === user?.unifiedUser?.id) || [];

  const [resources, setResources] = useState([
    {
    name: "",
    link: "",
    authorId: user?.unifiedUser?.id,
    sessionArr: [],
    communityArr: [],
      isPreSession: false,
      isPostSession: false,
      resourceType: 'link',
      selectedFiles: []
    }
  ]);

  const [uploading, setUploading] = useState(false);
  const [searchCommunity, setSearchCommunity] = useState("");
  const [searchSession, setSearchSession] = useState("");

  const handleChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const updatedResources = [...resources];
    updatedResources[index] = {
      ...updatedResources[index],
      [name]: type === "checkbox" ? checked : value 
    };
    setResources(updatedResources);
  };

  const handleResourceTypeChange = (index, value) => {
    const updatedResources = [...resources];
    updatedResources[index] = {
      ...updatedResources[index],
      resourceType: value,
      selectedFiles: [], // Clear files when changing type
      link: value === 'link' ? '' : updatedResources[index].link
    };
    setResources(updatedResources);
  };

  const handleFileSelect = (index, files) => {
    const updatedResources = [...resources];
    updatedResources[index] = {
      ...updatedResources[index],
      selectedFiles: files
    };
    setResources(updatedResources);
  };

  const uploadToS3 = async (file) => {
    try {
      // Step 1: Get a presigned URL from the backend
      const response = await api.post("/images/generate-presigned-url", {
        fileName: file.name,
        fileType: file.type,
        folder: "resources",
      });

      const { uploadUrl, fileUrl } = response.data;

      // Step 2: Upload file to S3
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      return fileUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      throw new Error('Failed to upload file');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setIsLoading(true);

    try {
      const results = [];
      
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        
        if (!resource.name.trim()) {
          toast.error(`Resource ${i + 1}: Name is required`);
          continue;
        }

        let finalLink = resource.link;

        if (resource.resourceType === 'file' && resource.selectedFiles.length > 0) {
          const uploadPromises = resource.selectedFiles.map(file => uploadToS3(file));
          const uploadedUrls = await Promise.all(uploadPromises);
          finalLink = uploadedUrls.join(',');
        } else if (resource.resourceType === 'link' && !resource.link.trim()) {
          toast.error(`Resource ${i + 1}: Link is required`);
          continue;
        }

        const resourceData = {
          ...resource,
          link: finalLink,
        };

        try {
          const res = await api.post(`/resources/-1`, resourceData);
    if (res.data.success) {
            results.push({ index: i, success: true });
          }
        } catch (error) {
          results.push({ index: i, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        onSuccess(`Successfully created ${successCount} resource${successCount > 1 ? 's' : ''}!`);
      }
      
      if (failureCount > 0) {
        toast.error(`${failureCount} resource${failureCount > 1 ? 's' : ''} failed to create`);
      }

    } catch (error) {
      onError(error);
    } finally {
      setUploading(false);
      setIsLoading(false);
    }
  };

  const handleSelectCommunity = (index, item) => {
    const updatedResources = [...resources];
    updatedResources[index] = {
      ...updatedResources[index],
      communityArr: [...updatedResources[index].communityArr, item]
    };
    setResources(updatedResources);
  };

  const handleSelectSession = (index, item) => {
    const updatedResources = [...resources];
    updatedResources[index] = {
      ...updatedResources[index],
      sessionArr: [...updatedResources[index].sessionArr, item]
    };
    setResources(updatedResources);
  };

  const handleDeleteCommunity = (index, item) => {
    const updatedResources = [...resources];
    updatedResources[index] = {
      ...updatedResources[index],
      communityArr: updatedResources[index].communityArr.filter((x) => x.id !== item.id),
    };
    setResources(updatedResources);
  };

  const handleDeleteSession = (index, item) => {
    const updatedResources = [...resources];
    updatedResources[index] = {
      ...updatedResources[index],
      sessionArr: updatedResources[index].sessionArr.filter((x) => x.id !== item.id),
    };
    setResources(updatedResources);
  };

  const addMoreResource = () => {
    setResources([
      ...resources,
      {
        name: "",
        link: "",
        authorId: user?.unifiedUser?.id,
        sessionArr: [],
        communityArr: [],
        isPreSession: false,
        isPostSession: false,
        resourceType: 'link',
        selectedFiles: []
      }
    ]);
  };

  const removeResource = (index) => {
    if (resources.length > 1) {
      const updatedResources = resources.filter((_, i) => i !== index);
      setResources(updatedResources);
    }
  };

  const handleClearForm = (e) => {
    e.preventDefault();
    form.current.reset();
    setResources([
      {
      name: "",
      link: "",
      sessionArr: [],
      communityArr: [],
        authorId: user.unifiedUser?.id,
      isPreSession: false, 
      isPostSession: false, 
        resourceType: 'link',
        selectedFiles: []
      }
    ]);
  };

  return (
    <form ref={form} onSubmit={handleSubmit} className="space-y-6">
      {resources.map((resource, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Resource Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MdLink className="text-orange-500" />
              Resource {index + 1}
            </h2>
            {resources.length > 1 && (
          <button
                type="button"
                onClick={() => removeResource(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove Resource"
              >
                <MdRemove className="w-5 h-5" />
          </button>
            )}
      </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label htmlFor={`name-${index}`} className="text-xs font-medium text-gray-700">
                    Resource Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                id={`name-${index}`}
                    name="name"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    required
                    value={resource.name || ""}
                onChange={(e) => handleChange(index, e)}
                    placeholder="Enter resource name"
                  />
                </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">
                Resource Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`resourceType-${index}`}
                    value="link"
                    checked={resource.resourceType === 'link'}
                    onChange={(e) => handleResourceTypeChange(index, e.target.value)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <MdLinkIcon className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Link</span>
                  </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`resourceType-${index}`}
                    value="file"
                    checked={resource.resourceType === 'file'}
                    onChange={(e) => handleResourceTypeChange(index, e.target.value)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <MdFileUpload className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">File Upload</span>
                </label>
              </div>
                </div>
              </div>

          {/* Resource Link or File Upload */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-2 block">
              Resource {resource.resourceType === 'link' ? 'Link' : 'File'} <span className="text-red-500">*</span>
            </label>
            
            {resource.resourceType === 'link' ? (
                    <input
                type="url"
                name="link"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
                value={resource.link || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Enter resource URL (https://...)"
                      />
                    ) : (
              <FileUploadZone
                onFileSelect={(files) => handleFileSelect(index, files)}
                selectedFiles={resource.selectedFiles}
                fileType="all"
                multiple={false}
                    />
                  )}
                </div>

          {/* Communities */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                <MdGroups className="text-orange-500" />
                Communities
              </h3>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>{resource.communityArr.length} selected</span>
                <MdInfo className="w-3 h-3 text-gray-400" />
              </div>
            </div>

            <MultiSelectDropdown
              options={partnerCommunities}
              selectedItems={resource.communityArr}
              onSelect={(item) => handleSelectCommunity(index, item)}
              onRemove={(item) => handleDeleteCommunity(index, item)}
              placeholder="Select communities..."
              searchValue={searchCommunity}
              onSearchChange={setSearchCommunity}
            />
          </div>

          {/* Sessions */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <MdVideoLibrary className="text-orange-500" />
                  Sessions
              </h3>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>{resource.sessionArr.length} selected</span>
                <MdInfo className="w-3 h-3 text-gray-400" />
              </div>
                    </div>

            <MultiSelectDropdown
              options={partnerSessions}
              selectedItems={resource.sessionArr}
              onSelect={(item) => handleSelectSession(index, item)}
              onRemove={(item) => handleDeleteSession(index, item)}
              placeholder="Select sessions..."
              searchValue={searchSession}
              onSearchChange={setSearchSession}
            />

            {/* Session Display Options */}
            {resource.sessionArr.length > 0 && (
              <div className="mt-3 bg-orange-50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Display Options</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              name="isPreSession"
                              checked={resource.isPreSession}
                      onChange={(e) => handleChange(index, e)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                            />
                    <span className="text-xs text-gray-700">Pre-Session</span>
                          </label>
                  <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              name="isPostSession"
                              checked={resource.isPostSession}
                      onChange={(e) => handleChange(index, e)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <span className="text-xs text-gray-700">Post-Session</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add More Resource Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={addMoreResource}
          className="flex items-center gap-2 px-6 py-3 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-medium transition-colors"
        >
          <MdAdd className="w-5 h-5" />
          Add More Resource
        </button>
            </div>

            {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={uploading}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Resources...
            </>
          ) : (
            <>
              <MdAdd className="w-4 h-4" />
              Create {resources.length} Resource{resources.length > 1 ? 's' : ''}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleClearForm}
          disabled={uploading}
          className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

const AddResource = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSuccess = (message, data) => {
    if (data && data.summary) {
      const { created, skipped, failed, total } = data.summary;
      if (created > 0) {
        toast.success(`Successfully uploaded ${created} resources! ${skipped > 0 ? `${skipped} skipped.` : ''} ${failed > 0 ? `${failed} failed.` : ''}`);
      } else if (skipped > 0 && failed === 0) {
        toast.warning(`All ${skipped} resources already exist. No new resources created.`);
      } else if (failed > 0) {
        toast.error(`Failed to upload resources. ${failed} errors occurred.`);
      }
    } else {
      toast.success(message || 'Resource created successfully!');
    }
    
    setTimeout(() => {
      router.push('/partner/resources');
    }, 3000);
  };

  const handleError = (error) => {
    console.error('Resource creation error:', error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong';
    toast.error(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Add Resource - Admin Dashboard</title>
      </Head>
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/partner/resources')}
                className="text-gray-500 hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-orange-50"
                title="Back to Resource List"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Add Resource</h1>
                <p className="text-sm text-gray-500">Add new resources to the platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/partner/resources')}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Individual Create</h2>
              <p className="text-gray-600 mb-6">Add detailed resource information with custom names and file uploads</p>

              {/* Instructions */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2 flex items-center space-x-2">
                  <MdInfo className="w-4 h-4" />
                  <span>Individual Create Benefits:</span>
                </h4>
                <ul className="text-orange-800 space-y-1 text-sm">
                  <li>• Add detailed resource information</li>
                  <li>• Upload single file per resource</li>
                  <li>• Select communities and sessions</li>
                  <li>• Real-time validation</li>
                  <li>• Immediate feedback</li>
                  <li>• Custom resource names</li>
                  <li>• Add multiple resources</li>
                </ul>
              </div>

              {/* Loading Indicator */}
              {isLoading && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-900">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Processing...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <IndividualResourceForm 
                  onSuccess={handleSuccess}
                  onError={handleError}
                  setIsLoading={setIsLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddResource;
