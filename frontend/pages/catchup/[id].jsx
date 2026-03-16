import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import api from '@/utils/apiSetup';
import VideoConference from '@/components/100ms';

const CatchupPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [roomConfig, setRoomConfig] = useState(null);

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        if (!id) return;

        // Get room details from your backend
        const response = await api.get(`/catchup/room/${id}`);
        
        if (!response?.data?.success) {
          router.push('/');
          return;
        }

        // Get token for 100ms
        const tokenResponse = await api.get("/session/token");
        
        if (!tokenResponse?.data?.token) {
          throw new Error("Failed to get token");
        }

        setRoomConfig({
          roomId: id, // Use the same ID from the URL
          token: tokenResponse.data.token,
          role: response.data.role || 'participant',
          userName: response.data.userName || 'User'
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing room:', error);
        router.push('/');
      }
    };

    initializeRoom();
  }, [id, router]);

  if (isLoading || !roomConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <VideoConference {...roomConfig} />
    </div>
  );
};

export default CatchupPage;
