import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import LinkIcon from "@mui/icons-material/Link";
import CategoryCard from "@/components/community/categorycard";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
import {
  selectAllResourcesGlobal,
  setAllResourcesGlobal,
} from "@/store/features/resourceSlice";
import { selectPartner, setAllPartners, setPartner } from "@/store/features/partnerSlice";
import Head from "next/head";
import { MdChevronRight, MdHome } from "react-icons/md";

function PartnerPage() {
  const dispatch = useDispatch();
  const partner = useSelector(selectPartner);
  const selectedPartner = partner?.partner?.partner;
  const partnerCommunities = partner?.partner?.communities || [];
  const partnerResources = partner?.partner?.resources || [];
  const partnerSubscribedCommunities = partner?.partner?.subscribedCommunities || [];
  const partnerSessions = partner?.partner?.partnerSessions || [];

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [partnerData, setPartnerData] = useState(null);

  useEffect(() => {
    dispatch(setAllResourcesGlobal());
  }, []);

  useEffect(() => {
    if (router.isReady) {
      const { id } = router.query;
      api.get(`/partner/${id}`).then(res => {
        setPartnerData(res.data.partner);
      dispatch(setPartner(id));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [router.isReady, router.query.id]);

  const handleDeletePartner = (e) => {
    let ans = prompt(
      "Sure You wanna delete partner? Type YES in caps to confirm. This action is irreversible."
    );
    if (ans === "YES") {
      api.delete(`/partner/${partnerData?.partner?.id}`).then((res) => {
        if (res.data) {
          toast("Partner Deleted Successfully");
          dispatch(setAllPartners());
          router.replace(`/admin/partner`);
        }
      });
    }
  };

  const handleEditPartner = (e) => {
    e.preventDefault();
    router.push(`/admin/partner/add/${partnerData?.partner?.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-138px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600" style={{ fontSize: '14px' }}>Loading partner details...</p>
        </div>
      </div>
    );
  }

  if (!partnerData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-138px)]">
        <div className="text-center">
          <h1 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>Partner not found</h1>
          <p className="text-gray-500 mt-2" style={{ fontSize: '14px' }}>Please try again or go back to the partners list</p>
          <button
            onClick={() => router.push('/admin/partner')}
            className="mt-4 inline-flex items-center px-4 py-2 font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors duration-200"
            style={{ fontSize: '14px' }}
          >
            Back to Partners
          </button>
        </div>
      </div>
    );
  }

  const partnerInfo = partnerData.partner;

  return (
    <>
      <Head>
        <title>{partnerInfo?.name || "Partner Details"}</title>
      </Head>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center hover:text-orange-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => router.push('/admin/partner')}
            className="text-gray-500 hover:text-orange-700"
          >
            Partners
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium truncate max-w-[200px] md:max-w-xs" title={partnerInfo?.name}>{partnerInfo?.name}</span>
        </div>
      </div>

      <div className="min-h-[calc(100vh-138px)] bg-gray-50 mx-auto px-2 md:px-4 lg:px-0 max-w-[1920px]">
          <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] max-w-[1920px] mx-auto">
          {/* Left Section: 30% width */}
          <section className="flex flex-col gap-6 p-0 w-full lg:w-[30%] lg:sticky lg:top-24 bg-transparent z-10 h-fit">
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-6">
              {/* Small 1:1 Image */}
              <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden bg-orange-50">
                  <Image
                  src={partnerInfo?.photoURL || "/notImg.svg"}
                  alt={partnerInfo?.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-xl"
                  />
                </div>
              {/* Basic Information */}
              <div className="flex flex-col gap-3 text-center">
                <h1 className="font-bold text-gray-900" style={{ fontSize: '16px' }}>{partnerInfo?.name}</h1>
                <p className="text-gray-600" style={{ fontSize: '14px' }}>{partnerInfo?.desc}</p>
                {/* Contact Info */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: '12px' }}>Email:</span>
                    <span className="text-gray-700" style={{ fontSize: '12px' }}>{partnerInfo?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: '12px' }}>Phone:</span>
                    <span className="text-gray-700" style={{ fontSize: '12px' }}>{partnerInfo?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: '12px' }}>Address:</span>
                    <span className="text-gray-700" style={{ fontSize: '12px' }}>{partnerInfo?.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: '12px' }}>Pincode:</span>
                    <span className="text-gray-700" style={{ fontSize: '12px' }}>{partnerInfo?.pincode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: '12px' }}>Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${partnerInfo?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {partnerInfo?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                </div>
                {/* Operations Section */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <button 
                    onClick={handleEditPartner}
                    className="relative overflow-hidden group bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300"
                  style={{ fontSize: '14px' }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                    <span className="relative z-10">Edit Partner</span>
                  </button>
                  <button
                    onClick={handleDeletePartner}
                    className="relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300"
                  style={{ fontSize: '14px' }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                    <span className="relative z-10">Delete Partner</span>
                  </button>
                </div>
              </div>
            </section>

          {/* Right Section: 70% width */}
          <section className="flex flex-col gap-8 p-0 w-full lg:w-[70%] lg:overflow-y-auto lg:max-h-[calc(100vh-7rem)]">
            {/* Communities Created Section */}
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="font-bold flex items-center gap-2 text-orange-700" style={{ fontSize: '16px' }}>
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
                Communities Created ({partnerCommunities.length})
                </p>
              {partnerCommunities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" />
                      </svg>
                    </div>
                  <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>No Communities Created</h3>
                  <p className="text-gray-500 max-w-sm" style={{ fontSize: '14px' }}>
                      This partner hasn't created any communities yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partnerCommunities.map((community, index) => (
                      <CategoryCard
                        category={community}
                        key={`partner-comm-${index}`}
                        baseURL={"admin"}
                      />
                    ))}
                  </div>
                )}
              </div>

            {/* Subscribed Communities Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="font-bold flex items-center gap-2 text-orange-700" style={{ fontSize: '16px' }}>
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
                Subscribed Communities ({partnerSubscribedCommunities.length})
              </p>
              {partnerSubscribedCommunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>No Subscribed Communities</h3>
                  <p className="text-gray-500 max-w-sm" style={{ fontSize: '14px' }}>
                    This partner hasn't subscribed to any communities yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partnerSubscribedCommunities.map((community, index) => (
                    <CategoryCard
                      category={community}
                      key={`subscribed-comm-${index}`}
                      baseURL={"admin"}
                    />
                  ))}
                </div>
              )}
            </div>

              {/* Resources Section */}
              <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="font-bold flex items-center gap-2 text-orange-700" style={{ fontSize: '16px' }}>
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" /></svg>
                Resources ({partnerResources.length})
                </p>
              {partnerResources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m4 0h-1v-4h-1" />
                      </svg>
                    </div>
                  <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>No Resources Yet</h3>
                  <p className="text-gray-500 max-w-sm" style={{ fontSize: '14px' }}>
                      This partner hasn't shared any resources yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {partnerResources?.map((item, idx) => {
                      const getDomain = (url) => {
                        try {
                          const domain = new URL(url).hostname.replace('www.', '');
                          return domain;
                        } catch {
                          return url;
                        }
                      };
                      const getFavicon = (url) => {
                        try {
                          const domain = new URL(url).hostname;
                          return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                        } catch {
                          return '/notImg.svg';
                        }
                      };
                      return (
                        <div key={`resource-${idx}`} className="group bg-white rounded-lg p-3 border border-gray-100 hover:border-orange-200 transition-all duration-200 shadow-sm hover:shadow-md">
                          <div className="flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-shrink-0">
                                <img
                                  src={getFavicon(item.link)}
                                  alt={`${item.name} favicon`}
                                  className="w-6 h-6 rounded group-hover:scale-110 transition-transform duration-200"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/notImg.svg';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium m-0 text-gray-900 truncate group-hover:text-orange-600 transition-colors duration-200">{item.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <span className="truncate">{getDomain(item.link)}</span>
                                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                </div>
                              </div>
                            </div>
                            <div className="mt-auto pt-2 border-t border-gray-100">
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-full px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded hover:bg-orange-100 transition-colors duration-200 group-hover:bg-orange-100"
                              >
                                Visit Resource
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            {/* Partner Sessions Section */}
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <p className="font-bold flex items-center gap-2 text-orange-700" style={{ fontSize: '16px' }}>
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Partner Sessions ({partnerSessions.length})
              </p>
              {partnerSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>No Partner Sessions</h3>
                  <p className="text-gray-500 max-w-sm" style={{ fontSize: '14px' }}>
                    This partner hasn't participated in any sessions yet.
                  </p>
          </div>
        ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partnerSessions.map((session, index) => (
                    <div key={`session-${index}`} className="bg-white rounded-lg p-4 border border-gray-100 hover:border-orange-200 transition-all duration-200 shadow-sm hover:shadow-md">
                      <div className="flex flex-col h-full">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">{session.title || 'Untitled Session'}</h4>
                        <p className="text-xs text-gray-500 mb-3 flex-1">{session.description || 'No description available'}</p>
                        <div className="text-xs text-gray-400">
                          {session.startTime && new Date(session.startTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
          </div>
      </div>
    </>
  );
}

export default PartnerPage;
