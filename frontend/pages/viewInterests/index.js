import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import { useEffect, useState } from "react";
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";

const DEFAULT_IMAGE_URL = "/default-avatar.png";

const ViewInterests = () => {
  const user = useSelector(selectUser);
  const [createdServices, setCreatedServices] = useState([]);
  const [interestedServices, setInterestedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [modalUsers, setModalUsers] = useState([]);
  const [modalService, setModalService] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('created');

  // Group interested services by creator (recalculate on tab/content change)
  const groupByCreator = (services) => {
    console.log('Grouping services:', services);
    const map = {};
    services.forEach((s) => {
      if (!map[s.creatorId]) map[s.creatorId] = [];
      map[s.creatorId].push(s);
    });
    console.log('Grouped services:', map);
    return map;
  };
  const [interestedByCreator, setInterestedByCreator] = useState({});
  useEffect(() => {
    console.log('Updating interestedByCreator with services:', interestedServices);
    setInterestedByCreator(groupByCreator(interestedServices));
    // Close modal on tab switch
    setOpenModal(false);
    setModalUsers([]);
    setModalService(null);
  }, [interestedServices, activeTab]);

  useEffect(() => {
    if (user) {
      fetchCreatedServices();
      fetchInterestedServices();
    }
  }, [user]);

  const fetchCreatedServices = async () => {
    try {
      const res = await api.get(`/service/getResponseForCreator/${user?.unifiedUser?.id}`);
      setCreatedServices(res?.data?.data || []);
    } catch {
      setCreatedServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterestedServices = async () => {
    try {
      console.log('Fetching interested services for user:', user?.unifiedUser?.id);
      const res = await api.get(`/service/getUserInterests/${user?.unifiedUser?.id}`);
      console.log('Interested services response:', res?.data);
      setInterestedServices(res?.data?.data || []);
    } catch (error) {
      console.error('Error fetching interested services:', error);
      setInterestedServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (users, service) => {
    setModalLoading(true);
    setModalService(service);
    setOpenModal(true);
    
    let modalUsers = users;
    
    // If no users provided, fetch them from the backend
    if (!users || users.length === 0) {
      try {
        const res = await api.get(`/service/getServiceResponsesWithRole/${service.serviceId}`);
        modalUsers = res?.data?.interestedUsers || [];
      } catch (error) {
        console.error('Error fetching interested users:', error);
        modalUsers = [];
      }
    }
    
    setModalUsers(modalUsers);
    setModalLoading(false);
  };
  const handleCloseModal = () => {
    setOpenModal(false);
    setModalUsers([]);
    setModalService(null);
  };

  // Service Card
  const ServiceCard = ({ service, isCreator }) => {
    const interestedUsers = service.users || [];
    return (
      <div className="flex items-center bg-white border border-orange-200 shadow rounded-xl p-3 mb-4 min-w-[260px] max-w-full lg:max-w-[25%] hover:shadow-md transition group flex-1">
        {/* Image */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-orange-100 bg-gray-50 mr-4">
          <img
            src={service.imageUrl || DEFAULT_IMAGE_URL}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-orange-700 truncate max-w-[180px]">{service.title}</h3>
            {isCreator && (
              <span className="ml-2 text-xs text-orange-500 font-semibold">{interestedUsers.length || 0} interested</span>
            )}
          </div>
          <p className="text-gray-700 text-xs mt-1 line-clamp-2 max-w-full">{service.description}</p>
          {!isCreator && service.creatorName && (
            <p className="text-xs text-gray-500 mt-1">by {service.creatorName}</p>
          )}
          <div className="mt-2 flex gap-2">
            {isCreator ? (
              <button
                className={`bg-orange-500 text-white px-4 py-1 rounded hover:bg-orange-600 transition text-xs font-semibold shadow ${interestedUsers.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}`}
                onClick={() => handleOpenModal(interestedUsers, service)}
                disabled={interestedUsers.length === 0}
              >
                {interestedUsers.length === 0 ? 'No responses yet' : 'Responses'}
              </button>
            ) : (
              <button
                className="bg-orange-100 text-orange-500 px-4 py-1 rounded hover:bg-orange-200 transition text-xs font-semibold shadow"
                onClick={() => handleOpenModal(interestedUsers, service)}
              >
                View Responses ({interestedUsers.length || 0})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Modal for Interested Users
  const InterestedUsersModal = ({ open, onClose, users, service }) => (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-fadeIn border-2 border-orange-200">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-orange-500 text-2xl font-bold"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          {service && (
            <h3 className="text-base font-bold text-orange-600 mb-2 text-center">{service.title}</h3>
          )}
          <h2 className="text-lg font-bold mb-4 text-center">
            {service?.creatorName ? `Interested Users (${users.length})` : 'Interested Users'}
          </h2>
          {modalLoading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              Loading interested users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500">No interested users yet.</div>
          ) : (
            <div className="space-y-4">
              {users.map((u) => (
                <div key={u.userId} className="flex items-center bg-orange-50 rounded-lg p-3 shadow-sm">
                  <div className="flex flex-col items-center w-16 mr-3">
                    <img
                      src={u.profileImage || DEFAULT_IMAGE_URL}
                      alt={u.name}
                      className="w-12 h-12 rounded-full object-cover border border-orange-200 mb-1"
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <span className="text-xs font-semibold text-orange-700 truncate w-full text-left">{u.name}</span>
                    <span className="text-xs text-gray-700 truncate w-full text-left">{u.email}</span>
                  </div>
                  <a
                    href={`/user/${u.userId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 px-3 py-1 bg-orange-500 text-white rounded text-xs font-semibold hover:bg-orange-600 transition whitespace-nowrap"
                  >
                    View Profile
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ) : null
  );

  // Empty State
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center w-full py-24">
      <img src="/empty-state.svg" alt="No interests" className="w-36 h-36 mb-6 opacity-80" />
      <p className="text-xl text-gray-500 font-semibold mb-2">No services or interests found.</p>
      <p className="text-base text-gray-400">You haven't created any services or shown interest in any yet.</p>
    </div>
  );

  return (
    <>
      <Head>
        <title>IFCA - My Service Interests</title>
      </Head>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-orange-100">
          <Topbar />
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-orange-700">My Service Interests</h1>
          </div>
        </header>
        <main className="flex-grow w-full max-w-[1920px] mx-auto px-4 py-8">
          <div className="flex gap-4 mb-8 border-b border-orange-200">
            <button
              className={`px-6 py-2 font-semibold text-base rounded-t-lg transition-all ${activeTab === 'created' ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-500' : 'text-gray-500 hover:text-orange-600'}`}
              onClick={() => setActiveTab('created')}
            >
              Your Created Services
            </button>
            <button
              className={`px-6 py-2 font-semibold text-base rounded-t-lg transition-all ${activeTab === 'interested' ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-500' : 'text-gray-500 hover:text-orange-600'}`}
              onClick={() => setActiveTab('interested')}
            >
              Services You've Shown Interest In
            </button>
          </div>
          {loading ? (
            <p className="text-gray-400 text-center py-16">Loading...</p>
          ) : createdServices.length === 0 && interestedServices.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-12">
              {activeTab === 'created' && createdServices.length > 0 && (
                <section>
                  <div className="flex flex-wrap gap-4 w-full">
                    {createdServices.map((service) => (
                      <ServiceCard key={service.serviceId} service={service} isCreator={true} />
                    ))}
                  </div>
                </section>
              )}
              {activeTab === 'interested' && Object.keys(interestedByCreator).length > 0 && (
                <section>
                  <div className="flex flex-col gap-8 w-full">
                    {Object.entries(interestedByCreator).map(([creatorId, services]) => (
                      <div key={creatorId} className="bg-orange-50 rounded-xl p-4">
                        <div className="flex flex-wrap gap-4 w-full">
                          {services.map((service) => (
                            <ServiceCard key={service.serviceId} service={service} isCreator={false} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
          <InterestedUsersModal open={openModal} onClose={handleCloseModal} users={modalUsers} service={modalService} />
        </main>
        <footer>
          <Footer />
        </footer>
      </div>
    </>
  );
};

export default ViewInterests;
