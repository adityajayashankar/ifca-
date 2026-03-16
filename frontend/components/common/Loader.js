import { CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import { selectLoading } from "../../store/features/userSlice";

const Loading = () => {
  const loader = useSelector(selectLoading);

  if (loader) {
    return (
      <div className="w-screen h-screen bg-black/50 fixed top-0 left-0 flex items-center justify-center z-[999]">
        <div className="bg-white rounded-lg flex flex-col justify-center items-center p-5">
          <CircularProgress />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Loading;
