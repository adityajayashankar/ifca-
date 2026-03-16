import ComThreadLayout from "@/components/comThreadLayout";

const ComThreads = ({ blogId, sessionId, replyPostId }) => {
  return (
    <ComThreadLayout
      blogId={blogId}
      sessionId={sessionId}
      replyPostId={replyPostId}
      isGreeting
    />
  );
};

export default ComThreads;
