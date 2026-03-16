import { React, useState, useEffect, useRef } from "react";
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import api from "@/utils/apiSetup";
import { BiDownArrow } from "react-icons/bi";
import io from 'socket.io-client'

// components
import SidebarComponent from "@/components/chat/sidebar";
import Markup from "@/components/chat/markup";
import UserMesssage from "@/components/chat/userMessage";
import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";

// const ENDPOINT = 'http://localhost:5001'
const ENDPOINT = 'http://ec2-15-206-94-58.ap-south-1.compute.amazonaws.com:5001/'

const Sidebar = () => {

    let socket = io(ENDPOINT)
    const router = useRouter();
    const [queryId, setQueryId] = useState();

    const messageRef = useRef(null);
    const [channels, setChannels] = useState([]);
    const [dms, setDms] = useState([]);

    const [messages, setMessages] = useState({});

    const [active, setActive] = useState(true);
    const [activeName, setActiveName] = useState({});
    const [activeChannelId, setActiveChannelId] = useState();

    const [activeUsers, setActiveUsers] = useState(true);
    const [data, setData] = useState('');

    const [status, setStatus] = useState(true)
    const [user, setUser] = useState({})  //this will store current user details 
    const [open, setOpen] = useState(true)

    useEffect(() => {

        const { id } = router.query;

        setQueryId(parseInt(id))

        if (id) {
            // get user channels and dms 
            api.get(`/channel/userchannels/${parseInt(id)}`).then((res) => {
                // console.log(res.data)
                setChannels(res.data?.channels)
                setDms(res.data?.dms)
            })
            // api.get(`/chat/user/id/${parseInt(id)}`).then((res) => {
            //     // console.log(res.data)
            //     setUser(res.data)
            // })
        }
    }, [router])

    useEffect(() => {
        socket.on('message received', (newMessageRecieved) => {
            // console.log("new message is", newMessageRecieved)
            let { channel, ...message } = newMessageRecieved['messageReceived'];
            console.log("channel id is", activeChannelId)
            console.log("message chanel id is", newMessageRecieved['messageReceived'].channelId)
            if (newMessageRecieved.messageReceived.channelId && activeChannelId) {
                if (parseInt(newMessageRecieved['messageReceived'].channelId) === activeChannelId) {
                    console.log("updating from activeChannelId ")
                    setMessages((prev) => ({ ...prev, [message.id]: message }))
                }
            }else{
                console.log('input data failed at 73')
            }
        })
    })
    // console.log("active name is ",activeName)
    useEffect(() => {
        console.log(`Set new active channel Id`,activeChannelId)
        socket.emit("setup", { id: parseInt(queryId) })

        socket.emit("join chat", parseInt(activeName.id));

        if (activeChannelId) {
            setData("")
            api.get(`/message/channelmessage/${activeChannelId}`).then((res) => {
                // console.log(res.data)
                let temp = {}
                console.log("fetched")
                res?.data.messages.forEach((element) => temp[element.id] = element);
                setMessages(temp)
            })
        }

        
    }, [activeChannelId])

    useEffect(()=>{
        toast(`Go back by clicking on community name on top-left`);
    },[])
    useEffect(() => {
        messageRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages])

    const sendBtn = () => {
        let temp = data;
        let stri = temp.replace(/<[^>]*>?/gm, '');
        // console.log(stri.trim().length)
        if (stri.trim().length === 0) {
            console.log("Empty Message");
            toast('Cant sent empty message',{type:'warning'})
            setData('')
            setStatus(true);
        }
        else {
            setStatus(false);
            // console.log("activeName ", activeName)
            api.post(`/message`, {
                channelId: parseInt(activeName.id),
                senderId: parseInt(queryId),
                content: data,
            }).then((res) => {
                socket.emit('new message', res.data.message)
                let { channel, ...message } = res.data.message
                console.log(res.data.message)
                setMessages((prev) => ({ ...prev, [message.id]: message }))
                setData('')
                setStatus(true);
            })
                .catch((err) => {
                    console.log(err)
                    toast('Message Not Sent',{type:"warning"});
                    setStatus(true)
                })
        }
    }
    //check if ref is in view or not
    const disconnect=()=>{
        socket.disconnect();
    }
    return (
        <div className="w-screen">
            <div className="flex w-screen min-h-screen flex-row border-none">
                <SidebarComponent
                    className=""
                    channels={channels}
                    active={active}
                    activeName={activeName}
                    setActive={setActive}
                    setActiveName={setActiveName}
                    setActiveChannelId={setActiveChannelId}
                    activeUsers={activeUsers}
                    dms={dms}
                    setDms={setDms}
                    setActiveUsers={setActiveUsers}
                    user={user}
                    open={open}
                    setOpen={setOpen}
                    disconnect={disconnect}
                    style={'z-0'}
                />
                <div className="flex-1 md:flex-3 flex flex-col flex-grow lg:max-w-11/12">
                    {activeChannelId ? (
                        <div className="min-h-screen ">
                            <div className="flex p-1 border-b text-black bg-white font-bold text-3xl">

                                {(<IoIosArrowDropright

                                    className="cursor-pointer my-auto mr-1 ml-3 h-8 w-8 md:hidden text-[#fff] bg-slate-500 rounded-full shadow-2xl"
                                    onClick={() => setOpen(!open)}
                                />)
                                }

                                <div className="profile-img pl-1 my-auto mb-1 w-10 h-10 rounded-full " >
                                    <picture>
                                        <source srcSet={activeName?.photoURL} type="image/webp" />
                                        <img className="" src={activeName?.photoURL} alt="User image" />
                                    </picture>
                                </div>
                                <h1 className="my-auto text-xl ml-2">{activeName?.name}</h1>
                            </div>
                            <div className="flex min-w-full flex-wrap flex-col">
                                <div className="bg-white text-black h-[72vh] md:h-[75.4vh] overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
                                    {
                                        messages && (Object.values(messages)?.map((message, index) =>
                                        (<div className={`flex items-end w-full`} key={index + 1}>
                                            <UserMesssage
                                                key={index}
                                                index={index}
                                                content={message?.content}
                                                sender={message?.sender}
                                                queryId={queryId}
                                                message={message}
                                                isExpert={message?.sender?.expertId}
                                            />
                                        </div>
                                        )
                                        ))
                                    }
                                    <div className="relative">


                                        <div ref={messageRef} />
                                        <div className="">

                                        </div>
                                    </div>
                                </div>
                                <div className="relative h-[15vh]">
                                <div className="absolute bottom-0 w-full rounded-2xl mb-1 z-0" >
                                    <button onClick={() => {
                                        messageRef.current?.scrollIntoView({ behavior: 'smooth' });
                                    }} className="fixed text-lg md:text-2xl rounded p-1 right-[20px] bottom-[190px] md:bottom-[150px] bg-white text-black ">

                                        <BiDownArrow />
                                    </button>
                                    <Markup className="" data={data} status={status} onClick={sendBtn} setData={setData} />
                                </div>
                                </div>
                            </div>
                        </div>) : (
                        <div className="mx-auto my-auto font-bold z-0 ">
                            CHOOSE CHANNEL TO DISPLAY MESSAGES !
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Sidebar;