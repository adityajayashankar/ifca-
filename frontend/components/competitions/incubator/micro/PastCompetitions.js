import useStateStore from "@zustand/index";
import { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowOutward";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TurnedInIcon from "@mui/icons-material/TurnedIn";
import EditIcon from "@mui/icons-material/Edit";
function PastCompetions({ owner }) {
  const services = useStateStore((state) => state.services);
  const [pastcomps, setpastcomps] = useState([]);
  useEffect(() => {
    services.competition &&
      services.competition.getPastCompetitions().then((res) => {
        console.log(res);

        if (res.successObject) {
          setpastcomps(
            res.successObject.filter(
              (item) => new Date(item.application_ends_on) >= new Date()
            )
          );
        } else {
          // Handle the case where res.successObject is undefined or empty
          console.error("No competitions found.");
        }
      });
  }, [services]);
  return (
    <div className="py-4 flex flex-col gap-3">
      <p className="text-headingColor text-lg font-semibold">
        Past Competitions
      </p>
      <div className="grid grid-cols-4 md:grid-cols-2 ph:grid-cols-1 gap-3">
        {pastcomps.map((item) => {
          return (
            <div className="relative  border rounded-md hover:shadow flex flex-col p-3 bg-white  hover:scale-[102%] transition ease-in-out overflow-hidden">
              <div className="relative">
                <img
                  src={item.banner}
                  className="row-span-1 object-cover w-full h-44"
                />
                <p className=" absolute bottom-2 right-2 bg-white rounded text-[#6941C6]  p-1 font-semibold text-xs">
                  Deadline : {item.endDate.split("T")[0]}
                </p>
              </div>

              <div className=" py-2 flex flex-col gap-2 justify-evenly  grow row-span-2">
                <p className="text-xs font-semibold text-[#6941C6]">
                  Stages : {item.stages}
                </p>

                <a
                  target="__blank"
                  href={`/competitions/${item.competition_id}`}
                  className="flex flex-row justify-between font-semibold text-sm items-center "
                >
                  <span className="line-clamp-1">{item.title}</span>
                  <ArrowBackIcon className="text-[20px]" />
                </a>

                <p className="capitalize line-clamp-2 text-xs  text-gray-500">
                  {item.description}
                </p>

                <div className="">
                  <div className="flex flex-row gap-3 items-center overflow-x-scroll scrollbar-thin ">
                    {item.domains.map((item) => (
                      <span className="text-xs border whitespace-nowrap border-headingColor px-4 py-1 rounded-full">
                        {item.value}
                      </span>
                    ))}
                    {item.domains.map((item) => (
                      <span className="text-xs border whitespace-nowrap border-headingColor px-4 py-1 rounded-full">
                        {item.value}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row justify-end items-center gap-3">
                  {owner ? (
                    <>
                      <a
                        href={`/myIncubator/competitions/${item.competition_id}/edit`}
                        className="text-xs font-semibold text-headingColor border border-headingColor px-4 py-2 bg-white rounded flex items-center gap-1 hover:scale-[102%] transition ease-in-out "
                      >
                        <EditIcon fontSize="35px" />
                        Edit
                      </a>
                      <a
                        href={`/myIncubator/competitions/${item.competition_id}/submissions`}
                        className="text-xs font-semibold  border border-headingColor px-4 py-2 bg-actionbtnBlue rounded  text-white flex items-center gap-1 hover:scale-[102%] transition ease-in-out "
                      >
                        <TurnedInIcon fontSize="small" /> Submissions
                      </a>
                    </>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PastCompetions;
