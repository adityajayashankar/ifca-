import ClassCard from "@/components/classCard";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import { selectAllSessions } from "@/store/features/sessionSlice";
import api from "@/utils/apiSetup";
import Head from "next/head";
import React from "react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";

const CatSessions = () => {
  const sessions = useSelector(selectAllSessions)?.filter((item) => {
    return item.isExclusive === false;
  });
  const [currentSessions, setcurrentSessions] = useState();
  const router = useRouter();
  const { id } = router.query;
  const tagId = id ? parseInt(id) : null;

  useEffect(() => {
    if (tagId && sessions) {
      setcurrentSessions(
        sessions.filter((data) => {
          return data.tags.some((tag) => tag.tagId === tagId);
        })
      );
    }
  }, [tagId, sessions]);

  // const [tags, setTags] = useState([])

  // useEffect(() => {
  //   api.get("/tag").then((res) => {
  //     setTags(res.data.topTags?.filter((item) => {
  //         return item.tag.id === parseInt(window.location.pathname.split("/")[2])
  //     }));
  //     console.log(res.data.topTags?.filter((item) => {
  //         return item.tag.id === parseInt(window.location.pathname.split("/")[2])
  //     }))
  //   });
  // }, []);

  return (
    <>
      <Head>
        <title>All Sessions</title>
      </Head>
      <header>
        <Topbar />
      </header>
      <main className="container">
        {/* <div className="w-full max-w-[1420px] mx-auto pb-[80px] my-auto">
          {tags?.length > 0 ? (
            <div className="flex flex-wrap justify-start mt-[50px] gap-[50px]">
              {tags &&
                tags[0]?.sessions?.map((item, index) => (
                  <ClassCard details={item} key={index} />
                ))}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <p className="font-bold text-gray-500 text-xl">
                No sessions matching this category
              </p>
            </div>
          )}
        </div> */}
        <div className="flex flex-wrap justify-start mt-[40px] gap-[30px] py-20">
          {currentSessions?.length > 0 ? (
            currentSessions
              ?.slice(0, 6)
              ?.map((item, index) => <ClassCard details={item} key={index} />)
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold  text-base md:text-lg lg:text-xl text-center">
              No open sessions
            </div>
          )}
        </div>
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  );
};

export default CatSessions;
