import React, { useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { IoSend } from "react-icons/io5";
import { AiOutlineSend } from "react-icons/ai";

// components
// import LoadBtn from '@/com/common/loadBtn';

import LoadBtn from "@/components/common/loadBtn";

/*
        Theme of the Quill Board :
        1. Snow
        2. Bubble
*/

const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const Markup = ({ data, setData, status, onClick, noSend }) => {
  const modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike", "blockquote"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
  ];

  function setFocus(editor) {
    editor.focus();
  }
  return (
    <div className="flex bg-white  justify-center">
      <div className="flex w-full flex-row bg-white  p-3 overflow-hidden">
        <div className="w-full text-black border-none">
          <QuillNoSSRWrapper
            value={data}
            className=""
            modules={modules}
            required={true}
            onEditorCreated={(editor) => setFocus(editor)}
            formats={formats}
            onKeyUp={(e) => {
              if (e.code === "Enter" && e.shiftKey === false) {
                e.preventDefault();
                // if (status) {
                //   onClick();
                // }
              }
            }}
            placeholder={"Type a message"}
            onChange={(e) => {
              setData(e);
            }}
            style={{ wordBreak: "break-all", color: "black" }}
            theme="snow"
          />
        </div>
        {!noSend && (
          <div className="border-2 p-2 hover:cursor-pointer border-none text-lg text-black rounded-lg flex">
            {status ? (
              <div
                onClick={onClick}
                className="p-2 my-auto border-2 hover:cursor-pointer border-black text-lg text-black rounded-lg flex"
              >
                {data === "<p><></p>" ? (
                  <AiOutlineSend className="ml-1 my-auto" />
                ) : (
                  <IoSend className="ml-1 my-auto" />
                )}
              </div>
            ) : (
              <div className="p-2 my-auto border-2 hover:cursor-pointer border-black rounded-lg flex">
                <LoadBtn status={"Sending"} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Markup;
