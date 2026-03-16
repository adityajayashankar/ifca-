import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Box, Typography, Grid, Card, CardContent, Chip, IconButton } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import PublicIcon from '@mui/icons-material/Public';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import api from '@/utils/apiSetup';
import Topbar from "@/components/topbar/Topbar";
import Head from 'next/head';

const ProfileView = () => {
  const user = useSelector(selectUser);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileProgress, setProfileProgress] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const [profileRes, progressRes] = await Promise.all([
        api.get(`user/${user.id}`),
        api.get(`user/${user.id}/profile-progress`)
      ]);
      setProfile(profileRes.data.user);
      setProfileProgress(progressRes.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Profile | IFCA</title>
      </Head>
      <Topbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative w-32 h-32">
                <Image
                  src={profile?.photoURL || '/default-avatar.png'}
                  alt={profile?.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{profile?.name}</h1>
                <p className="text-gray-600 mb-4">{profile?.currentPosition}</p>
                <div className="flex flex-wrap gap-4">
                  {profile?.email && (
                    <div className="flex items-center gap-2">
                      <EmailIcon className="text-gray-500" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="text-gray-500" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center gap-2">
                      <PublicIcon className="text-gray-500" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Career History */}
          {profile?.careerHistory?.length > 0 && (
            <Card className="mb-6">
              <CardContent>
                <div className="flex items-center gap-2 mb-6">
                  <WorkIcon className="text-gray-600" />
                  <Typography variant="h6" className="font-bold">
                    Experience
                  </Typography>
                </div>
                <div className="space-y-6">
                  {profile.careerHistory.map((career, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <BusinessIcon className="text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Typography variant="subtitle1" className="font-semibold">
                          {career.jobTitle}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          {career.companyName}
                        </Typography>
                        <Typography variant="body2" className="text-gray-500 text-sm">
                          {career.startDate} - {career.isCurrentPosition ? 'Present' : career.endDate}
                        </Typography>
                        {career.description && (
                          <Typography variant="body2" className="mt-2 text-gray-600">
                            {career.description}
                          </Typography>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education & Certifications */}
          {(profile?.certifications?.length > 0) && (
            <Card className="mb-6">
              <CardContent>
                <div className="flex items-center gap-2 mb-6">
                  <SchoolIcon className="text-gray-600" />
                  <Typography variant="h6" className="font-bold">
                    Education & Certifications
                  </Typography>
                </div>
                <div className="space-y-6">
                  {profile.certifications.map((cert, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <VerifiedIcon className="text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Typography variant="subtitle1" className="font-semibold">
                          {cert.name}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          {cert.organization}
                        </Typography>
                        <Typography variant="body2" className="text-gray-500 text-sm">
                          Issued {cert.issueDate} {!cert.noExpiration && `· Expires ${cert.expirationDate}`}
                        </Typography>
                        {cert.credentialId && (
                          <Typography variant="body2" className="text-gray-500 text-sm">
                            Credential ID: {cert.credentialId}
                          </Typography>
                        )}
                        {cert.credentialUrl && (
                          <a 
                            href={cert.credentialUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-1"
                          >
                            Show credential <span className="text-xs">↗</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills Section - LinkedIn Style */}
          {(profile?.technologySkills?.length > 0 || profile?.languageProficiency?.length > 0) && (
            <Card className="mb-6">
              <CardContent>
                <Typography variant="h6" className="font-bold mb-6">
                  Skills & Languages
                </Typography>
                
                {profile?.technologySkills?.length > 0 && (
                  <div className="mb-6">
                    <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">
                      Technical Skills
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {profile.technologySkills.map((skill, index) => (
                        <Chip 
                          key={index} 
                          label={skill}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {profile?.languageProficiency?.length > 0 && (
                  <div>
                    <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">
                      Languages
                    </Typography>
                    <div className="grid gap-3">
                      {profile.languageProficiency.map((lang, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <Typography variant="body2" className="font-medium">
                              {lang.language}
                            </Typography>
                          </div>
                          <Chip 
                            label={lang.level}
                            size="small"
                            className="bg-gray-100 text-gray-700"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Awards & Recognition */}
          {profile?.awards?.length > 0 && (
            <Card className="mb-6">
              <CardContent>
                <div className="flex items-center gap-2 mb-6">
                  <EmojiEventsIcon className="text-gray-600" />
                  <Typography variant="h6" className="font-bold">
                    Awards & Recognition
                  </Typography>
                </div>
                <div className="space-y-4">
                  {profile.awards.map((award, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 text-xl">🏆</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <Typography variant="body1" className="font-medium">
                          {award}
                        </Typography>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Professional Networks & Collaborations */}
          {(profile?.professionalNetworks?.length > 0 || profile?.collaborations?.length > 0) && (
            <Card className="mb-6">
              <CardContent>
                <div className="flex items-center gap-2 mb-6">
                  <GroupsIcon className="text-gray-600" />
                  <Typography variant="h6" className="font-bold">
                    Professional Networks & Collaborations
                  </Typography>
                </div>
                
                {profile?.professionalNetworks?.length > 0 && (
                  <div className="mb-6">
                    <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">
                      Professional Networks
                    </Typography>
                    <div className="space-y-4">
                      {profile.professionalNetworks.map((network, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-1">
                            <Typography variant="body1" className="font-medium">
                              {network.name}
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                              {network.role}
                            </Typography>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile?.collaborations?.length > 0 && (
                  <div>
                    <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">
                      Collaborations
                    </Typography>
                    <div className="space-y-4">
                      {profile.collaborations.map((collab, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-1">
                            <Typography variant="body1" className="font-medium">
                              {collab.partner}
                            </Typography>
                            <Typography variant="body2" className="font-medium text-gray-600">
                              {collab.project}
                            </Typography>
                            {collab.description && (
                              <Typography variant="body2" className="text-gray-500 mt-1">
                                {collab.description}
                              </Typography>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Events & Participation */}
          {profile?.eventsParticipation?.length > 0 && (
            <Card className="mb-6">
              <CardContent>
                <div className="flex items-center gap-2 mb-6">
                  <EventIcon className="text-gray-600" />
                  <Typography variant="h6" className="font-bold">
                    Events & Participation
                  </Typography>
                </div>
                <div className="space-y-4">
                  {profile.eventsParticipation.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                          <EventIcon className="text-orange-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Typography variant="subtitle1" className="font-semibold">
                          {event.name}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          {event.role}
                        </Typography>
                        <Typography variant="body2" className="text-gray-500 text-sm">
                          {event.date} • {event.location}
                        </Typography>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Publications & Tutorials */}
          {(profile?.publications?.length > 0 || profile?.tutorials?.length > 0) && (
            <Card className="mb-6">
              <CardContent>
                <div className="flex items-center gap-2 mb-6">
                  <MenuBookIcon className="text-gray-600" />
                  <Typography variant="h6" className="font-bold">
                    Publications & Tutorials
                  </Typography>
                </div>
                
                {profile?.publications?.length > 0 && (
                  <div className="mb-6">
                    <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">
                      Publications
                    </Typography>
                    <div className="space-y-4">
                      {profile.publications.map((pub, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-1">
                            <Typography variant="body1" className="font-medium">
                              {pub.title}
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                              {pub.publisher} • {pub.date}
                            </Typography>
                            {pub.url && (
                              <a 
                                href={pub.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View publication ↗
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile?.tutorials?.length > 0 && (
                  <div>
                    <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">
                      Tutorials
                    </Typography>
                    <div className="space-y-4">
                      {profile.tutorials.map((tutorial, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-1">
                            <Typography variant="body1" className="font-medium">
                              {tutorial.title}
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                              {tutorial.platform}
                            </Typography>
                            {tutorial.description && (
                              <Typography variant="body2" className="text-gray-500 mt-1">
                                {tutorial.description}
                              </Typography>
                            )}
                            {tutorial.url && (
                              <a 
                                href={tutorial.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View tutorial ↗
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Digital Presence */}
          {(profile?.website || profile?.socialMediaLinks?.length > 0) && (
            <Card className="mb-6">
              <CardContent>
                <Typography variant="h6" className="font-bold mb-4">
                  Digital Presence
                </Typography>
                {profile.website && (
                  <div className="mb-4">
                    <Typography variant="subtitle2" className="font-semibold">
                      Website
                    </Typography>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                       className="text-orange-500 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile.socialMediaLinks?.length > 0 && (
                  <div>
                    <Typography variant="subtitle2" className="font-semibold mb-2">
                      Social Media
                    </Typography>
                    <div className="space-y-2">
                      {profile.socialMediaLinks.map((social, index) => (
                        <div key={index}>
                          <a href={social.url} target="_blank" rel="noopener noreferrer" 
                             className="text-orange-500 hover:underline">
                            {social.platform} {social.platform === 'Other' && `(${social.customPlatform})`}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
};

export default ProfileView; 