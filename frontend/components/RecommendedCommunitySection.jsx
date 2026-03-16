import React, { useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAllCommunities, setCommunities } from "@/store/features/communitySlice";
import { getUserNonSubscribedCommunities, selectUserNonSubscribedCommunities, selectUser, selectUserCommunities, setUserCommunities } from "@/store/features/userSlice";
import ErrorFiller from "./UI/ErrorFiller";
import { BiRightArrowCircle } from "react-icons/bi";
import Link from "next/link";
import { PiCaretLeftFill, PiCaretRightFill } from "react-icons/pi";
import CommunityCard from "./communityCard";
import useLazyLoad from "@/hooks/useLazyLoad";
import { Skeleton, Button, Alert, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const RecommendedCommunitySection = ({ communities: propCommunities }) => {
  const user = useSelector(selectUser);
  const nonSubscribedCommunities = useSelector(selectUserNonSubscribedCommunities) || [];
  const displayCommunities = propCommunities || nonSubscribedCommunities;
  const scrollRef = useRef(null);

  const handleScroll = (dir) => {
    if (scrollRef.current) {
      const cardWidth = 300;
      const gap = 8; // from gap-2 class
      const scrollAmount = cardWidth + gap;
      const isLargeScreen = window.innerWidth >= 768;
      const cardsToScroll = isLargeScreen ? 2 : 1;
      scrollRef.current.scrollBy({
        left: dir * scrollAmount * cardsToScroll,
        behavior: "smooth",
      });
    }
  };

  return (
    <div 
      className="bg-white md:rounded-lg md:shadow p-0 relative border border-gray-100 hover:shadow-lg transition-shadow px-4 py-5"
    >
      <div className="flex md:items-center justify-between mb-2 flex-col md:flex-row gap-y-4">
        <div className="flex items-center justify-between w-full gap-2">
          <h1 className="text-[16px] font-[600]">Recommended Communities</h1>
          <Link href="/communities" className="text-[14px] text-gray-500 hover:underline hover:text-primary-500">
            <span className="flex items-center gap-1 cursor-pointer">View All</span>
          </Link>
        </div>
      </div>
      <div className="relative w-full max-w-[300px] md:max-w-[608px] mx-auto">
        <button
          onClick={() => handleScroll(-1)}
          className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-2 shadow-md z-20 hover:bg-gray-100 transition-colors"
        >
          <PiCaretLeftFill className="text-primary-500" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-2 w-full overflow-x-auto overflow-y-hidden scroll-smooth scroll-snap-x mandatory px-4 pt-3"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {displayCommunities.length === 0 ? (
            <div className="text-gray-400 text-center w-full py-10">No Recommended Communities!</div>
          ) : (
            displayCommunities.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <CommunityCard details={item} noscroll={false} enroll={false} className="w-[270px] h-[280px]" />
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => handleScroll(1)}
          className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-2 shadow-md z-20 hover:bg-gray-100 transition-colors"
        >
          <PiCaretRightFill className="text-primary-500" />
        </button>
      </div>
    </div>
  );
};

export default RecommendedCommunitySection; 