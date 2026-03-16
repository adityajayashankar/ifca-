import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/router';
import api from '../utils/apiSetup';

const CatchupNotification = () => {
    const [activeCatchups, setActiveCatchups] = useState([]);
    const user = useSelector((state) => state.user.user);
    const router = useRouter();

    useEffect(() => {
        if (!user?.unifiedUser?.id) return;

        const fetchActiveCatchups = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/v1/catchup/user/${user.unifiedUser.id}/active-catchups`);
                if (response?.data?.success) {
                    setActiveCatchups(response.data.catchups);
                }
            } catch (error) {
                console.error('Error fetching active catchups:', error);
            }
        };

        // Initial fetch
        fetchActiveCatchups();

        // Poll every 30 seconds
        const interval = setInterval(fetchActiveCatchups, 30000);

        return () => clearInterval(interval);
    }, [user?.unifiedUser?.id]);

    const handleJoinCatchup = async (catchup) => {
        try {
            // Get token for 100ms
            const tkn = await api.get("/session/token");
            
            // Create the room URL with proper parameters
            
        const response = await axios.post(
            `https://api.100ms.live/v2/room-codes/room/${catchup?.roomId}`,
            {
                user_id: user?.unifiedUser?.id,
                user_name: user?.name // Pass the user's full name as the session joining name
            },
            {
              headers: {
                Authorization: `Bearer ${tkn.data.token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log(response.data.data)

          if (response.data.data.length === 0) {
            toast.error('No catchup found. Please try again.');
            return;
          }
          if(catchup?.isHost) {
            const hostCode = response.data.data.find(item => item.role === 'host');
            if (hostCode) {
              const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${hostCode.code}`;
              if (typeof window !== "undefined") {
                window.open(redirectUrl, "_blank");
              }
            }   
            return;
          }

          const guestCode = response.data.data.find(item => item.role === 'guest');
          if (guestCode) {
            const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}`;
            if (typeof window !== "undefined") {
              window.open(redirectUrl, "_blank");
            }
          }

        } catch (error) {
            console.error('Error joining catchup:', error);
            toast.error('Failed to join catchup. Please try again.');
        }
    };

    useEffect(() => {
        // Show notifications for new catchups
        activeCatchups.forEach(catchup => {
            toast.custom((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                >
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <img
                                    className="h-10 w-10 rounded-full"
                                    src={catchup.communityBanner || '/comPic.svg'}
                                    alt=""
                                />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    New CatchUp in {catchup.communityName}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Started by {catchup.creatorName}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => handleJoinCatchup(catchup)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Join Now
                            </button>
                        </div>
                    </div>
                </div>
            ), {
                duration: 10000,
            });
        });
    }, [activeCatchups]);

    return null;
};

export default CatchupNotification; 