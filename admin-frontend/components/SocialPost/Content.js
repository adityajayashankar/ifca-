import React, { useState, useRef } from "react";
import Carousel from "@/components/common/Carousel";
import { Swiper, SwiperSlide } from "swiper/react";
import Modal from "@/components/common/Modal";
import Poll from "../chat/polls";
import { FaFilePdf, FaFileAudio, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaDownload } from "react-icons/fa";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const Content = ({
  content,
  media,
  title,
  isPoll,
  expiresAt,
  pollOptions,
  threadId,
  isVoted,
  votedOption,
  creatorId,
}) => {
  const [modalMedia, setModalMedia] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [playingVideos, setPlayingVideos] = useState({});
  const [mutedVideos, setMutedVideos] = useState({});
  const [mutedAudios, setMutedAudios] = useState({});

  const videoRefs = useRef({});
  const audioRefs = useRef({});

  const getMediaType = (asset) => {
    // Check if asset has type property (from FeedContent style)
    if (asset.type) {
      if (asset.type.startsWith('image/')) return 'image';
      if (asset.type.startsWith('video/')) return 'video';
      if (asset.type === 'application/pdf') return 'pdf';
      if (asset.type.startsWith('audio/')) return 'audio';
      return 'file';
    }
    
    // Fallback to URL extension check
    const url = asset.url || asset;
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'webm', 'mov'].includes(extension)) {
      return 'video';
    } else if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio';
    }
    return 'file';
  };

  const getFileName = (asset) => {
    const url = asset.url || asset;
    return asset.name || url.split('/').pop();
  };

  const getFileSize = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const size = response.headers.get('content-length');
      if (size) {
        const sizeInMB = (parseInt(size) / (1024 * 1024)).toFixed(2);
        return `${sizeInMB} MB`;
      }
      return 'Unknown size';
    } catch (error) {
      return 'Unknown size';
    }
  };

  const toggleVideoPlay = (videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (video.paused) {
        video.play();
        setPlayingVideos(prev => ({ ...prev, [videoId]: true }));
      } else {
        video.pause();
        setPlayingVideos(prev => ({ ...prev, [videoId]: false }));
      }
    }
  };

  const toggleVideoMute = (videoId, e) => {
    e.stopPropagation();
    const video = videoRefs.current[videoId];
    if (video) {
      video.muted = !video.muted;
      setMutedVideos(prev => ({ ...prev, [videoId]: video.muted }));
    }
  };

  const toggleAudioMute = (audioId) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      audio.muted = !audio.muted;
      setMutedAudios(prev => ({ ...prev, [audioId]: audio.muted }));
    }
  };

  const handleVideoClick = (videoId) => {
    toggleVideoPlay(videoId);
  };

  const renderMediaPreview = (asset, index) => {
    const mediaType = getMediaType(asset);
    const videoId = `video-${index}`;
    const audioId = `audio-${index}`;
    const assetUrl = asset.url || asset;
    const assetName = asset.name || getFileName(asset);
    const assetType = asset.type || 'unknown';
    
    switch (mediaType) {
      case 'image':
        return (
          <div key={asset.id || index} className="relative rounded-lg overflow-hidden">
            <img
              src={assetUrl}
              alt={`Post image ${index + 1}`}
              className="w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                setModalMedia([asset]);
                setShowModal(true);
              }}
            />
          </div>
        );
      case 'video':
        return (
          <div key={asset.id || index} className="relative rounded-lg overflow-hidden">
            <video
              controls
              className="w-full max-h-96 object-contain rounded-lg"
              preload="metadata"
            >
              <source src={assetUrl} type={assetType} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case 'pdf':
        return (
          <div key={asset.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {assetName}
                </p>
                <p className="text-xs text-gray-500">
                  Click to view or download
                </p>
              </div>
              <div className="flex-shrink-0">
                <a
                  href={assetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Open PDF
                </a>
              </div>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div key={asset.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <FaFileAudio className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {assetName}
                </p>
                <p className="text-xs text-gray-500">
                  Audio file
                </p>
              </div>
              <div className="flex-shrink-0">
                <audio 
                  controls 
                  className="h-8"
                  preload="metadata"
                >
                  <source src={assetUrl} type={assetType} />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div key={asset.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {assetName}
                </p>
                <p className="text-xs text-gray-500">
                  {assetType}
                </p>
              </div>
              <div className="flex-shrink-0">
                <a
                  href={assetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col w-full justify-around">
      <div className="pl-2 mb-3 mt-4">
        {title && <h1 className="p-0 text-[14px] md:text-[16px] m-0 font-semibold">{title}</h1>}
        <p className="text-[12px] md:text-[14px]">{content}</p>
      </div>
      {isPoll ? (
        <div className="w-full max-w-xl mx-auto">
          <Poll
            showPoll={true}
            threadId={threadId}
            results={pollOptions?.map(({ optionId, text, votes }, index) => ({
              id: index,
              optionId,
              text,
              votes: Number(votes),
            }))}
            isVoted={isVoted}
            votedOption={votedOption}
            creatorId={creatorId}
          />
        </div>
      ) : (
        // Post Assets - Updated to match FeedContent.jsx style
        media && media.length > 0 && (
          <div className="mt-3 space-y-3">
            {media.map((asset, index) => renderMediaPreview(asset, index))}
          </div>
        )
      )}
      {showModal && (
        <div className="h-full w-full">
          <Modal showModal={showModal} setShowModal={setShowModal}>
            <Carousel>
              {modalMedia?.map((item, index) => (
                <SwiperSlide key={index}>
                  {renderMediaPreview(item, `modal-${index}`)}
                </SwiperSlide>
              ))}
            </Carousel>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default Content;
