import CategoryCard from "@/components/community/categorycard"
import { 
  selectAllCommunities, 
  setCommunities,
  getCommunityTagsFromCommunitySlice,
  selectCommunityTagsFromCommunitySlice,
  selectCommunityTagsLoadingFromCommunitySlice,
  fetchCommunitiesByTagId
} from "@/store/features/communitySlice"
import { useRouter } from "next/router"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { MdChevronRight, MdHome, MdGroups, MdSort, MdSearch, MdAdd, MdChevronLeft } from "react-icons/md"
import { motion } from "framer-motion"
import api from "@/utils/apiSetup"

// Add CSS for animations
const modalStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = modalStyles;
  document.head.appendChild(style);
}

// Reusable CategoryBar component
function CategoryBar({ tags, tagsLoading, activeTag, onTagClick, onAddCategory, onTagUpdate, onTagDelete, showArchived, onToggleArchived }) {
  const tagBarRef = useRef();
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [hoveredTag, setHoveredTag] = useState(null);

  // Scroll category bar left/right
  const handleArrowClick = useCallback((direction) => {
    if (!tagBarRef.current) return;
    const scrollAmount = direction === 'left' ? -200 : 200;
    tagBarRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }, []);

  // Auto-scroll to center selected category
  useEffect(() => {
    if (activeTag && tagBarRef.current) {
      const tagBar = tagBarRef.current;
      const selectedTagElement = tagBar.querySelector(`[data-tag-id="${activeTag}"]`);
      if (selectedTagElement) {
        const tagBarRect = tagBar.getBoundingClientRect();
        const tagRect = selectedTagElement.getBoundingClientRect();
        const scrollLeft = selectedTagElement.offsetLeft - (tagBarRect.width / 2) + (tagRect.width / 2);
        tagBar.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [activeTag]);

  // Show/hide arrows based on scroll position
  const updateArrows = useCallback(() => {
    if (!tagBarRef.current) return;
    const tagBar = tagBarRef.current;
    setShowLeft(tagBar.scrollLeft > 5);
    setShowRight(tagBar.scrollLeft + tagBar.offsetWidth < tagBar.scrollWidth - 5);
  }, []);

  useEffect(() => {
    updateArrows();
    if (!tagBarRef.current) return;
    const tagBar = tagBarRef.current;
    tagBar.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    return () => {
      tagBar.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, tags]);

  return (
    <div className="relative mb-2 flex items-center gap-2">
      {/* Left Arrow */}
      {showLeft && (
        <button
          onClick={() => handleArrowClick('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <MdChevronLeft className="text-gray-600 text-xl" />
        </button>
      )}
      {/* Right Arrow */}
      {showRight && (
        <button
          onClick={() => handleArrowClick('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <MdChevronRight className="text-gray-600 text-xl" />
        </button>
      )}
      <div
        ref={tagBarRef}
        className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2 px-8 bg-white rounded-lg shadow-sm "
        style={{ scrollBehavior: 'smooth' }}
      >
        {tagsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
          ))
        ) : (
          tags.length > 0 ? (
            <>
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredTag(tag.id)}
                  onMouseLeave={() => setHoveredTag(null)}
                >
                  <button
                    data-tag-id={tag.id}
                    onClick={() => onTagClick(tag.id)}
                    className={`px-5 py-2 rounded-full font-semibold text-sm flex-shrink-0 whitespace-nowrap
                      transition-colors transition-shadow transition-transform duration-300 ease-in-out
                      ${String(activeTag) === String(tag.id)
                        ? 'bg-orange-500 text-white shadow-md scale-105'
                        : tag.isArchived
                          ? 'bg-gray-200 text-gray-400 border border-gray-300 line-through opacity-70'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-orange-50'}
                    `}
                    style={{ minWidth: 0 }}
                  >
                    {tag.name}
                    {tag.isArchived && (
                      <span className="ml-2 text-xs font-normal text-gray-500">(archived)</span>
                    )}
                  </button>
                  {/* Edit/Delete buttons on hover (only for non-default tags) */}
                  {hoveredTag === tag.id && tag.id !== 'all' && (
                    <div className="absolute -top-3 -right-1 flex gap-1 z-20">
                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTagUpdate(tag);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-full p-1.5 shadow-md transition-all duration-200 hover:scale-110 border border-gray-200"
                        title="Edit category"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTagDelete(tag);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-full p-1.5 shadow-md transition-all duration-200 hover:scale-110 border border-gray-200"
                        title="Delete category"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {/* Add Category Button (admin only) */}
              <button
                type="button"
                onClick={onAddCategory}
                className="px-4 py-2 rounded-full border-2 border-dashed border-orange-400 text-orange-500 font-semibold text-sm flex-shrink-0 ml-2 hover:bg-orange-50 hover:border-orange-500 transition-colors flex items-center gap-1"
              >
                <MdAdd className="text-lg" /> Add Category
              </button>
              {/* Show Archived Toggle Button */}
              <button
                type="button"
                onClick={onToggleArchived}
                className={`px-4 py-2 rounded-full border-2 ml-2 font-semibold text-sm flex-shrink-0 flex items-center gap-1 transition-colors ${showArchived ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'}`}
              >
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
            </>
          ) : (
            <div className="text-gray-400 text-sm">No categories found.</div>
          )
        )}
      </div>
    </div>
  );
}

// Custom CategoryModal component
function CategoryModal({ open, onClose, onSuccess }) {
  const [mode, setMode] = useState("single");
  const [singleInput, setSingleInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    
    let tags = [];
    if (mode === "single") {
      if (!singleInput.trim()) {
        setError("Please enter a category name.");
        setLoading(false);
        return;
      }
      tags = [singleInput.trim()];
    } else {
      tags = bulkInput
        .split(/[\n,]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      if (tags.length === 0) {
        setError("Please enter at least one category name.");
        setLoading(false);
        return;
      }
    }
    
    try {
      await api.post("/community/community-tags/bulk", { tags });
      setSuccess(true);
      setSingleInput("");
      setBulkInput("");
      onSuccess?.();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.response?.data?.error || "Failed to add categories."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto z-10 animate-fadeInUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold">Add Categories</span>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 text-xl px-2"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'single' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-orange-50'}`}
            onClick={() => setMode('single')}
            disabled={loading}
          >
            Single
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'bulk' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-orange-50'}`}
            onClick={() => setMode('bulk')}
            disabled={loading}
          >
            Bulk
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "single" ? (
            <input
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter category name"
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
          ) : (
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={4}
              placeholder="Enter category names, separated by commas or new lines"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
          )}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">Categories added!</div>}
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Category Modal
function EditCategoryModal({ open, onClose, onSuccess, tag }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tag) {
      setName(tag.name || "");
      setDescription(tag.description || "");
    }
  }, [tag]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.patch(`/community/tags/${tag.id}`, {
        name: name.trim(),
        description: description.trim()
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.response?.data?.error || "Failed to update category."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open || !tag) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto z-10 animate-fadeInUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold">Edit Category</span>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 text-xl px-2"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={3}
              placeholder="Enter category description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Category Modal
function DeleteCategoryModal({ open, onClose, onSuccess, tag }) {
  const [action, setAction] = useState("archive"); // "archive", "delete", or "unarchive"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Set default action based on tag's archived status
  useEffect(() => {
    if (tag) {
      setAction(tag.isArchived ? "unarchive" : "archive");
    }
  }, [tag]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (action === "archive") {
        await api.patch(`/community/tags/${tag.id}/archive`);
      } else if (action === "unarchive") {
        await api.patch(`/community/tags/${tag.id}/unarchive`);
      } else {
        await api.delete(`/community/tags/${tag.id}`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.response?.data?.error || `Failed to ${action} category.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open || !tag) return null;

  const isArchived = tag.isArchived;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto z-10 animate-fadeInUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className={`text-lg font-bold ${isArchived ? 'text-green-600' : 'text-red-600'}`}>
            {isArchived ? 'Manage Category' : 'Delete Category'}
          </span>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 text-xl px-2"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
              isArchived ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isArchived ? (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isArchived ? `Unarchive "${tag.name}"?` : `Delete "${tag.name}"?`}
              </h3>
              <p className="text-sm text-gray-500">
                {isArchived ? 'This will make the category visible again.' : 'This action cannot be undone.'}
              </p>
            </div>
          </div>
          
          {!isArchived && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Choose your action:
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="action"
                          value="archive"
                          checked={action === "archive"}
                          onChange={(e) => setAction(e.target.value)}
                          className="mr-2 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="font-medium">Archive</span> - Hide from view but keep data
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="action"
                          value="delete"
                          checked={action === "delete"}
                          onChange={(e) => setAction(e.target.value)}
                          className="mr-2 text-red-600 focus:ring-red-500"
                        />
                        <span className="font-medium">Permanently Delete</span> - Remove completely (only if not in use)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-5 py-2 rounded-lg font-semibold transition-colors disabled:opacity-60 ${
              action === "delete" 
                ? "bg-red-500 text-white hover:bg-red-600" 
                : action === "unarchive"
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
            disabled={loading}
          >
            {loading ? "Processing..." : 
              action === "delete" ? "Delete Permanently" : 
              action === "unarchive" ? "Unarchive" : 
              "Archive"}
          </button>
        </div>
      </div>
    </div>
  );
}

const Community = () => {
  const communities = useSelector(selectAllCommunities)
  const dispatch = useDispatch()
  const router = useRouter()
  const [fetchError, setFetchError] = useState(null)

  // Tag-related state
  const tags = useSelector(selectCommunityTagsFromCommunitySlice)
  const tagsLoading = useSelector(selectCommunityTagsLoadingFromCommunitySlice)
  const [activeTag, setActiveTag] = useState("all")
  const [loadingCommunities, setLoadingCommunities] = useState(false)
  const [showArchived, setShowArchived] = useState(false);

  // Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  // UI state
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("default")
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [sortExpanded, setSortExpanded] = useState(false);
  const [breadcrumbVisible, setBreadcrumbVisible] = useState(true);
  const breadcrumbTimeoutRef = useRef(null);

  // Fetch communities function
  const fetchCommunities = useCallback(async () => {
    try {
      setFetchError(null)
      await dispatch(setCommunities({ initialcommunity: true }))
      await dispatch(setCommunities({ initialcommunity: false }))
    } catch (error) {
      console.error("Failed to fetch communities:", error)
      setFetchError("Failed to fetch communities. Please try again.")
    }
  }, [dispatch])

  // Initial fetch
  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  // Fetch tags on mount or when showArchived changes
  useEffect(() => {
    dispatch(getCommunityTagsFromCommunitySlice(showArchived));
  }, [dispatch, showArchived]);

  // Fetch communities when tag changes
  useEffect(() => {
    if (!activeTag || activeTag === 'all') return
    setLoadingCommunities(true)
    setFetchError("")
    
    dispatch(fetchCommunitiesByTagId(activeTag))
      .then(() => {
        setLoadingCommunities(false)
      })
      .catch(() => {
        setFetchError("Failed to load communities for this category.")
        setLoadingCommunities(false)
      })
  }, [activeTag, dispatch])

  // Handle tag click
  const handleTagClick = useCallback((tagId) => {
    setActiveTag(tagId)
    if (tagId === 'all') {
      fetchCommunities()
    }
  }, [fetchCommunities])

  // Handle tag update
  const handleTagUpdate = useCallback((tag) => {
    setSelectedTag(tag);
    setShowEditCategoryModal(true);
  }, []);

  // Handle tag delete
  const handleTagDelete = useCallback((tag) => {
    setSelectedTag(tag);
    setShowDeleteCategoryModal(true);
  }, []);

  // Hide breadcrumb after 2 minutes
  useEffect(() => {
    breadcrumbTimeoutRef.current = setTimeout(() => {
      setBreadcrumbVisible(false);
    }, 2 * 60 * 1000);
    return () => clearTimeout(breadcrumbTimeoutRef.current);
  }, []);

  // Show breadcrumb if user scrolls to top
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY <= 0) {
        setBreadcrumbVisible(true);
        clearTimeout(breadcrumbTimeoutRef.current);
        breadcrumbTimeoutRef.current = setTimeout(() => {
          setBreadcrumbVisible(false);
        }, 2 * 60 * 1000);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter and sort communities
  const filtered = useMemo(() => {
    let filteredCommunities = (communities || [])
      .filter((c) => c?.communityType !== 'DEFAULT')
      .filter((c) => c?.title?.toLowerCase()?.includes(search?.toLowerCase() || ""));

    if (sort === "az") {
      filteredCommunities = [...filteredCommunities].sort((a, b) => (a?.title || "").localeCompare(b?.title || ""))
    } else if (sort === "za") {
      filteredCommunities = [...filteredCommunities].sort((a, b) => (b?.title || "").localeCompare(a?.title || ""))
    } else if (sort === "members") {
      filteredCommunities = [...filteredCommunities].sort(
        (a, b) =>
          (b?.subscriptions?.length || b?.subscriptionTrue?.length || 0) -
          (a?.subscriptions?.length || a?.subscriptionTrue?.length || 0),
      )
    }
    
    return filteredCommunities;
  }, [communities, search, sort]);

  const handleAddCommunity = useCallback(() => {
    setLoadingAdd(true)
    setTimeout(() => {
      setLoadingAdd(false)
      router?.push("/admin/community/add")
    }, 400)
  }, [router])

  // Prepare tags with default tags
  const allTags = useMemo(() => [
    { id: 'all', name: 'All Categories' },
    ...(Array.isArray(tags) ? tags : [])
  ], [tags]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Animated Breadcrumb */}
      <div
        className={`bg-white border-b border-gray-200 sticky top-0 z-10 transition-all duration-500 ease-in-out
          ${breadcrumbVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-16 pointer-events-none'}`}
        style={{ willChange: 'opacity, transform' }}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router?.push("/admin")}
              className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <MdHome className="w-4 h-4" />
            </button>
            <MdChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 font-medium">Communities</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 py-4">
        {/* Header Row with Animated Search/Sort */}
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MdGroups className="text-orange-500" /> Communities
          </h1>
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            {/* Animated Search */}
            <div
              className={`relative flex items-center group transition-all duration-300 ${searchExpanded ? 'w-48 sm:w-64' : 'w-10'} overflow-hidden bg-white rounded-lg border border-gray-200 justify-center`}
              onMouseEnter={() => setSearchExpanded(true)}
              onMouseLeave={() => setSearchExpanded(false)}
              onFocus={() => setSearchExpanded(true)}
              onBlur={() => setSearchExpanded(false)}
              tabIndex={0}
              style={{ minWidth: searchExpanded ? 120 : 40 }}
            >
              <button
                className="flex items-center justify-center w-10 h-10 text-gray-500 focus:outline-none"
                tabIndex={-1}
              >
                <MdSearch className="text-lg mx-auto" />
              </button>
              <input
                type="text"
                className={`transition-all duration-300 bg-transparent border-none outline-none text-sm flex-1 px-2 ${searchExpanded ? 'opacity-100 w-full' : 'opacity-0 w-0'} min-w-0`}
                placeholder="Search communities..."
                value={search}
                onChange={(e) => setSearch(e?.target?.value || "")}
                style={{ minWidth: 0 }}
              />
            </div>
            {/* Animated Sort */}
            <div
              className={`relative flex items-center group transition-all duration-300 ${sortExpanded ? 'w-36 sm:w-44' : 'w-10'} overflow-hidden bg-white rounded-lg border border-gray-200 justify-center`}
              onMouseEnter={() => setSortExpanded(true)}
              onMouseLeave={() => setSortExpanded(false)}
              onFocus={() => setSortExpanded(true)}
              onBlur={() => setSortExpanded(false)}
              tabIndex={0}
              style={{ minWidth: sortExpanded ? 80 : 40 }}
            >
              <button
                className="flex items-center justify-center w-10 h-10 text-gray-500 focus:outline-none"
                tabIndex={-1}
              >
                <MdSort className="text-lg mx-auto" />
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e?.target?.value || "default")}
                className={`transition-all duration-300 bg-transparent border-none outline-none text-sm flex-1 px-2 ${sortExpanded ? 'opacity-100 w-full' : 'opacity-0 w-0'} min-w-0`}
                style={{ minWidth: 0 }}
              >
                <option value="default">Default</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
                <option value="members">Most Members</option>
              </select>
            </div>
            {/* Create Community Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-medium px-6 py-2 rounded-lg shadow transition-colors flex items-center gap-2 ${loadingAdd ? 'cursor-not-allowed bg-orange-400' : ''}`}
              disabled={loadingAdd}
              onClick={handleAddCommunity}
              type="button"
            >
              {loadingAdd ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Processing...</span>
                </>
              ) : (
                <>
                  <MdAdd className="text-lg" />
                  <span className="text-sm">Create Community</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Category Bar */}
        <CategoryBar
          tags={allTags}
          tagsLoading={tagsLoading}
          activeTag={activeTag}
          onTagClick={handleTagClick}
          onAddCategory={() => setShowCategoryModal(true)}
          onTagUpdate={handleTagUpdate}
          onTagDelete={handleTagDelete}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived((prev) => !prev)}
        />
        <CategoryModal
          open={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={() => dispatch(getCommunityTagsFromCommunitySlice())}
        />
        <EditCategoryModal
          open={showEditCategoryModal}
          onClose={() => {
            setShowEditCategoryModal(false);
            setSelectedTag(null);
          }}
          onSuccess={() => dispatch(getCommunityTagsFromCommunitySlice())}
          tag={selectedTag}
        />
        <DeleteCategoryModal
          open={showDeleteCategoryModal}
          onClose={() => {
            setShowDeleteCategoryModal(false);
            setSelectedTag(null);
          }}
          onSuccess={() => dispatch(getCommunityTagsFromCommunitySlice())}
          tag={selectedTag}
        />

        {/* Error Message */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-400 mr-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-red-800 font-medium text-sm">{fetchError}</p>
              </div>
              <button
                onClick={fetchCommunities}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              {activeTag && activeTag !== 'all' 
                ? `${allTags.find(t => String(t.id) === String(activeTag))?.name || activeTag} Communities`
                : `All Communities`}
            </h2>
            <span className="text-sm text-gray-500">
              {filtered?.length || 0} {(filtered?.length || 0) === 1 ? "community" : "communities"}
            </span>
          </div>

          {/* Loading indicator for communities */}
          {loadingCommunities && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}

          {/* Communities Grid */}
          <div className="grid gap-4 sm:gap-6 w-full"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {!loadingCommunities && filtered?.length > 0 ? (
              filtered.map((category, index) => (
                <CategoryCard key={`category-${category?.id || index}`} category={category} baseURL={"admin"} />
              ))
            ) : !loadingCommunities ? (
              <div className="col-span-full w-full">
                <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <MdGroups className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-base sm:text-lg font-medium mb-2">
                    {activeTag && activeTag !== 'all' 
                      ? `No ${allTags.find(t => String(t.id) === String(activeTag))?.name || activeTag} communities found`
                      : `No communities found`}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {search ? "Try adjusting your search terms" : "Get started by creating your first community"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Community






