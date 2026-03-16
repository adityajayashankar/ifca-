import Card1 from "@/components/common/card1";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import { setExpertSessions } from "@/store/features/expert";
import { selectAllCompletedSessions } from "@/store/features/session";
import {
  selectAllSessions,
  setAllSessions,
} from "@/store/features/sessionSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// import Paginator from "@/components/common/Paginator";

function SessionsHomePage(props) {
  // const [sessions, setSessions] = useState([]);
  const [sessions, setSession] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const router = useRouter();
  const user = useSelector(selectUser);
  const [sessionType, setSessionsType] = useState("your");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/session?userCreatorId=${user?.id}`);
        const { sessions, completedSessions } = response.data;
        setSession(sessions);
        setCompletedSessions(completedSessions);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching session data:", error);
      }
    };

    fetchData(); // Call the fetchData function
  }, [sessionType, user?.id]);

  // const handleFetchNext = ({ newTake, newSkip }) => {
  //   if (newSkip < totalSessions) {
  //     dispatch(setAllSessions({ take: newTake, skip: newSkip }));
  //     setSkip(newSkip);
  //     setTake(newTake);
  //   }
  // };
  // const handleTakeChange = (e) => {
  //   setTake(e.target.value);
  //   handleFetchNext({ newTake: e.target.value, newSkip: skip });
  // };
  return (
    <>
      <Head>
        <title>IFCA - Home</title>
      </Head>
      <header>
        <Topbar />
      </header>
      <main className="overflow-x-hidden mt-10 mb-40 flex flex-col gap-y-[75px]">
        <div className="min-h-screen w-full">
          <section className="text-center py-10 max-w-7xl mx-auto">
            <div className="input__group__header px-4">
              <h2>{sessionType === "your" ? "Your " : "All "}Session</h2>
              <div className="flex gap-5">
                <button
                  className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded mr-2 "
                  onClick={() => router.push("/session/create")}
                >
                  + Add Session
                </button>
                {/* {sessionType === "all"?<button
                  className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded mr-2 "
                  onClick={() => setSessionsType("your") }
                >
                  Your sessions
                </button>:<button
                  className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded mr-2 "
                  onClick={() => setSessionsType("all")}
                >
                  All sessions
                </button>} */}
              </div>
            </div>

            {/* <div className='my-4'>
                    <div className='flex text-md text-gray-400 items-center'>
                        <label>
                            <b>Show </b>
                        <select onChange={handleTakeChange}>
                            <option value={4}>4 sessions</option>
                            <option value={8}>8 sessions</option>
                        </select>
                        </label>

                        <HiArrowCircleLeft className={`text-2xl cursor-pointer ${skip!==0?'text-[#0C74D4]':'text-gray-400'}`} onClick={()=>handleFetchNext({newTake:take,newSkip:skip-take})}/>
                        <HiArrowCircleRight className={`text-2xl cursor-pointer ${skip+take<totalSessions?'text-[#0C74D4]':'text-gray-400'}`} onClick={()=>handleFetchNext({newTake:take,newSkip:skip+take})}/>
                        
                    </div>
                </div> */}

            <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto gap-6 my-10 py-10 max-w-7xl">
              {sessions?.map((session, index) => {
                return (
                  <Card1
                    session={session}
                    key={"session-" + index}
                    view={true}
                    edit={true}
                    baseURL={"admin"}
                  />
                );
              })}
              {(!sessions || sessions.length === 0) && (
                <div>No sessions to display</div>
              )}
            </div>
            <div className="input__group__header px-4">
              <h2>
                {sessionType === "your" ? "Your " : "All "}Completed Sessions
              </h2>
            </div>
            <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto gap-6 my-10 py-10 max-w-7xl">
              {completedSessions?.map((session, index) => {
                return (
                  <Card1
                    session={session}
                    key={"session-" + index}
                    view={true}
                    edit={true}
                    baseURL={"admin"}
                  />
                );
              })}
              {(!completedSessions || completedSessions.length === 0) && (
                <div>No sessions in grave yet </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  );
}

export default SessionsHomePage;
