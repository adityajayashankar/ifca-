import { React, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Markup from "./markup";

const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const Threads = ({ thread, sender }) => {
  console.log(thread);
  let date = new Date(thread.createdAt);
  let time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  let dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  let dateTimeStr = `${dateStr} ${time}`;

  const [data, setData] = useState("");
  const [status, setStatus] = useState(true);

  const [childThreads, setChildThreads] = useState([
    {
      id: 3,
      userId: 1,
      sender: {
        id: 1,
        name: "Darshan",
        photoURL: "https://robohash.org/001",
      },
      content: "<p>Hey this is reply thread 1 !</p>",
      parentThread: 1,
      createdAt: "2022-10-15T18:19:47.577Z",
    },
    {
      id: 4,
      userId: 1,
      sender: {
        id: 1,
        name: "Darshan",
        photoURL: "https://robohash.org/001",
      },
      content: "<p>Hey this is reply thread 2 !</p>",
      parentThread: 1,
      createdAt: "2022-10-15T18:19:47.577Z",
    },
  ]);

  const [showReplies, setShowReplies] = useState(false);
  const sendBtn = () => {
    console.log(data);
    let temp = data;
    let stri = temp.replace(/<[^>]*>?/gm, "");
    // console.log(stri.trim().length)
    if (stri.trim().length === 0) {
      console.log("Empty Message");
      setData("");
      setStatus(true);
    } else {
      setStatus(false);
    }
  };
  return (
    <div className="mt-2">
      <div className="flex flex-row">
        <picture className="pl-1 ml-1 profile-img w-10 h-10">
          <source srcSet={sender.photoURL} type="image/webp" />
          <img src={sender.photoURL} alt="Sender image" />
        </picture>
        <div className="flex flex-col bg-slate-500 w-3/4 rounded-lg">
          <div className="flex flex-col mx-2 border-b-2 p-2 text-white">
            <div className="font-bold my-auto"> {sender.name} </div>
            <div className="my-auto text-xs italic">{dateTimeStr}</div>
          </div>
          <div className={`flex flex-wrap break-words`}>
            <QuillNoSSRWrapper
              value={thread.content}
              readOnly={true}
              style={{
                borderRadius: "10px",
                color: "white",
                maxHeight: "fit-content",
              }}
              theme="bubble"
            />
          </div>
          <div
            onClick={() => setShowReplies(!showReplies)}
            className="cursor-pointer text-blue-600 underline text-right pr-2"
          >
            View replies
          </div>
          {showReplies && (
            <div className="w-full rounded-2xl mb-1 ">
              <Markup
                className=""
                data={data}
                status={status}
                onClick={sendBtn}
                setData={setData}
              />
            </div>
          )}
          {showReplies &&
            childThreads &&
            childThreads?.map((childThread, index) => (
              <div key={index}>
                <div className="flex flex-row">
                  <picture className="pl-1 ml-1 profile-img w-10 h-10">
                    <source
                      srcSet={childThread.sender.photoURL}
                      type="image/webp"
                    />
                    <img src={childThread.sender.photoURL} alt="Sender image" />
                  </picture>
                  <div className="flex flex-col bg-slate-500 w-3/4 rounded-lg">
                    <div className="flex flex-col mx-2 border-b-2 p-2 text-white">
                      <div className="font-bold my-auto">
                        {" "}
                        {childThread.sender.name}{" "}
                      </div>
                      <div className="my-auto text-xs italic">
                        {dateTimeStr}
                      </div>
                    </div>
                    <div className={`flex flex-wrap break-words`}>
                      <QuillNoSSRWrapper
                        value={childThread.content}
                        readOnly={true}
                        style={{
                          borderRadius: "10px",
                          color: "white",
                          maxHeight: "fit-content",
                        }}
                        theme="bubble"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Threads;
