import RoomComponent from "@/components/room";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { HMSRoomProvider } from "@100mslive/react-sdk";

export default function Room() {
    const router = useRouter();
    const roomId = router?.query.roomId;

    const user = useSelector((state) => state?.user.user);

    return (
        <HMSRoomProvider>
            <RoomComponent
                userId={user?.id}
                userName={user?.name}
                roomId={roomId}
                role="host"
            />
        </HMSRoomProvider>
    )
}