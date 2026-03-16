import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
import Head from "next/head";
import Layout from "@/components/layout";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import moment from "moment";
import { MdEvent, MdPeople, MdCheckCircle, MdCancel, MdAccessTime } from "react-icons/md";

export default function RitualInvitations() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, accepted, declined

  useEffect(() => {
    if (!user) return;
    fetchInvitations();
  }, [user]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const userUnifiedId = user?.unifiedUserId || user?.id;
      const response = await api.get(`/huddle/user/${userUnifiedId}/invitations`);
      if (response.data.success) {
        setInvitations(response.data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (huddleId) => {
    try {
      const userUnifiedId = user?.unifiedUserId || user?.id;
      const response = await api.post(`/huddle/${huddleId}/invitation/accept`, {
        userId: userUnifiedId
      });

      if (response.data.success) {
        toast.success('Invitation accepted!');
        fetchInvitations();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleDecline = async (huddleId) => {
    try {
      const userUnifiedId = user?.unifiedUserId || user?.id;
      const response = await api.post(`/huddle/${huddleId}/invitation/decline`, {
        userId: userUnifiedId
      });

      if (response.data.success) {
        toast.success('Invitation declined');
        fetchInvitations();
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    }
  };

  const filteredInvitations = invitations.filter(inv => {
    if (filter === 'pending') return inv.status === 'PENDING';
    if (filter === 'accepted') return inv.status === 'ACCEPTED';
    if (filter === 'declined') return inv.status === 'DECLINED';
    return true;
  });

  const pendingCount = invitations.filter(inv => inv.status === 'PENDING').length;
  const acceptedCount = invitations.filter(inv => inv.status === 'ACCEPTED').length;
  const declinedCount = invitations.filter(inv => inv.status === 'DECLINED').length;

  return (
    <Layout>
      <Head>
        <title>Ritual Invitations</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ritual Invitations</h1>
            <p className="text-gray-600">Manage your ritual invitations</p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setFilter('pending')}
                className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                  filter === 'pending'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('accepted')}
                className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                  filter === 'accepted'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Accepted ({acceptedCount})
              </button>
              <button
                onClick={() => setFilter('declined')}
                className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                  filter === 'declined'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Declined ({declinedCount})
              </button>
            </div>
          </div>

          {/* Invitations List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <MdEvent className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No {filter} invitations
              </h3>
              <p className="text-gray-600">
                {filter === 'pending'
                  ? "You don't have any pending ritual invitations"
                  : `You haven't ${filter} any invitations yet`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvitations.map((invitation) => {
                const huddle = invitation.huddle;
                const isPending = invitation.status === 'PENDING';
                const isAccepted = invitation.status === 'ACCEPTED';
                const isLive = huddle?.isLive;
                const scheduledTime = moment(huddle?.scheduledTime);
                const isUpcoming = scheduledTime.isAfter(moment());

                return (
                  <div
                    key={invitation.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{huddle?.title}</h3>
                          {isPending && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                              Pending
                            </span>
                          )}
                          {isAccepted && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              Accepted
                            </span>
                          )}
                          {invitation.status === 'DECLINED' && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                              Declined
                            </span>
                          )}
                          {isLive && (
                            <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold animate-pulse">
                              Live Now
                            </span>
                          )}
                        </div>

                        {huddle?.description && (
                          <p className="text-gray-600 mb-4 line-clamp-2">{huddle.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                          {huddle?.community && (
                            <div className="flex items-center gap-2">
                              <MdPeople className="w-5 h-5" />
                              <span>{huddle.community.title}</span>
                            </div>
                          )}
                          {huddle?.scheduledTime && (
                            <div className="flex items-center gap-2">
                              <MdAccessTime className="w-5 h-5" />
                              <span>{scheduledTime.format('MMM DD, YYYY h:mm A')}</span>
                            </div>
                          )}
                          {huddle?.creator && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Created by:</span>
                              <span className="font-medium">
                                {huddle.creator.user?.name || huddle.creator.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleAccept(huddle.id)}
                              className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2"
                            >
                              <MdCheckCircle className="w-5 h-5" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(huddle.id)}
                              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center gap-2"
                            >
                              <MdCancel className="w-5 h-5" />
                              Decline
                            </button>
                          </>
                        )}
                        {isAccepted && (
                          <button
                            onClick={() => router.push(`/ritual/${huddle.id}`)}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                              isLive || isUpcoming
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <MdEvent className="w-5 h-5" />
                            {isLive ? 'Join Now' : isUpcoming ? 'View Details' : 'View'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}










