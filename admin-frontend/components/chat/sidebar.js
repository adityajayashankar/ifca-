import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { AiOutlineArrowRight, AiOutlineArrowDown } from "react-icons/ai";
import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";
// components
import Modal from "@/components/common/Modal";
import api from "@/utils/apiSetup";

// utils
import { emailTest } from "@/utils/regexTest";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { selectCommunity } from "@/store/features/communitySlice";
import { useRouter } from "next/router";

const SidebarComponent = ({
  channels = {},
  active,
  activeName,
  setActive,
  setActiveName,
  setActiveChannelId,
  activeUsers,
  dms,
  setDms,
  setActiveUsers,
  style,
  user,
  open,
  setOpen,
  disconnect,
}) => {
  const userC = useSelector(selectUser);
  const community = useSelector(selectCommunity);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userInput, setUserInput] = useState(""); //this state is for collecting username for dm
  const [results, setResults] = useState([]);
  function addUser() {
    if (emailTest(userInput)) {
      api.get(`/community/${community.id}/people`).then((res) => {
        console.log(res.data);
        setResults(res.data?.users);
      });
    } else {
      toast.warn("Enter Valid Email ID", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setResults([]);
    }
  }

  function newDm(user) {
    let { ...dm } = user;
    if (dm?.subscriptionId) {
      api
        .post(`/channel/userchannels/${dm.subscriptionId}`, {
          communityId: community.id,
        })
        .then((res) => {
          console.log(res.data);
          let obj = res.data.channel;
          obj.channel = dm;
          setDms((prev) => [...prev, obj]);
        });
      setUserInput("");
      setShowUserModal(false);
    }
  }
  const router = useRouter();
  const handleRouteBack = (e) => {
    e.preventDefault();
    router.push(`/expert/community/${community?.id}`);
  };
  return (
    <div className={"sidebar-container " + style ? style : ""}>
      <div
        className={`space-y-3 border-r border-solid border-white text-white md:block ${
          open ? "w-[260px] p-3 absolute z-10 md:relative md:z-0" : "w-[0px]"
        } min-h-screen duration-300  bg-[#0C74D4] shadow-2xl h-screen`}
      >
        <div className="wrapper flex">
          {open && (
            <div className="flex relative p-0 w-full border-b">
              <div className="profile-img pl-1 my-auto w-10 h-10 rounded-full ">
                <picture>
                  <source srcSet={userC["photoURL"]} type="image/webp" />
                  <img className="" src={community?.bannerImg} alt="" />
                </picture>
              </div>

              <h1
                className="my-auto font-bold uppercase text-xl ml-2 cursor-pointer"
                onClick={handleRouteBack}
              >
                {open && community?.title}
              </h1>
              {
                <IoIosArrowDropleft
                  className="cursor-pointer absolute right-0 my-auto mr-1 ml-3 h-8 w-8 md:hidden text-[#fff] rounded-full shadow-2xl"
                  onClick={() => setOpen(!open)}
                />
              }
            </div>
          )}
        </div>
        {open && (
          <div className="flex-1">
            <div className="flex relative items-stretch">
              {open && (
                <div className="flex">
                  <div
                    onClick={() => {
                      setActive((prev) => !prev);
                    }}
                    className="my-auto p-1 hover:bg-slate-600 rounded-lg hover:cursor-pointer"
                  >
                    {" "}
                    {active ? (
                      <AiOutlineArrowDown />
                    ) : (
                      <AiOutlineArrowRight />
                    )}{" "}
                  </div>
                  <div
                    onClick={() => {
                      setActive((prev) => !prev);
                    }}
                    className=" rounded-lg my-auto p-2 cursor-pointer"
                  >
                    Channels
                  </div>
                </div>
              )}

              {/* <div className="m-auto mt-1 bg-slate-600 absolute right-0 rounded-lg text-xl  px-2 hover:cursor-pointer" title="Create Channel">+</div> */}
            </div>

            {channels &&
              channels?.map(
                (channel, index) =>
                  active &&
                  open && (
                    <div
                      id={index}
                      key={index}
                      className={`rounded-xl pl-1 hover:cursor-pointer hover:bg-slate-500 ${
                        activeName?.id === channel?.id
                          ? "bg-white text-black hover:bg-sky-500"
                          : ""
                      }`}
                    >
                      <p
                        onClick={() => {
                          disconnect();
                          setActiveName(channel);
                          setActiveChannelId(parseInt(channel.id));
                        }}
                        className={`flex mx-auto font-bold text-base items-center p-1 rounded-md`}
                      >
                        # {channel?.name}
                      </p>
                    </div>
                  )
              )}

            {/* <div className="flex relative items-stretch">
              {open && (
                <div className="flex">
                  <div
                    onClick={() => {
                      setActiveUsers((prev) => !prev);
                    }}
                    className="my-auto p-1 hover:bg-slate-600 rounded-lg hover:cursor-pointer"
                  >
                    {activeUsers ? (
                      <AiOutlineArrowDown />
                    ) : (
                      <AiOutlineArrowRight />
                    )}
                  </div>
                  <div
                    onClick={() => {
                      setActiveUsers((prev) => !prev);
                    }}
                    className="rounded-lg my-auto p-2 cursor-pointer"
                  >
                    Direct Messages
                  </div>
                </div>
              )}
              <div
                className="m-auto mt-1 bg-slate-600 absolute right-0 rounded-lg text-xl  px-2 hover:cursor-pointer"
                title="New message"
                onClick={() => setShowUserModal(true)}
              >
                +
              </div>
            </div> */}
            {/* {dms &&
              dms?.map(
                (dm, index) =>
                  activeUsers && (
                    <div
                      id={index}
                      key={index + 1}
                      className={`ease-in-out mt-1 rounded-xl hover:cursor-pointer hover:bg-slate-500 ${
                        activeName.id === dm.channelId
                          ? "bg-sky-500 text-white hover:bg-sky-500"
                          : ""
                      }`}
                    >
                      <div
                        className="flex flex-row "
                        onClick={(e) => {
                          setActiveName(dm.channel);
                          console.log(dm);
                          console.log(activeName);
                          setActiveChannelId(parseInt(dm.channel.id));
                        }}
                      >
                        <picture className="pl-1 ml-1 profile-img w-10 h-10">
                          <source
                            srcSet={dm.channel["photoURL"]}
                            type="image/webp"
                          />
                          <img
                            src={dm.channel["photoURL"]}
                            alt="Sender image"
                          />
                        </picture>
                        <div className="font-bold my-auto">
                          {" "}
                          {dm.channel["name"]}{" "}
                        </div>
                      </div>
                    </div>
                  )
              )} */}
            {showUserModal && (
              <Modal
                title={"Select user"}
                showModal={showUserModal}
                setShowModal={setShowUserModal}
              >
                <div className="container flex justify-center items-center">
                  <div className="relative">
                    {/* <div className="absolute top-4 left-3">
                                            <i className="fa fa-search text-gray-900 z-20 hover:text-gray-500"></i>
                                        </div> */}
                    <input
                      type="email"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="h-14 text-black w-96 pl-10 pr-20 shadow rounded-lg z-0 focus:shadow focus:outline-none"
                      placeholder="Enter user email Id.."
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        className="h-10 w-20 text-white rounded-lg bg-red-500 hover:bg-red-600"
                        onClick={addUser}
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>
                {results?.length != 0 ? (
                  results.map((result, index) => (
                    <div
                      key={index}
                      className="flex cursor-pointer shadow hover:shadow-md rounded-sm my-3"
                      onClick={() => newDm(result)}
                    >
                      <div className="p-1 m-1 profile-img w-10 h-10">
                        <picture>
                          <source
                            srcSet={result["photoURL"]}
                            type="image/webp"
                          />
                          <img src={result["photoURL"]} alt="User image" />
                        </picture>
                      </div>
                      <div className="my-auto font-bold text-black">
                        {" "}
                        {result["name"]}{" "}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mx-auto text-red-600 text-center mt-2">
                    NO USER FOUND !!!
                  </div>
                )}
              </Modal>
            )}
            {/* <div className="flex relative items-stretch">
                            {open && <div className="flex">
                                <div onClick={() => { setActiveUsers((prev) => (!prev)) }} className="my-auto p-1 hover:bg-slate-600 rounded-lg hover:cursor-pointer">{activeUsers ? <AiOutlineArrowDown /> : <AiOutlineArrowRight />}</div>
                                <div onClick={() => { setActiveUsers((prev) => (!prev)) }} className="rounded-lg my-auto p-2 cursor-pointer">
                                    Users
                                </div>
                            </div>}
                            <div className="m-auto mt-1 bg-slate-600 absolute right-0 rounded-lg text-xl  px-2 hover:cursor-pointer"
                                title="New message"
                                onClick={() => setShowUserModal(true)}
                            >
                                +
                            </div>
                        </div> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarComponent;
