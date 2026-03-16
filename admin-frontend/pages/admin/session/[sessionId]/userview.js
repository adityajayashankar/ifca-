import Image from "next/image";
import { useEffect, useState } from "react";
import {
  MdCalendarToday,
  MdLocationOn,
  MdPerson,
  MdHome,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
import {
  oneSession,
  setAllSessions,
  setOneSession,
  setSelectedSession,
} from "@/store/features/session";
import { HiSpeakerphone } from "react-icons/hi";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  selectLikeMap,
  selectSessionPosts,
  selectVoteMap,
  setSessionPosts,
} from "@/store/features/postsSlice";
import CreatePostContainer from "@/components/community/home/CreatePostContainer";
import PostX from "@/components/SocialPost/PostX";

function UserViewSessionPage() {
  const selectedSession = useSelector(oneSession);
  const likeMap = useSelector(selectLikeMap);
  const voteMap = useSelector(selectVoteMap);
  const dispatch = useDispatch();
  const router = useRouter();
  const sessionPosts = useSelector(selectSessionPosts);
  // slot=> selected slot: on click, it should return the status of which to buy
  const [slot, setSlot] = useState(0);
  const [dates, setDates] = useState([]);
  const [price, setPrice] = useState(0);
  const [slotDetails, setSlotDetails] = useState();
  const [view, setView] = useState("home");

  const fetchPosts = () => {
    if (!isNaN(parseInt(router?.query["sessionId"]))) {
      dispatch(setSessionPosts(parseInt(router.query["sessionId"])));
    }
  };
  useEffect(() => {
    fetchPosts();
  }, [router, view]);

  let datesTemp = [];

  const stripSlots = () => {
    let slots = selectedSession.SessionSlot;

    slots.forEach((slot) => {
      let obj = {};
      const startDate = new Date(slot.startTime);
      obj["day"] = startDate.toLocaleString("en-us", { weekday: "long" });
      obj["date"] = `${startDate.getDate()} ${startDate.toLocaleString(
        "en-us",
        { month: "long" }
      )}`;
      obj["selected"] = false;
      obj["startTime"] = startDate.toLocaleTimeString();
      const endDate = new Date(slot.endTime);
      obj["endTime"] = endDate.toLocaleTimeString();
      obj["slotId"] = slot.id;
      obj["price"] = slot.price;
      datesTemp.push(obj);
    });
  };

  useEffect(() => {
    if (selectedSession) {
      if (datesTemp.length === 0) {
        stripSlots();
        setDates(datesTemp);
        datesTemp = [];
      }
    } else {
      if (router.query && router.query["sessionId"]) {
        dispatch(setOneSession(parseInt(router.query["sessionId"])));
      }
    }

    return () => {
      datesTemp = [];
    };
  }, [selectedSession, router]);

  function handleSelection(index) {
    // dates -> selection true
    // slot -> dates[i]
    let temp = dates;
    if (temp[index].selected) {
      temp[index].selected = !temp[index].selected;
      setSlot(0);
      setPrice(0);
      setSlotDetails(null);
    } else if (slot === 0) {
      temp[index].selected = true;
      setSlot(temp[index].slotId);
      setPrice(temp[index].price);
      setSlotDetails({
        startTime: temp[index].startTime,
        endTime: temp[index].endTime,
      });
    } else {
      temp.forEach((item, index) => {
        if (item.selected) {
          item.selected = false;
        }
      });

      temp[index].selected = true;
      setSlot(temp[index].slotId);
      setPrice(temp[index].price);
      setSlotDetails({
        startTime: temp[index].startTime,
        endTime: temp[index].endTime,
      });
    }

    setDates(temp);
  }

  const handleJoinSession = (e) => {
    e.preventDefault();
    let element = document.createElement("a");
    let ans = confirm("Join Session?");
    if (ans) {
      element.href = `${selectedSession.SessionSlot[0].expert_link}`;
      element.rel = "noreferrer";
      document.body.appendChild(element);
      element.click();
    }
  };

  const handleChangeView = (target) => {
    setView(target);
  };
  return (
    <>
      <Head>
        <title>{selectedSession?.title}</title>
      </Head>
      <div className="mx-auto lg:max-w-7xl mt-8">
        <div className="flex flex-col md:grid md:grid-cols-9 md:gap-8">
          <section className="col-span-3 flex flex-col px-4 md:items-center">
            <div className="bg-white rounded-lg overflow-hidden relative flex flex-col items-center text-center  hidden:md pb-4 h-screen">
              <img
                className="h-[300px] w-[300px]"
                src={selectedSession?.bannerImgs?.[0]}
                alt={selectedSession?.title}
              />
              <div className="mt-2 py-4 space-x-0.5">
                <h4 className="hover:underline decoration-purple-700 underline-offset-1 cursor-pointer text-step-2 font-bold">
                  {selectedSession?.title}
                </h4>
              </div>
              <div className="text-left text-gray-500 text-sm">
                <div className="flex flex-col items-start justify-around">
                  <button
                    className={`btn w-40 flex items-center ${
                      view === "home" ? "btn-blue" : "btn-pink"
                    }`}
                    onClick={() => handleChangeView("home")}
                  >
                    <MdPerson className="mr-2 text-xl" />
                    Home
                  </button>
                  <button
                    className={`btn w-40 flex items-center my-4 ${
                      view !== "home" ? "btn-blue" : "btn-pink"
                    }`}
                    onClick={() => handleChangeView("announcement")}
                  >
                    <HiSpeakerphone className="mr-2 text-xl" />
                    {"Q&A"}
                  </button>
                </div>
              </div>
            </div>
          </section>
          {view === "home" ? (
            <section className="col-span-6 flex flex-col gap-8 p-2 items-center md:items-start justify-center md:justify-start ml-8 md:ml-20">
              <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 md:before:bg-blue-400">
                About
              </p>
              <div>{selectedSession?.desc}</div>
              <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 md:before:bg-blue-400">
                Booked slot
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex flex-row flex-wrap gap-4 py-4">
                  {dates.map((date, index) => (
                    <div
                      className={`flex flex-col gap-1 items-center p-2 border rounded-lg hover:cursor-pointer ${
                        date.selected ? "bg-gray-600 text-white" : ""
                      }`}
                      onClick={(e) => handleSelection(index)}
                      key={`date-${index}`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          date.selected ? "text-white" : "text-orange-500"
                        }`}
                      >
                        {date.day}
                      </p>
                      <p>{date.date}</p>
                      <p className="text-sm font-bold">
                        {`${date.startTime}-${date.endTime}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {/* <div className='flex flex-col gap-2'>
                <p className='font-semibold text-step-1'>Time</p>
                <div className='flex flex-row flex-wrap gap-4 py-4'>
                    {times.map((time, index) => (
                        <div
                            className={`flex flex-col gap-1 items-center p-2 border rounded-lg hover:cursor-pointer ${
                                time.selected
                                    ? 'bg-gray-600 text-white'
                                    : ''
                            }`}>
                           
                        </div>
                    ))}
                </div>
            </div> */}

              {selectedSession?.SessionSlot[0]?.isOnline && (
  <button 
    className="btn btn-gray font-bold w-64" 
    disabled={false}
    onClick={handleJoinSession}
  >
    Join meeting
  </button>
)}
</section>
          ) : (
            <div className="col-span-6 scrollbar-hide max-h-screen overflow-scroll items-center">
              <div>
                <CreatePostContainer
                  placeholder={"Post about session.."}
                  sessionId={selectedSession?.id}
                  cb={fetchPosts}
                />
              </div>
              <hr />
              <div>
                {sessionPosts?.map((item, index) => (
                  <PostX
                    key={`session-post-${index}`}
                    user={item.creator}
                    // unifiedUser={item.creator}
                    title={item.title}
                    createdAt={item.createdAt}
                    content={item.content}
                    threadId={item.id}
                    tags={item.tags}
                    media={item.assets}
                    numLikes={item.likes.length}
                    numReplies={item._count.childrenPosts}
                    // likes={item.likes.length}
                    deletecb={fetchPosts}
                    userCommunity={true}
                    liked={likeMap[item.id] ? true : false}
                    isPoll={item.isPoll}
                    expiresAt={item.expiresAt}
                    pollOptions={item?.votes}
                    isVoted={
                      voteMap &&
                      !!Object.keys(voteMap)?.find(
                        (voteks) =>
                          parseInt(voteks) === item.id && voteMap[voteks] !== -1
                      )
                    }
                    votedOption={
                      voteMap &&
                      !!Object.keys(voteMap)?.find(
                        (voteks) =>
                          parseInt(voteks) === item.id && voteMap[voteks] !== -1
                      )
                        ? findOptionIndex(item.votes, voteMap[item.id])
                        : -1
                    }
                  />
                ))}
                {(!sessionPosts || sessionPosts.length === 0) && (
                  <div className="h-screen bg-red-400 opacity-40 flex justify-center items-center">
                    <h1 className="text-step-4 ml-8">No posts yet!</h1>
                  </div>
                  
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default UserViewSessionPage;
