import Layout from "@/components/layout";
import Head from "next/head";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EventSchedule from "@/components/eventSchedule";
import ClassSchedule from "@/components/classSchedule";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import LinkIcon from "@mui/icons-material/Link";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import ImportContactsOutlinedIcon from "@mui/icons-material/ImportContactsOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import VideoCom from "@/components/videoCom";
import { useState } from "react";
import ComHeading from "@/components/comHeading";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import {
  resources,
  selectCommunity,
  selectCommunitySessions,
  selectCommunityUsers,
  setCommunityById,
  setCommunitySessions,
  setCommunityUsers,
  setResources,
} from "@/store/features/communitySlice";
import { useSelector } from "react-redux";
import moment from "moment";
import { useRouter } from "next/router";
import companyData from "@/utils/data";
import ClassCard from "@/components/classCard";
import { selectCommunityPosts } from "@/store/features/postsSlice";
import {
  selectUser,
  selectUserCommunities,
  setUserCommunities,
} from "@/store/features/userSlice";
import { selectAllVideos, setAllVideos } from "@/store/features/videoSlice";
import { useLayoutEffect } from "react";

const comHome = () => {
  const [selectedLink, setSelectedLink] = useState(1);
  const comId = parseInt(window.location.pathname.split("/")[3]);
  const user = useSelector(selectUser);
  const users = useSelector(selectCommunityUsers);

  const allVideos = useSelector(selectAllVideos);

  const router = useRouter();

  useEffect(() => {
    user && dispatch(setUserCommunities(user?.id));
  }, [user]);

  const userCommunitiesIds = useSelector(selectUserCommunities)?.map((item) => {
    return item.id;
  });

  useEffect(() => {
    user == null && router.push("/onBoard");
  }, [router]);

  const dispatch = useDispatch();
  const posts = useSelector(selectCommunityPosts);
  const currentCommunity = useSelector(selectCommunity);

  useLayoutEffect(() => {
    dispatch(setCommunityById(comId));
    dispatch(setCommunityUsers(comId));
    dispatch(setCommunitySessions(comId));
    dispatch(setResources(comId));
  }, [ comId]);

  useEffect(() => {
    dispatch(setAllVideos());
  }, []);

  const communitySessions = useSelector(selectCommunitySessions);

  const currentCommunityUsers = useSelector(selectCommunityUsers);

  const currResources = useSelector(resources);

  const expertDetails = currentCommunityUsers.filter((item) => {
    return item.expertId !== null;
  })[0];

  function handleClick() {
    router.push("/room/" + communitySessions[0]?.roomId);
  }

  return (
    <>
      <Head>
        <title>Class Details</title>
      </Head>
      <Layout>
        <div className="py-6">
          <ComHeading />
          <div className="mt-10">
            <div className="flex items-center gap-4 mb-5">
              <button
                className={`${
                  selectedLink === 1
                    ? "bg-white rounded-[10px] py-[6px] px-[10px] sm:py-[10px] sm:px-[15px] text-sm font-medium text-orange-500 border-2 border-solid  cursor-pointer"
                    : "bg-white rounded-[10px] hover:bg-gray-300 border-0 py-[6px] px-[10px] sm:py-[10px] sm:px-[15px] text-sm font-medium text-gray-500 cursor-pointer"
                }`}
                onClick={() => setSelectedLink(1)}
              >
                Updates
              </button>
              <button
                className={
                  selectedLink === 2
                    ? "bg-white rounded-[10px] py-[6px] px-[10px] sm:py-[10px] sm:px-[15px] text-sm font-medium text-orange-500 border-2 border-solid  cursor-pointer"
                    : "bg-white rounded-[10px] hover:bg-gray-300 border-0 py-[6px] px-[10px] sm:py-[10px] sm:px-[15px] text-sm font-medium text-gray-500 cursor-pointer"
                }
                onClick={() => setSelectedLink(2)}
              >
                Sessions
              </button>
              <button
                className={
                  selectedLink === 3
                    ? "bg-white rounded-[10px] py-[6px] px-[10px] sm:py-[10px] sm:px-[15px] text-sm font-medium text-orange-500 border-2 border-solid  cursor-pointer"
                    : "bg-white rounded-[10px] hover:bg-gray-300 border-0 py-[6px] px-[10px] sm:py-[10px] sm:px-[15px] text-sm font-medium text-gray-500 cursor-pointer"
                }
                onClick={() => setSelectedLink(3)}
              >
                Resources
              </button>
            </div>
            <div>
              {selectedLink === 1 && (
                <>
                  <div className="mt-5 bg-white p-5 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center gap-5">
                      <img
                        className="w-[50px] h-[50px] rounded-full"
                        src={currentCommunity?.bannerImg || "/comPic.svg"}
                        alt=""
                      />
                      <h3>{currentCommunity?.welcomeMsg}</h3>
                    </div>
                    {/* <div className="flex gap-5">
                      <p className="mx-1 leading-normal">
                        {currentCommunity?.desc}
                      </p>
                    </div> */}
                  </div>
                  <div className="mt-10">
                    <h4 className="text-2xl text-[#444]">Events</h4>
                    <div className="flex items-center justify-between bg-white rounded-2xl p-5 w-full mb-5">
                      <div className="flex items-center gap-[10px] w-full text-orange-500">
                        <InfoOutlinedIcon />
                        {communitySessions.length > 0 ? (
                          <div className="w-full flex justify-between">
                            <div>
                              <p className="font-medium text-2xl">
                                {
                                  communitySessions[0]?.SessionSlot[0]
                                    ?.topicName
                                }
                              </p>
                              <p>
                                Starting{" "}
                                {moment(
                                  communitySessions[0]?.SessionSlot[0].startTime
                                ).fromNow()}
                              </p>
                            </div>
                            <button
                              className="border-0 gradient_background py-2 px-8 rounded-lg text-white font-medium text-base"
                              onClick={() => handleClick()}
                            >
                              Join Class
                            </button>
                          </div>
                        ) : (
                          <div>No Slots Available</div>
                        )}
                      </div>
                    </div>
                    <EventSchedule />
                  </div>
                </>
              )}
              <div className="mt-5">
                {/* {selectedLink === 3 && (
                  <div>
                    <div className="first:text-orange-500">
                      {communitySessions?.SessionSlot ? (
                        <div>
                          <InfoOutlinedIcon />
                          <p className="m-1 text-lg font-semibold">
                            Tabla Lesson 1
                          </p>
                          <p className="m-1">
                            Starting{" "}
                            {moment(
                              communitySessions?.SessionSlot[0].startTime
                            ).fromNow()}
                          </p>
                          <button className="border-0 gradient_background py-4 px-7 rounded-lg text-white font-medium text-base">
                            Join Class
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center lg:w-3/4">
                          No Slots Available
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col font-medium text-gray-500 gap-2"></div>
                  </div>
                )} */}
                {selectedLink === 2 && (
                  <>
                    <div className="flex flex-wrap justify-start mt-[40px] gap-[30px]">
                      {communitySessions.length > 0 ? (
                        communitySessions?.map((item, index) => (
                          <ClassCard details={item} key={index} />
                        ))
                      ) : (
                        <div className="border-[2px]  rounded-lg bg-[#EFEFEF] h-[324px] flex justify-center items-center text-[18px] text-[#ADADAD] font-semibold w-full">
                          No Sessions Available
                        </div>
                      )}
                    </div>
                  </>
                )}
                {selectedLink === 3 && (
                  <>
                    <div className="mt-5 w-full">
                      <p className="text-2xl font-bold mb-2">Resources</p>
                      {currResources?.map((item) => {
                        return (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-lg p-2 mb-2 mr-6 lg:mr-0">
                            <div className="flex items-start gap-3 w-full">
                              <div className="text-orange-500">
                                <LinkIcon />
                              </div>
                              <div>
                                <h4 className="m-[2px] mb-1 text-orange-500 text-lg">
                                  {item.name}
                                </h4>
                                <div className="w-32 md:w-44 lg:w-full truncate">
                                  <a
                                    href={`${item.link}`}
                                    className="text-gray-500 font-semibold"
                                    target="_blank"
                                  >
                                    {/* https://www.youtube.com/watch?v=kFDJ-zskFhk&ab_channel=Zelcus */}
                                    {item.link}
                                  </a>
                                </div>
                              </div>
                            </div>
                            {/* <div className="flex font-medium text-gray-500 gap-2 ml-6 mt-2 flex-row sm:flex-col">
                              <span>
                                <BookOutlinedIcon /> Session 12
                              </span>
                              <span>
                                <ImportContactsOutlinedIcon />
                                Rhythm
                              </span>
                            </div> */}
                          </div>
                        );
                      })}

                      {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-lg p-5 mb-5">
                        <div className="flex items-start gap-5  w-full sm:w-3/4">
                          <div className="text-orange-500">
                            <img src="/resourcePlay.svg" alt="" />
                          </div>
                          <div>
                            <h4 className="m-[2px] mb-1 text-orange-500 text-lg">
                              Resource Name
                            </h4>
                            <p className="m-0 text-gray-500 font-semibold">
                              2 mins - mp4 - 118kB
                            </p>
                            <button className="gradient_background border-0 text-white font-medium p-2 rounded-lg text-base mt-2">
                              Download
                            </button>
                          </div>
                        </div>
                        <div className="flex font-medium text-gray-500 gap-2 ml-10 mt-2 flex-row sm:flex-col">
                          <span className="flex items-center gap-2">
                            <BookOutlinedIcon /> Session 12
                          </span>
                          <span className="flex items-center gap-2">
                            <ImportContactsOutlinedIcon />
                            Rhythm
                          </span>
                        </div>
                      </div> */}
                      {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-lg p-5 mb-5">
                        <div className="flex items-start gap-5  w-full sm:w-3/4">
                          <div className="text-orange-500">
                            <InsertDriveFileOutlinedIcon />
                          </div>
                          <div>
                            <h4 className="m-[2px] mb-1 text-orange-500 text-lg">
                              Resource Name
                            </h4>
                            <p className="m-0 text-gray-500 font-semibold">
                              2 pages - PDF - 118kB
                            </p>
                            <button className="gradient_background border-0 text-white font-medium p-2 rounded-lg text-base mt-2">
                              Download
                            </button>
                          </div>
                        </div>
                        <div className="flex font-medium text-gray-500 gap-2 ml-10 mt-2 flex-row sm:flex-col">
                          <span className="flex items-center gap-2">
                            <BookOutlinedIcon /> Session 12
                          </span>
                          <span className="flex items-center gap-2">
                            <ImportContactsOutlinedIcon />
                            Rhythm
                          </span>
                        </div>
                      </div> */}
                      {/* <div className="lg:w-[125%] mt-20">
                        <h4 className="flex items-center gap-2">
                          <img src="/lessonLeft.svg" alt="" />
                          Video Material
                        </h4>
                        <div className="flex  flex-col md:flex-row center gap-5">
                          {allVideos.map((video, i) => (
                            <VideoCom details={video} key={i} />
                          ))}
                        </div>
                      </div> */}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default comHome;
