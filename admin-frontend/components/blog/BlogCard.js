import { numDays } from "@/utils/numDays";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

const BlogCard = ({
  title,
  content,
  tags,
  author,
  blogId,
  createdAt,
  draft,
  communityId,
  baseURL,
  isArchived,
}) => {
  const router = useRouter();
  const days = numDays(createdAt);
  const handleRouteBlog = (e) => {
    e.preventDefault();
    if (draft) {
      router.push(`/${baseURL}/blog/create/${blogId}`);
    } else {
      router.push(`/${baseURL}/blog/${blogId}`);
    }
  };
  return (
    <div className=" p-5 bg-colorpop border border-gray-200 rounded-lg text-black shadow-xl m-8 flex flex-col">
      {/* <a href="#">
        <img className="rounded-t-lg" src="/docs/images/blog/image-1.jpg" alt="" />
      </a> */}
      <div className="flex flex-col md:flex-row justify-between w-full items-center">
        {tags && (
          <div className="flex flex-wrap ">
            {tags?.map((item, index) => (
              <div
                className={`bg-green-600 text-white my-auto text-xs ml-2 px-2 p-1 rounded mt-1`}
                key={index}
              >
                {item.tag.name}
              </div>
            ))}
          </div>
        )}

        {draft ? (
          <div
            className={`bg-yellow-200 text-black my-auto text-xs m-2 px-2 p-1 rounded m`}
          >
            Draft
          </div>
        ) : (
          <div className="text-sm">{days}</div>
        )}
      </div>
      <div className="flex flex-col text-left">
        <h5 className="mb-2 text-2xl font-bold tracking-tight  ">
          {title || "Noteworthy technology acquisitions 2021"}
        </h5>
        <p className="mb-3 font-normal h-32">
          {content ||
            "Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order."}
        </p>
      </div>
      <div className="flex flex-col md:flex-row justify-between w-full items-center">
        <div className="flex flex-wrap items-center">
          <img
            src={
              author?.photoURL ||
              "https://publisher.flowbite.com/content/images/2022/12/david-dumont-profile-picture.jpeg"
            }
            className="w-10 h-10 rounded-full"
          />
          <div className="flex flex-col items-start">
            <p className="font-semibold ml-4">{author?.name || "amit"}</p>
            {/* <p className="font-light"> Investor, Friendly bitch</p> */}
          </div>
        </div>

        <div className="text-sm flex">
          {/* <Link href={`/expert/blog/${blogId}`} passHref> */}
          {isArchived && (
            <div
              className={`bg-yellow-300 text-black my-auto text-xs m-2 px-2 p-1 rounded m`}
            >
              Archived
            </div>
          )}
          <button
            //   href="#Contactus"
            onClick={handleRouteBlog}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#7C58F6] rounded-lg hover:bg-blue-800 
          focus:ring-4 focus:outline-none focus:ring-blue-300 cursor-pointer "
          >
            Read More
            <svg
              aria-hidden="true"
              className="w-4 h-4 ml-2 -mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </button>
          {/* </Link> */}
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
