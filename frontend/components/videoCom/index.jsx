import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CloseIcon from "@mui/icons-material/Close";

const VideoCom = ({ details }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handlePlayButtonClick = () => {
    setIsPlaying(true);
    dispatch(setSelectedVideo(allVideos[0])); // or pass the ID of the selected video
  };

  const handleVideoClose = () => {
    setIsPlaying(false);
  };

  return (
    <div className="rounded-[10px] w-full bg-white p-[10px] relative">
      <div className="relative">
        <img
          src={details.thumbnailURL || "/videoThumb.svg"}
          alt=""
          className="w-full h-full"
        />
        <button
          className="bg-gray-200 rounded-[50%] p-[10px] flex items-center justify-center text-orange-500 border-none absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]"
          onClick={handlePlayButtonClick}
        >
          <PlayArrowIcon fontSize="large" />
        </button>
      </div>
      <div className="mt-[10px]">
        <div className="my-5 flex items-center justify-between">
          <span className="flex items-center gap-[5px] text-lg font-semibold">
            {details.title}
          </span>
          {/* <span className="flex items-center gap-[5px] text-orange-500 font-medium">
            <AccessTimeOutlinedIcon />
            4 mins
          </span> */}
        </div>
        <p className="font-normal">{details.desc}</p>
        {isPlaying && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-[rgba(0, 0, 0, 0.6)] z-20 flex items-center justify-center">
            <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0, 0, 0, 0.6)] flex items-center justify-center z-30">
              <iframe
                title="YouTube video player"
                src={details.videoURL}
                className="w-full h-full absolute top-0 left-0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
              <button
                className="absolute top-2 right-2 bg-white p-2 rounded-full text-gray-800 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-800"
                onClick={handleVideoClose}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCom;
