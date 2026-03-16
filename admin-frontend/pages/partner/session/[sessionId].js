import Image from "next/image";
import { useEffect, useState } from "react";
import { MdCalendarToday, MdChevronRight, MdHome, MdLocationOn, MdPerson } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { BsFillArrowUpCircleFill } from "react-icons/bs";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
import {
  selectSelectedPartnerSession,
  setPartnerSessionById,
  clearPartnerSession,
  setPartnerSessions,
} from "@/store/features/partnerSlice";
import {
  setExpert,
  setExpertCommunities,
  setExpertSessions,
} from "@/store/features/expert";
import CreateCouponForm from "@/components/coupon/CreateCouponForm";
import Coupon from "@/components/coupon/coupon";
import { setResourcesSession } from "@/store/features/resourceSlice";
import { selectSession } from "@/store/features/createSessionSlice";
import { selectAllCommunities } from "@/store/features/communitySlice";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

function SessionPagePartner() {
  const selectedSession = useSelector(selectSelectedPartnerSession);
  const dispatch = useDispatch();
  const allCommunities = useSelector(selectAllCommunities);
  // slot=> selected slot: on click, it should return the status of which to buy
  const [slot, setSlot] = useState(0);
  const [creator, setCreator] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dates, setDates] = useState([]);
  const [price, setPrice] = useState(0);
  const [slotDetails, setSlotDetails] = useState();
  const [couponObj, setCouponObj] = useState({});
  const [selectedCommunity, setSelectedCommunity] = useState(0);
  const [participantLimit, setParticipantLimit] = useState(0);
  let datesTemp = [];
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  console.log(creator)

  const handleEditCoupon = (item) => {
    setCouponObj(item);
    setVisible(true);
  };

  const handleDeleteCoupon = (item) => {
    api.delete(`/coupon/${item.code}`).then((res) => {
      toast(`successfully deleted!`);
    });
  };

  const router = useRouter();
  const stripSlots = () => {
    let slots = selectedSession?.SessionSlot;

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
      obj["topicname"] = slot.topicName;
      obj["participantLimit"] = slot.participantLimit;
      datesTemp.push(obj);
    });
  };

  console.log(selectedSession)

  useEffect(() => {
    if (datesTemp.length === 0) {
      stripSlots();
      setDates(datesTemp);
      datesTemp = [];
    }
    dispatch(setResourcesSession(window.location.pathname.split('/')[3]))

    return () => {
      datesTemp = [];
    };
  }, [selectedSession, router]);

  useEffect(() => {
    if (router.query.sessionId) {
      dispatch(setPartnerSessionById(router.query.sessionId));
    }
    
    // Cleanup on unmount
    return () => {
      dispatch(clearPartnerSession());
    };
  }, [router.query.sessionId]);

  function handleSelection(index) {
    // dates -> selection true
    // slot -> dates[i]
    let temp = dates;
    if (temp[index].selected) {
      temp[index].selected = !temp[index].selected;
      setSlot(0);
      setPrice(0);
      setSlotDetails(null);
      setCreator(null);
      setParticipantLimit(0);
    } else if (slot === 0) {
      temp[index].selected = true;
      setSlot(temp[index].slotId);
      setPrice(temp[index].price);
      setSlotDetails({
        startTime: temp[index].startTime,
        endTime: temp[index].endTime,
      });
      setCreator(temp[index].speaker);
      setParticipantLimit(temp[index].participantLimit);
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
      setParticipantLimit(temp[index].participantLimit);
    }

    setDates(temp);
    setCreator(temp[index].speaker);
  }

  const handleDeleteSession = (e) => {
    e.preventDefault();
    setShowDeleteModal(true);
  };

  const confirmDeleteSession = () => {
    setLoadingDelete(true);
    api.delete(`/session/${selectedSession.id}`).then((res) => {
      setLoadingDelete(false);
      setShowDeleteModal(false);
      if (res.data) {
        toast(`Session Deleted`);
        dispatch(setPartnerSessions());
        router.replace(`/partner/session`);
      }
    });
  };

  const handleExpertNavigate = (e) => {
    e.preventDefault();
    dispatch(setExpert(creator));
    dispatch(setExpertSessions(creator?.id));
    dispatch(setExpertCommunities(creator?.id));
    router.push(`/partner/expert/${creator?.id}`);
  };

  const handleCouponCreate = () => {
    setVisible(false);
  };

  const handleAddCoupon = () => {
    setCouponObj({});
    setVisible((prev) => !prev);
  };

  const handleChange = (e) => {
    e.preventDefault();
    setSelectedCommunity(e.target.value);
  };

  const handleBuySession = (e) => {
    e.preventDefault();
    // check if slot chosen
    // check if community selected
    if (!slotDetails || !selectedCommunity) {
      toast(`Select A slot & community`);
      return;
    }
    console.log(selectedCommunity)
    api.post(`/tier`, { communityId: parseInt(selectedCommunity), discount: 10, sessionSlotId: parseInt(slot) })
      .then((res) => {
        if (res.data) {
          toast(`Successfully bought session`, { type: "success" });
        }
      })
  };

  return (
    <>
      <Head>
        <title>{`${selectedSession?.title}`}</title>
      </Head>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-2 ">
        <div className=" mx-auto px-4 py-3 flex items-center space-x-2 text-sm ">
          <button
            onClick={() => router.push('/partner')}
            className="flex items-center  hover:text-orange-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => router.push('/partner/session')}
            className="text-gray-500 hover:text-orange-700"
          >
            Sessions
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium truncate max-w-[200px] md:max-w-xs" title={selectedSession?.title}>{selectedSession?.title}</span>
        </div>
      </div>
      <div className="min-h-[calc(100vh-138px)] bg-gray-50 mx-auto px-2 md:px-4 lg:px-0 max-w-[1920px]">
        {selectedSession && (
          <>
            <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] max-w-[1920px] mx-auto">
              {/* Left Section: 35% width */}
              <section className="flex flex-col gap-6 p-0 w-full lg:w-[35%] lg:sticky lg:top-24 bg-transparent z-10 h-fit">
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-6">
                  <Image
                    src={selectedSession?.bannerImgs?.[0] || "/assets/images/yoga.jpg"}
                    width={1024}
                    height={682}
                    layout="responsive"
                    className="rounded-xl shadow object-contain bg-orange-50"
                  />
                  <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-gray-900 line-clamp-2">{selectedSession.title}</h1>
                    <div className="flex items-center gap-3 text-base text-gray-500">
                      <MdCalendarToday className="text-orange-500" />
                      {selectedSession?.SessionSlot[0]?.startTime && (
                        <span>{new Date(selectedSession?.SessionSlot[0]?.startTime).toLocaleString()}</span>
                      )}
                      {selectedSession?.SessionSlot[0]?.location && !selectedSession?.SessionSlot[0]?.isOnline && (
                        <>
                          <span className="mx-2">|</span>
                          <MdLocationOn className="text-orange-500" />
                          <span>{selectedSession.SessionSlot[0]?.location}</span>
                        </>
                      )}
                    </div>
                    <p className="text-gray-600 line-clamp-2 mt-1 text-lg">{selectedSession.desc}</p>
                    {creator?.name && (
                      <div className="font-semibold text-orange-500 mt-2 flex flex-col gap-2">
                        <span className="text-base text-gray-700">Speaker: <span className="font-semibold text-orange-600">{creator?.name}</span></span>
                        <button
                          className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex flex-row items-center gap-2 shadow focus:ring-2 focus:ring-orange-300"
                          onClick={handleExpertNavigate}
                        >
                          <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                          <MdPerson className="mr-2" /> About Speaker
                        </button>
                      </div>
                    )}
                    {!creator?.name && slot !== 0 && (
                      <div className="font-semibold text-red-400">
                        {`No Speaker Assigned`}
                      </div>
                    )}
                    {selectedSession?.isExclusive && (
                      <p className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full w-max mt-2 text-xs font-semibold">Community Exclusive</p>
                    )}
                  </div>
                  {/* Operations Section */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Link href={`/partner/session/${router.query["sessionId"]}/analytics`} passHref>
                      <button className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                        <span className="relative z-10">Analytics</span>
                      </button>
                    </Link>
                    <Link href={`/partner/session/${router.query["sessionId"]}/userview`} passHref>
                      <button className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                        <span className="relative z-10">User Page</span>
                      </button>
                    </Link>
                    <Link href={`/partner/session/create/${router.query["sessionId"]}`} passHref>
                      <button className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                        <span className="relative z-10">Edit</span>
                      </button>
                    </Link>
                    <button
                      className={`relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300 ${loadingDelete ? 'cursor-not-allowed bg-orange-400' : ''}`}
                      onClick={handleDeleteSession}
                      disabled={loadingDelete}
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                      <span className="relative flex items-center justify-center z-10">
                        {loadingDelete ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </section>
              {/* Right Section: 65% width */}
              <section className="flex flex-col gap-8 p-0 w-full lg:w-[65%] lg:overflow-y-auto lg:max-h-[calc(100vh-7rem)]">
                {/* About Section */}
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                  <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
                    About
                  </p>
                  <p className="text-base text-gray-700">{selectedSession.desc}</p>
                </div>
                {/* Slots Section */}
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                  <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Available Slots
                  </p>
                  {dates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Slots Available</h3>
                      <p className="text-gray-500 max-w-sm">
                        Add time slots to make your session available for booking.
                      </p>
                      <Link href={`/partner/session/create/${router.query["sessionId"]}`} passHref>
                        <button className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          Add Slots
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-row flex-wrap gap-6 py-4">
                      {dates.map((date, index) => (
                        <div
                          className={`flex flex-row gap-4 px-3 py-2 border rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 hover:from-orange-100 hover:to-orange-200/50 transition-all duration-300 cursor-pointer w-full max-w-[360px] shadow-md backdrop-blur-sm relative group ${date.selected ? "ring-2 ring-orange-400" : ""}`}
                          onClick={(e) => handleSelection(index)}
                          key={`date-${index}`}
                        >
                          {/* Left Section: Expert Info */}
                          <div className="flex flex-col items-center gap-2 min-w-[100px]">
                            {/* Expert Photo with Glow Effect */}
                            <div className="relative">
                              {date?.speaker?.photoURL ? (
                                <div className="relative group-hover:scale-105 transition-transform duration-300">
                                  <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                                  <Image
                                    src={date.speaker.photoURL}
                                    alt={date?.speaker?.name || "Expert Photo"}
                                    width={80}
                                    height={80}
                                    className="rounded-full border-2 border-orange-300 shadow-lg object-cover relative z-10"
                                  />
                                </div>
                              ) : (
                                <div className="w-15 h-15 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                  <MdPerson className="text-5xl text-orange-600" />
                                </div>
                              )}
                            </div>

                            {/* Expert Name with Hover Effect */}
                            <div className="text-center">
                              {date?.speaker?.name ? (
                                <button
                                  className="text-orange-700 font-semibold hover:text-orange-500 transition-colors duration-200 flex items-center gap-2 group-hover:underline text-sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    dispatch(setExpert(date.speaker));
                                    dispatch(setExpertSessions(date.speaker?.id));
                                    dispatch(setExpertCommunities(date.speaker?.id));
                                    router.push(`/partner/expert/${date.speaker?.id}`);
                                  }}
                                >
                                  {date.speaker.name}
                                  <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              ) : (
                                <span className="text-gray-400 italic text-sm">No Speaker Assigned</span>
                              )}
                            </div>
                          </div>

                          {/* Right Section: Session Details */}
                          <div className="flex flex-col gap-2 flex-1">
                            {/* Topic Name Badge */}
                            {date.topicname || date.topicName ? (
                              <span className="text-xs font-bold text-orange-700 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-orange-200 w-fit truncate max-w-[200px]">
                                {date.topicname || date.topicName}
                              </span>
                            ) : null}

                            {/* Date and Time Info */}
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-row gap-2">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className={`text-sm font-semibold ${date.selected ? "text-orange-700" : "text-blue-600"}`}>{date.day}</p>
                                </div>
                                <p className="text-gray-700 font-medium text-sm">, {date.date}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-bold text-orange-600">{`${date.startTime}-${date.endTime}`}</p>
                              </div>
                            </div>

                            {/* Price Badge */}
                            <div className="mt-auto">
                              <span className="bg-white/90 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm border border-orange-200 flex items-center gap-1">
                                ₹{date.price}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex">
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">price: {price}</span>
                  </div>
                </div>

                {/* Partner Specific Section - Buy Session */}
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                  <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                    Buy Session for Community
                  </p>
                  
                  <div className="flex flex-col gap-4">
                    <label htmlFor='category' className='label'>
                      <span className='label__text'>Select Community</span>
                      <select
                        className='select'
                        name='community'
                        onChange={handleChange}
                        value={selectedCommunity}
                      >
                        <option value="">Select a community</option>
                        {allCommunities?.map((item, index) => (
                          <option value={item.id} key={`community-${index}`}>{item.title}</option>
                        ))}
                      </select>
                    </label>
                    
                    <label htmlFor='participants' className='label'>
                      <span className='label__text'>Number of participants</span>
                      <input
                        type='number'
                        id='participants'
                        name='participants'
                        className='input'
                        required
                        value={participantLimit}
                        onChange={(e) => setParticipantLimit(e.target.value)}
                      />
                    </label>
                    
                    {selectedSession.SessionSlot[0]?.isOnline && (
                      <button 
                        className={`relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow focus:ring-2 focus:ring-orange-300 ${price > 0 ? '' : 'cursor-not-allowed bg-gray-400'}`} 
                        onClick={handleBuySession}
                        disabled={price === 0}
                      >
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                        <span className="relative z-10">Buy Session</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Coupons Section */}
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                  <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                    Coupons
                  </p>
                  {!selectedSession?.CouponCode || selectedSession.CouponCode.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Coupons Yet</h3>
                      <p className="text-gray-500 max-w-sm">
                        Create coupons to offer special discounts for your session.
                      </p>
                      <button
                        className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200"
                        onClick={handleAddCoupon}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create Coupon
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedSession.CouponCode.map((item, index) => (
                        <Coupon
                          couponCard={item}
                          key={`coupon-${index + 1}`}
                          editcb={() => handleEditCoupon(item)}
                          deletecb={() => handleDeleteCoupon(item)}
                        />
                      ))}
                      <button
                        className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white w-32 m-4 flex items-center justify-center h-12 rounded-xl font-medium shadow focus:ring-2 focus:ring-orange-300"
                        onClick={handleAddCoupon}
                      >
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                        {!visible ? "+ Coupon" : <BsFillArrowUpCircleFill />}
                      </button>
                    </div>
                  )}
                  {visible && (
                    <div className="">
                      <CreateCouponForm
                        name={selectedSession?.title}
                        sessionId={selectedSession?.id}
                        cb={handleCouponCreate}
                        preObj={couponObj}
                      />
                    </div>
                  )}
                </div>
                {/* Speaker Requests Section */}
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
                  <p className="text-lg font-bold flex items-center gap-2 text-orange-700">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
                    Speaker Requests
                  </p>
                  {!selectedSession?.speakerRequests || selectedSession.speakerRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Speaker Requests</h3>
                      <p className="text-gray-500 max-w-sm">
                        Speaker requests will appear here when experts express interest in your session.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-row flex-wrap gap-4 py-4">
                      {selectedSession.speakerRequests.map((item, index) => (
                        <div
                          className={`flex flex-col gap-1 max-w-[350px] items-center p-3 border rounded-xl bg-orange-50 hover:bg-orange-100 transition`}
                          key={index}
                        >
                          <p className={`text-sm font-semibold text-orange-500`}>{item.name}</p>
                          <p className="text-sm font-bold">{item.email}</p>
                          <p className="text-sm font-bold">{item.phone}</p>
                          <p>{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
            <button onClick={() => setShowDeleteModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold">&times;</button>
            <h2 className="text-xl font-bold text-orange-700">Delete Session</h2>
            <p className="text-gray-700">To confirm deletion, please type the session name below:</p>
            <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded font-semibold text-center select-all cursor-pointer" onClick={() => navigator.clipboard.writeText(selectedSession.title)}>
              {selectedSession.title}
            </div>
            <input
              type="text"
              className="border border-orange-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
              placeholder="Type session name to confirm..."
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setShowDeleteModal(false)}
                disabled={loadingDelete}
              >
                Cancel
              </button>
              <button
                className={`relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300 ${loadingDelete || deleteInput !== selectedSession.title ? 'cursor-not-allowed opacity-60' : ''}`}
                onClick={confirmDeleteSession}
                disabled={loadingDelete || deleteInput !== selectedSession.title}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center z-10">
                  {loadingDelete ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SessionPagePartner;
