import BreadCrumps from "@components/Common/BreadCrumps";
import ActiveCompetions from "./micro/activeCompetitions";
import PastCompetions from "./micro/PastCompetitions";
import AddEvaluatorModal from "./micro/addEvaluator";
import { useState } from "react";

const IncubatorCompetitionDashboard = () => {
  const [showPastCompetitions, setShowPastCompetitions] = useState(false);

  const togglePastCompetitions = () => {
    setShowPastCompetitions(!showPastCompetitions);
  };
  const crumps = [
    {
      name: "Dashboard",
      link: "/myIncubator",
    },
    {
      name: "Competitions",
      link: "/myIncubator/competitions",
    },
  ];
  return (
    <>
      <BreadCrumps crumbs={crumps} />
      <div className="  cust_sm:px-4 flex flex-row gap-4">
        <div className=" w-full  rounded">
          <div className="flex flex-row flex-wrap items-center justify-between gap-4 border-b-2 pb-3">
            <p className="text-headingColor text-2xl font-semibold">
              Competitions
            </p>
            <div className="flex flex-row items-center justify-end  gap-3">
              <a
                href="/myIncubator/competitions/new"
                className=" border-actionbtnBlue bg-actionbtnBlue cursor-pointer rounded border px-4  py-2 text-sm font-semibold text-white hover:shadow"
              >
                New Competition
              </a>
              <button
                onClick={togglePastCompetitions}
                className="border-actionbtnBlue bg-actionbtnBlue cursor-pointer rounded border px-4  py-2 text-sm font-semibold text-white hover:shadow"
              >
                {showPastCompetitions
                  ? "Hide Past Competitions"
                  : "Past Competitions"}
              </button>
              <AddEvaluatorModal />
            </div>
          </div>

          <div>
            <ActiveCompetions owner={true} />
          </div>
          {showPastCompetitions && (
            <div>
              <PastCompetions owner={true} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default IncubatorCompetitionDashboard;
