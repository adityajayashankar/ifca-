import VideoConference from "@/components/100ms";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import { useLayoutEffect, useState } from "react";
import { useSelector } from "react-redux";

function Room() {
  const [res, setres] = useState();
  const user = useSelector(selectUser);

  const router = useRouter();
  const roomId = router.query.id;

  const expertId = router.query.expertId;

  useLayoutEffect(() => {
    const check = async () => {
      const { data } = await api.post(
        `/order/verifyOrderOwership/${expertId ? expertId : user?.id}`,
        {
          roomId: roomId,
          isExpert: expertId ? true : false,
        }
      );

      if (!data.isOwner) {
        return router.push(`/classDetails/${data.sessionId}`);
      } else {
        setres(data);
      }
    };

    (expertId || user) && check();
  }, [roomId, expertId]);

  return (
    <div>
      {res !== undefined && (
        <VideoConference
          userId={parseInt(user?.id)}
          userName={user?.name}
          roomId={roomId}
          role={res?.role}
          Catchup={null}
        />
      )}
    </div>
  );
}

export default Room;
