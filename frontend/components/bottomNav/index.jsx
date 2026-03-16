import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useRouter } from 'next/router';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import { AutoGraph, Book } from '@mui/icons-material';

const BottomNav = () => {
  const router = useRouter();
  const currentUser = useSelector(selectUser);

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: { xs: 'block', md: 'none' },
        borderTop: '1px solid #e0e0e0',
        backgroundColor:"black"
      }}
      elevation={3}
    >
      <BottomNavigation
        value={router.pathname}
        onChange={(event, newValue) => {
          handleNavigation(newValue);
        }}
        showLabels
        sx={{
          height: '60px',
          '& .MuiBottomNavigationAction-root': {
            color: 'white',
            backgroundColor:"black",
            '&.Mui-selected': {
              color: '#0C74D4',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 600
              }
            }
          }
        }}
      >
        <BottomNavigationAction
          label="Home"
          value="/home"
          icon={<HomeIcon />}
        />
        <BottomNavigationAction
          label="Communitity"
          value="/myCommunities"
          icon={<PeopleIcon />}
        />
        <BottomNavigationAction
          label="Schedule"
          value="/mySchedule"
          icon={<CalendarMonthIcon />}
        />
        <BottomNavigationAction
          label="Courses"
          value="/courses"
          icon={<Book />}
        />
        <BottomNavigationAction
          label="Events"
          value="/competitions"
          icon={<AutoGraph />}
        />
        {/* <BottomNavigationAction
          label="Profile"
          value={`/user/${currentUser?.unifiedUser?.id}`}
          icon={<PersonIcon />}
        /> */}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav; 