import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import ThreadCard from '../threadCard';
import api from '@/utils/apiSetup';
import { toast } from 'react-toastify';

const ThreadCardList = ({ userId }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullyScrolled, setIsFullyScrolled] = useState(false);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await api.get(`thread/user/${userId}/community`);
        setThreads(response.data.posts || []);
      } catch (err) {
        console.error('Error fetching threads:', err);
        setError('Failed to load threads');
        toast.error('Failed to load threads. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchThreads();
    }
  }, [userId]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
      const isAtStart = container.scrollLeft <= 10;
      setIsFullyScrolled(isAtEnd);
      setShowLeftButton(!isAtStart);
    }
  };

  const scrollLeft = () => {
    if (containerRef.current) {
      const cardWidth = 400; // card width + gap
      const visibleCards = Math.floor(containerRef.current.clientWidth / cardWidth);
      containerRef.current.scrollBy({
        left: -(cardWidth * visibleCards),
        behavior: "smooth"
      });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      const cardWidth = 400; // card width + gap
      const visibleCards = Math.floor(containerRef.current.clientWidth / cardWidth);
      containerRef.current.scrollBy({
        left: cardWidth * visibleCards,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [threads]);

  if (loading) {
    return (
      <div className="py-4 px-2 md:px-4">
        <h5 className="mb-3 font-semibold text-[20px] md:text-[24px]">Recent Threads</h5>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((item) => (
            <div key={item} className="w-[340px] md:w-[380px] shrink-0">
              <div className='flex items-center gap-2 p-1'>
                <Skeleton variant="circular" height={40} width={40} />
                <Skeleton variant="text" width="60%" />
              </div>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-2 md:px-4">
        <h5 className="mb-3 font-semibold text-[20px] md:text-[24px] text-red-600">{error}</h5>
      </div>
    );
  }

  if (!threads.length) {
    return null;
  }

  return (
    <div className="my-2">
      <div className="mx-auto">
        <h5 className="text-xl  font-bold text-gray-800">
          Recent Threads
        </h5>
        <div className="relative -mx-4 px-4">
          <div
            ref={containerRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth py-4 -mx-2 px-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {threads.map((thread, index) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4,
                  delay: Math.min(index * 0.1, 0.3),
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                className="flex-shrink-0 snap-start py-2"
              >
                <ThreadCard thread={thread} />
              </motion.div>
            ))}
          </div>
          
          {showLeftButton && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden lg:block absolute -left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 rounded-full p-2.5 shadow-lg hover:bg-gray-50 transition-all duration-300 border border-gray-200"
              onClick={scrollLeft}
            >
              <IoChevronBackOutline size={24} className="text-gray-700" />
            </motion.button>
          )}
          
          {!isFullyScrolled && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden lg:block absolute -right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 rounded-full p-2.5 shadow-lg hover:bg-gray-50 transition-all duration-300 border border-gray-200"
              onClick={scrollRight}
            >
              <IoChevronForwardOutline size={24} className="text-gray-700" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadCardList;