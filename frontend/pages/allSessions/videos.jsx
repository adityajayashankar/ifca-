import CategoryCardList from "@/components/categoryCardList";
import ClassCard from "@/components/classCard";
import Footer from "@/components/footer";
import RecordedCardList from "@/components/programCard";
import Topbar from "@/components/topbar/Topbar";
import { selectAllSessions, setSessions } from "@/store/features/sessionSlice";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const liveClasses = () => {
  return (
    <>
      <header>
        <Topbar />
      </header>
      <main className="container overflow-x-hidden flex flex-col gap-y-[75px] mt-[80px]">
        <RecordedCardList />
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  );
};

export default liveClasses;
