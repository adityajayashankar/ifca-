import {
  selectAllSessions,
  setAllSessions,
  setSessions,
} from "@/store/features/sessionSlice";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import ClassCard from "../classCard";
import {
  selectUser,
  selectUserSessions,
  setUserSessions,
} from "@/store/features/userSlice";
import ErrorFiller from "../UI/ErrorFiller";

const RecordedCardList = () => {
  let session = useSelector(
    window.location.pathname.includes("myCommunities")
      ? selectUserSessions
      : selectAllSessions
  );

  const VideoSessions = window.location.pathname.includes("browseClasses")
    ? session?.filter((item) => item.isVideoChannel === true)
    : session?.sessions?.filter((item) => item.isVideoChannel === true);

  const user = useSelector(selectUser);
  const dispatch = useDispatch(session);

  useEffect(() => {
    window.location.pathname.includes("myCommunities")
      ? dispatch(setSessions())
      : user && dispatch(setUserSessions(user?.id));
  }, []);
  
  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-start gap-[30px]">
        {typeof session === "undefined" ||
        VideoSessions === null ||
        VideoSessions?.length === 0 ? (
          <ErrorFiller>
            Oops!! No Sessions available, please come back later!!
          </ErrorFiller>
        ) : (
          VideoSessions?.map((item, index) => (
            <ClassCard details={item} key={index} />
          ))
        )}
      </div>
    </div>
  );
};

export default RecordedCardList;
