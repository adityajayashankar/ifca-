import React from "react";
import CategoryCard from "../community/categorycard";
import Card from "./Card";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper";

const ResourceCarousel = ({ arr, isCommunity, isDelete, fun, baseURL }) => {
  return (
    // <div className={isCommunity ? "grid grid-cols-4" : "grid md:grid-cols-3"}>
    <div className="w-full">
      <Swiper
        modules={[Pagination, Navigation]}
        spaceBetween={isCommunity ? 30 : 10}
        breakpoints={{
          1100:{
            slidesPerView:
            fun != "none" ? (isCommunity ? 3 : 3) : isCommunity ? 5 : 3,
          },
          600: {
            slidesPerView:
              fun != "none" ? (isCommunity ? 3 : 2) : isCommunity ? 3 : 1,
          },
          300: {
            slidesPerView:
              fun != "none" ? (isCommunity ? 1 : 1) : isCommunity ? 2 : 1,
          },
        }}
        navigation
        pagination={{ clickable: true }}
      >
        {isCommunity
          ? arr?.map((item) => {
              return (
                <SwiperSlide className="">
                  <div className={fun != "none" ? "pr-1 mb-8" : "mb-8"}>
                    <CategoryCard category={item} baseURL={baseURL} />
                    {fun != "none" ? (
                      <button
                      type="button"
                        className={
                          isDelete
                            ? "bg-red-800 text-white px-2 py-2 my-1 rounded-lg w-full"
                            : "bg-blue-800 text-white px-2 py-2 my-1 rounded-lg w-full"
                        }
                        onClick={() => fun(item)}
                      >
                        {isDelete ? <>Remove</> : <>Add</>}
                      </button>
                    ) : (
                      <></>
                    )}
                  </div>
                </SwiperSlide>
              );
            })
          : arr?.map((item, index) => {
              return (
                <SwiperSlide>
                  <div className={fun != "none" ? "mb-8" : "mb-8"}>
                    <Card
                      session={item}
                      key={"session-" + index}
                      view={true}
                      baseURL={baseURL}
                    />
                    {fun != "none" ? (
                      <div className="w-full xl:w-5/6">
                        <button
                        type="button"
                          className={
                            isDelete
                              ? "bg-red-800 text-white px-2 py-2 my-1 rounded-lg w-full"
                              : "bg-blue-800 text-white px-2 py-2 my-1 rounded-lg w-full"
                          }
                          onClick={() => fun(item)}
                        >
                          {isDelete ? <>Remove</> : <>Add</>}
                        </button>
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
        {/* </div>  */}
      </Swiper>
    </div>
  );
};

export default ResourceCarousel;
