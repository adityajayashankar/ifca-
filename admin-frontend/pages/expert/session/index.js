import Card from "@/components/common/Card";
import { useRouter } from "next/router";
import api from "@/utils/apiSetup";
// import { Protected } from '@/utils/authHOC';
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { allSessions, setAllSessions } from "@/store/features/session";
import {
  selectExpertCompletedSessions,
  selectExpertSessions,
  setExpertSessions,
} from "@/store/features/expert";
import { selectUser } from "@/store/features/userSlice";
import { toast } from "react-toastify";

function Session(props) {
  // const [sessions, setSessions] = useState([]);
  const sessions = useSelector(selectExpertSessions);
  const completesSessions = useSelector(selectExpertCompletedSessions);
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [modalOpen, setModalOpen] = useState(false);

  const titleRef = useRef();
  const descRef = useRef();

  useEffect(() => {
    if (user) {
      dispatch(setExpertSessions(user.id));
    }
  }, []);

  const handleSubmitRecommendation = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!titleRef.current.value || !descRef.current.value) {
      toast.error("Both fields are mandatory");
      return false;
    }
    try {
      await api.post("/recommendation", {
        recommendedTitle: titleRef.current.value,
        recommendedDesc: descRef.current.value,
        expertId: user.id,
      });
      toast.success("Your recommendation was sent successfully");
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response.data.message);
    }
  };

  return (
    <div className="min-h-screen w-full px-[10px]">
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed w-screen h-screen bg-black/50 top-0 left-0 z-[999] flex items-center justify-center"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col bg-white p-5 rounded-xl"
            onSubmit={handleSubmitRecommendation}
          >
            <h1 className="text-blue-300">Recommend Session Form</h1>
            <label className="my-5">Title</label>
            <input
              ref={titleRef}
              type="text"
              className="border-2 border-gray-200 rounded-xl p-2"
            />
            <label className="my-5">Description</label>
            <input
              ref={descRef}
              type="text"
              className="border-2 border-gray-200 rounded-xl p-2"
            />
            <button
              type="submit"
              className="my-5 bg-blue-300 text-white py-2 px-4 rounded-xl"
            >
              Submit Recommendation
            </button>
          </form>
        </div>
      )}
      <section className="text-center py-10 max-w-7xl mx-auto">
        <div className="input__group__header">
          <h2>My sessions</h2>
          <div className="flex gap-5">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-blue-300 p-2 rounded-xl hover:scale-125 transition-transform text-white"
            >
              Recommend a Session
            </button>
            <button
              onClick={() => router.push("/expert/myRecommendations")}
              className="bg-blue-300 p-2 rounded-xl hover:scale-125 transition-transform text-white"
            >
              My Recommendations
            </button>
            {/* <button
              onClick={() => router.push("/allSessions")}
              className="bg-blue-300 p-2 rounded-xl hover:scale-125 transition-transform text-white"
            >
              View all Sessions
            </button> */}
          </div>
        </div>

        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto gap-6 my-10 py-10 max-w-7xl">
          {sessions?.map((session, index) => {
            return (
              <Card
                session={session}
                key={"session-" + index}
                view={true}
                baseURL={"expert"}
              />
            );
          })}
          {!sessions && <div>No Active sessions yet</div>}
        </div>
      </section>
      <section className="text-center py-10 max-w-7xl mx-auto">
        <div className="input__group__header">
          <h2>Completed sessions</h2>
        </div>

        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto gap-6 my-10 py-10 max-w-7xl">
          {completesSessions?.map((session, index) => {
            return (
              <Card
                session={session}
                key={"session-" + index}
                view={false}
                baseURL={"expert"}
              />
            );
          })}
          {!sessions && <div>No sessions completed yet</div>}
        </div>
      </section>
    </div>
  );
}

export default Session;
