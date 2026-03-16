import React from 'react';
import { HMSVideoTile } from '@100mslive/hms-video-react';

function Peers({ peers }) {
    return (
        <div>
            {peers.map((peer) => (
                <HMSVideoTile key={peer.id} peer={peer} />
            ))}
        </div>
    );
}

export default Peers;
