import { selectUser } from "@/store/features/userSlice";
import ScheduleIcon from "@mui/icons-material/Schedule";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import sessionRoomType from "../../utils/sessionRoomType";
import { setMeetDetails, selectMeetDetails } from "@/store/features/userSlice";
import { useRouter } from "next/router";
import axios from "axios";

const SessionScheduleCard = ({ session, isCompleted = false }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const router = useRouter();

  // function handleClick() {
  //   if (session.isCourse) {
  //     router.push("/playVideo/" + session?.SessionSlot[0]?.id);
  //     return;
  //   }
  //   let details = {
  //     roomId: session?.roomId,
  //     role: session?.sessionType === sessionRoomType[1] ? "host" : "guest",
  //     userId: user?.id,
  //     userName: user?.name,
  //   };
  //   dispatch(setMeetDetails(details));
  //   router.push("/room/" + session?.roomId);
  // }

  const handleClick= async ()=>{
    const management_Token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNjUyYTM1NTNjYTU4NDhmMGUzZDQ2ZDlmIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJpYXQiOjE3MzYwMDU1MzgsIm5iZiI6MTczNjAwNTUzOCwiZXhwIjoyNTk5OTE5MTM4LCJqdGkiOiJmMDNhZTI4NS0wOWM2LTQzNGMtODRhNC1lZTRhNDIxMDg0NWQifQ.1HBmQv415bKF8bs2zZV__9JBzCw1cfQ9oJH9kFBeKc4'

    try {

      if (session.isCourse) {
        router.push("/playVideo/" + session?.SessionSlot[0]?.id);
        return;
      }
      const response = await axios.post(`https://api.100ms.live/v2/room-codes/room/${session?.roomId}`,
      {}, 
      {
        headers: {
          Authorization: `Bearer ${management_Token}`,
          "Content-Type": "application/json",
        },
      });
      const guestCode = response.data.data.find(item => item.role === 'guest');

    if (guestCode) {
      const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}`;
      if (typeof window !== "undefined") {
        window.open(redirectUrl, "_blank");
      }
    }
    

    } catch (error) {
      console.error("Error", error);
    }
  }

  return (
    <div className="mb-12">
      <h1 className="text-lg md:text-[36px]">
        {moment(session?.SessionSlot[0].startTime).format("MMMM DD, dddd")}
      </h1>
      <div className="flex items-center justify-between bg-white rounded-[10px] p-[4px] md:p-[10px] gap-0 md:gap-[40px] font-[600] my-[10px] md:my-[30px] card-shadow">
        <div className="flex items-center gap-4">
          <div
            className={`flex flex-col md:flex-row items-center gap-[5px] ml-[5px]`}
          >
            <ScheduleIcon className="text-[12px] md:text-[14px]" />
            <div>
              <p className="whitespace-nowrap m-[5px] text-[12px] md:text-[14px]">
                {moment(session?.SessionSlot[0].startTime).format("h:mm a")}
              </p>
              <p className="m-[5px] text-[12px] md:text-[14px]">
                {moment(session?.SessionSlot[0].startTime).format("dddd")}
              </p>
            </div>
          </div>
          <div className="w-full md:w-auto">
            <h3 className="line-clamp-1 text-[14px] md:text-[20px] m-[5px] font-bold">
              {session.title} - {session.SessionSlot[0]?.topicName}
            </h3>
            <p className="capitalize text-[12px] md:text-[14px] m-[5px] font-medium">
              By {session.SessionSlot[0]?.speakers?.[0]?.name}
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              {isCompleted ? (
                <></>
              ) : session.SessionSlot[0].isOnline ? (
                <div
                  className="whitespace-nowrap flex justify-center px-1 py-2 md:px-6 md:py-3 rounded-lg gradient_background w-auto min-w-[100px] md:w-[200px] cursor-pointer text-white mr-2 text-[14px] md:text-[18px]"
                  onClick={() => handleClick()}
                >
                  Join Now
                </div>
              ) : (
                <p className="m-[5px] text-[12px] md:text-[14px]">
                  {session.SessionSlot[0].topicName}
                </p>
              )}
              <div
  className="whitespace-nowrap flex justify-center px-1 py-2 md:px-6 md:py-3 rounded-lg gradient_background w-auto min-w-[100px] md:w-[200px] cursor-pointer text-white mr-2 text-[14px] md:text-[18px]"
  onClick={() => router.push(`/classDetails/${session.id}`)}
>
  Session Details
</div>
            </div>
          </div>
        </div>
        <div className="md:hidden lg:block">
          <img
            src={session.infoImgs?.[0] || session.bannerImgs?.[0] || "/tablaSchedule.svg"}
            alt={session.title}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.target.src = "/tablaSchedule.svg";
              e.target.onerror = null; // Prevent infinite loop
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionScheduleCard;
