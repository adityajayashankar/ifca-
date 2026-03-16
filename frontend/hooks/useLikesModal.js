import { useState } from 'react';

const useLikesModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [currentLikeCount, setCurrentLikeCount] = useState(0);

  const openLikesModal = (postId, likeCount) => {
    setCurrentPostId(postId);
    setCurrentLikeCount(likeCount);
    setIsOpen(true);
  };

  const closeLikesModal = () => {
    setIsOpen(false);
    setCurrentPostId(null);
    setCurrentLikeCount(0);
  };

  return {
    isOpen,
    currentPostId,
    currentLikeCount,
    openLikesModal,
    closeLikesModal
  };
};

export default useLikesModal; 