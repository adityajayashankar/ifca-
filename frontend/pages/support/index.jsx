import React from "react";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import Image from "next/image";

const Support = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>Support | IFCA</title>
      </Head>
      <Topbar />
      {/* Banner Image */}
      <div className="relative w-full h-48 md:h-64 flex items-center justify-center overflow-hidden shadow-md">
        <Image
          src="/cooking-banner.jpg" // Place a relevant cooking image in public/cooking-banner.jpg
          alt="Cooking Banner"
          layout="fill"
          objectFit="cover"
          className="z-0"
          priority
        />
        {/* Enhanced gradient overlay for texture */}
        <div className="absolute inset-0 z-10" style={{
          background: "radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 60%, rgba(0,0,0,0.35) 100%), linear-gradient(120deg, rgba(255,153,0,0.10) 0%, rgba(255,255,255,0.00) 60%, rgba(0,0,0,0.25) 100%)"
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-20" />
        <div className="relative z-30 flex flex-col items-center justify-center w-full">
          <Image
            src="/logoifca.png"
            alt="IFCA Logo"
            width={178}
            height={38}
            objectFit="contain"
            className="drop-shadow-lg"
            priority
          />
        </div>
      </div>
      <div className="pt-8 max-w-3xl mx-auto px-4 pb-16 min-h-[45vh]">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 -mt-16 relative z-30 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Support</h1>
          <p className="text-gray-600 text-center mb-2">
            For any queries, please contact us at <a href="mailto:analyst@pesuventurelabs.com" className="text-blue-600 underline">analyst@pesuventurelabs.com</a>
          </p>
          {/* Add more support content here */}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Support;
