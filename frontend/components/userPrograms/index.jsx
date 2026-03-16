import {
  selectUser,
  selectUserAttendance,
  selectUserSessions,
  setUserSessions,
} from "@/store/features/userSlice";
import {
  selectAllSessions,
  setAllSessions,
  setSessions,
} from "@/store/features/sessionSlice";
import api from "@/utils/apiSetup";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import Category from "../category";
import ClassCard from "../classCard";
import CourseCard from "../courseCard";
import ErrorFiller from "../UI/ErrorFiller";

const UserPrograms = ({ userOnly }) => {
  const userSessions = useSelector(selectUserSessions);
  const userAttendance = useSelector(selectUserAttendance).map((item) => {
    const updatedData = {
      ...item,
      session: {
        ...item.session,
        SessionSlot: item.sessionSlot,
      },
    };
    return updatedData;
  });

  const courses = userSessions.sessions?.filter((item) => {
    return item.isCourse === true;
  });

  const uniqueCourses = {};

  courses.forEach((course) => {
    if (!uniqueCourses[course.id]) {
      uniqueCourses[course.id] = course;
    }
  });

  const resultUniqueCourses = Object.values(uniqueCourses);


  return (
    <>
      {Object.keys(courses).length > 0 ? (
        <div className="w-full h-full flex gap-8 items-center justify-start text-gray-400 font-bold text-xl">
          {resultUniqueCourses?.map((item, index) => (
            <ClassCard details={item} key={index} />
          ))}
        </div>
      ) : (
        <div>
          {(() => {
            try {
              throw new Error("You haven't enrolled in any courses yet.");
            } catch (error) {
              return <ErrorFiller>{error.message}</ErrorFiller>;
            }
          })()}
        </div>
      )}

      {/* 
                // sessions.map((item, index) => (
                //     <ClassCard details={item} key={index} /> */}
    </>
  );
};
export default UserPrograms;
