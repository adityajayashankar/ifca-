import CreateVideoForm from "@/components/video/CreateVideoForm";

function EditVideo() {
  return (
    <div className="page flex flex-col gap-6 items-center">
      <h1 className="text-center">Update Video</h1>
      <CreateVideoForm baseURL={"admin"} isEdit={true} />
    </div>
  );
}

export default EditVideo;
