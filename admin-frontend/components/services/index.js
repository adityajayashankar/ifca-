import React, { useState, useEffect } from "react";
import { Modal, Box, TextField, Button } from "@mui/material";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { useRouter } from "next/router";
import axios from "axios";
import api from "@/utils/apiSetup";
import UploadImage from "@/components/UploadImage";
import { toast } from "react-toastify";

const DEFAULT_IMAGE_URL = 'https://fastly.picsum.photos/id/20/3670/2462.jpg?hmac=CmQ0ln-k5ZqkdtLvVO23LjVAEabZQx2wOaT4pyeG10I';

// Upload file using backend presigned URL API
const uploadFileToS3 = async (file, folder, onSuccess, onError) => {
  if (!file) return;
  try {
    // Get presigned URL from backend
    const response = await api.post("/images/generate-presigned-url", {
      fileName: file.name,
      fileType: file.type,
      folder: folder,
    });
    const { uploadUrl, fileUrl } = response.data;
    
    // Upload file directly to S3 using presigned URL
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
    });
    
    if (onSuccess) onSuccess(fileUrl);
  } catch (error) {
    console.error("Error uploading file:", error);
    if (onError) onError(error);
  }
};

const Services = ({ services: initialServices, serviceResponses = [], addServiceOpen, setAddServiceOpen, handleAddServiceClose }) => {
  const router = useRouter();
  const [services, setServices] = useState(initialServices || []);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalUsers, setModalUsers] = useState([]);
  const [modalService, setModalService] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    video: "",
  });
  const user = useSelector(selectUser);
  const [uploadProgress, setUploadProgress] = useState({ image: 0, video: 0 });

  // Add state for interested users modal
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [modalServiceId, setModalServiceId] = useState(null);
  const [interestLoading, setInterestLoading] = useState({});

  const communityId = router.query.id || router.asPath.split("/")[3];

  // Fetch services with interested users data
  const fetchServicesWithInterests = async () => {
    try {
      const res = await api.get(`/service/getServicesByCommunityId/${communityId}`);
      if (res?.data?.data) {
        setServices(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  useEffect(() => {
    if (communityId) {
      fetchServicesWithInterests();
    }
  }, [communityId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress({ image: 0, video: 0 });

    // Ensure creatorId is present
    if (!user || !user.unifiedUser || !user.unifiedUser.id) {
      toast.error("User not authenticated. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      let imageUrl = formData.imageUrl;
      // If a new image file is selected and not yet uploaded, upload it
      if (formData.imageFile && !formData.imageUrl) {
        await uploadFileToS3(
          formData.imageFile,
          "images",
          (url) => { imageUrl = url; },
          (err) => console.error("Image upload failed", err)
        );
      }
      let videoUrl = formData.videoUrl;
      if (formData.videoFile && !formData.videoUrl) {
        await uploadFileToS3(
          formData.videoFile,
          "videos",
          (url) => { videoUrl = url; },
          (err) => console.error("Video upload failed", err)
        );
      }
      console.log(imageUrl, videoUrl);

      const serviceData = {
        title: formData.title,
        description: formData.description,
        imageUrl: imageUrl || '',
        videoUrl: videoUrl || '',
        creatorId: user.unifiedUser.id, // Always defined here
        communityId: communityId ? parseInt(communityId) : undefined,
      };

      await api.post("/service", serviceData);

      // Refresh services after adding new one
      await fetchServicesWithInterests();
      setFormData({ title: "", description: "", image: null, imageFile: null, imageUrl: '', video: null, videoFile: null, videoUrl: '' });
      if (typeof handleAddServiceClose === 'function') {
        handleAddServiceClose();
      }
    } catch (error) {
      console.error("Error submitting service:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInterests = async () => {
    router.push({
      pathname: '/partner/services/viewInterests',
      query: { communityId },
    });
  };

  const handleOpenModal = async (service) => {
    setModalLoading(true);
    setModalService(service);
    setOpen(true);

    try {
      const res = await api.get(`/service/getServiceResponsesWithRole/${service.id}`);
      const interestedUsers = res?.data?.interestedUsers || [];
      setModalUsers(interestedUsers);
    } catch (error) {
      console.error('Error fetching interested users:', error);
      setModalUsers([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setOpen(false);
    setModalUsers([]);
    setModalService(null);
  };

  // Helper to get interested users for a service
  const getInterestedUsers = (serviceId) => {
    if (!serviceResponses || !Array.isArray(serviceResponses)) return [];
    const found = serviceResponses.find(s => s.serviceId === serviceId);
    return found && Array.isArray(found.users) ? found.users : [];
  };

  // Helper to check if current user is interested
  const isUserInterested = (serviceId) => {
    const users = getInterestedUsers(serviceId);
    return users.some(u => u.userId === user?.unifiedUser?.id);
  };

  // Handle interest
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

  // Modal for showing interested users
  const ResponsesModal = ({ open, onClose, users, serviceTitle }) => {
    const [search, setSearch] = useState("");

    // Filter users by name or email
    const filteredUsers = users.filter(u =>
      (!search ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
      )
    );

    // Download CSV
    const handleDownloadCSV = () => {
      const csvRows = [
        ["Name", "Email", "User ID"],
        ...filteredUsers.map(u => [u.name, u.email, u.userId])
      ];
      const csvContent = csvRows.map(row => row.map(field => `"${field || ''}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${serviceTitle || 'interested-users'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return open ? (
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-center">Interested Users ({filteredUsers.length})</h2>
            {filteredUsers.length > 0 && (
              <button
                onClick={handleDownloadCSV}
                className="ml-2 px-3 py-1 bg-orange-100 text-orange-600 rounded text-xs font-semibold hover:bg-orange-200 transition"
              >
                Download CSV
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
          />
          {filteredUsers.length === 0 ? (
            <div className="text-center text-gray-500">No interested users found.</div>
          ) : (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {filteredUsers.map((u) => (
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
    ) : null;
  };

  // Service Card Component
  const ServiceCard = ({ service }) => {
    const interestedUsers = service.users || [];
    const isCreator = service.creatorId === user?.unifiedUser?.id;
    const alreadyResponded = isUserInterested(service.id);
    return (
      <div className="flex flex-col bg-white border border-orange-200 shadow-md rounded-2xl max-w-[31%] flex-1 basis-1/3 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group">
        {/* Media (video or image) on top */}
        <div className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
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
        {/* Title and interested badge below media */}
        <div className="flex items-center justify-between px-4 pt-3">
          <h3 className="font-bold text-base text-orange-700 truncate max-w-[180px]">{service.title}</h3>
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">{interestedUsers.length || 0} interested</span>
        </div>
        {/* Description and actions */}
        <div className="flex flex-col flex-1 min-w-0 px-4 pb-4">
          <p className="text-gray-700 text-xs mt-1 line-clamp-2 max-w-full mb-3">{service.description}</p>
          <div className="mt-auto flex flex-row gap-2">
            <button
              className={`flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition text-xs shadow ${interestedUsers.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(service);
              }}
              disabled={interestedUsers.length === 0}
            >
              {interestedUsers.length === 0 ? 'No responses' : 'View Responses'}
            </button>
            <button
              className="flex-1 bg-orange-100 text-orange-500 px-4 py-2 rounded-lg font-semibold hover:bg-orange-200 transition text-xs shadow"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/partner/services/${service.id}`);
              }}
            >
              Edit Service
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal for Interested Users
  const InterestedUsersModal = ({ open, onClose, users, service }) => (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-fadeIn border-2 border-orange-200">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-orange-500 text-2xl font-bold"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          {service && (
            <h3 className="text-base font-bold text-orange-600 mb-2 text-center">{service.title}</h3>
          )}
          <h2 className="text-lg font-bold mb-4 text-center">Interested Users ({users.length})</h2>
          {modalLoading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              Loading interested users...
            </div>
          ) : users.length === 0 ? (
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

  return (
    <div className="p-0 w-full">
      {/* Remove the heading and action buttons from the Services component */}
      {/* Export the action buttons as a separate component */}
      {/* In the Services component, remove the heading and action buttons, only render the list and modals */}
      <div className="flex flex-wrap gap-6 mt-4 justify-start">
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
                className="flex items-center bg-white border border-orange-200 shadow rounded-xl p-3 mb-3 w-full max-w-md min-w-[260px] hover:shadow-md transition group"
                style={{ minHeight: '80px' }}
              >
                {/* Left: Image */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-orange-100 bg-gray-50 mr-3">
                  <img
                    src={service.imageUrl || DEFAULT_IMAGE_URL}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Right: Content */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-orange-700 truncate max-w-[140px]">{service.title}</h3>
                    <span className="ml-2 text-xs text-orange-500 font-semibold">{service.interestedCount || 0} interested</span>
                    {user?.userType === 'admin' ? (
                      <button
                        onClick={() => { setShowResponsesModal(true); setModalServiceId(service.id); }}
                        className="ml-2 bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition text-xs font-semibold shadow"
                        disabled={getInterestedUsers(service.id).length === 0}
                      >
                        {getInterestedUsers(service.id).length === 0 ? 'No responses yet' : 'View Responses'}
                      </button>
                    ) : (
                      !isCreator && (
                        <button
                          onClick={() => handleInterested(service.id)}
                          className={`ml-2 px-3 py-1 rounded text-xs font-semibold shadow transition-all flex items-center gap-1 ${alreadyResponded ? 'bg-orange-100 text-orange-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                          disabled={alreadyResponded || interestLoading[service.id]}
                        >
                          {interestLoading[service.id] ? <span className="loader w-3 h-3 border-2 border-white border-t-orange-500 rounded-full animate-spin"></span> : null}
                          Interested
                        </button>
                      )
                    )}
                  </div>
                  <p className="text-gray-700 text-xs mt-1 line-clamp-2 max-w-full">{service.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <ResponsesModal
        open={showResponsesModal}
        onClose={() => setShowResponsesModal(false)}
        users={getInterestedUsers(modalServiceId) || []}
        serviceTitle={modalServiceId ? (services.find(s => s.id === modalServiceId)?.title || '') : ''}
      />

      {/* Add Service Modal */}
      {addServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={handleAddServiceClose}>
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 overflow-y-auto max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-orange-500 text-2xl font-bold"
              onClick={handleAddServiceClose}
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4">Add New Service</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white text-gray-900 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white text-gray-900 transition-all duration-200"
                />
              </div>
              {/* In the Add Service modal, render image and video uploaders as custom 4:3 rectangles, side by side */}
              <div className="flex gap-4 mb-4">
                {/* Image uploader */}
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <div
                    className="w-40 aspect-[4/3] border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer relative"
                    onClick={() => document.getElementById('service-image-input').click()}
                  >
                    {formData.imageFile ? (
                      <img src={URL.createObjectURL(formData.imageFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <svg className="w-8 h-8 text-orange-400 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                        <span className="text-xs text-gray-400">Choose Image</span>
                      </div>
                    )}
                    <input
                      id="service-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setFormData(prev => ({ ...prev, imageFile: file }));
                          uploadFileToS3(file, "images", (url) => setFormData(prev => ({ ...prev, imageUrl: url })), (err) => console.error("Image upload failed", err));
                        }
                      }}
                    />
                    {formData.imageFile && (
                      <span className="absolute bottom-1 left-1 right-1 text-[10px] text-gray-500 bg-white bg-opacity-70 px-1 rounded truncate max-w-full">{formData.imageFile.name}</span>
                    )}
                  </div>
                </div>
                {/* Video uploader */}
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium mb-1">Video</label>
                  <div
                    className="w-40 aspect-[4/3] border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer relative"
                    onClick={() => document.getElementById('service-video-input').click()}
                  >
                    {formData.videoFile ? (
                      <video src={URL.createObjectURL(formData.videoFile)} controls className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <svg className="w-8 h-8 text-orange-400 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                        <span className="text-xs text-gray-400">Choose Video</span>
                      </div>
                    )}
                    <input
                      id="service-video-input"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setFormData(prev => ({ ...prev, videoFile: file }));
                          uploadFileToS3(file, "videos", (url) => setFormData(prev => ({ ...prev, videoUrl: url })), (err) => console.error("Video upload failed", err));
                        }
                      }}
                    />
                    {formData.videoFile && (
                      <span className="absolute bottom-1 left-1 right-1 text-[10px] text-gray-500 bg-white bg-opacity-70 px-1 rounded truncate max-w-full">{formData.videoFile.name}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-all duration-200 shadow"
                  disabled={loading}
                >
                  {loading ? "Uploading..." : "Submit"}
                </button>
                <button
                  type="button"
                  className="bg-white border border-orange-500 text-orange-500 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-all duration-200 shadow"
                  onClick={handleAddServiceClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interested Users Modal */}
      <InterestedUsersModal 
        open={open} 
        onClose={handleCloseModal} 
        users={modalUsers} 
        service={modalService} 
      />
    </div>
  );
};

export default Services;

// Export ServiceActions as a named export
export const ServiceActions = ({ onAdd, onView }) => (
  <div className="flex flex-row text-gray-500 gap-2">
    <button
      onClick={onAdd}
      className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
    >
      Add Service
    </button>
    <button
      onClick={onView}
      className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
    >
      View All Responses
    </button>
  </div>
);
