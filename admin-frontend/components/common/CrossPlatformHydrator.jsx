import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/features/userSlice';
import { useRouter } from 'next/router';

const CrossPlatformHydrator = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasProcessedRef.current) return; // Only process once
    
    const params = new URLSearchParams(window.location.search);
    const jwt = params.get('jwt');
    const userType = params.get('userType');
    const user = params.get('user');
    
    // Only process if we have actual params (don't log null params)
    if (jwt && userType && user) {
      console.log('[CrossPlatformHydrator] Processing params:', { jwt: !!jwt, userType, user: !!user });
      hasProcessedRef.current = true; // Mark as processed
      
      let userDecoded = user;
      try {
        userDecoded = decodeURIComponent(userDecoded);
        if (userDecoded.includes('%')) userDecoded = decodeURIComponent(userDecoded);
      } catch (e) {}
      let userObj = null;
      try {
        userObj = JSON.parse(userDecoded);
      } catch (e) {
        console.error('[CrossPlatformHydrator] Failed to parse user:', userDecoded, e);
        return;
      }
      localStorage.setItem('ifca-jwt', jwt);
      localStorage.setItem('ifca-userType', userType);
      localStorage.setItem('ifca-user', JSON.stringify(userObj));
      dispatch(setUser(userObj));
      console.log('[CrossPlatformHydrator] Hydrated Redux and localStorage from URL params:', userObj);
      
      // Remove params from URL using window.history.replaceState to avoid triggering Next.js navigation
      // This prevents the "hard navigate to the same URL" error
      const currentPath = router.pathname || window.location.pathname;
      const currentSearch = window.location.search;
      if (currentSearch) {
        // Use window.history.replaceState to silently remove query params without triggering navigation
        const newUrl = window.location.origin + currentPath;
        window.history.replaceState({ ...window.history.state, as: currentPath, url: currentPath }, '', newUrl);
      }
    }
  }, [dispatch, router]);

  return null;
};

export default CrossPlatformHydrator; 