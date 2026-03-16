import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function RoomComponent({
    userId,
    userName,
    roomId,
    role
}) {
    const [meetingUrl, setMeetingUrl] = useState('');

    useEffect(() => {
        if (roomId !== undefined && roomId !== null && roomId !== '') {
            const dynamicMeetingUrl = `https://cultureplace.app.100ms.live/${roomId}/host`;
            setMeetingUrl(dynamicMeetingUrl);
        }        
    }, [roomId, userId, userName, role]);
    
    useEffect(() => {
        if (meetingUrl) {
            window.location.href = meetingUrl;
        }
    }, [meetingUrl]);

    return (
        <>
        </>
    );
}
