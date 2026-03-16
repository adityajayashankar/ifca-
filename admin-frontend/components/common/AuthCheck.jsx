import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { selectUser, setUser } from '../../store/features/userSlice';

const AuthCheck = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const jwt = localStorage.getItem('ifca-jwt');
    const userType = localStorage.getItem('ifca-userType');
    const storedUser = JSON.parse(localStorage.getItem('ifca-user') || 'null');
    if (jwt && userType && storedUser && !user) {
      console.log('AuthCheck - Hydrating Redux from localStorage');
      dispatch(setUser(storedUser));
    }
  }, [user, dispatch]);

  return null;
};

export default AuthCheck; 