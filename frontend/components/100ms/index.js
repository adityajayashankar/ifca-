import React, { useEffect, useState } from "react";
import Controls from "@/components/100ms/Controls";
import {
  useHMSActions,
  selectHMSMessages,
  useHMSStore,
  selectLocalPeer,
  selectPeers,
  selectIsSomeoneScreenSharing,
  selectDominantSpeaker,
  useHMSNotifications,
  HMSNotificationTypes,
  selectIsPeerAudioEnabled,
} from "@100mslive/react-sdk";
import { useRouter } from "next/router";

import Messages from "@/components/100ms/Messages";
import VideoTile from "@/components/100ms/VideoTiles";
import VideoSpaces from "@/components/100ms/VideoSpaces";
import ScreenShare from "@/components/100ms/ScreenShare";
import axios from "axios";
import { BsThreeDots } from "react-icons/bs";
import { MdPushPin } from "react-icons/md";
import {
  HiUserRemove,
  HiOutlineArrowSmLeft,
  HiOutlineArrowSmRight,
} from "react-icons/hi";

import NameCard from "@/components/100ms/NameCard";
import AudioCard from "@/components/100ms/AudioCard";
// To create room via api https://www.100ms.live/docs/server-side/v2/Rooms/create-via-api
//[POST] https://api.100ms.live/v2/rooms
import { toast } from "react-toastify";
import SidebarWrapper from "../common/SideBarWrapper";

