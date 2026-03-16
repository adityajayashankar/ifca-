import ScheduleIcon from "@mui/icons-material/Schedule";
import moment from "moment";
import Link from "next/link";
import ReactPlayer from "react-player";

const CourseCard = ({ key, idx, details, isUser, isCourse }) => {
  console.log("deatils", details);
  const timeInt =
    (new Date(details.endTime).getTime() -
      new Date(details.startTime).getTime()) /
    (1000 * 60);

  return (
    <div className="flex items-center justify-between bg-white rounded-lg relative overflow-hidden ring-[1px] ring-gray-200 max-w-[650px]">
      <div className="flex gap-[20px]">
        <ReactPlayer
          url={
            details?.videoUrl !== "" ? details?.videoUrl : "/sample.mp4"
          }
          controls={true}
          width="220px"
          height="full"
        />
        <div className="flex flex-col justify-between h-full py-5">
          <div className="h-[110px] flex flex-col justify-between">
            <h2 className="text-[#333] mb-0 mt-0 text-2xl font-bold">
              {details.topicName === ""
                ? `Class ${idx + 1}`
                : details.topicName}
            </h2>
            {/* <p className="mt-[5px] text-[#444] font-[400]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.{" "}
            </p> */}
            {details.isLive ? (
              <span className="text-red-500 font-bold text-[18px] flex items-center gap-x-[4px] mr-10">
                LIVE
              </span>
            ) : (
              <span className="text-red-500 font-bold text-[18px] flex items-center gap-x-[4px] mr-10">
                Recorded
              </span>
            )}
          </div>
        </div>
      </div>
      {!details.isLive && (
        <div className="flex h-[150px] flex-col justify-between p-5">
          <p className="">
            {details.discount ? (
              <span className="text-orange-500 font-bold">
                &#8377;{details.price - details.discount}{" "}
                <span className="font-[400] text-[#A0A0A0] line-through">
                  &#8377;{details.price}
                </span>
              </span>
            ) : details.price === 0 ? (
              <span className="text-orange-500 font-bold">FREE</span>
            ) : (
              <span className="text-orange-500 font-bold">
                &#8377; {details.price}
              </span>
            )}
          </p>
          <a
            target="_blank"
            disabled={!isUser && details.price > 0}
            href={`/playVideo/${details.id}`}
          >
            <button
              className={`${
                !isUser && details.price > 0
                  ? "bg-gray-300 text-gray-600"
                  : "text-orange-500"
              } border-[1px]  rounded-lg py-[20px] px-[10px]  bg-transparent font-semibold text-[14px]`}
            >
              {details.price === 0 ? "Watch Free" : "Pay & Watch"}
            </button>
          </a>
        </div>
      )}
    </div>
  );
};

export default CourseCard;
