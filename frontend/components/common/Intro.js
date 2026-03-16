import React, { useState } from "react";

function Intro({ titles, selectedTitle, setSelectedTitle }) {
  return (
    <div className="w-full flex flex-col mt-10 p-3">
      <div className="flex flex-wrap items-center mx-auto rounded-[25px] md:rounded-[50px] py-2 px-4 bg-slate-300 md:py-5 md:px-7">
        <span className="flex font-semibold">I want to ...</span>
        {titles?.map((title, index) => (
          <div
            key={index}
            onClick={() => setSelectedTitle(titles[index])}
            className={` mt-2 md:mt-0 text-center font-semibold p-2 ml-4 rounded-3xl cursor-pointer ${
              title._id === selectedTitle._id ? "bg-red-200" : "font-light"
            }`}
          >
            {title.title}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap md:grid w-full md:grid-cols-3 mt-8 max-w-[90vw] mx-auto">
        {selectedTitle?.points?.map((description, index) => (
          <div className="flex m-2">
            <div className="font-semibold text-5xl text-[#BB274B]">
              {index + 1}
            </div>
            <div className="flex flex-col ml-4">
              <div className="font-semibold text-xl">
                {description?.subHeader}
              </div>
              <div>{description?.main}</div>
              {description?.img && (
                <div className="flex items-center m-auto">
                  <img
                    src={description.img}
                    alt="desc text"
                    className="object-fill h-[200px] p-2 max-w-[150px] w-full"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Intro;
