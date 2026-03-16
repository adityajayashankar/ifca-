import BlogRender from "@/components/blog/BlogRender";
import LHS from "@/components/blog/LHS";
import RHS from "@/components/blog/RHS";
import { selectOneBlog, setSelectedBlog } from "@/store/features/blogSlice";
import { resolveUnifiedUser } from "@/utils/resolveUser";
import { useRouter } from "next/router";
import React, { useEffect, useRef } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
const ViewBlogPage = ({}) => {
  //   const [content, setContent] = useState("");
  // console.log(blogData);
  const blogData = useSelector(selectOneBlog);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    if (router?.query["blogId"]) {
      dispatch(setSelectedBlog(router?.query["blogId"]));
    }
  }, [router]);
  const divRef = useRef();
  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = blogData.content;
    }
  }, [blogData, divRef]);
  const handleRouteBack = (e) => {
    e.preventDefault();
    router.push(`/admin/blog`);
  };
  return (
    <div className="mx-auto max-h-screen overflow-hidden lg:max-w-6xl mt-8">
      {blogData && (
        <main className="grid grid-cols-9">
          <LHS
            tags={blogData.BlogTags}
            blogId={blogData.id}
            numLikes={blogData._count.BlogLikes}
            numReplies={blogData._count.Post}
            liked={false}
            createdAt={blogData.createdAt}
            baseURL={`admin`}
            author={resolveUnifiedUser(blogData.author)}
          />
          <BlogRender handleRouteBack={handleRouteBack} blogData={blogData} />
          <RHS author={resolveUnifiedUser(blogData.author)} />
        </main>
      )}
    </div>
  );
};

export default ViewBlogPage;

// export async function getServerSideProps(context) {
//   const res = await fetch(
//     `http://localhost:5000/api/v1/blog/${context.query["blogId"]}`
//   );
//   const { blog } = await res.json();
//   return {
//     props: { blogData: blog }, // will be passed to the page component as props
//   };
// }
