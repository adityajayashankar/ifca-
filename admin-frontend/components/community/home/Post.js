import React, { useState } from "react";
import { AiOutlineLike, AiTwotoneLike, AiOutlineComment } from "react-icons/ai";
import Markup from "@/components/chat/markup";
import dynamic from "next/dynamic";
import Modal from "@/components/common/Modal";

import Carousel from "@/components/common/Carousel";
import { Swiper, SwiperSlide } from "swiper/react";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const Post = ({ user, media, content, threadId, tags, unifiedUser }) => {
  const [like, setLike] = useState(false);

  const [data, setData] = useState("");
  const [status, setStatus] = useState(true);
  const [showReplies, setShowReplies] = useState(false);
  const [childThreads, setChildThreads] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalMedia, setModalMedia] = useState([]);

  const getReplies = () => {
    console.log(threadId);
    setShowReplies(!showReplies);
    setChildThreads([
      {
        id: 10,
        userId: 1,
        sender: {
          id: 1,
          name: "Darshan",
          photoURL: "https://robohash.org/001",
        },
        content: "<p>Hey this is reply thread 1 !</p>",
        parentThread: 1,
        media: [
          {
            id: 1,
            url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
            type: "image",
          },
          // {
          //   id: 2,
          //   url: "https://bit.ly/3CQFPvv",
          //   type: "image",
          // },
          //  {
          //   id: 2,
          //   url: "https://bit.ly/3CQFPvv",
          //   type: "image",
          // },  {
          //   id: 2,
          //   url: "https://bit.ly/3CQFPvv",
          //   type: "image",
          // },  {
          //   id: 2,
          //   url: "https://bit.ly/3CQFPvv",
          //   type: "image",
          // },  {
          //   id: 2,
          //   url: "https://bit.ly/3CQFPvv",
          //   type: "image",
          // },
          {
            id: 2,
            url: "https://bit.ly/3CQFPvv",
            type: "image",
          },
        ],
        createdAt: "2022-10-15T18:19:47.577Z",
      },
      {
        id: 12,
        userId: 1,
        sender: {
          id: 1,
          name: "Darshan",
          photoURL: "https://robohash.org/001",
        },
        content: "<p>Hey this is reply thread 2 !</p>",
        parentThread: 1,
        // media: [{
        //   id: 1,
        //   url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
        //   type: "image",
        // }, {
        //   id: 1,
        //   url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
        //   type: "image",
        // }],
        createdAt: "2022-10-15T18:19:47.577Z",
      },
    ]);
  };

  const sendBtn = () => {
    console.log(data);
    let temp = data;
    let stri = temp.replace(/<[^>]*>?/gm, "");
    // console.log(stri.trim().length)
    if (stri.trim().length === 0) {
      console.log("Empty Message");
      setData("");
      setStatus(true);
    } else {
      setStatus(false);
    }
  };
  return (
    <div className="rounded-xl flex flex-col items-center justify-center p-4 m-4 bg-slate-200 shadow-xl">
      <div className="flex items-center w-full ">
        <img src={user?.photoURL} className="w-10 h-10 rounded-sm" />
        <div className="flex flex-col">
          <div className="flex flex-row">
            <h2 className="text-semibold ml-2 text-lg">{user?.name}</h2>
            <div
              className={`${
                user?.userId % 2
                  ? "bg-green-600 text-white w-16"
                  : "bg-blue-100 text-white "
              } my-auto  text-xs font-semibold ml-2 px-2.5 rounded `}
            >
              {user?.role}
            </div>
          </div>
          {tags && (
            <div className="flex flex-wrap ">
              {tags?.map((tag, index) => (
                <div
                  className={`bg-blue-100 text-white my-auto text-xs ml-2 px-2 p-1 rounded mt-1`}
                  key={index}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col w-full justify-around">
        <div className="pl-2 my-8">
          <p>{content}</p>
        </div>
        <div className="flex overflow-x-auto w-full">
          {media?.length > 0 && (
            <Carousel>
              {media?.map((item, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={item.url}
                    onClick={() => {
                      setModalMedia(media);
                      setShowModal(true);
                    }}
                    className="object-cover w-full h-[310px] p-2 rounded-xl cursor-pointer"
                  />
                </SwiperSlide>
              ))}
            </Carousel>
          )}
        </div>
      </div>
      <div className="flex items-center w-full mt-4">
        <button
          className="btn btn-pink flex items-center mr-4"
          onClick={() => setLike((prev) => !prev)}
        >
          {like ? <AiTwotoneLike /> : <AiOutlineLike />}
          Like
        </button>
        <button
          onClick={() => getReplies()}
          className="btn btn-blue flex items-center"
        >
          <AiOutlineComment />
          Reply
        </button>
      </div>

      {showReplies && (
        <div className="flex flex-col w-full">
          {/* <div className=""> */}
          <textarea
            rows={5}
            cols={50}
            className={"bg-white rounded p-4 my-8"}
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Reply with love"
          />
          <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 rounded-b">
            <button
              className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              type="button"
            >
              Post Reply
            </button>
            {/* </div> */}
          </div>
          {childThreads.map((childThread, index) => (
            // <div className="w-full" key={index}>
            <div key={index} className="w-full mt-2">
              <div className="flex flex-col bg-slate-300 w-full rounded-lg ">
                <div className="flex flex-row border-b-2 p-2 text-white">
                  <picture className="profile-img w-10 h-10">
                    <source
                      srcSet={childThread.sender.photoURL}
                      type="image/webp"
                    />
                    <img src={childThread.sender.photoURL} alt="Sender image" />
                  </picture>
                  <div className="font-bold my-auto">
                    {" "}
                    {childThread.sender.name}{" "}
                  </div>
                  {/* <div className='my-auto text-xs italic'>{dateTimeStr}</div> */}
                </div>
                <div className="pl-2 my-8">
                  <p>{content}</p>
                </div>
                <div className="flex overflow-x-auto">
                  {
                    <Carousel>
                      {childThread?.media?.map((item, index) => (
                        <SwiperSlide key={index}>
                          {item?.type === "image" && (
                            <img
                              src={item.url}
                              onClick={() => {
                                setModalMedia(childThread?.media);
                                setShowModal(true);
                              }}
                              className="object-cover w-full h-[280px] p-2 rounded-xl cursor-pointer"
                            />
                          )}
                        </SwiperSlide>
                      ))}
                    </Carousel>
                  }
                </div>
              </div>
            </div>

            // </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="h-full w-full">
          <Modal showModal={showModal} setShowModal={setShowModal}>
            <Carousel>
              {modalMedia?.map((item, index) => (
                <SwiperSlide key={index}>
                  {
                    // item?.type === "image" && (
                    <img
                      src={item.url}
                      className="object-contain w-full h-[500px]  rounded-xl"
                    />
                    // )
                  }
                </SwiperSlide>
              ))}
            </Carousel>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default Post;
