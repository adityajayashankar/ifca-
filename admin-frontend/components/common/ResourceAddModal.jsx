import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import axios from "axios";
import { toast } from "react-toastify";
import { MdClose, MdAdd, MdFileUpload, MdLink as MdLinkIcon, MdRemove } from "react-icons/md";

// FileUploadZone and MultiSelectDropdown can be imported or inlined if needed
// For brevity, only the core modal and form logic is shown here

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const ResourceAddModal = ({ open, onClose, community, onSuccess }) => {
  const user = useSelector(selectUser);
  const [resources, setResources] = useState([
    {
      name: "",
      link: "",
      authorId: user?.unifiedUser?.id,
      communityArr: [community],
      isPreSession: false,
      isPostSession: false,
      resourceType: "link",
      selectedFiles: []
    }
  ]);
  const [errors, setErrors] = useState([{}]);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef();
  // Track if component is mounted
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  if (!open) return null;

  const validateResource = (resource) => {
    const error = {};
    if (!resource.name.trim()) {
      error.name = "Name is required";
    }
    if (resource.resourceType === "link") {
      if (!resource.link.trim()) {
        error.link = "Link is required";
      } else if (!isValidUrl(resource.link.trim())) {
        error.link = "Enter a valid URL (https://...)";
      }
    } else if (resource.resourceType === "file") {
      if (!resource.selectedFiles || resource.selectedFiles.length === 0) {
        error.selectedFiles = "File is required";
      }
    }
    return error;
  };

  const handleChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    setResources((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [name]: type === "checkbox" ? checked : value
      };
      return updated;
    });
    setErrors((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: undefined };
      return updated;
    });
  };

  const handleResourceTypeChange = (index, value) => {
    setResources((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        resourceType: value,
        selectedFiles: [],
        link: value === "link" ? "" : updated[index].link
      };
      return updated;
    });
    setErrors((prev) => {
      const updated = [...prev];
      updated[index] = {};
      return updated;
    });
  };

  const handleFileSelect = (index, files) => {
    setResources((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selectedFiles: files };
      return updated;
    });
    setErrors((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selectedFiles: undefined };
      return updated;
    });
  };

  const addMoreResource = () => {
    setResources((prev) => [
      ...prev,
      {
        name: "",
        link: "",
        authorId: user?.unifiedUser?.id,
        communityArr: [community],
        isPreSession: false,
        isPostSession: false,
        resourceType: "link",
        selectedFiles: []
      }
    ]);
    setErrors((prev) => [...prev, {}]);
  };

  const removeResource = (index) => {
    if (resources.length > 1) {
      setResources((prev) => prev.filter((_, i) => i !== index));
      setErrors((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const uploadToS3 = async (file) => {
    const response = await api.post("/images/generate-presigned-url", {
      fileName: file.name,
      fileType: file.type,
      folder: "resources",
    });
    const { uploadUrl, fileUrl } = response.data;
    await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } });
    return fileUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all resources
    const newErrors = resources.map(validateResource);
    if (!isMounted.current) return;
    setErrors(newErrors);
    const firstErrorIndex = newErrors.findIndex(err => Object.keys(err).length > 0);
    if (firstErrorIndex !== -1) {
      // Scroll to first error
      setTimeout(() => {
        const el = formRef.current?.querySelector(`#resource-form-${firstErrorIndex}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      toast.error("Please fix the errors before submitting.");
      return;
    }
    if (!isMounted.current) return;
    setUploading(true);
    try {
      const results = [];
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        let finalLink = resource.link;
        if (resource.resourceType === "file" && resource.selectedFiles.length > 0) {
          const uploadedUrls = await Promise.all(resource.selectedFiles.map(uploadToS3));
          finalLink = uploadedUrls.join(",");
        }
        const resourceData = {
          ...resource,
          link: finalLink,
          communityArr: [community],
        };
        try {
          const res = await api.post(`/resources/-1`, resourceData);
          if (res.data.success) {
            results.push({ index: i, success: true });
          }
        } catch (error) {
          results.push({ index: i, success: false, error: error.message });
        }
        if (!isMounted.current) return;
      }
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} resource${successCount > 1 ? 's' : ''}!`);
        if (isMounted.current) onSuccess && onSuccess(resources);
        if (isMounted.current) onClose();
      }
      if (failureCount > 0 && isMounted.current) {
        toast.error(`${failureCount} resource${failureCount > 1 ? 's' : ''} failed to create`);
      }
    } catch (error) {
      if (isMounted.current) toast.error(error?.response?.data?.message || error.message || "Failed to create resource");
    } finally {
      if (isMounted.current) setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-auto flex flex-col gap-6 relative p-6 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold z-10">&times;</button>
        <h2 className="text-xl font-bold text-orange-700 mb-2">Add Resource{resources.length > 1 ? 's' : ''} to {community?.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
          {resources.map((resource, index) => (
            <div key={index} id={`resource-form-${index}`} className="bg-orange-50 rounded-lg border border-orange-100 p-4 mb-2 relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <MdLinkIcon className="text-orange-500" />
                  Resource {index + 1}
                </h3>
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
              <div className="grid grid-cols-1 gap-3 mb-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">Resource Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 ${errors[index]?.name ? 'border-red-400' : 'border-gray-300'}`}
                    required
                    value={resource.name}
                    onChange={e => handleChange(index, e)}
                    placeholder="Enter resource name"
                  />
                  {errors[index]?.name && <p className="text-xs text-red-500 mt-1">{errors[index].name}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Resource Type <span className="text-red-500">*</span></label>
                  <div className="flex gap-3 mt-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`resourceType-${index}`}
                        value="link"
                        checked={resource.resourceType === 'link'}
                        onChange={() => handleResourceTypeChange(index, 'link')}
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
                        onChange={() => handleResourceTypeChange(index, 'file')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <MdFileUpload className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">File Upload</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Resource {resource.resourceType === 'link' ? 'Link' : 'File'} <span className="text-red-500">*</span>
                  </label>
                  {resource.resourceType === 'link' ? (
                    <>
                      <input
                        type="url"
                        name="link"
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 ${errors[index]?.link ? 'border-red-400' : 'border-gray-300'}`}
                        required
                        value={resource.link}
                        onChange={e => handleChange(index, e)}
                        placeholder="Enter resource URL (https://...)"
                      />
                      {errors[index]?.link && <p className="text-xs text-red-500 mt-1">{errors[index].link}</p>}
                    </>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*,video/*,.pdf"
                        onChange={e => handleFileSelect(index, Array.from(e.target.files))}
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${errors[index]?.selectedFiles ? 'border-red-400' : 'border-gray-300'}`}
                        required
                      />
                      {errors[index]?.selectedFiles && <p className="text-xs text-red-500 mt-1">{errors[index].selectedFiles}</p>}
                    </>
                  )}
                </div>
                {/* Community is locked and shown */}
                <div>
                  <label className="text-xs font-medium text-gray-700">Community</label>
                  <input
                    type="text"
                    value={community?.title}
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-700"
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-center mb-2">
            <button
              type="button"
              onClick={addMoreResource}
              className="flex items-center gap-2 px-6 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-medium transition-colors"
            >
              <MdAdd className="w-5 h-5" />
              Add More Resource
            </button>
          </div>
          <div className="flex gap-3 pt-2">
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
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceAddModal; 