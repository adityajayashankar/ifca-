import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/features/userSlice';

const CrossPlatformHydrator = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const jwt = params.get('jwt');
    const userType = params.get('userType');
    const user = params.get('user');
    console.log('[CrossPlatformHydrator] Params:', { jwt, userType, user });
    if (jwt && userType && user) {
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
      // Remove params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [dispatch]);

  return null;
};

export default CrossPlatformHydrator; 