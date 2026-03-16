import CategoryCardList from "../../components/categoryCardList";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import CommunityCardList from "@/components/communityList";
import ThreadCardList from "@/components/threadCardList";
import BottomNav from "@/components/bottomNav";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUser,
  selectUserCommunities,
  selectUserSessions,
  setUserSessions,
} from "@/store/features/userSlice";
import { selectAllSessions, setSessions } from "@/store/features/sessionSlice";
import SessionCardList from "@/components/sessionsCardList";
import { Box, Button, Card, CardContent, Chip, Grid, Typography, Container } from '@mui/material';
import Image from "next/image";
import EditIcon from "@mui/icons-material/Edit";
import api from "@/utils/apiSetup";
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import PublicIcon from '@mui/icons-material/Public';
import PersonIcon from '@mui/icons-material/Person';
import { setCommunities } from "@/store/features/communitySlice";
import { ImProfile } from "react-icons/im";
import { motion } from "framer-motion";
import { selectCompletedSessions } from "@/store/features/session";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Home = () => {
  const router = useRouter();
  const user = useSelector(selectUser);
  const userSessions = useSelector(selectUserSessions)?.sessions
  const completedSessions = useSelector(selectUserSessions)?.completedSessions;
  const allSessions = useSelector(selectAllSessions);
  const [profileProgress, setProfileProgress] = useState(null)
  const [initialCommunities, setInitialCommunities] = useState([])
  const recommendedSessions = allSessions?.filter(
    (obj) => !userSessions?.some((subObj) => subObj.id === obj.id)
  );
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const communities = useSelector(selectUserCommunities);

  useEffect(() => {
    !user && router.push("/onBoard");
  }, [router, user]);

  

  useEffect(() => {
    if (user?.id) {
      api
        .get(`user/${user?.id}/profile-progress`)
        .then((response) => {
          setProfileProgress(response.data)
        })
        .catch((error) => {
          console.error("Error fetching profile progress:", error)
        })
    }
    if (user?.unifiedUser?.id) {
      api
        .get(`user/${user?.unifiedUser?.id}/intial-community`)
        .then((response) => {
          setInitialCommunities(response.data.initialCommunity);
        })
        .catch((error) => {
          console.error("Error fetching initial communities:", error);
        });
    }
  }, [user])

  useEffect(() => {
    if (currentUser !== undefined && currentUser !== null && currentUser !== "") {
      dispatch(setUserSessions(currentUser?.id));
    }
    dispatch(setSessions());
  }, [currentUser]);

  const combinedSessions = [...userSessions || [], ...completedSessions || []]

  // useEffect(() => {
  //   if (Notification.permission === "default") {
  //     Notification.requestPermission();
  //   } else if (Notification.permission === "granted") {
  //     new Notification("Welcome to IFCA!", {
  //       body: "Check out the latest sessions and communities.",
  //       icon: "/icon.png",
  //     });
  //   }
  // }, []);

  return (
    <>
      <Head>
        <title>IFCA - Home</title>
      </Head>
      <header>
        <Topbar />
      </header>
      <main className="overflow-x-hidden mt-[calc(80px+0.2rem)] flex flex-col mb-[80px] md:mb-10">
        <Container maxWidth="xl" className="">
          <Grid container spacing={2}>
            {/* Profile Section */}
            <Grid item xs={12} lg={8}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="bg-white rounded-lg shadow-sm ring-[1px] ring-gray-200 overflow-hidden h-full"
              >
                <div className="relative h-[120px] md:h-[140px] w-full">
                  <Image
                    src={user?.bannerImage || "/user_banner.png"}
                    alt="user banner"
                    layout="fill"
                    objectFit="cover"
                    priority
                    className="smooth-transition hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="relative px-4 md:px-6 pb-4">
                  <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-6 -mt-14">
                    {/* Profile Image with Progress Badge on Mobile */}
                    <div className="relative">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg flex-shrink-0"
                      >
                        <Image
                          src={user?.photoURL || "/t6.svg"}
                          alt="user picture"
                          layout="fill"
                          objectFit="cover"
                        />
                      </motion.div>
                      
                      {/* Profile Progress Badge - Mobile */}
                      <div className="md:hidden absolute -bottom-1 left-20 bg-white rounded-full p-0.5 shadow-lg">
                        <div className="relative w-10 h-10">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-gray-200"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray="175.93"
                              strokeDashoffset={
                                175.93 - (175.93 * (profileProgress?.profileProgress || 0)) / 100
                              }
                              className="text-primary-500 smooth-transition"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center body-small text-primary-600">
                            {profileProgress?.profileProgress ?? 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Content */}
                  <div className="">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <div className="space-y-3 text-gray-500">
                          <div>
                            <h2 className="text-xl font-bold mb-1">
                              {user?.name} {user?.preferredName && (
                                <span className="body-small text-gray-600">({user?.preferredName})</span>
                              )}
                            </h2>
                            {user?.currentPosition && (
                              <Typography className="body-small text-gray-600">
                                {user?.currentPosition} at {user?.employer}
                              </Typography>
                            )}
                          </div>

                          <div className="space-y-2">
                            {/* {user?.email && (
                              <Box className="flex items-center gap-2 text-gray-600 hover:text-primary-500 smooth-transition">
                                <EmailIcon className="text-primary-500 w-4 h-4" />
                                <Typography className="caption truncate">{user?.email}</Typography>
                              </Box>
                            )} */}
                            {/* {user?.phone && (
                              <Box className="flex items-center gap-2 text-gray-600 hover:text-primary-500 smooth-transition">
                                <PhoneIcon className="text-primary-500 w-4 h-4" />
                                <Typography className="caption">{user?.phone}</Typography>
                              </Box>
                            )} */}
                            {user?.state && user?.nationality && (
                              <Box className="flex items-center gap-2 text-gray-600">
                                <PublicIcon className="text-primary-500 w-4 h-4 flex-shrink-0" />
                                <Typography className="caption line-clamp-1">
                                  {`${user?.location}, ${user?.state}, ${user?.nationality} - ${user?.pincode}`}
                                </Typography>
                              </Box>
                            )}
                            {user?.website && (
                              <Box className="flex items-center gap-2 text-gray-600 hover:text-primary-500 smooth-transition">
                                <LanguageIcon className="text-primary-500 w-4 h-4" />
                                <Typography className="caption truncate">{user?.website}</Typography>
                              </Box>
                            )}
                          </div>

                          {user?.specializations?.length > 0 && (
                            <div className="pt-1 flex flex-col gap-2 text-gray-500">
                              <Typography className="body-small font-medium ">
                                Specializations
                              </Typography>
                              <div className="flex flex-wrap gap-1.5">
                                {user?.specializations.map((item, index) => (
                                  <Chip
                                    key={index}
                                    label={item}
                                    // className="text-white hover:bg-blue-400 transition-all duration-300 caption !h-6"
                                    style={{
                                      backgroundColor: '#60a5fa', 
                                      transition: 'background-color 0.3s ease',
                                    }}
                                  />
                                ))}
                              </div>



                            </div>
                          )}
                        </div>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        {/* Profile Progress - Desktop */}
                        <div className="hidden md:flex flex-col items-end pr-9 justify-start">
                          <p className="body-small text-primary-500 text-center mb-2">Profile Progress</p>
                          <div className="relative w-20 h-20">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-gray-200"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="none"
                                strokeDasharray="175.93"
                                strokeDashoffset={
                                  175.93 - (175.93 * (profileProgress?.profileProgress || 0)) / 100
                                }
                                className="text-primary-500 smooth-transition"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center heading text-primary-600">
                              {profileProgress?.profileProgress ?? 0}%
                            </span>
                          </div>
                        </div>
                      </Grid>
                    </Grid>
                  </div>

                  <div className="absolute top-16 right-3 md:right-6 flex gap-1.5 mt-3">
                    <Button
                      onClick={() => {
                        window.location.href = `/user/edit/${user?.id}`;
                      }}
                      variant="contained"
                      className="button button-blue caption md:body-small !px-2 md:!px-3 !py-1"
                      startIcon={<EditIcon className="!w-3.5 !h-3.5" />}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        window.location.href = `/user/${user?.unifiedUser?.id}`;
                      }}
                      variant="contained"
                      className="button button-blue caption md:body-small !px-2 md:!px-3 !py-1"
                      startIcon={<ImProfile className="!w-3.5 !h-3.5" />}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </motion.div>
            </Grid>

            {/* Initial Communities Section */}
            <Grid item xs={12} lg={4}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="h-full"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-gray-800">Initial Communities</h2>
                    {initialCommunities.length > 4 && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => router.push('/communities')}
                        className="!text-primary-500 !border-primary-500 !rounded-full !px-4 !py-1"
                      >
                        View All
                      </Button>
                    )}
                  </div>
                  <div className="w-full overflow-x-auto pb-2">
                    <div className="grid grid-cols-2 gap-2 min-w-[320px] md:grid-cols-2 md:gap-3" style={{ minWidth: '320px', maxWidth: '100%' }}>
                      {(initialCommunities.slice(0, 4)).map((community, index) => (
                        <motion.div
                          key={community.id}
                          variants={cardVariants}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-black/20 rounded-lg shadow-sm border-2 border-gray-200 hover:border-primary-500 overflow-hidden cursor-pointer smooth-transition aspect-[4/3] flex flex-col"
                          onClick={() => router.push(`/communityDetails/${community.id}`)}
                        >
                          <div className="relative w-full h-28 md:h-32 group overflow-hidden flex-1">
                            {/* Background blur layer */}
                            <div 
                              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-70"
                              style={{ 
                                backgroundImage: `url(${community.bannerImg || "/placeholder.jpg"})`, 
                                backgroundSize: 'cover', 
                                backgroundPosition: 'center' 
                              }}
                            />
                            {/* Main image */}
                            <div className="relative h-full w-full z-10">
                              <Image
                                src={community.bannerImg || "/placeholder.jpg"}
                                alt={community.title}
                                layout="fill"
                                objectFit="contain"
                                className="smooth-transition group-hover:scale-105"
                              />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 z-20" />
                            <div className="absolute inset-0 p-2 flex flex-col justify-end z-30">
                              <h3 className="text-[14px] text-white mb-0.5 line-clamp-1">{community.title}</h3>
                              <p className="body-small text-gray-200 mb-1 line-clamp-2">{community.desc}</p>
                              <div className="flex items-center justify-between">
                                <span className="body-small text-white font-medium">
                                  {community.price === 0 ? "Free" : `₹${community.price}`}
                                </span>
                                <div className="flex items-center gap-0.5 text-white">
                                  <span className="body-small text-white">{community.subscriptions}</span>
                                  <PersonIcon className="!w-3 !h-3" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Grid>
          </Grid>
          {userSessions?.length > 0 && <SessionCardList Sessions={userSessions} />}
          {user?.unifiedUser?.id && (
            <ThreadCardList userId={user.unifiedUser.id} />
          )}
          {communities?.length > 0 && <CommunityCardList type="yours" enroll={true} />}
          
          {(userSessions?.length > 0 || completedSessions?.length > 0)  && <SessionCardList Sessions={combinedSessions} yours/>}
          <CommunityCardList type="recommended" enroll={false} />
          <SessionCardList Sessions={recommendedSessions} recommended />
         
        </Container>
      </main>
      <footer>
        <Footer />
      </footer>
      {currentUser && <BottomNav />}
    </>
  );
};

export default Home;
