import React, { useState, useEffect, useRef } from 'react'
import NameCard from './NameCard'
import { useHMSActions, useHMSStore, selectPeers, selectHMSMessages, selectLocalPeer, selectPermissions } from "@100mslive/react-sdk"
import { toast } from "react-toastify";
import { BiMicrophone, BiMicrophoneOff, BiVideoOff, BiVideo } from "react-icons/bi";

function Messages({ sideMenu, setSideMenu, handRaisedPeers = new Set(), dominantSpeakerId, isModerator = false }) {

    const hmsActions = useHMSActions();
    const localPeer = useHMSStore(selectLocalPeer);
    const permissions = useHMSStore(selectPermissions);
    const [inputValues, setInputValues] = useState("");
    const peers = useHMSStore(selectPeers);
    const allMessages = useHMSStore(selectHMSMessages); // get all messages
    const [typingUsers, setTypingUsers] = useState(new Map()); // Map of peerId -> userName
    const typingTimeoutRef = useRef(null);
    const lastTypingBroadcastRef = useRef(0);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Filter out typing indicator messages and activity sync messages from chat
    const actualMessages = allMessages?.filter((msg) => {
        try {
            const messageData = JSON.parse(msg.message);
            return messageData.type !== 'TYPING_START' && 
                   messageData.type !== 'TYPING_STOP' &&
                   messageData.type !== 'ACTIVITY_CHANGE' &&
                   messageData.type !== 'ACTIVITY_COMPLETED';
        } catch (e) {
            return true; // Not JSON, it's a real message
        }
    }) || [];

    // Listen for typing indicators from other users
    useEffect(() => {
        if (!allMessages || allMessages.length === 0) return;

        const latestMessage = allMessages[allMessages.length - 1];
        
        // Check if it's a typing indicator message
        try {
            const messageData = JSON.parse(latestMessage.message);
            if (messageData.type === 'TYPING_START' || messageData.type === 'TYPING_STOP') {
                const senderId = latestMessage.senderId || latestMessage.sender;
                const senderName = latestMessage.senderName || 'Someone';
                
                // Don't show typing indicator for local user
                if (senderId === localPeer?.id) return;

                if (messageData.type === 'TYPING_START') {
                    setTypingUsers(prev => {
                        const newMap = new Map(prev);
                        newMap.set(senderId, senderName);
                        return newMap;
                    });

                    // Auto-remove typing indicator after 3 seconds
                    const timeoutId = setTimeout(() => {
                        setTypingUsers(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(senderId);
                            return newMap;
                        });
                    }, 3000);
                    
                    return () => clearTimeout(timeoutId);
                } else if (messageData.type === 'TYPING_STOP') {
                    setTypingUsers(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(senderId);
                        return newMap;
                    });
                }
            }
        } catch (e) {
            // Not a JSON message, ignore
        }
    }, [allMessages, localPeer?.id]);

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Auto-scroll to bottom when new messages arrive or typing indicator appears
    useEffect(() => {
        if (messagesEndRef.current && messagesContainerRef.current && sideMenu === 'chat') {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [actualMessages, typingUsers, sideMenu]);

    // Also scroll on initial load
    useEffect(() => {
        if (messagesEndRef.current && sideMenu === 'chat') {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 300);
        }
    }, [sideMenu]);

    const sendTypingIndicator = (isTyping) => {
        if (!hmsActions || !localPeer) return;
        
        const now = Date.now();
        // Throttle typing indicators (max once per 1 second)
        if (isTyping && now - lastTypingBroadcastRef.current < 1000) {
            return;
        }
        lastTypingBroadcastRef.current = now;

        try {
            const typingMessage = JSON.stringify({
                type: isTyping ? 'TYPING_START' : 'TYPING_STOP',
                userId: localPeer.id,
                userName: localPeer.name || 'You'
            });
            hmsActions.sendBroadcastMessage(typingMessage);
        } catch (error) {
            console.error('Error sending typing indicator:', error);
        }
    };

    const handleInputChange = (e) => {
        setInputValues(e.target.value);
        
        // Send typing start indicator
        sendTypingIndicator(true);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Send typing stop after 2 seconds of no typing
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingIndicator(false);
        }, 2000);
    };

    const handleEnter = (e) => {
        e.preventDefault()
        if (e.keyCode === 13) {
            sendMessage()
        }
    }

    const sendMessage = () => {
        // Clear typing indicator
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        sendTypingIndicator(false);
        
        hmsActions.sendBroadcastMessage(inputValues);
        setInputValues("");
    };

    // Admin controls for bulk actions
    const handleMuteAll = async () => {
        if (!hmsActions || !permissions?.mute) {
            toast.error("You don't have permission to mute participants");
            return;
        }
        try {
            const remotePeers = peers.filter(p => p.id !== localPeer?.id);
            for (const peer of remotePeers) {
                if (peer.audioTrack) {
                    await hmsActions.setRemoteTrackEnabled(peer.audioTrack, false);
                }
            }
            toast.success("Muted all participants");
        } catch (error) {
            console.error("Error muting all:", error);
            toast.error("Failed to mute all participants");
        }
    };

    const handleUnmuteAll = async () => {
        if (!hmsActions || !permissions?.mute) {
            toast.error("You don't have permission to unmute participants");
            return;
        }
        try {
            const remotePeers = peers.filter(p => p.id !== localPeer?.id);
            for (const peer of remotePeers) {
                if (peer.audioTrack) {
                    await hmsActions.setRemoteTrackEnabled(peer.audioTrack, true);
                }
            }
            toast.success("Unmuted all participants");
        } catch (error) {
            console.error("Error unmuting all:", error);
            toast.error("Failed to unmute all participants");
        }
    };

    const handleTurnOffAllVideo = async () => {
        if (!hmsActions || !permissions?.mute) {
            toast.error("You don't have permission to control video");
            return;
        }
        try {
            const remotePeers = peers.filter(p => p.id !== localPeer?.id);
            for (const peer of remotePeers) {
                if (peer.videoTrack) {
                    await hmsActions.setRemoteTrackEnabled(peer.videoTrack, false);
                }
            }
            toast.success("Turned off video for all participants");
        } catch (error) {
            console.error("Error turning off all video:", error);
            toast.error("Failed to turn off all video");
        }
    };

    const handleTurnOnAllVideo = async () => {
        if (!hmsActions || !permissions?.mute) {
            toast.error("You don't have permission to control video");
            return;
        }
        try {
            const remotePeers = peers.filter(p => p.id !== localPeer?.id);
            for (const peer of remotePeers) {
                if (peer.videoTrack) {
                    await hmsActions.setRemoteTrackEnabled(peer.videoTrack, true);
                }
            }
            toast.success("Turned on video for all participants");
        } catch (error) {
            console.error("Error turning on all video:", error);
            toast.error("Failed to turn on all video");
        }
    };

    return (
        <div className="h-full bg-gray-800 flex flex-col overflow-hidden">
            {/* Tabs Header */}
            <div className="flex items-center justify-between px-2 md:px-4 py-2 md:py-3 border-b border-gray-700 bg-gray-800 flex-shrink-0">
                <div className="flex gap-1 flex-1">
                    <button 
                        onClick={() => setSideMenu("chat")} 
                        className={`flex-1 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-t-lg transition-colors ${
                            sideMenu === "chat" 
                                ? "text-white bg-gray-900 border-b-2 border-orange-500" 
                                : "text-gray-400 hover:text-gray-300"
                        }`}
                    >
                        Chat {actualMessages.length > 0 && `(${actualMessages.length})`}
                    </button>
                    <button 
                        onClick={() => setSideMenu("participants")} 
                        className={`flex-1 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-t-lg transition-colors ${
                            sideMenu === "participants" 
                                ? "text-white bg-gray-900 border-b-2 border-orange-500" 
                                : "text-gray-400 hover:text-gray-300"
                        }`}
                    >
                        <span className="hidden sm:inline">Participants </span>({peers?.length || 0})
                    </button>
                </div>
            </div>

            {sideMenu === "chat" && (
                <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden">
                    {/* Messages Area */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-2 md:px-4 py-3 md:py-4 min-h-0">
                        {actualMessages.length > 0 ? (
                            <div className="space-y-2 md:space-y-3">
                                {actualMessages.map((msg) => (
                                    <div
                                        className="flex flex-col gap-1 bg-gray-700 p-2 md:p-3 rounded-lg hover:bg-gray-650 transition-colors"
                                        key={msg.id}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium text-xs md:text-sm">
                                                {msg.senderName}
                                            </span>
                                            <span className="text-gray-400 text-xs">
                                                {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <span className="text-gray-200 text-xs md:text-sm break-words">{msg.message}</span>
                                    </div>
                                ))}
                                
                                {/* Invisible element at the bottom for scrolling */}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                {typingUsers.size === 0 ? (
                                    <>
                                        <div className="mb-3 md:mb-4">
                                            <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-white text-base md:text-lg font-semibold mb-1 md:mb-2">Start a conversation</h3>
                                        <p className="text-gray-400 text-xs md:text-sm max-w-xs">
                                            There are no messages here yet. Start a conversation by sending a message.
                                        </p>
                                    </>
                                ) : null}
                            </div>
                        )}
                    </div>
                    
                    {/* Typing Indicator - Sticky above input */}
                    {typingUsers.size > 0 && (
                        <div className="border-t border-gray-700 px-2 md:px-4 py-1.5 bg-gray-800 flex-shrink-0">
                            <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm italic">
                                <span className="flex items-center gap-1">
                                    {Array.from(typingUsers.values()).join(', ')}
                                    {typingUsers.size === 1 ? ' is' : ' are'} typing
                                    <span className="flex gap-0.5">
                                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                                    </span>
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Input Area */}
                    <div className="border-t border-gray-700 p-2 md:p-4 bg-gray-800 flex-shrink-0">
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Send a message..."
                                    value={inputValues}
                                    onKeyUp={handleEnter}
                                    onChange={handleInputChange}
                                    className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400 text-xs md:text-sm"
                                />
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={!inputValues.trim()}
                                className="p-2 md:p-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                            >
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {sideMenu === "participants" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Admin Bulk Controls */}
                    {isModerator && permissions?.mute && peers && peers.length > 1 && (
                        <div className="px-2 md:px-4 py-2 border-b border-gray-700 bg-gray-900">
                            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                                <button
                                    onClick={handleMuteAll}
                                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs md:text-sm transition-colors"
                                    title="Mute all participants"
                                >
                                    <BiMicrophoneOff className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <span className="hidden sm:inline">Mute All</span>
                                </button>
                                <button
                                    onClick={handleUnmuteAll}
                                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs md:text-sm transition-colors"
                                    title="Unmute all participants"
                                >
                                    <BiMicrophone className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <span className="hidden sm:inline">Unmute All</span>
                                </button>
                                <button
                                    onClick={handleTurnOffAllVideo}
                                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs md:text-sm transition-colors"
                                    title="Turn off video for all"
                                >
                                    <BiVideoOff className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <span className="hidden sm:inline">Video Off All</span>
                                </button>
                                <button
                                    onClick={handleTurnOnAllVideo}
                                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs md:text-sm transition-colors"
                                    title="Turn on video for all"
                                >
                                    <BiVideo className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <span className="hidden sm:inline">Video On All</span>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Participants List */}
                    <div className="flex-1 overflow-y-auto px-2 md:px-4 pt-2 pb-0">
                        {peers?.length > 0 ? (
                            <div className="space-y-1.5">
                                {peers.map((peer, index) => (
                                    <NameCard 
                                        peer={peer} 
                                        key={index} 
                                        showHandRaised={handRaisedPeers.has(peer.id)} 
                                        dominantSpeakerId={dominantSpeakerId}
                                        isModerator={isModerator}
                                        permissions={permissions}
                                        localPeerId={localPeer?.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-center">
                                <div>
                                    <p className="text-gray-400 text-xs md:text-sm">No participants yet</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Messages