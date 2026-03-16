import { errorToast } from "@helpers/toastconfig";
import useStateStore from "@zustand/index";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Table from "./micro/table";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BreadCrumps from "@components/Common/BreadCrumps";
function EvaulationResults() {
  const router = useRouter();
  const { id } = useRouter().query;
  const services = useStateStore((state) => state.services);
  const [data, setdata] = useState(null);
  const [activeStage, setactiveStage] = useState(0);
  const [rows, setrows] = useState([]);
  const [allsubmissions, setallsubmissions] = useState([]);
  const [columns, setcolumns] = useState([
    {
      id: "user",
      label: "User",
    },
    {
      id: "assignedTo",
      label: "Assigned To",
    },
    {
      id: "evaluatedby",
      label: "Evaluated By",
    },
  ]);
  useEffect(() => {
    services.competition &&
      services.competition.getEvaultionResultsforIncubator(id).then((res) => {
        console.log(res);
        if (res) {
          setdata(res.successObject);
          let assignedTo = [];
          assignedTo = res.successObject.competition.stages[
            activeStage
          ]?.evaluators.map((item) => {
            return item.label;
          });
          const evaluatedby = [];
          res.successObject.submissions.forEach((submission) => {
            let t = [];
            submission.evaluation.forEach((evaluation) => {
              if (
                res.successObject.competition.stages[activeStage]?.stage_id ===
                evaluation.stage_id
              ) {
                t.push(evaluation.evaluator);
              }
            });
            evaluatedby.push(t);
          });
          console.log("rb", evaluatedby);
          setrows(
            res.successObject.submissions.map((item, index) => ({
              ...item,
              evaluatedby: evaluatedby[index],
              assignedTo,
            })),
          );
          setallsubmissions(
            res.successObject.submissions.map((item, index) => ({
              ...item,
              evaluatedby: evaluatedby[index],
              assignedTo,
            })),
          );
        } else {
          setdata(false);

          errorToast("Error Fetching Data");
        }
      });
  }, [services, activeStage]);
  if (data === null) {
    return (
      <div className="my-4 h-[90%] rounded bg-white  p-12">
        <p className="text-center text-xl">Loading...</p>
        <div></div>
      </div>
    );
  }
  if (data === false) {
    return <div>Error</div>;
  }
  const crumbs = [
    { name: "Dashboard", link: "/myIncubator" },
    { name: "Competitions", link: "/myIncubator/competitions" },
    {
      name: `Submissions - ${data.competition.title}`,
      link: `#`,
    },
  ];
  return (
    <div className="cust_sm:px-4 min-h-[90%] rounded ">
      {/* add a goback button */}
      {/* <span
        onClick={() => {
          router.back();
        }}
        className="flex w-fit cursor-pointer items-center gap-3 rounded px-2 py-1 text-sm hover:bg-gray-100 "
      >
        <ArrowBackIcon fontSize="small" />{" "}
        <span className="font-semibold">Go Back</span>
      </span> */}
      <BreadCrumps crumbs={crumbs} />
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 pb-2">
        <div>
          <p className="text-3xl font-semibold">
            Evaluation Results - {data.competition.title}
          </p>
        </div>
      </div>
      <p className="text-headingColor py-2 text-2xl"></p>
      <div className="flex flex-row items-center gap-4 border-b-2 pb-2">
        {data.competition.stages.map((stage, index) => {
          if (index === 0) {
            return (
              <>
                <div
                  className={`cursor-pointer rounded px-6 py-2 transition ease-in-out hover:bg-gray-100 ${
                    activeStage === index ? "bg-gray-100" : ""
                  }`}
                  onClick={() => {
                    setactiveStage(index);
                    console.log(data.submissions);
                    setrows(
                      allsubmissions.filter(
                        (submission) =>
                          submission.responses.length >= index + 1,
                      ),
                    );
                  }}
                >
                  Application Round
                </div>
                <ArrowForwardIosIcon className="text-sm" />
              </>
            );
          }
          return (
            <>
              <div
                className={`cursor-pointer rounded px-6 py-2 transition ease-in-out hover:bg-gray-100 ${
                  activeStage === index ? "bg-gray-100" : ""
                }`}
                onClick={() => {
                  setactiveStage(index);
                  console.log(data.submissions);
                  setrows(
                    allsubmissions.filter(
                      (submission) => submission.responses.length >= index + 1,
                    ),
                  );
                }}
              >
                Stage-{index}
              </div>

              <ArrowForwardIosIcon className="text-sm" />
            </>
          );
        })}
        <div
          className={`cursor-pointer rounded px-6 py-2 transition ease-in-out hover:bg-gray-100 ${
            activeStage === data.competition.stages.length ? "bg-gray-100" : ""
          }`}
          onClick={() => {
            setactiveStage(data.competition.stages.length);
            console.log(allsubmissions);
            setrows(
              allsubmissions.filter(
                (submission) =>
                  submission.stage === data.competition.stages.length,
              ),
            );
          }}
        >
          Finalists
        </div>
      </div>
      {/* {JSON.stringify(data.submissions)} */}
      <Table rows={rows} columns={columns} competition={data.competition} />
    </div>
  );
}

export default EvaulationResults;
