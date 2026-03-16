import ScheduleIcon from "@mui/icons-material/Schedule";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  selectUser,
  selectUserAttendance,
  selectUserCommunities,
  setFromPage,
  setSelectedUserSession,
  setUserCart,
  setUserCommunities,
  setUserSessions,
} from "@/store/features/userSlice";
import { useEffect, useState } from "react";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import {
  selectSession,
  setSelectedSessionById,
} from "@/store/features/sessionSlice";
import { selectCommunitySessions } from "@/store/features/communitySlice";
import axios from "axios";
import { toast } from "react-toastify";

const ClassSchedule = ({
  sessionSlots,
  isUser,
  isButtonOnly,
  isExclusive,
  mobilehidden,
  communityId,
  roomId,
  // selectedSession,
}) => {
  const selectedSession = useSelector(selectSession);
  const communitySessions = useSelector(selectCommunitySessions);
  const currentId = window.location.pathname.split("/")[2];
  const userAttendance = useSelector(selectUserAttendance);
  const user = useSelector(selectUser);
  const [userStatus, setUserStatus] = useState(0);
  const [dates, setDates] = useState([]);
  const [isCommunitySession, setIsCommunitySession] = useState(false);
  const [creator, setCreator] = useState();
  const comId = selectedSession?.communityId;
  const userCommunities = useSelector(selectUserCommunities);
  const [isUserInCommunity, setIsUserInCommunity] = useState(false);
  const [isRequestPending, setIsRequestPending] = useState(false);

  const sessionImg=selectedSession?.infoImgs[0]
  const sessionTitle = selectedSession?.title

  const router = useRouter();
  const dispatch = useDispatch();

  let datesTemp = [];

  // useEffect(() => {
  //   dispatch(setSelectedSessionById(currentId));
  // }, []);

  useEffect(() => {
    user && dispatch(setUserCommunities(user?.id));
  }, []);

  // Add check for user's community membership
  useEffect(() => {
    const checkCommunityMembership = async () => {
      if (user && communityId) {
        try {
          const communityMembersRes = await api.get(`/community/${communityId}/people`);
          const isMember = communityMembersRes.data?.users?.some(
            member => member.unifiedUserId === user?.unifiedUser?.id
          );
          setIsUserInCommunity(isMember);
        } catch (error) {
          console.error("Error checking community membership:", error);
          setIsUserInCommunity(false);
        }
      }
    };

    checkCommunityMembership();
  }, [user, communityId]);

  // Check if user has pending request for community
  useEffect(() => {
    const checkRequestStatus = async () => {
      if (user && user.id && communityId) {
        try {
          const requestResponse = await api.get(`/user/${user.id}/community/${communityId}/requested`);
          setIsRequestPending(!!requestResponse.data.requested);
        } catch (error) {
          console.error("Error checking request status:", error);
          setIsRequestPending(false);
        }
      }
    };

    checkRequestStatus();
  }, [user, communityId]);

  const completedSessions = sessionSlots?.filter((item) => {
    return new Date(item.endTime).getTime() < new Date().getTime();
  });

  const upcomingSessions = sessionSlots?.filter((item) => {
    return new Date(item.endTime).getTime() > new Date().getTime();
  });

  const [active, setActive] = useState(
    upcomingSessions ? upcomingSessions[0]?.id : -1
  );
  const [slot, setSlot] = useState(
    upcomingSessions ? upcomingSessions[0]?.id : 0
  );
  const [price, setPrice] = useState(
    upcomingSessions ? upcomingSessions[0]?.price : 0
  );
  const [slotDetails, setSlotDetails] = useState();

  const checkCommunitySession = (e) => {
    e?.preventDefault();
    user &&
      api.get(`/user/${user?.id}/community/sessions`).then((res) => {
        if (
          res.data?.sessions?.find((item) => item.id === selectedSession.id)
        ) {
          setIsCommunitySession(true);
        }
      });
  };

  const stripSlots = () => {
    let slots = selectedSession.SessionSlot;
    slots?.forEach((slot) => {
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
      obj["speaker"] = slot.speakers;
      datesTemp.push(obj);
    });
  };

  useEffect(() => {
    if (selectedSession?.id === parseInt(currentId)) {
      let userBoughtStatus = false;
      checkCommunitySession();
      userAttendance?.every((item) => {
        if (item.sessionId === parseInt(selectedSession?.id)) {
          let obj = {
            session: selectedSession,
            attendance: item,
            SessionSlot: item.sessionSlot,
          };
          dispatch(setSelectedUserSession(obj));
          userBoughtStatus = true;
          return false;
        }
        return true;
      });
      // if (userBoughtStatus && currentId) {
      //   router.replace(`/mySchedule`);
      // }
      if (datesTemp.length === 0) {
        stripSlots();
        setDates([...datesTemp]);
      }
    }

    return () => {
      datesTemp = [];
    };
  }, [selectedSession, userAttendance, router, currentId]);

  const handleJoinCommunity = async (e) => {
    if (!user) {
      router.push("/auth");
      return;
    }
    let now = new Date();
    let expiry = new Date(
      now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
      (now.getMonth() + 1) % 12,
      now.getDate()
    );
    let obj = {
      userId: user?.id,
      communityId: comId,
      expiresAt: expiry,
      startsAt: now,
      amount: currentCommunity.price,
      transactionId: `xSxssdefg`,
      paymentId: "sauasevgr2133",
    };
    const res = await api.post(`/pay/`, obj);
    toast(`Enrolled successfully!`, { type: "success", delay: 250 });
    dispatch(setUserCommunities(user?.id));
    router.push(`/comHome/${comId}`);
  };

  const isUserCommunityMember = userCommunities
    ?.map((item) => {
      return item.id;
    })
    .includes(selectedSession?.communityId);

  function getAttendence(uid, slotId) {
    api
      .get(`/user/${uid}/attendance`)
      .then((res) => {
        let attendance = res.data.attendance;
        let session = attendance.find((item) => {
          if (item.sessionSlotId === slotId) {
            return item;
          }
        });

        if (session) {
          if (session.paymentCompleted) {
            setUserStatus(2);
          }
        }
      })
      .catch((err) => {
        toast(`Error fetching slot details`, { type: "error", delay: 1000 });
        console.log(err);
      });
  }

  async function addUserSession(
    id,
    sessionId,
    sessionSlotId,
    price,
    title,
    slotDetails
  ) {
    try {
      let postObj = { weeklyPass: isCommunitySession };
      if (selectedSession?.isCourse) {
        postObj = { ...postObj, sessionId, price, email: user.email };
        await api.post(`/user/${id}/sessions`, postObj);

        if (price > 0) {
          dispatch(setUserCart(id));
          if (!isCommunitySession) {
            toast("Added to cart", { type: "success", delay: 500 });
          }
          router.push(`/cart`);
        } else {
          dispatch(setUserSessions(user?.id));
          router.push(`/home`);
        }
      } else {
        postObj = { ...postObj, sessionId, sessionSlotId, price };
        await api.post(`/user/${id}/sessions`, postObj);
        if (price > 0) {
          dispatch(setUserCart(id));
          if (!isCommunitySession) {
            toast("Added to cart", { type: "success", delay: 300 });
          }
          router.push(`/cart`);
        } else {
          dispatch(setUserSessions(user?.id));
          router.push(`/home`);
        }
      }
    } catch (err) {
      err.message === "User owns session" && router.push(`/cart`);
      console.log(err);
    }
  }

  const handleAddToCart = async (sessionId, price) => {
    dispatch(addToCart({ sessionId, comTitle:sessionTitle, price, image:sessionImg }));
    toast.success("Added to cart!");
  }

  const handleCommunityRedirection = async (e) => {
    e?.preventDefault();
    toast("Buy Community Membership to access session", { type: "success" });
    // check if the user has community membership
    // handleJoinCommunity()

    // if(selectedSession.SessionSlot[0].price > 0){
    //   handleCheckout()
    // } else {
    //   try {
    //     await addUserSession(user.id, selectedSession.id, slot, price);
    //     dispatch(setUserSessions(user.id));
    //   } catch (err) {
    //     toast(err.msg, { type: "error", delay: 500 });
    //     console.log(err);
    //   }
    // }
    dispatch(setFromPage({ from: "sessionBuyPage", id: currentId }));
    router.push(`/communitySub/${communityId ? communityId : currentId}`);
  };

  function handleSelection(index) {
    let temp = dates;

    if (temp[index]?.selected) {
      temp[index].selected = !temp[index]?.selected;
      setSlot(0);
      setPrice(0);
      setUserStatus(0);
      setSlotDetails(null);
      setCreator({});
    } else if (slot === 0) {
      temp[index].selected = true;
      setSlot(temp[index]?.slotId);
      setPrice(temp[index]?.price);
      setUserStatus(1);
      setSlotDetails({
        startTime: temp[index]?.startTime,
        endTime: temp[index]?.endTime,
      });
      setCreator(temp[index]?.speaker);
    } else {
      temp.forEach((item, index) => {
        if (item.selected) {
          item.selected = false;
        }
      });

      temp[index].selected = true;
      setSlot(temp[index]?.slotId);
      setPrice(temp[index]?.price);
      setSlotDetails({
        startTime: temp[index]?.startTime,
        endTime: temp[index]?.endTime,
      });
      setCreator(temp[index]?.speaker);
    }
    getAttendence(user?.id, temp[index]?.slotId);

    setDates(temp);
    // console.log("slot det", temp[index]?.slotId);
  }

  console.log(completedSessions);

  // const handleJoin=(id)=>{
  //   console.log('enter here---', id);
  //   router.push("/room/" + id);
  // }

  const handleJoin= async (roomId)=>{
    const management_Token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNjUyYTM1NTNjYTU4NDhmMGUzZDQ2ZDlmIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJpYXQiOjE3MzYwMDU1MzgsIm5iZiI6MTczNjAwNTUzOCwiZXhwIjoyNTk5OTE5MTM4LCJqdGkiOiJmMDNhZTI4NS0wOWM2LTQzNGMtODRhNC1lZTRhNDIxMDg0NWQifQ.1HBmQv415bKF8bs2zZV__9JBzCw1cfQ9oJH9kFBeKc4'

    try {
      const response = await axios.post(`https://api.100ms.live/v2/room-codes/room/${roomId}`,
      {}, 
      {
        headers: {
          Authorization: `Bearer ${management_Token}`,
          "Content-Type": "application/json",
        },
      });
      const guestCode = response.data.data.find(item => item.role === 'guest');

    if (guestCode) {
      const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}`;
      if (typeof window !== "undefined") {
        window.open(redirectUrl, "_blank");
      }
    }
    

    } catch (error) {
      console.error("Error", error);
    }
  }

  console.log('selectedSession-----', selectedSession)

  if (!upcomingSessions || upcomingSessions.length === 0) {
    return (
      <div className="flex items-center justify-center w-full min-h-[200px] bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <p className="text-gray-500 text-base font-medium">No upcoming sessions</p>
      </div>
    );
  } else if (isUser) {
    return (
      <div className="space-y-4 w-full">
            {selectedSession?.SessionSlot?.length > 0 ? (
              selectedSession?.SessionSlot?.map((slot, index) => (
                <div
                  key={slot.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:p-4 hover:border-orange-200 transition-colors"
                >
              {slot.topicName && (
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {slot.topicName}
                </h3>
              )}
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <ScheduleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <p className="text-xs sm:text-sm">
                  {moment(slot.startTime).format("dddd")},{" "}
                    {moment(slot.startTime).format("h:mm a")} -{" "}
                    {moment(slot.endTime).format("h:mm a")}
                  </p>
              </div>
                    <button
                      onClick={() => handleJoin(selectedSession?.roomId)}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                Join Session
                    </button>
                </div>
              ))
            ) : (
          <p className="text-sm sm:text-base text-gray-500">No session slots available</p>
            )}
          </div>
    );
  }

  // console.log('isUser hereeeee---', isUser)
  // console.log('sessionSlots---', sessionSlots)

  return (
    <div className={`w-full max-w-full overflow-hidden ${mobilehidden ? "hidden md:block" : ""} space-y-4`}>

      {!window.location.pathname.includes("comHome") && !isButtonOnly && (
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Upcoming Sessions</h2>
          {user && isExclusive && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isUserInCommunity ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isUserInCommunity ? 'Member' : 'Not a Member'}
              </span>
            </div>
          )}
        </div>
      )}

      {!isButtonOnly && sessionSlots?.length > 0 ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar px-2">
          {completedSessions?.length > 0 && (
            <div className="space-y-3">
              {completedSessions.map((item, index) => (
              <div
                key={index}
                  className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="text-center min-w-[40px]">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">
                      {moment(item.startTime).format("MMM").toUpperCase()}
                    </p>
                        <p className="text-xl sm:text-2xl font-semibold text-gray-400">
                      {moment(item.startTime).format("DD")}
                    </p>
                  </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-medium text-gray-500 mb-1 truncate">
                          {item.topicName || "Session " + (index + 1)}
                        </h3>
                        <div className="flex items-center gap-1 text-gray-400">
                          <ScheduleIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <p className="text-xs sm:text-sm whitespace-nowrap">
                      {moment(item.startTime).format("h:mm a")} -{" "}
                      {moment(item.endTime).format("h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-400 ml-2">
                      COMPLETED
                    </span>
              </div>
            </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {upcomingSessions.map((item, index) => (
              <div
                key={item.id}
              onClick={() => {
                  if (!isExclusive || (isExclusive && isUserInCommunity)) {
                setActive(item.id);
                    user && handleSelection(index);
                  } else {
                    toast.error("Join the community to access these sessions");
                  }
              }}
                className={`cursor-pointer rounded-lg p-3 sm:p-4 transition-all ${
                active === item.id
                    ? "bg-orange-50 border-2 border-orange-200"
                    : "bg-white border border-gray-200 hover:border-orange-200"
                } ${!isUserInCommunity && isExclusive ? "opacity-75" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="text-center min-w-[40px]">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">
                    {moment(item.startTime).format("MMM").toUpperCase()}
                  </p>
                      <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {moment(item.startTime).format("DD")}
                  </p>
                </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1 truncate">
                        {item.topicName || `Session ${index + 1}`}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-600">
                        <ScheduleIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <p className="text-xs sm:text-sm whitespace-nowrap">
                          {moment(item.startTime).format("h:mm a")} -{" "}
                          {moment(item.endTime).format("h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs sm:text-sm font-medium text-orange-600">
                      {moment(item.startTime).isAfter(moment())
                        ? "UPCOMING"
                        : "ONGOING"}
                    </span>
                    {isExclusive && !isUserInCommunity && (
                      <span className="text-xs text-orange-600">
                        Members Only
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full min-h-[200px] bg-gray-50 rounded-lg border border-gray-200 mx-2">
          <p className="text-sm sm:text-base text-gray-500">No sessions available</p>
        </div>
      )}

      {!window.location.pathname.includes("comHome") && !isUser && (
        <div className="mt-6 px-2">
          {!user ? (
            <button
              onClick={() => router.push("/onBoard?fromSession=true")}
              className="w-full bg-orange-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Login to Register / Purchase Sessions
            </button>
          ) : isExclusive ? (
            !isUserInCommunity ? (
              (() => {
                // Button configurations array
                const buttonConfigs = [
                  {
                    condition: isRequestPending,
                    bgColor: 'bg-yellow-400',
                    hoverColor: 'hover:bg-yellow-500',
                    textColor: 'text-yellow-900',
                    text: 'Request Pending',
                    icon: (
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    ),
                    disabled: true,
                    onClick: null
                  },
                  {
                    condition: true,
                    bgColor: 'bg-orange-600',
                    hoverColor: 'hover:bg-orange-700',
                    textColor: 'text-white',
                    text: 'Join Community to Access Sessions',
                    icon: null,
                    disabled: false,
                    onClick: handleCommunityRedirection
                  }
                ];

                const config = buttonConfigs.find(c => c.condition) || buttonConfigs[1];

                return (
                  <button
                    onClick={config.onClick}
                    disabled={config.disabled}
                    className={`w-full ${config.bgColor} ${config.textColor} px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-medium ${config.disabled ? 'cursor-not-allowed' : config.hoverColor} transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center`}
                  >
                    {config.icon}
                    {config.text}
                  </button>
                );
              })()
            ) : sessionSlots[0].price === 0 ? (
              <button
                onClick={() =>
                  addUserSession(
                    user?.unifiedUser?.id,
                    selectedSession.id,
                    slot,
                    price,
                    selectedSession.title,
                    slotDetails
                  )
                }
                className="w-full bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Register for Free
              </button>
            ) : (
              <button
                onClick={()=>handleAddToCart(selectedSession?.id, price)}
                className="w-full bg-orange-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Add to Cart
              </button>
            )
          ) : sessionSlots[0].price === 0 ? (
            <button
              disabled={isUser}
              onClick={() =>
                addUserSession(
                  user?.unifiedUser?.id,
                  selectedSession.id,
                  slot,
                  price,
                  selectedSession.title,
                  slotDetails
                )
              }
              className={`w-full px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isUser
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
              }`}
            >
              Register for Free
            </button>
          ) : (
            <button
              disabled={isUser}
              onClick={()=>handleAddToCart(selectedSession?.id, price)}
              className={`w-full px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isUser
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
              }`}
            >
              Add to Cart
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Add custom scrollbar styles
const styles = {
  customScrollbar: `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `
}

export default ClassSchedule;
