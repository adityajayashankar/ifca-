import React, { useState } from 'react'

import {
    useHMSStore,
    selectPeerAudioByID,
    selectIsPeerAudioEnabled,
    selectLocalPeer,
    useHMSActions,
    selectPeerMetadata
} from "@100mslive/react-sdk"

import { BsThreeDotsVertical } from "react-icons/bs"
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai"
import { HiOutlineHand } from "react-icons/hi"

import NameCard from './NameCard'
// speaker can talk, listener cannot turn on their mic, moderator can control other peers

function AudioCard({ peer }) {
    console.log("peeer is", peer);
    const level = useHMSStore(selectPeerAudioByID(peer.id)) || 0;
    const audioEnabled = useHMSStore(selectIsPeerAudioEnabled(peer.id));
    const localPeer = useHMSStore(selectLocalPeer);
    const isModerator = ['moderator', 'host', 'stage'].includes(localPeer?.roleName);
    const hmsActions = useHMSActions();
    const [menuOpen, setMenuOpen] = useState(false)

    const mutePeer = () => {
        console.log(peer)
        hmsActions.setRemoteTrackEnabled(peer.audioTrack, false);
    };
    const changeRole = (role) => {
        // console.log("before changing, peer is => ", peer)
        hmsActions.changeRoleOfPeer(peer?.id, role, true);
    };

    // console.log("levell ", level)
    // const btnClass = 'flex w-32 text-sm font-semibold hover:bg-gray-800 p-2';

    // console.log("audio for ",peer?.name,audioEnabled)
    const metaData = useHMSStore(selectPeerMetadata(peer?.id));

    return (
        <div className='m-2 h-full bg-white rounded-full my-auto p-[40px] mt-4'
            style={{
                boxShadow: `0px 0px ${level || 0 / 4}px #3d5afe`,
            }}>
            {/* <div className='relative w-full'> */}
            <div className='flex flex-col items-center justify-center text-center'>
                <p className='font-bold text-sm'>{peer.name}</p>
                {/* <NameCard peer={peer}/> */}
                <p className='flex items-center font-semibold text-gray-400 text-xs'>
                    {audioEnabled ? (
                        <span><AiOutlineAudio /></span>
                    ) : (
                        <span><AiOutlineAudioMuted /></span>
                    )}{' '}
                    {peer.roleName}{" "}<span className="m-2 my-auto text-yellow-400">{metaData?.isHandRaised && <HiOutlineHand />}</span>
                </p>
                {/* </div> */}
            </div>
            {
                (isModerator && (localPeer?.id !== peer?.id)) ? (
                    // <Permission id={peer.id} audioTrack={peer.audioTrack} />
                    <div className='absolute left-0 top-0 pl-[30px] mt-3 '>
                        <div as='button' className='rounded-md px-1 relative group cursor-pointer' onClick={() => setMenuOpen(!menuOpen)}>
                            <BsThreeDotsVertical />
                        </div>
                        {menuOpen && (<div className='flex py-2 flex-col bg-white border-2 p-2 text-gray-500 rounded-md'>
                            <button className={` hover:bg-gray-200`} onClick={() => mutePeer()}>
                                Mute
                            </button>
                            <button className={` hover:bg-gray-200`} onClick={() => changeRole('listener')}>
                                Make Listener
                            </button>
                            <button className={` hover:bg-gray-200`} onClick={() => changeRole('speaker')}>
                                Make Speaker
                            </button>
                        </div>)}
                    </div>
                ) : null
            }
        </div>
    )
}

export default AudioCard