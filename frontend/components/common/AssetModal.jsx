import React, { useState, useEffect, useCallback } from "react";
import moment from "moment";

/**
 * AssetModal - displays images, videos, or PDFs in a modal/lightbox with navigation and post comments
 * @param {boolean} show - whether modal is open
 * @param {function} onClose - function to close modal
 * @param {Array} assets - array of asset objects: { url, type, name? }
 * @param {number} initialIndex - which asset to show first
 * @param {object} post - the full post object (with childrenPosts)
 * @param {function} onComment - function(postId, commentText) to add a comment
 * @param {object} user - current user (for avatar, etc)
 * @param {function} openLikesModal - function to open likes modal
 */
const AssetModal = ({ show, onClose, assets = [], initialIndex = 0, post, onComment, user, openLikesModal }) => {
  const [current, setCurrent] = useState(initialIndex);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (show) {
      setCurrent(initialIndex);
      setIsExpanded(false);
    }
  }, [show, initialIndex]);

  const handleNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % assets.length);
  }, [assets.length]);

  const handlePrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + assets.length) % assets.length);
  }, [assets.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!show) return;
    const handleKey = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [show, handleNext, handlePrev, onClose]);

  if (!show || !assets || assets.length === 0) return null;
  const asset = assets[current];
  const childrenPosts = post?.childrenPosts || [];

  // Handle comment submit
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !onComment || !post) return;
    setSubmitting(true);
    await onComment(post.id, commentText.trim());
    setCommentText("");
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      {/* Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden h-[90vh]">
        {/* Asset section */}
        <div className="flex-1 flex flex-col bg-black bg-opacity-80 md:bg-white md:bg-opacity-100 relative">
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold z-20 hover:text-orange-400 md:text-black md:top-2 md:right-2"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          
          {/* Post Header */}
          <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-50 rounded-lg p-3 text-white">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={post?.creator?.user?.photoURL || post?.creator?.partner?.photoURL || "/t6.svg"}
                className="w-8 h-8 rounded-full object-cover"
                onError={e => { e.target.src = "/t6.svg"; }}
                alt={post?.creator?.user?.name || 'User'}
              />
              <div>
                <div className="font-semibold text-sm">{post?.creator?.user?.name || post?.creator?.partner?.name || 'User'}</div>
                <div className="text-xs text-gray-300">{moment(post?.createdAt).format("MMM D, YYYY h:mm A")}</div>
              </div>
            </div>
            {post?.title && (
              <div className="text-sm font-medium mb-2">{post.title}</div>
            )}
                         {post?.content && (
               <div className="text-sm text-gray-300">
                 <div 
                   className={`${!isExpanded && post.content.length > 100 ? 'overflow-hidden' : ''}`}
                   style={{
                     display: !isExpanded && post.content.length > 100 ? '-webkit-box' : 'block',
                     WebkitLineClamp: !isExpanded && post.content.length > 100 ? 1 : 'unset',
                     WebkitBoxOrient: !isExpanded && post.content.length > 100 ? 'vertical' : 'unset',
                   }}
                 >
                   {post.content}
                 </div>
                 {post.content.length > 100 && (
                   <button
                     onClick={() => setIsExpanded(!isExpanded)}
                     className="text-blue-400 hover:text-blue-300 text-xs font-medium mt-1"
                   >
                     {isExpanded ? 'Show less' : 'Show more'}
                   </button>
                 )}
               </div>
             )}
          </div>
          
          {/* Image/Video Container */}
          <div className="flex-1 flex items-center justify-center w-full p-4">
            {asset.type?.startsWith("image/") && (
              <img
                src={asset.url}
                alt={asset.name || "Image"}
                className="max-h-full max-w-full object-contain rounded"
              />
            )}
            {asset.type?.startsWith("video/") && (
              <video
                src={asset.url}
                controls
                autoPlay
                className="max-h-full max-w-full object-contain rounded"
              />
            )}
            {asset.type === "application/pdf" && (
              <iframe
                src={asset.url}
                title={asset.name || "PDF"}
                className="w-full h-full border rounded bg-white"
              />
            )}
            {/* Fallback for other types */}
            {!asset.type?.startsWith("image/") && !asset.type?.startsWith("video/") && asset.type !== "application/pdf" && (
              <a
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mt-4"
              >
                Open file
              </a>
            )}
          </div>
          
          {/* Navigation */}
          {assets.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-4">
              <button
                onClick={handlePrev}
                className="text-white text-2xl px-4 py-2 rounded hover:bg-orange-500 bg-black bg-opacity-40"
                aria-label="Previous"
              >
                &#8592;
              </button>
              <span className="text-white text-lg">
                {current + 1} / {assets.length}
              </span>
              <button
                onClick={handleNext}
                className="text-white text-2xl px-4 py-2 rounded hover:bg-orange-500 bg-black bg-opacity-40"
                aria-label="Next"
              >
                &#8594;
              </button>
            </div>
          )}
        </div>
        
        {/* Comments section */}
        <div className="w-full md:w-[400px] flex flex-col bg-white border-l border-gray-200 h-full">
          {/* Comments Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-lg mb-2">Comments</h3>
                         {/* Likes Section */}
             <div className="flex items-center gap-4 text-sm text-gray-600">
               <span 
                 className={`flex items-center gap-1 ${(post?.likes?.length || 0) > 0 ? 'cursor-pointer hover:text-blue-600' : ''}`}
                 onClick={() => openLikesModal && openLikesModal(post?.id, post?.likes?.length || 0)}
                 title={(post?.likes?.length || 0) > 0 ? 'Click to see who liked this post' : ''}
               >
                 <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                   <path d="M6 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2" />
                   <circle cx="12" cy="7" r="4" />
                 </svg>
                 {post?.likes?.length || 0} Likes
               </span>
               <span className="flex items-center gap-1">
                 <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                   <path d="M7 10v6M12 7v9M17 13v3" />
                 </svg>
                 {childrenPosts.length} Comments
               </span>
             </div>
          </div>
          
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4">
            {childrenPosts.length === 0 && <div className="text-gray-400 text-sm">No comments yet.</div>}
            <div className="space-y-4">
              {childrenPosts.map(child => {
                const childUser = child.creator?.user || child.creator?.partner || child.creator?.expert || child.creator?.admin;
                return (
                  <div key={child.id} className="flex gap-2 items-start">
                    <img
                      src={childUser?.photoURL || "/t6.svg"}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={e => { e.target.src = "/t6.svg"; }}
                      alt={childUser?.name || 'User'}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm">{childUser?.name || 'User'}</span>
                        <span className="text-xs text-gray-500">{moment(child.createdAt).fromNow()}</span>
                      </div>
                      <div className="text-sm text-gray-800">
                        {child.content}
                        {child.updatedAt !== child.createdAt && (
                          <span className="ml-2 text-xs text-gray-400">(Edited)</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Fixed Comment Input */}
          {onComment && user && (
            <div className="border-t border-gray-100 bg-white p-4">
              <form className="flex items-center gap-2" onSubmit={handleSubmitComment}>
                <img
                  src={user.photoURL || "/t6.svg"}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={e => { e.target.src = "/t6.svg"; }}
                  alt={user.name || 'User'}
                />
                <input
                  className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="submit"
                  className="text-gray-500 hover:text-blue-600 font-medium"
                  disabled={submitting || !commentText.trim()}
                >
                  Post
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetModal; 