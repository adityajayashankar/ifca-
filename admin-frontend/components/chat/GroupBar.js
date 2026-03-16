import React from "react";

const GroupBar = ({
  channels,
  active,
  activeName,
  setActiveName,
  setActiveChannelId,
  setView,
}) => {
  return (
    <div className="my-4">
      {" "}
      {channels &&
        channels?.map(
          (channel, index) =>
            active &&
            open && (
              <div
                id={index}
                key={index}
                className={`rounded-xl pl-1 hover:cursor-pointer hover:bg-slate-500 ${
                  activeName?.id === channel?.id
                    ? "hover:bg-white text-black bg-sky-500"
                    : ""
                }`}
              >
                <p
                  onClick={() => {
                    setActiveName(channel);
                    setView("chat");
                    setActiveChannelId(parseInt(channel.id));
                  }}
                  className={`flex mx-auto font-bold text-base items-center p-1 rounded-md`}
                >
                  # {channel?.name}
                </p>
              </div>
            )
        )}
    </div>
  );
};

export default GroupBar;
