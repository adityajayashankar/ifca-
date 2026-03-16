import React from 'react';
import { Card, Typography, Box, Avatar, IconButton, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import Image from 'next/image';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PollIcon from '@mui/icons-material/Poll';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useRouter } from 'next/router';
import useLikesModal from '../../hooks/useLikesModal';
import LikesModal from '../post/LikesModal';

const ThreadCardWithLikes = ({ thread, isLiked = false, onLikeToggle }) => {
  const router = useRouter();
  const { isOpen, currentPostId, currentLikeCount, openLikesModal, closeLikesModal } = useLikesModal();
  
  // Determine card type based on thread properties
  const getCardType = () => {
    if (thread.isAsk) return "ask";
    if (thread.isPoll) return "poll";
    if (thread.isGreeting) return "greeting";
    return "announcement";
  };
  
  const cardType = getCardType();
  
  // Get appropriate icon and label based on card type
  const getCardTypeInfo = () => {
    switch (cardType) {
      case "ask":
        return { 
          icon: <HelpOutlineIcon sx={{ fontSize: 14 }} />, 
          label: "Ask",
          chipClass: "bg-blue-50 text-blue-600"
        };
      case "poll":
        return { 
          icon: <PollIcon sx={{ fontSize: 14 }} />, 
          label: "Poll",
          chipClass: "bg-purple-50 text-purple-600"
        };
      case "greeting":
        return { 
          icon: <EmojiPeopleIcon sx={{ fontSize: 14 }} />, 
          label: "Greeting",
          chipClass: "bg-green-50 text-green-600"
        };
      default:
        return { 
          icon: <CampaignIcon sx={{ fontSize: 14 }} />, 
          label: "Thread",
          chipClass: "bg-primary-50 text-primary-600"
        };
    }
  };
  
  const cardTypeInfo = getCardTypeInfo();

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (onLikeToggle) {
      onLikeToggle(thread.id);
    }
  };

  const handleLikesCountClick = (e) => {
    e.stopPropagation();
    const likeCount = thread.likes?.length || 0;
    if (likeCount > 0) {
      openLikesModal(thread.id, likeCount);
    }
  };

  const handleCardClick = () => {
    router.push(`/comThreads/${thread.community.id}?postId=${thread.id}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="w-[280px] md:w-[320px] shrink-0 cursor-pointer h-[420px]"
        onClick={handleCardClick}
      >
        <Card className="relative bg-white hover:bg-gray-50/50 transition-all duration-300 rounded-xl border border-gray-200 hover:border-primary-500 hover:shadow-md overflow-hidden h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 p-2 border-b border-gray-300 h-[52px] pt-1">
            <Avatar 
              src={thread.creator?.user?.photoURL || thread.creator?.partner?.photoURL || thread.creator?.expert?.photoURL || thread.creator?.admin?.photoURL || '/t6.svg'} 
              alt={thread.creator?.user?.name || thread.creator?.partner?.name || thread.creator?.expert?.name || thread.creator?.admin?.name || 'Anonymous'}
              className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/user/${thread.creatorId}`);
              }}
            />
            <div className="min-w-0 flex-1">
              <Typography 
                variant="subtitle2"
                className="text-sm font-semibold text-gray-900 truncate hover:text-primary-500"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/user/${thread.creatorId}`);
                }}
              >
                {thread.creator?.user?.name || thread.creator?.partner?.name || thread.creator?.expert?.name || thread.creator?.admin?.name || 'Anonymous'}
              </Typography>
              <div className='flex items-center gap-1'>
                <img src={thread.community.bannerImg} alt="community" className='w-4 h-4' />
                <Typography 
                  variant="caption" 
                  className="text-xs text-gray-500 truncate hover:text-primary-500 line-clamp-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/comHome/${thread.community.id}`);
                  }}
                >
                  {thread.community.title}
                </Typography>
              </div>
            </div>
            <Chip 
              icon={cardTypeInfo.icon}
              label={cardTypeInfo.label}
              size="small"
              className="bg-primary-50 text-primary-600 text-[10px] font-medium h-4 px-1.5"
            />
          </div>

          {/* Image */}
          {thread.assets?.[0] ? (
            <div className="relative aspect-[4/3]">
              <div 
                className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-70"
                style={{ 
                  backgroundImage: `url(${thread.assets[0].url})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center' 
                }}
              />
              
              <div className="relative h-full w-full z-10">
                <Image
                  src={thread.assets[0].url}
                  alt={thread.title || thread.content}
                  layout="fill"
                  objectFit="contain"
                  className="transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          ) : (
            <div className=""></div>
          )}

          {/* Content */}
          <Box className="p-2 flex-1 flex flex-col">
            <Typography 
              variant="subtitle1"
              className="text-sm font-bold text-gray-900 mb-1 truncate hover:text-primary-500 transition-colors"
            >
              {thread.title}
            </Typography>

            <Typography 
              variant="body2"
              className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1 max-h-10 overflow-hidden"
            >
              {thread.content}
            </Typography>

            {/* Engagement */}
            <Box className="flex items-center gap-3 mt-auto pt-2 border-t border-gray-300">
              <Box className="flex items-center gap-1">
                <IconButton 
                  size="small"
                  className={`${isLiked ? 'text-primary-500' : 'text-gray-400 hover:text-primary-500'} p-0.5`}
                  onClick={handleLikeClick}
                >
                  {isLiked ? (
                    <FavoriteIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ fontSize: 14 }} />
                  )}
                </IconButton>
                <Typography 
                  variant="caption" 
                  className={`${thread.likes?.length > 0 ? 'cursor-pointer hover:text-primary-500' : 'text-gray-500'}`}
                  onClick={handleLikesCountClick}
                >
                  {thread.likes?.length || 0}
                </Typography>
              </Box>
              <Box className="flex items-center gap-1">
                <IconButton 
                  size="small"
                  className="text-gray-400 hover:text-primary-500 p-0.5"
                >
                  <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <Typography variant="caption" className="text-gray-500">
                  {thread._count?.childrenPosts || 0}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      </motion.div>

      {/* Likes Modal */}
      <LikesModal
        open={isOpen}
        onClose={closeLikesModal}
        postId={currentPostId}
        likeCount={currentLikeCount}
      />
    </>
  );
};

export default ThreadCardWithLikes; 