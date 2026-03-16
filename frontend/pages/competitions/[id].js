import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import PublicPageApplyButton from "@/components/competitions/incubator/micro/PublicPageApplyButton";
import api from "@/utils/apiSetup";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";

function Competition() {
  const [compDetails, setCompDetails] = useState();
  const [loading, setLoading] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const router = useRouter();
  const { id } = router.query;
  const user = useSelector(selectUser);

  useEffect(() => {
    if (id) fetchCompById();
  }, [id]);

  const fetchCompById = async () => {
    try {
      setLoading(true);
      const userId = user?.unifiedUser?.id;
      const url = userId ? `/competitions/${id}?userId=${userId}` : `/competitions/${id}`;
      const res = await api.get(url);
      setCompDetails(res?.data);
      
      // Check submission status if user is logged in
      if (userId) {
        try {
          const submissionRes = await api.get(`/competitions/checkUserSubmission/${id}/${userId}`);
          setSubmissionStatus(submissionRes?.data);
        } catch (err) {
          console.error("Error checking submission status:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching competition details:", err);
    } finally {
      setLoading(false);
    }
  };

  const stages = compDetails?.Stage || [];

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Competition...</title>
        </Head>
        <Topbar />
        <div className="min-h-screen bg-gray-50 pt-[65px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading competition details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!compDetails) {
    return (
      <>
        <Head>
          <title>Competition Not Found</title>
        </Head>
        <Topbar />
        <div className="min-h-screen bg-gray-50 pt-[65px] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Competition Not Found</h1>
            <p className="text-gray-600 mb-6">The competition you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/competitions')}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              Back to Competitions
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{compDetails?.title || 'Competition'} - IFCA</title>
      </Head>
      <Topbar />
      
      <div className="min-h-screen bg-gray-50 pt-[65px]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
          >
            <div className="relative h-64 md:h-80">
              <img
                src={compDetails?.bannerUrl || '/default-competition.jpg'}
                alt={compDetails?.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {compDetails?.title}
                </h1>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-orange-500/90 text-white text-sm font-semibold px-4 py-2 rounded-full shadow">
                    {stages.length} Stage{stages.length === 1 ? '' : 's'}
                  </span>
                  <span className="bg-white/90 text-gray-800 text-sm font-semibold px-4 py-2 rounded-full shadow">
                    Deadline: {compDetails?.endDate?.split("T")[0]}
                  </span>
                  {submissionStatus?.hasSubmitted && (
                    <span className="bg-green-500/90 text-white text-sm font-semibold px-4 py-2 rounded-full shadow flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Applied
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Competition</h2>
                <p className="text-gray-700 leading-relaxed">
                  {compDetails?.description || "No description available."}
                </p>
              </motion.div>

              {/* Timeline Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Timeline</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">Start Date</p>
                      <p className="text-gray-600">{compDetails?.startDate?.split("T")[0]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">End Date</p>
                      <p className="text-gray-600">{compDetails?.endDate?.split("T")[0]}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stages Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Competition Stages</h2>
                {stages.length === 0 ? (
                  <p className="text-gray-500">No stages available.</p>
                ) : (
                  <div className="space-y-3">
                    {stages.map((stage, idx) => (
                      <div key={stage.id || idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {stage.name ? stage.name : `Stage ${idx + 1}`}
                          </p>
                          {stage.description && (
                            <p className="text-sm text-gray-600">{stage.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Button Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-sm p-6 sticky top-24"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ready to Participate?</h3>
                
                {submissionStatus?.hasSubmitted ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-900">Already Applied!</h4>
                          <p className="text-sm text-green-700">
                            Stage {submissionStatus.submissionDetails?.stageNumber} • {submissionStatus.submissionDetails?.stageName}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-green-700">
                        Applied on {new Date(submissionStatus.submissionDetails?.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => router.push('/competitions/myApplications')}
                      className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition font-semibold"
                    >
                      View My Applications
                    </button>
                    
                    <button
                      onClick={() => router.push('/competitions')}
                      className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
                    >
                      Back to All Competitions
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <PublicPageApplyButton
                      competition={compDetails}
                      competitionId={compDetails?.id}
                      application_ends_on={compDetails?.applicationEndsOn}
                    />
                    <button
                      onClick={() => router.push('/competitions')}
                      className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
                    >
                      Back to All Competitions
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Quick Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stages:</span>
                    <span className="font-semibold">{stages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold">
                      {compDetails?.startDate && compDetails?.endDate ? 
                        `${Math.ceil((new Date(compDetails.endDate) - new Date(compDetails.startDate)) / (1000 * 60 * 60 * 24))} days` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  {submissionStatus?.hasSubmitted && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Status:</span>
                      <span className="font-semibold text-green-600">Applied</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}

export default Competition;
