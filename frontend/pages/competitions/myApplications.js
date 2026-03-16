import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import MyApplications from "@/components/competitions/myApplication";
import OnBoard from "../onBoard";
import companyData from "@/utils/data";

const MyApplicationsPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('ifca-jwt')) {
      router.push("/onBoard");
    }
  }, [router]);

  if (!localStorage.getItem('ifca-jwt')) return <OnBoard />;

  return (
    <>
      <Head>
        <title>My Applications - IFCA</title>
      </Head>
      <Topbar />
      
      <div className="min-h-screen bg-gray-50 pt-[65px]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/competitions')}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Back to Competitions</span>
              </button>
            </div>

          </div>

          {/* Applications Content */}
          <div className="bg-white rounded-xl shadow-sm">
            <MyApplications />
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default MyApplicationsPage;