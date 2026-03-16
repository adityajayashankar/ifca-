import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { selectAllCommunities } from "@/store/features/communitySlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { selectOneVideo, setAllVideos } from "@/store/features/videoSlice";
import VideoUploader from "../common/VideoUploader";
import { allSessions, setAllSessions } from "@/store/features/session";
import BetterUploaderImg from "../common/BetterImgUploader";
import UploadImage from "../UploadImage";

const CreateVideoForm = ({ isEdit, baseURL }) => {
  const formRef = useRef();
  const router = useRouter();
  const allCommunities = useSelector(selectAllCommunities);
  const sessions = useSelector(allSessions);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const oneVideo = useSelector(selectOneVideo);
  const [uploadType, setUploadType] = useState("");
  const urlRef = useRef("");

  const initObj = {
    title: "",
    videoURL: "",
    desc: "",
    thumbnailURL:
      "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885__480.jpg",
    sessionId: 0,
  };
  const [videoForm, setVideoForm] = useState(initObj);
  const [thumbURL, setThumbURL] = useState("");

  const handleChange = (e) => {
    if (e.target.name === "uploadType") {
      setUploadType(e.target.value);
    } else {
      setVideoForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };
  const handleClearForm = (e) => {
    e?.preventDefault();
    formRef.current.reset();
    setVideoForm(initObj);
  };
  const handleDiscardChanges = (e) => {
    e.preventDefault();
    router.replace(`/${baseURL}/video`);
  };
  useEffect(() => {
    dispatch(setAllSessions());
  }, []);
  useEffect(() => {
    console.log(router?.query["videoId"]);
    if (isEdit && oneVideo && router?.query["videoId"] == oneVideo.id) {
      setVideoForm(oneVideo);
      setThumbURL(oneVideo?.thumbnailURL);
    }
  }, [oneVideo, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const { status, message } = validate();
    if (!status) {
      toast(message, { type: "error" });
    } else {
      if (!isEdit) {
        let obj = { ...videoForm, thumbnailURL: thumbURL };
        if (uploadType === "upload") {
          obj = { ...videoForm, videoURL: urlRef.current };
        }
        if (videoForm.sessionId !== 0) {
          obj = { ...obj, sessionId: parseInt(videoForm.sessionId) };
        }

        api
          .post(`/video`, {
            ...obj,
          })
          .then((res) => {
            if (res.data) {
              toast("Video Created..", { type: "success" });
              router.replace(`/${baseURL}/video`);
              dispatch(setAllVideos());
            }
          });
      } else {
        const obj = {
          title: videoForm.title,
          desc: videoForm.desc,
          thumbnailURL: thumbURL,
        };
        if (!videoForm?.thumbnailURL) {
          toast(`Add a thumnail`, { type: "warning" });
          return;
        }

        if (videoForm.sessionId !== 0) {
          obj = { ...obj, sessionId: parseInt(videoForm.sessionId) };
        }

        console.log(obj);
        api.patch(`/video/${videoForm?.id}`, obj).then(() => {
          toast(`Video Updated..`);
          router.replace(`/${baseURL}/video`);
          dispatch(setAllVideos());
        });
      }
    }
  };

  useEffect(() => {
    if (user && (user.userType === "partner" || user.userType === "admin")) {
      setVideoForm((prev) => ({ ...prev, videoURL: urlRef.current }));
    }
  }, [user, urlRef.current]);

  const validate = () => {
    // const videoUrlRegex = new RegExp("[a-zA-Z0-9@#$%^&*(|{+=-.>,</'[!]})]$");
    // const descRegex = new RegExp("[a-zA-Z0-9@#$%^&*(|{+=-.>,</'[!]})]$");
    // const titleRegex = new RegExp("[a-zA-Z0-9@#$%^&*(|{+=-.>,</'[!]})]$");
    // const thumbnailUrlRegex = "[a-zA-Z0-9@#$%^&*(|{+=-.>,</'[!]})]$";
    if (
      // !titleRegex.test(videoForm.title) || 
      videoForm.title.length == 0) {
      return { status: false, message: "Title not in correct format" };
    }
    if (
      // !videoUrlRegex.test(videoForm.videoURL) ||
      videoForm.videoURL.length == 0
    ) {
      return { status: false, message: "Url not in correct format" };
    }

    if (
      // !descRegex.test(videoForm.desc) || 
      videoForm.desc.length == 0) {
      return { status: false, message: "Description not in correct format" };
    }


    return { status: true, message: "Validation successful" };
  };

  return (
    <div className="createsessionform__container">
      <form
        className="createsessionform__form"
        method="POST"
        ref={formRef}
        onSubmit={handleSubmit}
      >
        <div className="input__group">
          <div className="input__group__header">
            <p>Basic Information</p>
          </div>
          {isEdit && (
            <p>
              You cannot re-upload the video, you can only change metadata about
              the video
            </p>
          )}
          <label htmlFor="title" className="label">
            <span className="label__text">
              Video Title
              <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              id="title"
              name="title"
              className="input"
              required
              defaultValue={videoForm.title}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="desc" className="label">
            <span className="label__text">
              Description
              <span className="text-red-500">*</span>
            </span>
            <p className="text-sm text-gray-400">
              A brief description about the video
            </p>
            <textarea
              id="desc"
              name="desc"
              className="input"
              defaultValue={videoForm.desc}
              onChange={handleChange}
              required
            />
          </label>
          {/* If youtube video checkmark */}
          {!isEdit && (
            <>
              <span className="label__text">Video Upload Method</span>
              <p className="text-sm text-gray-400">
                If your video is already put as unlisted in youtube, choose
                youtube. If you have the mp4 version of video, choose upload
                video.
              </p>
              <label htmlFor="uploadType">
                <input
                  type="radio"
                  name="uploadType"
                  value="youtube"
                  className="mr-2"
                  onChange={handleChange}
                />
                I have link to youtube video
              </label>
              {uploadType === "youtube" && (
                <label htmlFor="videoURL" className="label">
                  <span className="label__text">
                    Youtube URL
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    id="videoURL"
                    name="videoURL"
                    className="input"
                    required
                    defaultValue={videoForm.videoURL}
                    readOnly={isEdit}
                    onChange={handleChange}
                  />
                </label>
              )}
              <label htmlFor="uploadType">
                <input
                  type="radio"
                  name="uploadType"
                  value="upload"
                  onChange={handleChange}
                  className="mr-2"
                />
                Upload Video
              </label>
              {uploadType === "upload" && (
                <UploadImage folder="resource" imgUrl={videoForm.videoURL} urlRef={urlRef} type={"videos"} />
              )}
            </>
          )}

          <BetterUploaderImg
            videoURL={thumbURL}
            setVideoURL={setThumbURL}
            placeholder={"Add Thumbnail here"}
          />
          <label htmlFor="thumbnailURL" className="label">
            <span className="label__text">Thumbnail URL</span>
            <input
              type="text"
              id="thumbnailURL"
              name="thumbnailURL"
              className="input"
              //   required
              defaultValue={videoForm.name}
              readOnly={isEdit}
              onChange={handleChange}
            />
          </label>

          <label htmlFor="category" className="label">
            <span className="label__text">Select Session</span>
            <p className="text-sm text-gray-400">
              If the video you are uploading is a recorded session, choose that
              session. Leave it blank if the video is not a recording
            </p>
            {/* Get partner communities */}
            <select className="select" name="sessionId" onChange={handleChange}>
              <option value={0}>NA</option>
              {sessions?.map((item, index) => (
                <option value={item.id} key={`session-${index}`}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {isEdit && (
          <div className="flex flex-row flex-wrap gap-2" type="submit">
            <button className="button button-blue flex-1">Edit Video</button>

            <button
              className="button button-blue flex-1"
              onClick={handleDiscardChanges}
            >
              Discard Changes
            </button>
          </div>
        )}
        {!isEdit && (
          <div className="flex flex-row flex-wrap gap-2" type="submit">
            <button
              className="button button-blue flex-1"
              onClick={handleSubmit}
            >
              Create Video
            </button>

            <button
              className="button button-blue flex-1"
              onClick={handleClearForm}
            >
              Reset Form
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateVideoForm;
