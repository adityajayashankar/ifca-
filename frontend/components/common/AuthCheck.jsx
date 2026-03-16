import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { selectUser, setUser, setNextPage } from '../../store/features/userSlice';

const AuthCheck = () => {
  const user = useSelector(selectUser);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('AuthCheck - Current user state:', user);
    console.log('AuthCheck - Current route:', router.pathname);
    
    const jwt = localStorage.getItem('ifca-jwt');
    const userType = localStorage.getItem('ifca-userType');
    const storedUser = JSON.parse(localStorage.getItem('ifca-user') || 'null');
    
    console.log('AuthCheck - localStorage data:', {
      jwt: !!jwt,
      userType,
      storedUser: !!storedUser
    });
    
    // Check if we're on a public route that doesn't require authentication
    const publicRoutes = [
      '/', 
      '/onBoard', 
      '/reset-password', 
      '/termsOfService', 
      '/privacyPolicy', 
      '/aboutus', 
      '/contact', 
      '/support',
      '/termsAndConditions',
      '/returnAndRefund'
    ];
    const isPublicRoute = publicRoutes.includes(router.pathname);
    
    // If we have tokens but no user in Redux, try to hydrate
    if (jwt && userType && storedUser && !user) {
      console.log('AuthCheck - Found tokens but no Redux user, attempting to hydrate...');
      dispatch(setUser(storedUser));
      return;
    }
    
    // If we have a user in Redux, we're authenticated
    if (user) {
      console.log('AuthCheck - User authenticated, allowing access');
      return;
    }
    
    // If we're on a public route, don't redirect
    if (isPublicRoute) {
      console.log('AuthCheck - On public route, no redirect needed');
      return;
    }
    
    // If we don't have authentication and we're not on a public route, redirect to onboard
    if (!jwt || !userType || !storedUser) {
      console.log('AuthCheck - No authentication found, redirecting to onboard');
      // Save the current route for after login
      dispatch(setNextPage(router.asPath));
      router.push('/onBoard');
      return;
    }
    
    // If we have tokens but no user in Redux, try to set the user
    if (jwt && userType && storedUser) {
      console.log('AuthCheck - Setting user from localStorage');
      dispatch(setUser(storedUser));
    }
  }, [user, router.pathname, router.asPath, dispatch]);

  return null; // This component doesn't render anything
};

export default AuthCheck; 