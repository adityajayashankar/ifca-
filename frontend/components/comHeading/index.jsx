import NotificationsIcon from "@mui/icons-material/Notifications";
import { useSelector } from "react-redux";
import { selectCommunity } from "@/store/features/communitySlice";

const ComHeading = () => {
  const currentCommunity = useSelector(selectCommunity);

  return (
    <div className="flex items-center gap-5">
      <img
        className="w-[75px] h-[75px] object-cover rounded-full"
        src={currentCommunity?.bannerImg || "/comPic.svg"}
        alt=""
      />
      <span className="text-black font-semibold text-2xl">
        {currentCommunity?.title} Community
      </span>
      <span className="text-gray-500 font-medium text-lg">Joined</span>
      {/* <span><NotificationsIcon /></span> */}
      {/* background-color: #D9D9D9;
        color: #3554C5;
        border-radius: 50%;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center; */}
    </div>
  );
};

export default ComHeading;
