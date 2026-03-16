import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import styles from "./playVideo.module.scss";
import SendIcon from "@mui/icons-material/Send";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { selectSession } from "@/store/features/sessionSlice";
import { useEffect, useState } from "react";
import moment from "moment";
import ReactPlayer from "react-player";

import { useRouter } from "next/router";
import api from "@/utils/apiSetup";

const PlayVideo = () => {
    const user = useSelector(selectUser);
    const selectedSession = useSelector(selectSession)

    const [sessionThreads, setSessionThreads] = useState([]);
    const router = useRouter();
    const [message, setMessage] = useState("");
    const [sessionSlot, setSelectedSlot] = useState(null);
    const [isInfo, setIsinfo] = useState(false);

    useEffect(() => {
        let sessionSlotId = parseInt(router.query["id"]);
        if (sessionSlotId) {
            api
                .get(`/sessionThreads/${sessionSlotId}`)
                .then((res) => {
                    setSessionThreads(res.data);
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }, [router.query]);

    useEffect(() => {
        let id = parseInt(router.query["id"]);
        if (selectedSession && id) {
            let data = selectedSession?.SessionSlot?.filter((item) => {
                return item?.id === id;
            })[0];
            setSelectedSlot(data)
        }
    }, [router.query]);

    const handleSendMessage = () => {
        console.log(message);
        setMessage("");
        let sessionSlotId = router.query["id"];
        let obj = {
            title: message,
            creatorId: parseInt(user?.unifiedUser?.id),
            sessionSlotId: parseInt(sessionSlotId),
            assetsData: [],
        };
        console.log(obj);
        api
            .post("/sessionThreads", { ...obj })
            .then((res) => {
                console.log(res);
                setSessionThreads([...sessionThreads, res.data]);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const getFormattedTime = (x) => {
        const date = new Date(x);
        const day = ("0" + date.getDate()).slice(-2);
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const hours = ("0" + date.getHours()).slice(-2);
        const minutes = ("0" + date.getMinutes()).slice(-2);

        const ddmm = day + "/" + month;
        const time = hours + ":" + minutes;

        const output = ddmm + " " + time;

        return output;
    };

    return (
        <>
            <Head>
                <title>Video</title>
            </Head>
            <header>
                <Topbar />
            </header>
            <main className={styles.playVideo}>
                <p className={styles.playVideoPath}>
                    Home &gt; Class Details &gt; {selectedSession?.title}{" "}
                </p>
                <div className={styles.playVideoContainer}>
                    <div className={styles.left}>
                        <ReactPlayer
                            url={sessionSlot?.videoUrl !== '' ? sessionSlot?.videoUrl : "/sample.mp4"}
                            controls={true}
                            width="100%"
                            height="100%"
                        />
                    </div>
                    <div className={styles.right}>
                        <div className={styles.btmPart}>
                            <div className={styles.navLinks}>
                                <div onClick={() => setIsinfo(false)} className={isInfo ? 'cursor-pointer' : styles.active}>
                                    <ChatOutlinedIcon fontSize="large" /> Chat
                                </div>
                                <div onClick={() => setIsinfo(true)} className={isInfo ? styles.active : 'cursor-pointer'}>
                                    <InfoOutlinedIcon fontSize="large" /> Info
                                </div>
                            </div>
                            <div className={styles.bottomPart}>
                                {
                                    isInfo ? (
                                        <div className="p-4">
                                            <p className="font-bold text-2xl underline underline-offset-2">About this session</p>
                                            <p className="text-xl mt-4">
                                                <span>
                                                    <span className="font-bold">Session Title: </span>
                                                </span>
                                                {selectedSession?.title}
                                            </p>
                                            <p className="text-xl mt-4">
                                                <span>
                                                    <span className="font-bold">Session Description: </span>
                                                </span>
                                            </p>
                                            <p className="overflow-y-auto h-20">
                                                {selectedSession?.desc}
                                            </p>
                                            <p className="text-xl mt-4">
                                                <span>
                                                    <span className="font-bold">Speaker </span>
                                                </span>
                                            </p>
                                            <div className="ml-6">
                                                <p className="text-lg mt-1">
                                                    <span>
                                                        <span className="font-medium">Name: </span>
                                                    </span>
                                                    {sessionSlot?.speakers?.name}
                                                </p>
                                                <p className="text-lg mt-1">
                                                    <span>
                                                        <span className="font-medium">Email: </span>
                                                    </span>
                                                    {sessionSlot?.speakers?.email}
                                                </p>
                                            </div>
                                            <p className="text-xl mt-6">
                                                <span>
                                                    <span className="font-bold">Uploaded At: </span>
                                                    {moment(sessionSlot?.createdAt).format("DD/MM/YYYY")}
                                                </span>
                                            </p>
                                        </div>
                                    )
                                        :
                                        (
                                            <>
                                                <div className={styles.chatArea}>
                                                    {
                                                        sessionThreads?.map((thread, index) => {
                                                            return (
                                                                <div className={styles.chat} key={index}>
                                                                    <h4 className="mb-2">{thread.creator.user.name}</h4>
                                                                    <p>{thread.title}</p>
                                                                    <span>{getFormattedTime(thread.createdAt)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                                <div className={styles.inputContainer}>
                                                    <div className={styles.inputWrapper}>
                                                        <input
                                                            type="text"
                                                            placeholder="Type something here..."
                                                            value={message}
                                                            onChange={(e) => setMessage(e.target.value)}
                                                        />
                                                        <span onClick={() => handleSendMessage()}>
                                                            <SendIcon />
                                                        </span>
                                                    </div>
                                                </div>
                                            </>
                                        )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default PlayVideo;