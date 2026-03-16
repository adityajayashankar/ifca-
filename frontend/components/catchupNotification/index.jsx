import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import api from '@/utils/apiSetup';

const CatchupNotification = () => {
  const [activeCatchups, setActiveCatchups] = useState([]);
  const [previousCatchups, setPreviousCatchups] = useState([]);
  const user = useSelector(selectUser);
  const router = useRouter();

  useEffect(() => {
    if (!user?.unifiedUser?.id) return;

    const checkActiveCatchups = async () => {
      try {
        const response = await api.get(`/catchup/user/${user.unifiedUser.id}/active-catchups`);
        if (response.data.success) {
          const newCatchups = response.data.catchups;
          
          // Check for new catchups that weren't in previousCatchups
          const newNotifications = newCatchups.filter(
            catchup => !previousCatchups.some(prev => prev.roomId === catchup.roomId)
          );

          // Show notifications for new catchups
          newNotifications.forEach(catchup => {
            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play();

            // Show toast notification
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
                        New Catchup in {catchup.communityName}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {catchup.isHost ? 'You are the host' : `Hosted by ${catchup.creatorName}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex">
                    <button
                      onClick={async () => {
                        try {
                          // Get token for 100ms
                          const tkn = await api.get("/session/token");
                          
                          // Create the room URL with proper parameters
                          const roomUrl = new URL(`https://aluminaries.app.100ms.live/meeting/${catchup.roomId}`);
                          roomUrl.searchParams.append('name', user?.name || 'User');
                          roomUrl.searchParams.append('role', catchup.isHost ? 'host' : 'participant');
                          roomUrl.searchParams.append('token', tkn.data.token);
                          
                          // Navigate to catchup room
                          window.location.href = roomUrl.toString();
                          toast.dismiss(t.id);
                        } catch (error) {
                          console.error('Error joining catchup:', error);
                          toast.error('Failed to join catchup. Please try again.');
                        }
                      }}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Join Now
                    </button>
                  </div>
                </div>
              </div>
            ), {
              duration: 100000,
              position: 'top-right',
            });
          });

          setPreviousCatchups(newCatchups);
          setActiveCatchups(newCatchups);
        }
      } catch (error) {
        console.error('Error checking active catchups:', error);
      }
    };

    // Initial check
    checkActiveCatchups();

    // Set up polling interval
    const interval = setInterval(checkActiveCatchups, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user?.unifiedUser?.id, previousCatchups]);

  return null; // This component doesn't render anything
};

export default CatchupNotification; 