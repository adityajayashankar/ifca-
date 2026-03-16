import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Box, Typography, Grid, Card, CardContent, Chip, IconButton, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import PublicIcon from '@mui/icons-material/Public';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import api from '@/utils/apiSetup';
import Topbar from "@/components/topbar/Topbar"
import Head from 'next/head';

const ChefProfile = () => {
  const user = useSelector(selectUser);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileProgress, setProfileProgress] = useState(null)

  useEffect(() => {
    api
      .get(`user/${1}/profile-progress`)
      .then((response) => {
        setProfileProgress(response.data)
      })
      .catch((error) => {
        console.error("Error fetching profile progress:", error)
      })
  }, [])


  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get(`user/${1}`);
        const userData = response.data.user;
        setProfile(userData);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchUserProfile();
    }
  }, [user]);



  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <header>
        <Topbar />
      </header>
      <Box className="max-w-4xl mx-auto py-10 mt-[50px]">
        <div className="p-0  shadow-md rounded-md">
          <div className="relative h-[190px] w-full bg-gray-200">
            <Image
              src={profile?.bannerImage || "/user_banner.png"}
              alt="Profile banner"
              className="w-full h-full object-cover"
              width={1500}
              height={260}
            />
            <div className="absolute -bottom-12 left-8 z-10">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white">
                <Image
                  src={profile?.photoURL || "/t6.svg"}
                  alt="Profile picture"
                  width={150}
                  height={150}
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="p-4 relative mt-8">
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h5" fontWeight="bold" className='capitalize'>
                  {profile?.name} ({profile?.preferredName})
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {profile?.currentPosition} at {profile?.employer}
                </Typography>
                {profile?.email && (
                  <Box className="flex items-center gap-2 mt-2">
                    <EmailIcon /> <Typography>{profile?.email}</Typography>
                  </Box>
                )}
                {profile?.phone && (
                  <Box className="flex items-center gap-2 mt-1">
                    <PhoneIcon /> <Typography>{profile?.phone}</Typography>
                  </Box>
                )}
                {profile?.state && profile?.nationality && (
                  <Box className="flex items-center gap-2 mt-1">
                    <PublicIcon /> <Typography>{`${profile?.location}, ${profile?.state}, ${profile?.nationality} - ${profile?.pincode}`}</Typography>
                  </Box>
                )}
                {profile?.website && (
                  <Box className="flex items-center gap-2 mt-1">
                    <LanguageIcon /> <Typography>{profile?.website}</Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={4}>
                <div className="bg-white p-3 flex flex-col items-center justify-center">
                  <p className="text-xs font-medium text-gray-500 text-center">Profile Progress</p>
                  <div className="relative w-20 h-20 flex items-center justify-center mt-1">
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
                        className="text-orange-500 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xs font-semibold text-gray-800">
                      {profileProgress?.profileProgress ?? 0}%
                    </span>
                  </div>
                </div>
                {profile?.specializations?.length > 0 && (
                  <>
                    <Typography variant="h6" fontWeight="bold">
                      Specializations
                    </Typography>
                    {profile?.specializations.map((item, index) => (
                      <Chip key={index} label={item} className="m-1" />
                    ))}
                  </>
                )}
              </Grid>
            </Grid>
            <div className="absolute -top-4 right-4">
              <Button
                onClick={() => {
                  window.location.href = `/user/edit/${profile?.id}`;
                }}
                className=""
                style={{ backgroundColor: 'black', color: 'white' }}
              >
                <EditIcon />
                <Typography>Edit</Typography>
              </Button>
            </div>
          </div>
        </div>
        {/* Professional Background */}
        {profile && (
          <Card className="mt-4 p-4">
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                Professional Background
              </Typography>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Current Position:
                </Typography>
                <Typography variant="body2">
                  {profile.currentPosition} at {profile.employer}
                </Typography>
                <Typography variant="body2">
                  {profile.currentRoleDescription}
                </Typography>
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Career History:
                </Typography>
                {profile.careerHistory.map((history, index) => (
                  <Typography key={index} variant="body2">
                    • {history}
                  </Typography>
                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Specializations:
                </Typography>
                {profile.specializations.map((specialization, index) => (
                  <Chip key={index} label={specialization} className="m-1" />
                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Certifications and Training:
                </Typography>
                {profile.certifications.map((certification, index) => (
                  <Typography key={index} variant="body2">
                    • {certification}
                  </Typography>
                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Awards and Recognitions:
                </Typography>
                {profile.awards.map((award, index) => (
                  <Typography key={index} variant="body2">
                    • {award}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Culinary Philosophy and Vision */}
        {profile && (
          <Card className="mt-4 p-4">
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                Culinary Philosophy and Vision
              </Typography>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Philosophy:
                </Typography>
                <Typography variant="body2">
                  {profile.culinaryPhilosophy}
                </Typography>
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Vision:
                </Typography>
                <Typography variant="body2">
                  {profile.vision}
                </Typography>
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Sustainability Practices:
                </Typography>
                <Typography variant="body2">
                  {profile.sustainability}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Contributions to IFCA and the Industry */}
        {profile && (
          <Card className="mt-4 p-4">
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                Contributions to IFCA and the Industry
              </Typography>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Past Involvement with IFCA:
                </Typography>
                {profile.ifcaInvolvement.map((involvement, index) => (
                  <Typography key={index} variant="body2">
                    • {involvement}
                  </Typography>
                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Industry Contributions:
                </Typography>
                {profile.industryContributions.map((contribution, index) => (
                  <Typography key={index} variant="body2">
                    • {contribution}
                  </Typography>
                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Mentorship and Training:
                </Typography>
                {profile.mentorship.map((mentorship, index) => (
                  <Typography key={index} variant="body2">
                    • {mentorship}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Technology Skills */}
        {profile?.technologySkills?.length > 0 && (
          <Card className="mt-4 p-4 shadow-lg">
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                Technology Skills
              </Typography>
              {profile?.technologySkills.map((skill, index) => (
                <Chip key={index} label={skill} className="m-1" />
              ))}
            </CardContent>
          </Card>
        )}
        {/* Content and Knowledge Sharing */}
        {profile && (
          <Card className="mt-4 p-4 shadow-lg">
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                Content and Knowledge Sharing
              </Typography>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Publications and Articles:
                </Typography>
                {profile.publications.map((publication, index) => (
                  <Chip key={index} label={publication} className="m-1" />
                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Recipes and Techniques:
                </Typography>
                {profile.recipes.map((recipe, index) => (
                  <Chip key={index} label={recipe} className="m-1" />

                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Tutorials and Videos:
                </Typography>
                {profile.tutorials.map((tutorial, index) => (
                  <Typography key={index} variant="body2">
                    • {tutorial}
                  </Typography>
                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Expertise in Specific Cuisine/Techniques:
                </Typography>
                <Typography variant="body2">
                  {profile?.expertise}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Networking and Collaboration */}
        {profile && (
          <Card className="mt-4 p-4 shadow-lg">
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                Networking and Collaboration
              </Typography>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Professional Networks:
                </Typography>
                {profile.professionalNetworks.map((network, index) => (
                  <Typography key={index} variant="body2">
                    • {network}
                  </Typography>
                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Collaborations:
                </Typography>
                {profile.collaborations.map((collaboration, index) => (
                  <Typography key={index} variant="body2">
                    • {collaboration}
                  </Typography>
                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Events Participation:
                </Typography>
                {profile.eventsParticipation.map((event, index) => (
                  <Typography key={index} variant="body2">
                    • {event}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Digital Presence */}
        {profile && (
          <Card className="mt-4 p-4 shadow-lg">
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                Digital Presence
              </Typography>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Social Media Links:
                </Typography>
                {profile.socialMediaLinks.map((link, index) => (
                  <Box key={index} className="flex items-center gap-2 mt-1">
                    <PublicIcon />
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <Typography variant="body2">{link}</Typography>
                    </a>
                  </Box>
                ))}
              </Box>
              {profile.website && (
                <Box className="mt-2">
                  <Typography variant="body1" fontWeight="bold">
                    Website or Blog:
                  </Typography>
                  <Box className="flex items-center gap-2 mt-1">
                    <LanguageIcon />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer">
                      <Typography variant="body2">{profile.website}</Typography>
                    </a>
                  </Box>
                </Box>
              )}
              {profile.onlinePortfolios?.length > 0 && (
                <Box className="mt-2">
                  <Typography variant="body1" fontWeight="bold">
                    Online Portfolios:
                  </Typography>
                  {profile.onlinePortfolios.map((portfolio, index) => (
                    <Box key={index} className="flex items-center gap-2 mt-1">
                      <PublicIcon />
                      <a href={portfolio} target="_blank" rel="noopener noreferrer">
                        <Typography variant="body2">{portfolio}</Typography>
                      </a>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Availability and Interests */}
        {profile && (
          <Card className="mt-4 p-4 shadow-lg">
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                Availability and Interests
              </Typography>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Event Participation:
                </Typography>
                <Typography variant="body2">
                  {profile.availability}
                </Typography>
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Areas of Interest:
                </Typography>
                {profile.interests.map((interest, index) => (
                  <Chip key={index} label={interest} className="m-1" />
                ))}
              </Box>
              <Box className="mt-2">
                <Typography variant="body1" fontWeight="bold">
                  Mentorship Availability:
                </Typography>
                <Typography variant="body2">
                  {profile.mentorshipAvailability ? "Available" : "Not Available"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
        {/* Skills */}
        {profile?.technologySkills?.length > 0 && (
          <Card className="mt-4 p-4 shadow-lg">
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                Skills
              </Typography>
              {profile?.technologySkills.map((skill, index) => (
                <Chip key={index} label={skill} className="m-1" />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Language Proficiency */}
        {profile?.languageProficiency?.length > 0 && (
          <Card className="mt-4 p-4 shadow-lg">
            <CardContent>
              <Typography variant="h6" fontWeight="bold">
                Language Proficiency
              </Typography>
              {profile?.languageProficiency.map((language, index) => (
                <Box key={index} className="flex items-center gap-2 mt-1">
                  <Typography variant="body2" fontWeight="bold">
                    {language.language}:
                  </Typography>
                  <Typography variant="body2">
                    {language.proficiency}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}
      </Box>
    </>
  );
};

export default ChefProfile;