function VideoConference({ roomId, token, role, userName }) {
  const localPeer = useHMSStore(selectLocalPeer);
  const stage = localPeer?.roleName === "stage";
  const viewer = localPeer?.roleName === "viewer";
  const peers = useHMSStore(selectPeers);
  const hmsActions = useHMSActions();
  const notification = useHMSNotifications();
  const allMessages = useHMSStore(selectHMSMessages);
  const [inputValues, setInputValues] = useState("");
  const [visible, isVisible] = useState(true);
  const [isAudio, setIsAudio] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [sideMenu, setSideMenu] = useState("chat");
  const [screenShared, setScreenShared] = useState(false);
  const [pinned, setPinned] = useState({
    status: false,
    peer: {},
  });
  const hmsStore = useHMSStore(selectIsSomeoneScreenSharing);

  useEffect(() => {
    setScreenShared(hmsStore);
  }, [hmsStore]);

  useEffect(() => {
    if (token && roomId) {
      hmsActions.join({
        userName: userName || 'User',
        authToken: token,
        settings: {
          isAudioMuted: true,
        },
      });
    }
  }, [token, roomId, userName, hmsActions]);

  useEffect(() => {
    if (visible === true) {
      setItemsPerPage(4);
    } else {
      if (pages > 1) {
        setCurrentPage(0);
        setItemsPerPage(6);
      } else {
        setCurrentPage(0);
      }
    }
  }, [visible]);

  const pages = Math.ceil(peers?.length / itemsPerPage);

  const handlePrevClick = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextClick = () => {
    if (currentPage < pages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getCurrentVideoCards = () => {
    const startIndex = currentPage * itemsPerPage;
    return peers.slice(startIndex, startIndex + itemsPerPage);
  };

  useEffect(() => {
    if (!notification) return;

    switch (notification.type) {
      case HMSNotificationTypes.PEER_JOINED:
        toast.info(`${notification.data.name} joined`);
        break;
      case HMSNotificationTypes.PEER_LEFT:
        toast.info(`${notification.data.name} left`);
        break;
      case HMSNotificationTypes.NEW_MESSAGE:
        toast.info(`${notification.data.message} from ${notification.data.senderName}`);
        break;
      case HMSNotificationTypes.ERROR:
        toast.error(`Error: ${notification.data.message}`);
        break;
      case HMSNotificationTypes.RECONNECTING:
        toast.warning("Reconnecting...");
        break;
      case HMSNotificationTypes.RECONNECTED:
        toast.success("Reconnected successfully");
        break;
      case HMSNotificationTypes.ROOM_ENDED:
        toast.info(`Room ended: ${notification.data.reason}`);
        break;
      case HMSNotificationTypes.REMOVED_FROM_ROOM:
        toast.error(`Removed from room: ${notification.data.reason}`);
        break;
      case HMSNotificationTypes.CHANGE_TRACK_STATE_REQUEST:
        const { requestedBy, track, enabled } = notification.data;
        if (enabled) {
          toast.warning(`${requestedBy?.name} requested you to unmute`);
        }
        break;
    }
  }, [notification]);

  const updateGridTemplate = () => {
    let template = "";
    let participants = peers?.length;
    if (participants === 1) {
      template = "1fr";
    } else if (participants === 2) {
      template = "1fr 1fr";
    } else {
      template = "repeat(auto-fit, minmax(300px, 1fr))";
    }
    return template;
  };

  const handleInputChange = (e) => {
    setInputValues(e.target.value);
  };

  const sendMessage = () => {
    if (inputValues.trim()) {
      hmsActions.sendBroadcastMessage(inputValues);
      setInputValues("");
    }
  };

  const setVisibility = (dat) => {
    isVisible(dat);
  };

  return (
    <div className="max-h-screen justify-center">
      <main className="grid md:grid-cols-9 w-full h-full">
        <SidebarWrapper
          className="block md:hidden"
          open={visible}
          setOpen={isVisible}
          show={false}
        >
          <Messages
            sideMenu={sideMenu}
            setSideMenu={setSideMenu}
            allMessages={allMessages}
          />
        </SidebarWrapper>
        <div
          className={`relative h-[100vh] ${
            visible ? "md:col-span-7" : "md:col-span-full"
          }`}
        >
          <div className="h-full overflow-auto flex bg-slate-600 commScroll">
            {screenShared ? (
              <div
                className={`flex flex-wrap gap-x-10 p-5 justify-center commScroll items-center mx-auto h-full ${
                  visible ? "w-[75vw]" : "w-[80vw]"
                } rounded-2xl`}
              >
                {!stage && peers?.map((peer) => (
                  <ScreenShare key={peer.id} isLocal={false} peer={peer} />
                ))}
              </div>
            ) : !pinned?.status ? (
              <div className="w-full relative">
                <div
                  className="flex flex-wrap gap-x-10 p-5 justify-center mx-auto overflow-auto"
                  style={{ gridTemplateColumns: updateGridTemplate() }}
                >
                  {peers && getCurrentVideoCards().map((peer) => (
                    <div key={peer.id} className="relative">
                      <VideoSpaces
                        isLocal={false}
                        peer={peer}
                        setPinned={setPinned}
                        pinned={pinned}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="gap-x-10 justify-center mx-auto w-[70%] my-auto overflow-hidden">
                <div className="relative">
                  <VideoSpaces
                    isLocal={false}
                    peer={pinned?.peer}
                    pinned={pinned}
                    setPinned={setPinned}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="absolute flex flex-col w-full mx-auto justify-center bottom-0">
            {!pinned?.status && !screenShared && pages > 1 && (
              <div className="flex justify-around w-full mb-2">
                <button
                  className={`bg-gray-300 rounded-full my-auto text-gray-800 font-bold text-3xl ${
                    currentPage > 0 ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                  onClick={handlePrevClick}
                  disabled={currentPage === 0}
                >
                  <HiOutlineArrowSmLeft />
                </button>
                <div className="flex mt-4 my-auto">
                  {Array.from({ length: pages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index)}
                      className={`w-3 h-3 mr-2 cursor-pointer rounded-full ${
                        index === currentPage ? "bg-white" : "bg-gray-500"
                      }`}
                    />
                  ))}
                </div>
                <button
                  className={`bg-gray-300 text-gray-800 font-bold rounded-full text-3xl ${
                    currentPage + 1 === pages ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                  onClick={handleNextClick}
                  disabled={currentPage + 1 === pages}
                >
                  <HiOutlineArrowSmRight />
                </button>
              </div>
            )}

            <div className="bg-slate-900 w-[90%] mx-auto md:rounded-lg min-h-2/5 p-2 my-3">
              <Controls
                type="av"
                switches={setVisibility}
                visible={visible}
                setVisible={isVisible}
                isAudio={isAudio}
                setIsAudio={setIsAudio}
              />
            </div>
          </div>
        </div>

        <div
          className={`md:col-span-2 max-h-screen bg-slate-700 duration-300 transition-all ease-in-out
                    ${visible ? "hidden md:block" : "hidden"}
                `}
        >
          <Messages
            sideMenu={sideMenu}
            setSideMenu={setSideMenu}
            allMessages={allMessages}
          />
        </div>
      </main>
    </div>
  );
}

export default VideoConference;
