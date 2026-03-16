import { selectUser } from "@/store/features/userSlice";
import React from "react";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useSelector } from "react-redux";
import Link from 'next/link';
import DotsMenu from "../common/DotsMenu";
import { getUserPhotoURL } from "@/utils/userUtils";
import { useRouter } from "next/router";

const Header = ({ user, tags, threadId, createdAt, cb, communityId }) => {
  const [openMenu, setOpenMenu] = useState(false);
  let date = new Date(createdAt);
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

  const router = useRouter()

  function routeUser(user) {
    if(user?.uid){
      router.push(`/user/${user.uid}`)
    }
  }

  return (
    <div className="flex items-center w-full gap-2">
      <div 
        className="cursor-pointer transition-transform hover:scale-105"
        onClick={() => routeUser(user)}
      >
        <img 
          src={getUserPhotoURL(user) || "/comPic.svg"} 
          className="w-10 h-10 rounded-full object-cover border-2 border-primary-light hover:border-primary-500 transition-colors" 
          alt={user?.name || "User avatar"}
          onError={(e) => {
            e.target.src = "/t6.svg";
          }}
        />
      </div>
      <div className="flex flex-col w-full">
        <div className="flex flex-row justify-between w-full">
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => routeUser(user)}
            >
              <h2 className="text-semibold text-lg font-medium text-gray-800 group-hover:text-primary-500 transition-colors">
                {user?.name || "Anonymous"}
              </h2>
              {user?.role === "Expert" ? (
                <div className="bg-sky-300 text-black text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {user?.role}
                </div>
              ) : (
                <div className="gradient_background text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Member
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 italic">{dateTimeStr}</div>
          </div>
          <div className="flex justify-end items-center">
            <DotsMenu
              visible={openMenu}
              setVisible={setOpenMenu}
              user={user}
              threadId={threadId}
              cb={cb}
            />
          </div>
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.map((item, index) => (
              <div
                className="bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full font-medium hover:bg-primary-200 transition-colors cursor-pointer"
                key={index}
                onClick={() => router.push(`/search?tag=${item.tag.name}`)}
              >
                #{item.tag.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
