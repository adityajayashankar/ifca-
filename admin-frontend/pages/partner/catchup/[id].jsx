import VideoConference from "@/components/100ms";
import { HMSRoomProvider } from "@100mslive/react-sdk";
import { selectCommunity } from "@/store/features/communitySlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useLayoutEffect, useState } from "react";
import { useSelector } from "react-redux";

const catchup = () => {
  const [res, setres] = useState();
  const user = useSelector(selectUser);
  const router = useRouter();
  const info = window.location.href.split("/");
  const roomId = info[5];
  const currentCommunity = useSelector(selectCommunity);

  // const roomId=info.split('&')[0]
  // const userId = parseInt(info.split('&')[1])
  // const comId = parseInt(info.split('&')[2])

  // const users = selectCommunityUsers(comId)
  // useLayoutEffect(() => {
  //   const check = async () => {
  //   //   const { data } = await api.get(
  //   //     `/catchup/verifyMember/${userId}/${comId}`,
  //   //   );
  //   console.log(comId);
  //   console.log(users);
  //     // if (!data.isMember) {
  //     //   return router.push(`/classDetails/${data.sessionId}`);
  //     // } else {
  //     //   setres(data);
  //     // }
  //   };

  //   (userId || user) && check();
  // }, [roomId, userId]);
  useEffect(() => {
    console.log(roomId);
    // console.log("HELLO");
  }, []);
  return (
    <div>
      {/* {res !== undefined && ( */}
      <HMSRoomProvider>
        <VideoConference
          userId={parseInt(user?.unifiedUser?.id)}
          userName={user?.name}
          roomId={roomId}
          role={"host"}
          Catchup={{ roomId: roomId, comId: currentCommunity.id }}
        />
      </HMSRoomProvider>
      {/* )} */}
    </div>
  );
};

export default catchup;
