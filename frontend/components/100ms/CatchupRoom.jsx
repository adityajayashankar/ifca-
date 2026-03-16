import React, { useState, useEffect } from 'react';
import { HMSRoomProvider, HMSThemeProvider } from '@100mslive/react-sdk';
import { VideoSpaces } from './VideoSpaces';
import { Controls } from './Controls';
import { Messages } from './Messages';
import { ScreenShare } from './ScreenShare';
import { AudioCard } from './AudioCard';
import { NameCard } from './NameCard';

const CatchupRoom = ({ roomId, token, role, userName }) => {
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <HMSRoomProvider>
      <HMSThemeProvider
        config={{
          theme: {
            palette: {
              primary: {
                main: '#2563eb',
                light: '#60a5fa',
                dark: '#1d4ed8',
              },
              secondary: {
                main: '#64748b',
                light: '#94a3b8',
                dark: '#475569',
              },
            },
          },
        }}
      >
        <div className="flex h-screen bg-gray-900">
          {/* Main Video Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              <VideoSpaces />
              <div className="absolute bottom-4 left-4">
                <NameCard name={userName} />
              </div>
            </div>
            
            {/* Controls */}
            <div className="bg-gray-800 p-4">
              <Controls
                isScreenShared={isScreenShared}
                setIsScreenShared={setIsScreenShared}
                isAudioEnabled={isAudioEnabled}
                setIsAudioEnabled={setIsAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                setIsVideoEnabled={setIsVideoEnabled}
                isChatOpen={isChatOpen}
                setIsChatOpen={setIsChatOpen}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className={`w-80 bg-gray-800 transition-all duration-300 ${isChatOpen ? 'block' : 'hidden'}`}>
            <div className="h-full flex flex-col">
              {/* Participants List */}
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold mb-2">Participants</h3>
                <div className="space-y-2">
                  <AudioCard name={userName} />
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col">
                <Messages />
              </div>
            </div>
          </div>

          {/* Screen Share Overlay */}
          {isScreenShared && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50">
              <ScreenShare onClose={() => setIsScreenShared(false)} />
            </div>
          )}
        </div>
      </HMSThemeProvider>
    </HMSRoomProvider>
  );
};

export default CatchupRoom; 