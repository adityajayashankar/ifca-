// import { ReactDOM } from "react";
import ReactDOM from "react-dom";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const UserMesssage = ({
  sender,
  content,
  index,
  message,
  queryId,
  isExpert,
}) => {
  // function createElementFromHTML(htmlString) {
  //     var div = document.createElement('div');
  //     div.innerHTML = htmlString.trim();

  //     // Change this to div.childNodes to support multiple top-level nodes.
  //     // return div.firstChild;
  //     ReactDOM.render(div.firstElementChild, document.getElementById(`msgContainer-${index}`))
  // }
  // console.log(createElementFromHTML(content))
  let date = new Date(message.sendTime);
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
  const divRef = useRef();
  useEffect(() => {
    divRef.current.innerHTML = content;
  }, [content]);

  if (isExpert) {
    return (
      <div
        className={`p-1 flex mt-2 m w-full items-center ${
          queryId === message.senderId ? "justify-end" : ""
        }`}
      >
        <div className="flex flex-col">
          <div
            className={`flex flex-row cursor-pointer w-full ${
              queryId === message.senderId ? "justify-end" : ""
            }`}
          >
            <picture className="pl-1 ml-1 profile-img w-10 h-10">
              <source srcSet={sender?.expert.photoURL} type="image/webp" />
              <img src={sender?.expert.photoURL} alt="" />
            </picture>
            <div className="font-bold my-auto"> {sender?.expert.name} </div>
            {
              <div
                className={`${
                  isExpert
                    ? "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-800"
                }    ${queryId === message.senderId ? "hidden" : ""}
                            my-auto  text-xs font-semibold ml-2 px-2.5 rounded `}
              >
                {isExpert ? "Expert" : "Member"}
              </div>
            }
            <div className="my-auto ml-2 text-xs italic">{dateTimeStr}</div>
          </div>
          <div
            className={`flex flex-col ${
              queryId === message.senderId ? "ml-24" : "mr-24"
            }`}
          >
            <div
              className={`flex flex-wrap break-words ${
                queryId === message.senderId ? "justify-end" : ""
              }`}
              id={`msgContainer-${index}`}
            >
              {/* <QuillNoSSRWrapper
                        value={content}
                        readOnly={true}
                        style={{marginLeft:"25px",backgroundColor:"rgb(226 232 240)",borderRadius:"10px",color: "", maxHeight:"fit-content"}}
                        theme='bubble'
                    /> */}
              <div
                ref={divRef}
                className="mx-4 bg-slate-200 p-2 rounded-xl max-w-96 w-64"
              ></div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-1 flex mt-2 m w-full items-center ${
        queryId === message.senderId ? "justify-end" : ""
      }`}
    >
      <div className="flex flex-col">
        <div
          className={`flex flex-row cursor-pointer w-full ${
            queryId === message.senderId ? "justify-end" : ""
          }`}
        >
          <picture className="pl-1 ml-1 profile-img w-10 h-10">
            <source srcSet={sender?.user.photoURL} type="image/webp" />
            <img src={sender?.user.photoURL} alt="" />
          </picture>
          <div className="font-bold my-auto"> {sender?.user.name} </div>
          {
            <div
              className={`${isExpert ? "btn-green" : "blue-tag"}    ${
                queryId === message.senderId ? "hidden" : ""
              }
                            my-auto  text-xs font-semibold ml-2 px-2.5 rounded `}
            >
              {isExpert ? "Expert" : "Member"}
            </div>
          }
          <div className="my-auto ml-2 text-xs italic">{dateTimeStr}</div>
        </div>
        <div
          className={`flex flex-col ${
            queryId === message.senderId ? "ml-24" : "mr-24"
          }`}
        >
          <div
            className={`flex flex-wrap break-words ${
              queryId === message.senderId ? "justify-end" : ""
            }`}
            id={`msgContainer-${index}`}
          >
            {/* <QuillNoSSRWrapper
                        value={content}
                        readOnly={true}
                        style={{marginLeft:"25px",backgroundColor:"rgb(226 232 240)",borderRadius:"10px",color: "", maxHeight:"fit-content"}}
                        theme='bubble'
                    /> */}
            <div
              ref={divRef}
              className="mx-4 bg-slate-200 p-2 rounded-xl max-w-96 w-64"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMesssage;
