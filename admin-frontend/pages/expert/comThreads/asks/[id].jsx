import ComThreadLayout from "@/components/comThreadLayout";

const ComThreads = ({ blogId, sessionId, replyPostId }) => {
  return (
    <ComThreadLayout
      blogId={blogId}
      sessionId={sessionId}
      replyPostId={replyPostId}
      isAsk
    />
  );
};

export default ComThreads;
