import { selectUser } from "@/store/features/userSlice";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import CreatePost from "./CreatePost";

const CreatePostContainer = ({
  posts,
  placeholder,
  blogId,
  cb,
  noTitle,
  sessionId,
}) => {
  const user = useSelector(selectUser);
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg p-3 space-y-3 border border-none dark:border-none">
      <div className="flex items-center space-x-2">
        <div className="flex items-center justify-between">
          <img src={user?.photoURL} className="w-10 h-10 rounded-sm" />
          {/* <h3>{user?.name}</h3> */}
        </div>

        <input
          type="text"
          placeholder={placeholder || "Speak your mind, Create a post!"}
          readOnly
          className="mx-4 border-none rounded-full p-4 bg-slate-100 w-full text-black"
          onClick={() => setOpen((prev) => !prev)}
        />
        <>
          <CreatePost
            showModal={open}
            setShowModal={setOpen}
            blogId={blogId}
            cb={cb}
            noTitle={noTitle}
            sessionId={sessionId}
          />
        </>
      </div>

      {/* <div className="flex items-center flex-wrap gap-4 justify-center md:gap-x-10">
            <button className="inputButton group">
              <PhotoIcon className="text-blue-400" />
              <h4 className="opacity-80 group-hover:opacity-100">Photo</h4>
            </button>
            <button className="inputButton group">
              <YouTubeIcon className="text-green-400" />
              <h4 className="opacity-80 group-hover:opacity-100">Video</h4>
            </button>
            <button className="inputButton group">
              <EventNoteIcon className="text-yellow-600" />
              <h4 className="opacity-80 group-hover:opacity-100">Event</h4>
            </button>
            <button className="inputButton group">
              <AssignmentIcon className="text-red-400" />
              <h4 className="opacity-80 group-hover:opacity-100 whitespace-nowrap">
                Write Article
              </h4>
            </button>
          </div> */}
    </div>
  );
};

export default CreatePostContainer;
