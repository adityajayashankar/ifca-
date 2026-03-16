import { selectCommunity } from "@/store/features/communitySlice";
import { setCommunityPosts } from "@/store/features/postsSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import React, { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import Modal from "./Modal";
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BarChartIcon from '@mui/icons-material/BarChart';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const DotsMenu = ({ visible, setVisible, user, threadId, addTags, cb, postData, existingTags, onEdit }) => {
  const dispatch = useDispatch();
  const loggedUser = useSelector(selectUser);
  const community = useSelector(selectCommunity);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(postData?.content || "");
  const [editTitle, setEditTitle] = useState(postData?.title || "");
  const [editHashtags, setEditHashtags] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Check if current user is admin
  const isAdmin = loggedUser?.userType === 'admin' || loggedUser?.unifiedUser?.adminId;
  
  // Check if user is the post creator
  const isPostCreator = loggedUser?.unifiedUser?.id === user?.uid;
  
  const handlePostDelete = (e) => {
    e.preventDefault();
    let ans = confirm("Are you sure you want to delete this post? This action cannot be undone.");
    if (ans) {
      api.delete(`/thread/${threadId}`).then((res) => {
        if (res.data) {
          toast.success("Post deleted successfully!");
          if (cb) {
            cb();
          } else {
            dispatch(setCommunityPosts(community.id));
          }
        }
      }).catch((error) => {
        toast.error("Failed to delete post");
      });
    }
  };

  const handlePostArchive = (e) => {
    e.preventDefault();
    let ans = confirm("Are you sure you want to archive this post?");
    if (ans) {
      api.patch(`/thread/${threadId}/archive`).then((res) => {
        if (res.data) {
          toast.success("Post archived successfully!");
          if (cb) {
            cb();
          } else {
            dispatch(setCommunityPosts(community.id));
          }
        }
      }).catch((error) => {
        toast.error("Failed to archive post");
      });
    }
  };

  const handlePostEdit = (e) => {
    e.preventDefault();
    
    // If onEdit prop is provided, use it instead of internal modal
    if (onEdit) {
      onEdit();
      setVisible(false);
      return;
    }
    
    // Fallback to internal edit modal
    setEditContent(postData?.content || "");
    setEditTitle(postData?.title || "");
    
    // Populate hashtags with existing tags
    if (existingTags && existingTags.length > 0) {
      const hashtagString = existingTags.map(tag => `#${tag.tag.name}`).join(' ');
      setEditHashtags(hashtagString);
    } else {
      setEditHashtags("");
    }
    
    setShowEditModal(true);
    setVisible(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setIsEditing(true);
    try {
      const response = await api.patch(`/thread/${threadId}`, {
        content: editContent.trim(),
        title: editTitle.trim() || null
      });

      if (response.data) {
        toast.success("Post updated successfully!");
        setShowEditModal(false);
        if (cb) {
          cb();
        } else {
          dispatch(setCommunityPosts(community.id));
        }
      }
    } catch (error) {
      toast.error("Failed to update post");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditContent("");
    setEditTitle("");
    setEditHashtags("");
  };

  // Get user info for the modal
  const getUserInfo = () => {
    const currentUser = loggedUser?.unifiedUser;
    return {
      name: currentUser?.user?.name || currentUser?.partner?.name || currentUser?.expert?.name || currentUser?.admin?.name || "User",
      photoURL: currentUser?.user?.photoURL || currentUser?.partner?.photoURL || currentUser?.expert?.photoURL || currentUser?.admin?.photoURL || "/t6.svg",
      community: community?.title || "Community"
    };
  };

  const userInfo = getUserInfo();

  return (
    <>
      <div
        className="relative inline-block text-left"
        onClick={() => {
          if (visible) {
            setVisible(false);
          }
        }}
      >
        <div>
          <BsThreeDotsVertical
            onClick={(e) => {
              e.stopPropagation();
              setVisible((prev) => !prev);
            }}
            className="hover:bg-gray-100 hover:text-gray-700 rounded-full p-1 cursor-pointer transition-colors duration-200"
          />
        </div>

        {visible && (
          <div
            className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
            tabIndex="-1"
            onMouseLeave={() => {
              setVisible(false);
            }}
          >
            <div className="py-1" role="none">
              {/* Add tags option */}
              <button
                className="text-gray-700 block w-full text-left px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                onClick={() => addTags()}
              >
                Add tags
              </button>
              
              {/* Admin Options */}
              {isAdmin && (
                <>
                  <button
                    className="text-gray-700 block w-full text-left px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                    onClick={handlePostEdit}
                  >
                    <EditIcon fontSize="small" className="text-blue-600" />
                    Edit
                  </button>
                  <button
                    className="text-gray-700 block w-full text-left px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                    onClick={handlePostArchive}
                  >
                    <ArchiveIcon fontSize="small" className="text-orange-600" />
                    Archive
                  </button>
                  <button
                    className="text-red-600 block w-full text-left px-4 py-2 text-sm cursor-pointer hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
                    onClick={handlePostDelete}
                  >
                    <DeleteIcon fontSize="small" className="text-red-600" />
                    Delete
                  </button>
                </>
              )}
              
              {/* Post Creator Options (if not admin) */}
              {!isAdmin && isPostCreator && (
                <>
                  <button
                    className="text-gray-700 block w-full text-left px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                    onClick={handlePostEdit}
                  >
                    <EditIcon fontSize="small" className="text-blue-600" />
                    Edit
                  </button>
                  <button
                    className="text-red-600 block w-full text-left px-4 py-2 text-sm cursor-pointer hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
                    onClick={handlePostDelete}
                  >
                    <DeleteIcon fontSize="small" className="text-red-600" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Edit Modal */}
      <Modal
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        title=""
        customClass="max-w-2xl"
        showHeader={false}
        showFooter={false}
      >
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <button
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* User Information Section */}
          <div className="flex items-center gap-3 mb-6">
            <img 
              src={userInfo.photoURL} 
              alt={userInfo.name}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
              onError={(e) => { e.target.src = "/t6.svg"; }}
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{userInfo.name}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <AutoAwesomeIcon fontSize="small" className="text-orange-500" />
                <span>{userInfo.community}</span>
              </div>
            </div>
          </div>

          {/* Input Fields Section */}
          <div className="space-y-4 flex-1">
            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter post title..."
              />
            </div>
            
            {/* Content Field */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to talk about?
              </label>
              <div className="relative">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border-2 border-orange-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  placeholder="Share your thoughts..."
                />
                {/* Grammarly-like indicator */}
                <div className="absolute bottom-2 right-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hashtag Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add hashtags (type #)
              </label>
              <input
                type="text"
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., #community #discussion"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="border-t border-gray-200 pt-4 mt-6">
            <div className="flex items-center justify-between">
              {/* Left side - Action Icons */}
              <div className="flex items-center gap-4">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <HelpOutlineIcon fontSize="small" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <BarChartIcon fontSize="small" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <ThumbUpIcon fontSize="small" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <ImageIcon fontSize="small" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <VideocamIcon fontSize="small" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <DescriptionIcon fontSize="small" />
                </button>
              </div>

              {/* Right side - Update Button */}
              <button
                onClick={handleSaveEdit}
                disabled={isEditing || !editContent.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isEditing || !editContent.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {isEditing ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DotsMenu;
