import React from "react";
import Image from "next/image";
const ComingSoon = () => {
  return (
    <div className="h-full p-4">
      <div className="w-full h-full blur-md absolute top-0 left-0">
        {/* Image container */}
        <Image
          src={"/assets/images/back.webp"}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center">
        <h1 className="z-2 text-black text-6xl drop-shadow-xl ml-6">
          Welcome to IFCA!
          <br />
          <span className="text-[#0C74D4]">
          Helping individuals & organizations dedicated to helping startups!
          </span>
        </h1>
      </div>
    </div>
  );
};

export default ComingSoon;
