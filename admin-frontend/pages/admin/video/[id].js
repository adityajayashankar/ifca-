import { selectOneVideo, setAllVideos } from "@/store/features/videoSlice";
import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactPlayer from "react-player/lazy";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import axios from "axios";
import { cloudFrontURL, videoURLs } from "@/utils/videoAPIutil";
import Control from "@/components/video/Control";
import { matchCloudfrontURL } from "@/utils/matchCloudfrontURL";

// function getId(url) {
//   var regExp =
//     /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
//   var match = url.match(regExp);

//   if (match && match[2].length == 11) {
//     return match[2];
//   } else {
//     return "error";
//   }
// }

export const formatTime = (time) => {
  //formarting duration of video
  if (isNaN(time)) {
    return "00:00";
  }

  const date = new Date(time * 1000);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");
  if (hours) {
    //if video have hours
    return `${hours}:${minutes.toString().padStart(2, "0")} `;
  } else return `${minutes}:${seconds}`;
};

const VideoPage = () => {
  const video = useSelector(selectOneVideo);
  const dispatch = useDispatch();
  const router = useRouter();
  const handleDeleteVideo = (e) => {
    e.preventDefault();
    let ans = prompt(
      "Do you want to delete video? This action is irreversible. Type YES in CAPS to agree"
    );
    if (ans === "YES") {
      let temp = video.videoURL.split("/");
      let fname = temp[temp.length - 1];
      console.log(fname);
      if (
        temp.find(
          (item) =>
            item ===
            cloudFrontURL.split("/")[cloudFrontURL.split("/").length - 1]
        )
      ) {
        axios
          .delete(`${videoURLs[process.env.NODE_ENV]}/video/${fname}`)
          .then((res) => {
            api.delete(`video/${video.id}`).then((res) => {
              toast(`Video ${video?.title} Deleted`);
              dispatch(setAllVideos());
              router.replace(`/admin/video`);
            });
          });
      } else {
        api.delete(`video/${video.id}`).then((res) => {
          toast(`Video ${video?.title} Deleted`);
          dispatch(setAllVideos());
          router.replace(`/admin/video`);
        });
      }
    }
  };
  const handleRouteEdit = (e) => {
    e.preventDefault();
    router.push(`/admin/video/create/${video.id}`);
  };

  const [videoState, setVideoState] = useState({
    playing: false,
    muted: false,
    volume: 1,
    played: 0,
    seeking: false,
    Buffer: true,
  });
  const [count, setCount] = useState(0);

  const videoPlayerRef = useRef(null);
  const currentTime = videoPlayerRef.current
    ? videoPlayerRef.current.getCurrentTime()
    : "00:00";

  const duration = videoPlayerRef.current
    ? videoPlayerRef.current.getDuration()
    : "00:00";
  const { playing, muted, volume, playbackRate, played, seeking, buffer } =
    videoState;
  const [fullScreen, setFullScreen] = useState();

  const playPauseHandler = () => {
    //plays and pause the video (toggling)
    setVideoState({ ...videoState, playing: !videoState.playing });
  };

  const rewindHandler = () => {
    //Rewinds the video player reducing 5
    videoPlayerRef.current.seekTo(videoPlayerRef.current.getCurrentTime() - 5);
  };

  const fastFowardHandler = () => {
    //FastFowards the video player by adding 10
    videoPlayerRef.current.seekTo(videoPlayerRef.current.getCurrentTime() + 5);
  };

  const progressHandler = (state) => {
    if (!seeking) {
      setVideoState({ ...videoState, ...state });
    }

    if (count > 3) {
      controlRef.current.style.visibility = "hidden";
    } else if (controlRef.current.style.visibility === "visible") {
      count += 1;
    }
  };

  const seekHandler = (e, value) => {
    setVideoState({ ...videoState, played: parseFloat(value) / 100 });
  };

  const seekMouseUpHandler = (e, value) => {
    setVideoState({ ...videoState, seeking: false });
    videoPlayerRef.current.seekTo(value / 100);
  };

  const volumeChangeHandler = (e, value) => {
    const newVolume = parseFloat(value) / 100;
    setVideoState({
      ...videoState,
      volume: newVolume,
      muted: Number(newVolume) === 0 ? true : false, // volume === 0 then muted
    });
  };

  const volumeSeekUpHandler = (e, value) => {
    const newVolume = parseFloat(value) / 100;
    setVideoState({
      ...videoState,
      volume: newVolume,
      muted: newVolume === 0 ? true : false,
    });
  };

  const muteHandler = () => {
    //Mutes the video player
    setVideoState({ ...videoState, muted: !videoState.muted });
  };

  const formatCurrentTime = formatTime(currentTime);

  const formatDuration = formatTime(duration);
  const controlRef = useRef(null);

  const mouseMoveHandler = () => {
    controlRef.current.style.visibility = "visible";
    count = 0;
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto py-20 px-4 lg:px-0">
      <h1 className="text-step-4 font-semibold max-w-[30ch] mb-8">
        {video?.title}
      </h1>
      {video?.sessionId && (
        <button className="blue-tag">Session Recording </button>
      )}
      <div className="flex flex-col gap-8 p-2">
        <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 before:bg-blue-400">
          About
        </p>
        <p className="text-step-0">{video?.desc}</p>
        {/* <iframe width="560" height="315" src={`//www.youtube.com/embed/${getId(video?.videoURL)}`} frameborder="0" allowfullscreen>
         */}

        {/* // "https://session-images-0.s3.ap-south-1.amazonaws.com/video/fdaee1fdc3d44d4b8c14aba2ae813ccc/file_example_mp4_480_1_5mg.m3u8" */}
        {/* </iframe> */}
        {/* {
          matchCloudfrontURL(video?.videoURL) ?
           <div className="relative border-4 w-full md:w-1/2 flex justify-center mx-auto" onMouseDown = {mouseMoveHandler} >
            <ReactPlayer
              className="flex object-cover p-0 m-0"
              ref={videoPlayerRef} //updating the react player ref
              url={video?.videoURL}
              playing={playing}
              muted={muted}
              controls={false}
              volume={volume}
              onProgress={progressHandler}
            />
            <Control
              controlRef={controlRef}
              onPlayPause={playPauseHandler}
              playing={playing}
              onRewind={rewindHandler}
              onForward={fastFowardHandler}
              played={played}
              onSeek={seekHandler}
              onSeekMouseUp={seekMouseUpHandler}
              volume={volume}
              onVolumeChangeHandler={volumeChangeHandler}
              onVolumeSeekUp={volumeSeekUpHandler}
              mute={muted}
              onMute={muteHandler}
              duration={formatDuration}
              currentTime={formatCurrentTime}
            />
          </div> : <div className="relative w-full border-4">
            <ReactPlayer
              className="min-w-full object-cover p-0 m-0"
              url={video?.videoURL}
            />

          </div>

        } */}
        <ReactPlayer
          className=""
          url={video?.videoURL}
          controls={true}
          config={{ file: { attributes: { controlsList: "nodownload" } } }}
          onContextMenu={(e) => e.preventDefault()}
        />

        <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 before:bg-blue-400">
          Actions
        </p>
        <div className="flex my-4 justify-start items-center">
          <button className="btn btn-blue mr-4" onClick={handleDeleteVideo}>
            Delete Video
          </button>
          <button className="btn btn-blue" onClick={handleRouteEdit}>
            Update Video details
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
