import CommunityCard from "../communityCard";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAllCommunities,
  setCommunities,
} from "@/store/features/communitySlice";
import RecordedCardList from "../programCard";
import { useEffect, useRef } from "react";
import { useState } from "react";
import {
  selectUser,
  selectUserCommunities,
  setUserCommunities,
} from "@/store/features/userSlice";
import UserPrograms from "../userPrograms";
import ErrorFiller from "../UI/ErrorFiller";
import { motion } from "framer-motion";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";

const CommunityCardList = ({ type, page, noscroll, enroll }) => {
  const [programs, setPrograms] = useState(false);
  const [comm, setComm] = useState(true);
  const [channel, setChannel] = useState(false);
  const [title, setTitle] = useState("Your Communities");
  const user = useSelector(selectUser);
  const userCommunities = useSelector(selectUserCommunities);
  const scrollContainerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullyScrolled, setIsFullyScrolled] = useState(false);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const dispatch = useDispatch();

  const communities =
    type === "yours"
      ? userCommunities
      : useSelector(selectAllCommunities)?.filter((item) => {
          return !userCommunities
            ?.map((uItem) => uItem.id)
            .includes(item.id);
        });

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const isAtEnd =
        container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
      const isAtStart = container.scrollLeft <= 10;
      setIsFullyScrolled(isAtEnd);
      setShowLeftButton(!isAtStart);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 400; // card width + gap
      const visibleCards = Math.floor(scrollContainerRef.current.clientWidth / cardWidth);
      scrollContainerRef.current.scrollBy({
        left: -(cardWidth * visibleCards),
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 400; // card width + gap
      const visibleCards = Math.floor(scrollContainerRef.current.clientWidth / cardWidth);
      scrollContainerRef.current.scrollBy({
        left: cardWidth * visibleCards,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (user) {
      dispatch(setCommunities({ userId: user?.unifiedUser?.id }));
      dispatch(setUserCommunities(user?.unifiedUser?.id));
    }
  }, [user]);

  if (communities?.length === 0) {
    return null;
  }

  return (
    <div className="py-2">
      <div
        className={`flex md:items-center justify-between  flex-col md:flex-row gap-y-3 ${
          communities?.length === 0 && "hidden"
        }`}
      >
        <h1 className="text-xl font-bold text-gray-800">
          {type === "recommended" ? "Recommended Communities" : title}
        </h1>
      </div>

      <div className="relative">
        {comm ? (
          <div className="relative">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className={`${
                page !== "myComm"
                  ? "flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth py-4 -mx-2 px-2"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              } w-full relative ${communities?.length === 0 && "hidden"}`}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {communities?.length === 0 || !communities ? (
                <ErrorFiller>
                  {type === "recommended"
                    ? "No Recommended Communities!! Please try again Later"
                    : "You are not part of any community yet!!"}
                </ErrorFiller>
              ) : (
                communities?.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(index * 0.1, 0.3),
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className="flex-shrink-0 snap-start"
                  >
                    <CommunityCard
                      details={item}
                      noscroll={noscroll}
                      enroll={enroll}
                    />
                  </motion.div>
                ))
              )}
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
        ) : programs ? (
          <div className="w-full flex justify-center items-center">
            {programs && <UserPrograms />}
          </div>
        ) : (
          <div className="w-full flex justify-center items-center">
            {channel && <RecordedCardList />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityCardList;
