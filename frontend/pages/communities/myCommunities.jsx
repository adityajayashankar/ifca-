import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import CommunityCard from "@/components/communityCard";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectSubscribedCommunities,
  selectRequestedCommunities,
  getUserSubscribedCommunities,
  getUserRequestedCommunities,
} from "@/store/features/userSlice";
import { motion } from "framer-motion";
import { Typography, TextField, InputAdornment } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import Link from "next/link";

const MyCommunities = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const subscribedCommunities = useSelector(selectSubscribedCommunities);
  const requestedCommunities = useSelector(selectRequestedCommunities);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("subscribed");
  const [loading, setLoading] = useState(true);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch user communities on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      if (user?.id) {
        setLoading(true);
        try {
          await Promise.all([
            dispatch(getUserSubscribedCommunities(user.id)),
            dispatch(getUserRequestedCommunities(user.id))
          ]);
        } catch (error) {
          console.error('Error fetching communities:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, [dispatch, user?.id]);

  const communitiesToDisplay =
    activeTab === "subscribed" ? subscribedCommunities : requestedCommunities;

  const filteredCommunities = (communitiesToDisplay || []).filter((com) => {
    if (!searchQuery) return true;
    return (
      com.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      com.desc?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <Head>
        <title>IFCA - My Communities</title>
      </Head>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header>
          <Topbar />
        </header>
        <main className="flex-grow mt-[60px] container mx-auto px-4 py-6 max-w-[1920px] justify-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6"
          >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <Typography variant="h4" className="font-bold text-gray-900">
                My Communities
              </Typography>
              <div className="flex items-center gap-4">
                <TextField
                  placeholder="Search my communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                  className="w-full md:w-64"
                  size="small"
                />
                <button 
                  onClick={() => router.push('/communities')}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                >
                  <span>Explore Communities</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("subscribed")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "subscribed"
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Communities
                </button>
                <button
                  onClick={() => setActiveTab("requested")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "requested"
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Requested
                </button>
              </nav>
            </div>

            {/* Communities Card Flex Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
              {loading ? (
                <div className="col-span-full text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <Typography variant="body1" className="text-gray-500">
                    Loading your communities...
                  </Typography>
                </div>
              ) : filteredCommunities.length > 0 ? (
                filteredCommunities.map((item) => (
                  <div key={item.id} className="w-full max-w-[320px] h-[360px]">
                    <CommunityCard 
                      details={item} 
                      enroll={activeTab === 'subscribed'} 
                      className="w-full h-full"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-10">
                  {activeTab === 'subscribed'
                    ? (
                      <div className="flex flex-col items-center justify-center">
                        <Typography variant="body1" className="text-gray-500">
                          You haven't joined any communities yet.
                        </Typography>
                        <Link href="/communities" className="mt-4">
                          <button className="text-orange-600 hover:text-orange-700 hover:underline">
                            Explore Communities
                          </button>
                        </Link>
                      </div>
                    )
                    : (
                      <div className="flex flex-col items-center justify-center">
                        <Typography variant="body1" className="text-gray-500">
                          You don't have any pending community requests.
                        </Typography>
                        <Link href="/communities" className="mt-4">
                          <button className="text-orange-600 hover:text-orange-700 hover:underline">
                            Explore Communities
                          </button>
                        </Link>
                      </div>
                    )}
                </div>
              )}
            </div>
          </motion.div>
        </main>
        <footer>
          <Footer />
        </footer>
      </div>
    </>
  );
};

export default MyCommunities; 