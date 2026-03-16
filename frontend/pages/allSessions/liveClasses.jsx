import CategoryCardList from "@/components/categoryCardList";
import ClassCard from "@/components/classCard";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import { selectAllSessions, setSessions } from "@/store/features/sessionSlice";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const liveClasses = () => {
  const dispatch = useDispatch();

  const sessions = useSelector(selectAllSessions)
    ?.filter((item) => {
      return item.isExclusive === false;
    })
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
    dispatch(setSessions());
  }, []);

  return (
    <>
      <header>
        <Topbar />
      </header>
      <main className="container overflow-x-hidden flex flex-col gap-y-[75px] mt-[80px]">
        <div className="w-full max-w-[1420px] mx-auto pb-[80px]">
          <div className="flex flex-wrap justify-start mt-[50px] gap-[50px]">
            {sessions?.length <= 0 || !sessions ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold  text-base md:text-lg lg:text-xl text-center">
                Oops!! No Live Sessions available, please come back later!!
              </div>
            ) : (
              sessions?.map((item, index) => (
                <ClassCard details={item} key={index} />
              ))
            )}
          </div>
        </div>
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  );
};

export default liveClasses;
