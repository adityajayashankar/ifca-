import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
// import { NextSeo } from 'next-seo';
import Card from "@/components/common/Card";
import CategoryCard from "@/components/community/categorycard";
import {
  selectExpert,
  selectExpertCommunities,
  selectExpertSessions,
  setAllExperts,
} from "@/store/features/expert";
import { useRouter } from "next/router";
import { useEffect } from "react";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";

function ExpertPage() {
  const dispatch = useDispatch();
  const selectedExpert = useSelector(selectExpert);
  const expertSessions = useSelector(selectExpertSessions);
  const expertCommunities = useSelector(selectExpertCommunities);

  const router = useRouter();
  const handleEditExpert = (e) => {
    e.preventDefault();
    router.push(`/partner/expert/add/${selectedExpert?.id}`);
  };
  const handleDeleteExpert = (e) => {
    let ans = prompt(
      "Sure You wanna delete community? Type YES in caps to confirm. This action is irreversible."
    );
    if (ans === "YES") {
      api.delete(`/expert/${selectedExpert?.id}`).then((res) => {
        if (res.data) {
          toast("Expert Deleted");
          dispatch(setAllExperts());
          router.replace(`/partner/expert`);
        }
      });
    }
  };

  return (
    <>
      {/* <NextSeo
            title="Expert | Aluminaries"
            description="Expert details"
        /> */}
      <div className="min-h-screen max-w-7xl mx-auto py-20 px-4 lg:px-0">
        <div className="flex flex-col lg:flex-row gap-16">
          <section className="flex flex-col gap-8 p-2 flex-0.5">
            <div className="block">
              <img
                src={selectedExpert?.photoURL || "/assets/images/yoga.jpg"}
                width={300}
                height={300}
                layout="responsive"
                className="rounded-lg shadow-xl"
              />
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="text-step-2 font-semibold max-w-[30ch]">
                {selectedExpert?.name}
              </h1>
            </div>
            <button className="btn btn-pink" onClick={handleEditExpert}>
              Edit Expert
            </button>
            <button className="btn btn-red" onClick={handleDeleteExpert}>
              Delete Expert
            </button>
          </section>
          <section className="flex flex-col gap-8 p-2 flex-1">
            <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 before:bg-blue-400">
              About
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-step-0">{selectedExpert?.desc}</p>
            </div>
            <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 before:bg-blue-400">
              Sessions
            </p>

            <div className="px-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {expertSessions?.map((session, index) => (
                <Card
                  session={session}
                  key={`expert-sess-${index}`}
                  baseURL={"admin"}
                  view
                />
              ))}
              {(!expertSessions || expertSessions.length === 0) && (
                <div className="justify-center">
                  <h1 className="text-center font-light text-step-1">
                    No sessions yet :/
                  </h1>
                </div>
              )}
            </div>
            <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 before:bg-blue-400">
              Communities
            </p>
            <div className="flex flex-col gap-2">
              {expertCommunities?.map((community, index) => (
                <CategoryCard
                  category={community}
                  key={`expert-comm-${index}`}
                  baseURL={"admin"}
                />
              ))}
              {(!expertCommunities || expertCommunities.length === 0) && (
                <div className="justify-center">
                  <h1 className="text-center font-light text-step-1">
                    Seems like they are a new expert
                  </h1>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default ExpertPage;
