import CompetitionDashboard from "@/components/competitions/list";
// import { MainSideBar } from "@/components/MainSideBar/MainSideBar";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import React from "react";

function Competitions() {
  return (
    <>
      <Head>
        <title> Competitions</title>
      </Head>
      <header>
        <Topbar />
      </header>
      <main className="flex-grow flex flex-col items-center justify-start pb-12 pt-[40px] ">
        <section className="w-full max-w-[1920px] px-4">
          <CompetitionDashboard />
        </section>
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  );
}

export default Competitions;
