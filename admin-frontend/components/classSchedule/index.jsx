import ScheduleIcon from "@mui/icons-material/Schedule";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUser,
  selectUserAttendance,
  selectUserCommunities,
  // setFromPage,
  // setUserCart,
  setUserCommunities,
  // setSelectedUserSession,
  // setUserSessions,
} from "@/store/features/userSlice";
import { toast, Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useState } from "react";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import {
  selectSession,
  setSelectedSessionById,
} from "@/store/features/session";
import { selectCommunitySessions } from "@/store/features/communitySlice";

const ClassSchedule = ({ sessionSlots, isExclusive, mobilehidden }) => {
  const selectedSession = useSelector(selectSession);
  const communitySessions = useSelector(selectCommunitySessions);
  const currentId = window.location.pathname.split("/")[3];
  const userAttendance = useSelector(selectUserAttendance);
  const user = useSelector(selectUser);
  const [userStatus, setUserStatus] = useState(0);
  const [dates, setDates] = useState([]);
  const [isCommunitySession, setIsCommunitySession] = useState(false);
  const [creator, setCreator] = useState();
  const comId = selectedSession?.communityId;
  const userCommunities = useSelector(selectUserCommunities);

  const router = useRouter();
  const dispatch = useDispatch();

  let datesTemp = [];

  console.log("sessionSlots from class", sessionSlots);

  useEffect(() => {
    dispatch(setSelectedSessionById(currentId));
  }, []);

  useEffect(() => {
    user && dispatch(setUserCommunities(user?.id));
  }, []);

  const completedSessions = sessionSlots?.filter((item) => {
    return new Date(item.startTime).getTime() < new Date().getTime();
  });

  const upcomingSessions = sessionSlots?.filter((item) => {
    return new Date(item.startTime).getTime() > new Date().getTime();
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
          // dispatch(setSelectedUserSession(obj));
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
    console.log(res.data);
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
    console.log("Inside add user session");
    try {
      // add to cart
      let postObj = { weeklyPass: isCommunitySession };
      if (selectedSession?.isCourse) {
        postObj = { ...postObj, sessionId, price, email: user.email };
        await api.post(`/user/${id}/sessions`, postObj);

        if (price > 0) {
          // dispatch(setUserCart(id));
          if (!isCommunitySession) {
            toast("Added to cart", { type: "success", delay: 500 });
          }
        }
        router.push(`/cart`);
      } else {
        postObj = { ...postObj, sessionId, sessionSlotId, price };
        await api.post(`/user/${id}/sessions`, postObj);
        if (price > 0) {
          // dispatch(setUserCart(id));
          if (!isCommunitySession) {
            toast("Added to cart", { type: "success", delay: 500 });
          }
        }
        router.push(`/cart`);
      }
      router.push(`/mySchedule`);
    } catch (err) {
      toast(err.message, { type: "error", delay: 500 });
      console.log(err);
    }
  }

  async function handleCheckout() {
    if (user) {
      try {
        // console.log("here1");
        await addUserSession(
          user?.id,
          selectedSession.id,
          slot,
          price,
          selectedSession.title,
          slotDetails
        );
        // dispatch(setUserSessions(user?.id));
      } catch (err) {
        toast(err.msg, { type: "error", delay: 500 });
        console.log(err);
      }
    } else {
      toast(`Error, try again`, { type: `error` });
    }
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
    // dispatch(setFromPage({ from: "sessionBuyPage", id: currentId }));
    router.push(`/communitySub/${selectedSession.communityId}`);
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
    console.log("slot det", temp[index]?.slotId);
  }

  if (!upcomingSessions || upcomingSessions.length === 0) {
    return (
      <div
        className={`border-[2px]  flex items-center justify-center h-[424px] ${
          window.location.pathname.includes("expert/community")
            ? "md:w-[75%]"
            : "md:w-[37.5%]"
        } bg-white classScheduleScroll px-[20px] rounded-xl`}
      >
        No upcoming sessions
      </div>
    );
  }

  return (
    <div
      style={{
        width: window.location.pathname.includes("expert/community") && "75%",
      }}
      className={`w-full md:w-[37.5%] ${mobilehidden && "hidden md:block"}`}
    >
      <Toaster position="top-center" />
      {!window.location.pathname.includes("expert/community") && (
        <h1 className="text-2xl md:text-4xl font-bold mb-10 mt-5">
          Upcoming Sessions
        </h1>
      )}
      {sessionSlots?.length > 0 ? (
        <div className="border-[2px]  rounded-lg h-[324px] overflow-y-scroll classScheduleScroll">
          {completedSessions.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-[15px] py-[10px] px-[20px] justify-between border-[2px] border-[#CDCDCD] rounded-lg bg-[#DFDFDF] opacity-50 text-gray-500"
            >
              <div className="flex items-center gap-[30px]">
                <div className="font-semibold">
                  <p className="text-[21px] mb-[10px]">
                    {moment(item.startTime)
                      .format("MMM")
                      .toUpperCase()}
                  </p>
                  <p className="text-[28px] font-semibold">
                    {moment(item.startTime).format("DD")}
                  </p>
                </div>
                <div className="font-semibold">
                  <p className="text-[24px] mb-[10px]">Tabla Lesson 1</p>
                  <p className="flex items-center gap-[5px] text-[18px] font-semibold">
                    <ScheduleIcon /> Tuesday , 4pm - 6pm
                  </p>
                </div>
              </div>
              <div className="font-semibold">COMPLETED</div>
            </div>
          ))}
          <div
            onClick={() => {
              setActive(upcomingSessions ? upcomingSessions[0]?.id : -1);
              user && handleSelection(0);
            }}
            className={
              active === upcomingSessions[0]?.id
                ? "flex items-center gap-[15px] py-[10px] px-[20px] justify-between border-[2px]  rounded-lg bg-[#3554C566] text-orange-500 cursor-pointer "
                : " cursor-pointer flex items-center gap-[15px] py-[10px] px-[20px] justify-between border-[2px] border-[#CDCDCD] rounded-lg bg-white text-gray-500"
            }
          >
            <div className="flex items-center gap-[20px] md:gap-[30px]">
              <div className="font-semibold">
                <p className="text-[14px] md:text-[21px] mb-[10px] whitespace-nowrap">
                  {moment(upcomingSessions[0]?.startTime)
                    .format("MMM")
                    .toUpperCase()}
                </p>
                <p className="text-[20px] md:text-[28px] font-semibold whitespace-nowrap">
                  {moment(upcomingSessions[0]?.startTime).format("DD")}
                </p>
              </div>
              <div className="font-semibold">
                <p className="text-[14px] md:text-[24px] mb-[10px] whitespace-nowrap">
                  {upcomingSessions[0]?.topicName === ""
                    ? "Class 1"
                    : upcomingSessions[0]?.topicName}
                </p>
                <p className="flex items-center gap-[5px] text-[12px] md:text-[18px] font-semibold whitespace-nowrap">
                  <ScheduleIcon />{" "}
                  {moment(upcomingSessions[0]?.startTime).format("dddd")},{" "}
                  {moment(upcomingSessions[0].startTime).format("h a")} -{" "}
                  {moment(upcomingSessions[0].endTime).format("h a")}
                </p>
              </div>
            </div>
            <div className="text-sm md:text-normal font-[400] tracking-wide">
              UPCOMING
            </div>
          </div>
          {upcomingSessions.slice(1).map((item, index) => (
            <div
              onClick={() => {
                setActive(item.id);
                user && handleSelection(index + 1);
              }}
              key={index}
              className={
                active === item.id
                  ? "cursor-pointer flex items-center gap-[15px] py-[10px] px-[20px] justify-between border-[2px]  rounded-lg bg-[#3554C566] text-orange-500"
                  : "cursor-pointer flex items-center gap-[15px] py-[10px] px-[20px] justify-between border-[2px] border-[#CDCDCD] rounded-lg bg-white text-gray-500"
              }
            >
              <div className="flex items-center gap-[30px]">
                <div className="font-semibold">
                  <p className="text-[14px] md:text-[21px] mb-[10px]">
                    {moment(item.startTime)
                      .format("MMM")
                      .toUpperCase()}
                  </p>
                  <p className="text-[20px] md:text-[28px] font-semibold">
                    {moment(item.startTime).format("DD")}
                  </p>
                </div>
                <div className="font-semibold">
                  <p className="text-[14px] md:text-[24px] mb-[10px]">
                    {item.topicName !== ""
                      ? item.topicName
                      : `Class ${index + 2}`}
                  </p>
                  <p className="flex items-center gap-[5px] text-[12px] md:text-[18px] font-semibold">
                    <ScheduleIcon /> {moment(item.startTime).format("dddd")},{" "}
                    {moment(item.startTime).format("h a")} -{" "}
                    {moment(item.endTime).format("h a")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-[2px]  rounded-lg bg-[#EFEFEF] h-[324px] flex justify-center items-center text-[18px] text-[#ADADAD] font-semibold">
          No sessions for this community yet!!
        </div>
      )}
      {!window.location.pathname.includes("comHome") && (
        <div className="my-[20px]">
          {/* {isExclusive ? <button onClick={handleCheckout} className="w-full gradient_background text-white px-[30px] py-[15px] rounded-lg border-none outline-none text-[21px] font-semibold cursor-pointer">{window.location.pathname.includes("community") ? "Get Community Subscription" : "Add to Cart"}</button> : <button className="w-full gradient_background text-white px-[30px] py-[15px] rounded-lg border-none outline-none text-[21px] font-semibold cursor-pointer">{window.location.pathname.includes("community") ? "Join Community" : "Register"}</button>} */}
          {!user ? (
            <button
              onClick={() => router.push("/onBoard?fromSession=true")}
              className="w-full gradient_background text-white px-[30px] py-[15px] rounded-lg border-none outline-none text-[21px] font-semibold cursor-pointer"
            >
              Login to Register / Purchase Sessions
            </button>
          ) : isExclusive ? (
            !isUserCommunityMember ? (
              <button
                onClick={handleCommunityRedirection}
                className="w-full gradient_background text-white px-[30px] py-[15px] rounded-lg border-none outline-none text-[21px] font-semibold cursor-pointer"
              >
                Get Community Membership to Access
              </button>
            ) : sessionSlots[0].price === 0 ? (
              <button
                onClick={() =>
                  addUserSession(
                    user?.id,
                    selectedSession.id,
                    slot,
                    price,
                    selectedSession.title,
                    slotDetails
                  )
                }
                className="w-full gradient_background text-white px-[30px] py-[15px] rounded-lg border-none outline-none text-[21px] font-semibold cursor-pointer"
              >
                Register
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                className="w-full gradient_background text-white px-[30px] py-[15px] rounded-lg border-none outline-none text-[21px] font-semibold cursor-pointer"
              >
                Add To Cart
              </button>
            )
          ) : sessionSlots[0].price === 0 ? (
            <button
              onClick={() =>
                addUserSession(
                  user?.id,
                  selectedSession.id,
                  slot,
                  price,
                  selectedSession.title,
                  slotDetails
                )
              }
              className="w-full gradient_background text-white px-[30px] py-[15px] rounded-lg border-none outline-none text-[21px] font-semibold cursor-pointer"
            >
              Register
            </button>
          ) : (
            <button
              onClick={handleCheckout}
              className="w-full gradient_background text-white px-[30px] py-[15px] rounded-lg border-none outline-none text-[21px] font-semibold cursor-pointer"
            >
              Add To Cart
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassSchedule;
