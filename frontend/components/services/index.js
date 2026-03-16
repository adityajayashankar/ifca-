import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { useRouter } from "next/router";
import axios from "axios";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
const DEFAULT_IMAGE_URL='https://fastly.picsum.photos/id/20/3670/2462.jpg?hmac=CmQ0ln-k5ZqkdtLvVO23LjVAEabZQx2wOaT4pyeG10I'


// Replace uploadFileToS3 with backend presigned URL logic
const uploadFileWithProgress = async (file, folder, fileType) => {
  if (!file) return null;
  
  return new Promise((resolve, reject) => {
    // Step 1: Get presigned URL from backend
    api.post("/images/generate-presigned-url", {
      fileName: file.name,
      fileType: file.type,
      folder: folder
    }).then(response => {
      const { uploadUrl, fileUrl } = response.data;
      
      // Step 2: Upload file to S3 using presigned URL with progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [fileType]: progress }));
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadProgress(prev => ({ ...prev, [fileType]: 100 }));
          resolve(fileUrl);
        } else {
          reject(new Error('Upload failed'));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    }).catch(reject);
  });
};

const Services = ({services: initialServices, user, serviceResponses, addServiceOpen, handleAddServiceOpen, handleAddServiceClose}) => {
  const router = useRouter();
  const [services, setServices] = useState(initialServices || []);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
  });
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [modalServiceId, setModalServiceId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({ image: null, video: null });
  const [uploadProgress, setUploadProgress] = useState({ image: 0, video: 0 });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState({ image: null, video: null });
  const [dragStates, setDragStates] = useState({ image: false, video: false });
  const MAX_IMAGE_SIZE_MB = 2;
  const [interestLoading, setInterestLoading] = useState({});

  const communityId = router.query.id || router.asPath.split("/")[2];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDragOver = (e, fileType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [fileType]: true }));
  };

  const handleDragLeave = (e, fileType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [fileType]: false }));
  };

  const handleDrop = (e, fileType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [fileType]: false }));
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file type
      if (fileType === 'image') {
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file');
          return;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          toast.error('Image must be less than 2MB');
          return;
        }
      }
      if (fileType === 'video' && !file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }
      
      setSelectedFiles(prev => ({ ...prev, [fileType]: file }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewData(prev => ({ ...prev, [fileType]: previewUrl }));
      
      // Show preview modal
      setShowPreviewModal(true);
    }
  };

  const handleFileInputChange = (e, fileType) => {
    const { files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      if (fileType === 'image') {
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file');
          return;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          toast.error('Image must be less than 2MB');
          return;
        }
      }
      if (fileType === 'video' && !file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }
      setSelectedFiles(prev => ({ ...prev, [fileType]: file }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewData(prev => ({ ...prev, [fileType]: previewUrl }));
      
      // Show preview modal
      setShowPreviewModal(true);
    }
  };

  const removeFile = (fileType) => {
    setSelectedFiles(prev => ({ ...prev, [fileType]: null }));
    setPreviewData(prev => ({ ...prev, [fileType]: null }));
    setUploadProgress(prev => ({ ...prev, [fileType]: 0 }));
  };

  const DropZone = ({ fileType, title, accept, icon }) => {
    const hasFile = selectedFiles[fileType];
    const isDragOver = dragStates[fileType];
    const progress = uploadProgress[fileType];
    
    return (
      <div className="space-y-3">
        <p className="font-semibold text-orange-700">{title}</p>
        
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
            isDragOver 
              ? 'border-orange-400 bg-orange-50' 
              : hasFile 
                ? 'border-orange-300 bg-orange-25' 
                : 'border-orange-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-25'
          }`}
          onDragOver={(e) => handleDragOver(e, fileType)}
          onDragLeave={(e) => handleDragLeave(e, fileType)}
          onDrop={(e) => handleDrop(e, fileType)}
        >
          {!hasFile ? (
            <div className="text-center">
              <div className="text-4xl text-orange-400 mb-3">{icon}</div>
              <p className="text-gray-600 font-medium mb-2">
                Drag & drop your {fileType} here
              </p>
              <p className="text-gray-500 text-sm mb-4">
                or click to browse files
              </p>
              <input
                type="file"
                accept={accept}
                onChange={(e) => handleFileInputChange(e, fileType)}
                className="hidden"
                id={`file-input-${fileType}`}
              />
              <label
                htmlFor={`file-input-${fileType}`}
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition cursor-pointer font-semibold"
              >
                Choose {fileType}
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File Preview */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl text-orange-500">{icon}</div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedFiles[fileType]?.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFiles[fileType]?.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(fileType)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Progress Bar */}
              {progress > 0 && progress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-600">Uploading...</span>
                    <span className="text-orange-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Success State */}
              {progress === 100 && (
                <div className="flex items-center space-x-2 text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Upload complete!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handlePreviewConfirm = () => {
    setShowPreviewModal(false);
    // Preview is already set, proceed with form
  };

  const handlePreviewCancel = () => {
    setShowPreviewModal(false);
    setSelectedFiles({ image: null, video: null });
    setPreviewData({ image: null, video: null });
    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => input.value = '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress({ image: 0, video: 0 });
    
    try {
      let imageUrl = formData.imageUrl;
      let videoUrl = formData.videoUrl;
      
      // Upload image if selected
      if (selectedFiles.image) {
        imageUrl = await uploadFileWithProgress(selectedFiles.image, 'services', 'image');
      }
      
      // Upload video if selected
      if (selectedFiles.video) {
        videoUrl = await uploadFileWithProgress(selectedFiles.video, 'services', 'video');
      }
      
      const serviceData = {
        title: formData.title,
        description: formData.description,
        imageUrl,
        videoUrl,
        creatorId: user.unifiedUser.id,
        communityId: communityId ? parseInt(communityId) : undefined,
      };
      
      await api.post("/service", serviceData);
      toast.success("Service added successfully!");
      setFormData({ title: "", description: "", imageUrl: "", videoUrl: "" });
      setSelectedFiles({ image: null, video: null });
      setPreviewData({ image: null, video: null });
      setUploadProgress({ image: 0, video: 0 });
      handleAddServiceClose();
      fetchServices();
    } catch (error) {
      console.error("Error adding service:", error);
      toast.error("Failed to add service");
    } finally {
      setLoading(false);
    }
  };

  const handleInterested = async (serviceId) => {
    setInterestLoading(prev => ({ ...prev, [serviceId]: true }));
    try {
      await api.post('/service/subscribeToService', {
        userId: user?.unifiedUser?.id,
        serviceId,
      });
      setServices((prev) => prev.map(s =>
        s.id === serviceId
          ? { ...s, alreadyResponded: true, interestedCount: (s.interestedCount || 0) + 1 }
          : s
      ));
    } catch (err) {
      alert('Failed to show interest');
    } finally {
      setInterestLoading(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  // Find interested users for a service from serviceResponses
  const getInterestedUsers = (serviceId) => {
    if (!serviceResponses) return [];
    const found = serviceResponses.find(s => s.serviceId === serviceId);
    return found ? found.users : [];
  };

  // Check if current user is in the interested users array or alreadyResponded in local state
  const isUserInterested = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service?.alreadyResponded) return true;
    const users = getInterestedUsers(serviceId);
    return users.some(u => u.userId === user?.unifiedUser?.id);
  };

  // Modal for showing interested users
  const ResponsesModal = ({ open, onClose, users, serviceTitle }) => (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 animate-fadeIn">
          <button
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          {serviceTitle && (
            <h3 className="text-base font-bold text-orange-600 mb-2 text-center">{serviceTitle}</h3>
          )}
          <h2 className="text-lg font-bold mb-4 text-center">Interested Users</h2>
          {users.length === 0 ? (
            <div className="text-center text-gray-500">No interested users yet.</div>
          ) : (
            <div className="space-y-4">
              {users.map((u) => (
                <div key={u.userId} className="flex items-center bg-orange-50 rounded-lg p-3 shadow-sm">
                  <div className="flex flex-col items-center w-16 mr-3">
                    <img
                      src={u.profileImage || DEFAULT_IMAGE_URL}
                      alt={u.name}
                      className="w-12 h-12 rounded-full object-cover border border-orange-200 mb-1"
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <span className="text-xs font-semibold text-orange-700 truncate w-full text-left">{u.name}</span>
                    <span className="text-xs text-gray-700 truncate w-full text-left">{u.email}</span>
                  </div>
                  <a
                    href={`/user/${u.userId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 px-3 py-1 bg-orange-500 text-white rounded text-xs font-semibold hover:bg-orange-600 transition whitespace-nowrap"
                  >
                    View Profile
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ) : null
  );

  let previewModal = null;
  if (showPreviewModal) {
    previewModal = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60">
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl mx-4 p-6 md:p-10 animate-fadeIn border-2 border-orange-200 flex flex-col items-center max-h-[100vh] overflow-y-auto">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-orange-500 text-3xl font-bold"
            onClick={handlePreviewCancel}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-8 text-center text-orange-700">Preview Selected Files</h2>
          <div className="flex flex-col md:flex-row gap-10 w-full justify-center items-center">
            {/* Image Preview */}
            {previewData.image && (
              <div className="space-y-4 flex flex-col items-center">
                <h3 className="font-semibold text-orange-700">Image Preview</h3>
                <div className="relative">
                  <img
                    src={previewData.image}
                    alt="Image preview"
                    className="w-80 h-60 object-cover rounded-2xl border-2 border-orange-200 shadow-lg"
                  />
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow">
                    {selectedFiles.image?.name}
                  </div>
                </div>
              </div>
            )}
            {/* Video Preview */}
            {previewData.video && (
              <div className="space-y-4 flex flex-col items-center">
                <h3 className="font-semibold text-orange-700">Video Preview</h3>
                <div className="relative">
                  <video
                    src={previewData.video}
                    controls
                    className="w-80 h-60 object-cover rounded-2xl border-2 border-orange-200 shadow-lg"
                  />
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow">
                    {selectedFiles.video?.name}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-10 flex gap-4 justify-end w-full">
            <button
              onClick={handlePreviewCancel}
              className="border border-orange-500 text-orange-500 px-6 py-2 rounded-lg hover:bg-orange-50 transition font-semibold text-lg"
            >
              Cancel
            </button>
            <button
              onClick={handlePreviewConfirm}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition font-semibold shadow-md text-lg"
            >
              Confirm & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 w-full">
      {previewModal}
      <div className="flex flex-wrap -mx-2 mt-4">
        {services.length === 0 ? (
          <p className="ml-4 mt-2 font-semibold text-gray-500">No Services to display!! </p>
        ) : (
          services.map((service) => {
            const isCreator = service.creatorId === user?.unifiedUser?.id;
            const interestedUsers = getInterestedUsers(service.id);
            const alreadyResponded = isUserInterested(service.id);
            return (
              <div
                key={service.id}
                className="w-full sm:w-1/2 px-2 mb-4"
                style={{ minWidth: '260px', maxWidth: '100%' }}
              >
                <div
                  className="flex items-center bg-white border border-orange-200 shadow rounded-xl p-3 h-full hover:shadow-md transition group box-border"
                  style={{ minHeight: '80px' }}
                >
                  {/* Left: Image */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-orange-100 bg-gray-50 mr-3">
                    {service.videoUrl ? (
                      <video
                        src={service.videoUrl}
                        controls
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    ) : service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={DEFAULT_IMAGE_URL}
                        alt="No media"
                        className="w-full h-full object-cover opacity-50"
                      />
                    )}
                  </div>
                  {/* Right: Content */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-orange-700 truncate max-w-[140px]">{service.title}</h3>
                      <span className="ml-2 text-xs text-orange-500 font-semibold">{service.interestedCount || 0} interested</span>
                      {isCreator ? (
                        interestedUsers.length === 0 ? (
                          <span className="ml-2 px-3 py-1 rounded bg-gray-100 text-gray-400 text-xs font-semibold">No responses yet</span>
                        ) : (
                          <button
                            onClick={() => { setShowResponsesModal(true); setModalServiceId(service.id); }}
                            className="ml-2 bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition text-xs font-semibold shadow"
                          >
                            Responses
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleInterested(service.id)}
                          className={`ml-2 px-3 py-1 rounded text-xs font-semibold shadow transition-all flex items-center gap-1 ${alreadyResponded ? 'bg-orange-100 text-orange-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                          disabled={alreadyResponded || interestLoading[service.id]}
                        >
                          {interestLoading[service.id] ? <span className="loader w-3 h-3 border-2 border-white border-t-orange-500 rounded-full animate-spin"></span> : null}
                          Interested
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 text-xs mt-1 line-clamp-2 max-w-full">{service.description}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Modal for interested users */}
      <ResponsesModal
        open={showResponsesModal}
        onClose={() => setShowResponsesModal(false)}
        users={getInterestedUsers(modalServiceId) || []}
        serviceTitle={modalServiceId ? (services.find(s => s.id === modalServiceId)?.title || '') : ''}
      />
      
      {/* Add Service Modal */}
      {addServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-fadeIn border-2 border-orange-200 max-h-[100vh] overflow-y-auto flex flex-col">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold"
              onClick={handleAddServiceClose}
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-center text-orange-700">Add New Service</h2>
            
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="title"
                placeholder="Title *"
                required
                onChange={handleChange}
                value={formData.title}
                className="w-full border border-orange-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <textarea
                name="description"
                placeholder="Description *"
                required
                rows={3}
                onChange={handleChange}
                value={formData.description}
                className="w-full border border-orange-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              
              {/* File Selection with Drag & Drop */}
              <div className="space-y-6">
                <DropZone
                  fileType="image"
                  title="Upload Image"
                  accept="image/*"
                  icon="📷"
                />
                
                <DropZone
                  fileType="video"
                  title="Upload Video"
                  accept="video/*"
                  icon="🎥"
                />
              </div>
              
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition font-semibold shadow-md"
                  disabled={loading}
                >
                  {loading ? "Uploading..." : "Submit"}
                </button>
                <button
                  type="button"
                  className="border border-orange-500 text-orange-500 px-4 py-2 rounded-lg hover:bg-orange-50 transition font-semibold"
                  onClick={handleAddServiceClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
