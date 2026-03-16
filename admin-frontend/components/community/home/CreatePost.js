import Modal from "@/components/common/Modal";
import React, { useState } from "react";
import Markup from "@/components/chat/markup";
import MultiFileInput from "@/components/common/FileUpload";

import { FiUpload } from "react-icons/fi";
import { MdOutlinePoll } from "react-icons/md";
import { BiImageAdd, BiArrowBack } from "react-icons/bi";

import { GrDocumentPdf } from "react-icons/gr";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
import { selectCommunity } from "@/store/features/communitySlice";
import { selectTags, setCommunityPosts } from "@/store/features/postsSlice";
import TagsInput from "@/components/common/Tags";
import AWS from "aws-sdk";

import Poll from "@/components/chat/polls";
const ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "";
const SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "";
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "ap-south-1";

AWS.config.update({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_ACCESS_KEY,
});
const CreatePost = ({
  showModal,
  setShowModal,
  replyPostId,
  blogId,
  cb,
  noTitle,
  sessionId,
}) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState(true);

  const [showpoll, setShowpoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([{ text: "" }, { text: "" }]);
  const [pollExpiresAt, setPollExpiresAt] = useState("");

  const [media, setMedia] = useState([]);
  const [pdf, setPdf] = useState([]);
  const user = useSelector(selectUser);
  const suggestionTags = useSelector(selectTags);
  const community = useSelector(selectCommunity);
  // const [suggestions, setSuggestions] = useState(suggestionTags || []);
  const [tags, setTags] = useState([]);
  const dispatch = useDispatch();

  const handleClearPost = () => {
    setTitle("");
    setContent("");
    setTags([]);
    setMedia([]);
  };
  const handleUploadImages = async (items) => {
    let urls = [];

    for (const asset of items) {
      try {
        // Step 1: Get a presigned URL from the backend
        const response = await api.post("/images/generate-presigned-url", {
          fileName: asset.name,
          fileType: asset.file.type,
          folder: "posts",
        });

        const { uploadUrl, fileUrl } = response.data;

        // Step 2: Upload the file directly to S3 using the presigned URL
        await fetch(uploadUrl, {
          method: "PUT",
          body: asset.file,
          headers: {
            "Content-Type": asset.file.type,
          },
        });

        urls.push({
          url: fileUrl,
          index: asset.index,
          type: "image",
        });
      } catch (error) {
        toast(`Error uploading`, { type: "error" });
        console.log(error);
      }
    }

    return urls;
  };

  const handleCreatePost = async () => {
    let assetsData = [];
    if (media.length > 0) {
      assetsData = media;
    } else {
      assetsData = pdf;
    }

    // console.log(media);
    const massets = await handleUploadImages(media);
    // console.log(massets);
    // console.log(tags);
    let tempTags = tags?.map((item) => {
      if (!isNaN(parseInt(item.id.split("-")[1]))) {
        return { id: parseInt(item.id.split("-")[1]), name: item.text };
      } else {
        return { name: item.text };
      }
    });
    // console.log(tempTags);
    if (blogId) {
      let obj = {
        content,
        title,
        assetsData: massets,
        tagsData: tempTags,
        creatorId: user.unifiedUser.id,
        blogId,
      };
      if (showpoll) {
        console.log(pollQuestion);
        console.log(pollOptions);
        if (pollOptions?.length < 2) {
          toast(`Poll should contain atleast 2 options !`, { type: "error" });
          return;
        }
        if (
          pollQuestion.trim().length === 0 ||
          pollExpiresAt.trim().length === 0 ||
          pollOptions[0].text.trim().length === 0 ||
          pollOptions[1].text.trim().length === 0
        ) {
          toast(`Poll question , options, expires at should not be empty !`, {
            type: "error",
          });
          return;
        }
        obj = {
          ...obj,
          title: pollQuestion,
          isPoll: true,
          optionsData: pollOptions?.map(({ text }) => ({ option: text })),
          pollExpiresAt: new Date(pollExpiresAt).toISOString(),
        };
      }
      // console.log(obj);
      if (replyPostId) {
        api
          .post(`/thread`, {
            ...obj,
            parentPostId: parseInt(replyPostId),
          })
          .then((res) => {
            console.log(res.data);
            // dispatch(setCommunityPosts(community.id));
            toast(`Created Post!`, { type: "success" });
            setShowModal(false);
            if (cb) {
              cb();
            }
          });
      } else {
        api.post(`/thread`, { ...obj }).then((res) => {
          console.log(res.data);
          // dispatch(setCommunityPosts(community.id));
          toast(`Created Post!`, { type: "success" });
          setShowModal(false);
          if (cb) {
            cb();
          }
        });
      }
    } else if (sessionId) {
      let obj = {
        content,
        title,
        assetsData: massets,
        tagsData: tempTags,
        creatorId: user.unifiedUser.id,
        sessionId,
      };
      if (showpoll) {
        console.log(pollQuestion);
        console.log(pollOptions);
        if (pollOptions?.length < 2) {
          toast(`Poll should contain atleast 2 options !`, { type: "error" });
          return;
        }
        if (
          pollQuestion.trim().length === 0 ||
          pollExpiresAt.trim().length === 0 ||
          pollOptions[0].text.trim().length === 0 ||
          pollOptions[1].text.trim().length === 0
        ) {
          toast(`Poll question , options, expires at should not be empty !`, {
            type: "error",
          });
          return;
        }
        obj = {
          ...obj,
          title: pollQuestion,
          isPoll: true,
          optionsData: pollOptions?.map(({ text }) => ({ option: text })),
          pollExpiresAt: new Date(pollExpiresAt).toISOString(),
        };
      }
      // console.log(obj);
      if (replyPostId) {
        api
          .post(`/thread`, {
            ...obj,
            parentPostId: parseInt(replyPostId),
          })
          .then((res) => {
            console.log(res.data);
            // dispatch(setCommunityPosts(community.id));
            toast(`Created Announcement!`, { type: "success" });
            setShowModal(false);
            if (cb) {
              cb();
            }
          });
      } else {
        api.post(`/thread`, { ...obj }).then((res) => {
          console.log(res.data);
          // dispatch(setCommunityPosts(community.id));
          toast(`Created Announcement!`, { type: "success" });
          setShowModal(false);
          if (cb) {
            cb();
          }
        });
      }
    } else {
      let obj = {
        content,
        title,
        assetsData: massets,
        tagsData: tempTags,
        creatorId: user.unifiedUser.id,
        communityId: community.id,
      };

      if (showpoll) {
        console.log(pollQuestion);
        console.log(pollOptions);
        if (pollOptions?.length < 2) {
          toast(`Poll should contain atleast 2 options !`, { type: "error" });
          return;
        }
        if (
          pollQuestion.trim().length === 0 ||
          pollExpiresAt.trim().length === 0 ||
          pollOptions[0].text.trim().length === 0 ||
          pollOptions[1].text.trim().length === 0
        ) {
          toast(`Poll question , options, expires at should not be empty !`, {
            type: "error",
          });
          return;
        }
        obj = {
          ...obj,
          title: pollQuestion,
          isPoll: true,
          optionsData: pollOptions?.map(({ text }) => ({ option: text })),
          pollExpiresAt: new Date(pollExpiresAt).toISOString(),
        };
      }

      if (replyPostId) {
        api
          .post(`/thread`, {
            ...obj,
            parentPostId: parseInt(replyPostId),
          })
          .then((res) => {
            console.log(res.data);
            dispatch(setCommunityPosts(community.id));
            toast(`Created Post!`, { type: "success" });
            setShowModal(false);
          });
      } else {
        api.post(`/thread`, { ...obj }).then((res) => {
          console.log(res.data);
          dispatch(setCommunityPosts(community.id));
          toast(`Created Post!`, { type: "success" });
          setShowModal(false);
        });
      }

      // handleClearPost();
      // if (cb) {
      //   cb();
      // }
    }
    handleClearPost();

    // e.preventDefault();
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      title={replyPostId ? "Reply" : "Create Post"}
      className="max-w-3xl"
    >
      <div className="flex flex-col items-center ">
        <div
          className={`flex-col items-center ${showpoll ? "hidden" : "flex"}`}
        >
          {!noTitle && (
            <input
              type="text"
              className="bg-slate-200 rounded p-4 my-4 w-full border-none focus:border-transparent outline-none focus:ring-0 "
              placeholder="Choose title for better search"
              value={title}
              autoFocus="true"
              onChange={(e) => setTitle(e.target.value)}
            />
          )}
          <textarea
            rows={5}
            cols={50}
            className={
              "bg-slate-200 rounded p-4 border-none focus:border-transparent outline-none focus:ring-0 "
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="How excited are you..?"
            autoFocus
          />

          <>
            <p className="py-4">Tag your post for specifics</p>
            <TagsInput
              tags={tags}
              setTags={setTags}
              suggestions={suggestionTags}
            />
          </>
          <div className="mt-1 flex items-center">
            {pdf?.length <= 0 && (
              <MultiFileInput
                value={media}
                className="my-auto"
                setValue={setMedia}
                key={3}
                accept={"image/png, image/jpeg"}
                type={"img"}
                placeholder={<BiImageAdd />}
              />
            )}
            <MdOutlinePoll
              className="cursor-pointer text-3xl my-auto"
              onClick={() => setShowpoll(!showpoll)}
            />
          </div>
        </div>
        {showpoll && (
          <div className="flex flex-col w-full">
            <div
              className="cursor-pointer rounded-lg flex m-4"
              onClick={() => setShowpoll(false)}
            >
              {" "}
              <BiArrowBack className="my-auto" /> Back
            </div>
            <Poll
              showPoll={false}
              question={pollQuestion}
              setQuestion={setPollQuestion}
              options={pollOptions}
              setOptions={setPollOptions}
              expiresAt={pollExpiresAt}
              setExpiresAt={setPollExpiresAt}
              onSubmit={handleCreatePost}
            />
          </div>
        )}
        <button className="btn btn-blue my-4" onClick={handleCreatePost}>
          Publish to world
        </button>
      </div>
    </Modal>
  );
};

export default CreatePost;
