import CategoryCardList from "../../components/categoryCardList";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import { useRouter } from "next/router";
import RecordedCardList from "@/components/programCard";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  selectAllCommunities,
  setCommunities,
} from "@/store/features/communitySlice";
import CommunityCard from "@/components/communityCard";
import { selectAllSessions, setSessions } from "@/store/features/sessionSlice";
import ClassCard from "@/components/classCard";
import ErrorFiller from "@/components/UI/ErrorFiller";

const BrowseByCategory = () => {
  const router = useRouter();

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="heading1">Browse By Category</h1>
        <button
          onClick={() => router.push("/allSessions")}
          className="square-blue-border-button"
        >
          Show All
        </button>
      </div>
      <CategoryCardList isLive={false} />
    </div>
  );
};

const LiveClasses = () => {
  const router = useRouter();

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="heading1">
          <span className="text-orange-500">LIVE</span> Classes
        </h1>
        <button
          onClick={() => router.push("/allSessions/liveClasses")}
          className="square-blue-border-button"
        >
          Show All
        </button>
      </div>
      <CategoryCardList isLive={true} />
    </div>
  );
};

const Communities = () => {
  const communities = useSelector(selectAllCommunities);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setCommunities({ skip: 0, take: 1000 }));
  }, []);

  return (
    <div className="container">
      <div className="flex md:items-center justify-between mb-5 flex-col md:flex-row gap-y-4">
        <h1 className="heading1">Communities</h1>{" "}
      </div>
      <div className="relative">
        <div
          id="innerContId"
          className="overflow-x-auto justify-start flex gap-[20px] w-full pb-5"
        >
          {communities?.length > 0 ? (
            communities?.map((item, index) => (
              <CommunityCard details={item} key={index} />
            ))
          ) : (
            <ErrorFiller>
              Oops!! No communities available, please come back later!!
            </ErrorFiller>
          )}
        </div>
      </div>
    </div>
  );
};

const VideoOnDemand = () => {
  const router = useRouter();

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="heading1">
          <span className="text-orange-500">Video</span> on Demand
        </h1>
        <button
          onClick={() => router.push("/allSessions/videos")}
          className="square-blue-border-button"
        >
          Show All
        </button>
      </div>
      <RecordedCardList isLive={true} />
    </div>
  );
};

const Courses = () => {
  const router = useRouter();

  const sessions = useSelector(selectAllSessions)?.filter((item) => {
    return item.isExclusive === false && item.isCourse == true;
  });

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setSessions());
  }, []);

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="heading1">Courses</h1>
        {/* <button
          onClick={() => router.push("/allSessions")}
          className="square-blue-border-button"
        >
          Show All
        </button> */}
      </div>
      <div className="flex flex-wrap justify-start mt-[40px] gap-[30px]">
        {sessions.length > 0 ? (
          sessions?.map((item, index) => (
            <ClassCard details={item} key={index} />
          ))
        ) : (
          <ErrorFiller>
            {" "}
            Oops!! No classes available, please come back later!!
          </ErrorFiller>
        )}
      </div>
    </div>
  );
};

const BrowseClasses = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Community Details</title>
      </Head>
      <header>
        <Topbar />
      </header>
      <main className="overflow-x-hidden flex flex-col gap-y-[75px] mt-20 pb-40">
        <LiveClasses />
        <BrowseByCategory />
        <Communities />
        <Courses />
        <VideoOnDemand />
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  );
};

export default BrowseClasses;
