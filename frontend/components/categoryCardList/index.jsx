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
import ErrorFiller from "../UI/ErrorFiller";

const CategoryCardList = ({ isLive }) => {
  const [tags, setTags] = useState([]);
  const [active, setActive] = useState(-1);
  const sessions = useSelector(selectAllSessions)?.filter((item) => {
    return item.isExclusive === false;
  });
  const [currentSessions, setcurrentSessions] = useState();

  const [selectedCat, setSelectedCat] = useState(0);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setSessions());
  }, []);

  const liveSessions = sessions
    ?.map((item) => {
      return (
        item.SessionSlot.filter((slotItem) => {
          return (
            new Date().getTime() >= new Date(slotItem.startTime).getTime() &&
            new Date().getTime() <= new Date(slotItem.endTime).getTime()
          );
        }).length > 0 && item
      );
    })
    .filter((item) => {
      return item !== false;
    });

  useEffect(() => {
    console.log(
      isLive
        ? liveSessions?.flatMap((item) => item.tags.map((tagObj) => tagObj.tag))
        : sessions?.flatMap((item) => item.tags.map((tagObj) => tagObj.tag))
    );
  }, []);

  useEffect(() => {
    if (active == -1) {
      setcurrentSessions(isLive ? liveSessions : sessions);
    } else {
      setcurrentSessions(
        isLive
          ? liveSessions.filter((data) => {
              // Check if the data object has a tag with tagId 1
              return data.tags.some((tag) => tag.tagId === active);
            })
          : sessions.filter((data) => {
              // Check if the data object has a tag with tagId 1
              return data.tags.some((tag) => tag.tagId === active);
            })
      );
    }
  }, [active]);

  useEffect(() => {
    const tags = async () => {
      try {
        const res = await api.get(`/tag`);
        console.log(res.data.tags);
        setTags(res.data.tags);
      } catch (err) {
        console.log(`Error while fetching sessions`);
        console.log(err);
        return [];
      }
    };
    tags();
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-center flex-wrap gap-[2px] md:justify-start md:gap-1 lg:gap-[5px]">
        <Category
          key={-1}
          index={-1}
          cat={{ id: -1, name: "all", createdAt: "" }}
          setSelectedCat={setSelectedCat}
          setActive={setActive}
          active={active}
        />
        {tags?.map((item, index) => (
          <Category
            key={index}
            index={index}
            cat={item}
            setSelectedCat={setSelectedCat}
            setActive={setActive}
            active={active}
          />
        ))}
      </div>
      <div className="flex flex-wrap justify-start py-5 gap-[30px]">
        {isLive ? (
          currentSessions?.length <= 0 || !currentSessions ? (
            <ErrorFiller>
              Oops!! No Live Sessions available, please come back later!!
            </ErrorFiller>
          ) : (
            currentSessions?.map((item, index) => (
              <ClassCard details={item} key={index} />
            ))
          )
        ) : sessions?.length <= 0 ? (
          <ErrorFiller>
            Oops!! No Sessions available, Please come back later!!
          </ErrorFiller>
        ) : window.location.pathname.includes("allSessions") ? (
          sessions?.map((item, index) => (
            <ClassCard details={item} key={index} />
          ))
        ) : currentSessions?.length > 0 ? (
          currentSessions
            ?.slice(0, 6)

            ?.map((item, index) => <ClassCard details={item} key={index} />)
        ) : (
          <ErrorFiller> No open sessions</ErrorFiller>
        )}
      </div>
    </div>
  );
};

export default CategoryCardList;
