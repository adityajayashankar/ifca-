import React, { useState } from "react";
import Carousel from "@/components/common/Carousel";
import { Swiper, SwiperSlide } from "swiper/react";
import Modal from "@/components/common/Modal";
import Poll from "../chat/polls";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const Content = ({ content, media, title, isPoll, expiresAt, pollOptions, threadId, isVoted, votedOption }) => {
  const [modalMedia, setModalMedia] = useState([]);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col w-full justify-around">
      <div className="pl-2 my-8">
        {title && <h1 className="text-step-1 font-semibold">{title}</h1>}
        <p>{content}</p>
      </div>
      {isPoll ? (
        <>
          <Poll
            showPoll={true}
            threadId={threadId}
            results={pollOptions?.map(({ optionId, text, votes }, index) => ({
              id: index,
              optionId,
              text,
              votes: Number(votes)
            }))}
            isVoted={isVoted}
            votedOption={votedOption}
          />
        </>
      ) : (
        <div className="flex overflow-x-auto w-full">
          {media?.length > 1 && (
            <Carousel>
              {media?.map((item, index) => (
                <SwiperSlide key={index}>
                  <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={item.url}
                      onClick={() => {
                        setModalMedia(media);
                        setShowModal(true);
                      }}
                      className="absolute inset-0 w-full h-full object-contain p-2 cursor-pointer hover:opacity-95 transition-opacity"
                      alt={`Media ${index + 1}`}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Carousel>
          )}
          {media?.length === 1 &&
            media?.map((item, index) => (
              <div key={index} className="relative w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={item.url}
                  onClick={() => {
                    setModalMedia(media);
                    setShowModal(true);
                  }}
                  className="absolute inset-0 w-full h-full object-contain p-2 cursor-pointer hover:opacity-95 transition-opacity"
                  alt="Single media"
                />
              </div>
            ))}
        </div>
      )}
      {showModal && (
        <div className="h-full w-full">
          <Modal showModal={showModal} setShowModal={setShowModal}>
            <Carousel>
              {modalMedia?.map((item, index) => (
                <SwiperSlide key={index}>
                  <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={item.url}
                      className="absolute inset-0 w-full h-full object-contain"
                      alt={`Modal media ${index + 1}`}
                    />
                  </div>
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
