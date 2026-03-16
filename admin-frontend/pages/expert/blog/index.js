import BlogCard from "@/components/blog/BlogCard";
import {
  selectAllBlogs,
  selectExpertBlogs,
  setExpertBlogs,
} from "@/store/features/blogSlice";
import { selectUser } from "@/store/features/userSlice";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resolveUnifiedUser } from "@/utils/resolveUser";
const AllBlogPage = () => {
  let communities = [];
  const router = useRouter();
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const expertBlogs = useSelector(selectExpertBlogs);
  const allBlogs = useSelector(selectAllBlogs);
  const [imgUrl, setImgUrl] = useState("");
  console.log(expertBlogs);
  useEffect(() => {
    if (user) {
      dispatch(setExpertBlogs(user.unifiedUserId.id));
    }
  }, []);
  return (
    <div className="min-h-screen w-full">
      <section className="text-center py-10 max-w-7xl mx-auto">
        <div className="input__group__header">
          <h2>Your Blogs</h2>
          <button
            className="button button-blue"
            onClick={() => router.push("/expert/blog/create")}
          >
            + Add Blog
          </button>
        </div>
        <div className="px-4 grid grid-cols-1 md:grid-cols-2">
          {expertBlogs?.map((item) => (
            <BlogCard
              blogId={item.id}
              title={item.title}
              content={item.glance}
              tags={item.BlogTags}
              author={resolveUnifiedUser(item.author)}
              draft={item.draft}
              baseURL={"expert"}
              createdAt={item.createdAt}
            />
          ))}
          {/* <BlogCard blogId={1} /> */}
        </div>
        <div className="input__group__header">
          <h2>You might like</h2>
        </div>
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto gap-6 my-10 py-10 max-w-7xl">
          {/* {communities?.map((category, index) => {
            return (
              <CategoryCard
                category={category}
                baseURL={"expert"}
                key={"category" + index}
              />
            );
          })}
          {(!communities || communities.length === 0) && (
            <p>No blogs yet</p>
          )} */}
        </div>
      </section>
    </div>
  );
};

export default AllBlogPage;
