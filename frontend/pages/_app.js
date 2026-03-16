import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Provider, useDispatch, useSelector } from 'react-redux'
import store, { persistedStore } from '../store/store'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { lightTheme, darkTheme } from '../styles/materialTheme'
import '../styles/globals.css'
import { PersistGate } from 'redux-persist/integration/react'
import { injectStore } from '../utils/apiSetup'
import Loading from '../components/common/Loader'
import { HMSRoomProvider } from '@100mslive/react-sdk'
import { ThemeProvider as MUIThemeProvider, useTheme } from '../context/ThemeContext'
import { Toaster } from 'react-hot-toast'
import { setUser } from '../store/features/userSlice';
import AuthCheck from '../components/common/AuthCheck';
import CrossPlatformHydrator from '../components/common/CrossPlatformHydrator';
import Topbar from '../components/topbar/Topbar.jsx';
import { selectUser } from '../store/features/userSlice';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LiveCatchupPopup from '../components/LiveCatchupPopup'
// import SessionNotification from '../components/common/SessionNotification'

injectStore(store)

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B00',
    },
    secondary: {
      main: '#FFA559',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
})

function AuthGate({ children }) {
  // No useDispatch here! Only use in ReduxHydrator.
  return children;
}

// NEW: ReduxHydrator component
function ReduxHydrator({ children }) {
  const dispatch = useDispatch();
  useEffect(() => {
    const jwt = localStorage.getItem('ifca-jwt');
    const userType = localStorage.getItem('ifca-userType');
    const user = JSON.parse(localStorage.getItem('ifca-user') || 'null');
    if (jwt && userType === 'user' && user) {
      Promise.resolve().then(() => {
        dispatch(setUser(user));
      });
    }
  }, [dispatch]);
  return children;
}

// Remove Provider and PersistGate from inside AppContent
// Create ReduxAppContent to hold all Redux logic
function ReduxAppContent({ Component, pageProps }) {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const currentUser = useSelector(selectUser);

  // Hide Topbar on ritual pages
  const isRitualPage = router.pathname?.startsWith('/ritual');

  useEffect(() => {
    // Remove the server-side injected CSS
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }

    // Suppress Chrome extension errors from cluttering the console
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const errorMessage = args.join(' ');
      // Filter out chrome-extension errors
      if (errorMessage.includes('chrome-extension://') || 
          errorMessage.includes('net::ERR_FILE_NOT_FOUND') ||
          errorMessage.includes('contentScript.bundle.js')) {
        return; // Silently ignore extension errors
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const warnMessage = args.join(' ');
      // Filter out chrome-extension warnings
      if (warnMessage.includes('chrome-extension://') ||
          warnMessage.includes('contentScript')) {
        return; // Silently ignore extension warnings
      }
      originalWarn.apply(console, args);
    };

    // Global error handler to catch and filter extension errors
    const handleError = (event) => {
      const errorSource = event.filename || event.source || '';
      const errorMessage = event.message || '';
      
      // Check if error is from chrome extension
      if (errorSource.includes('chrome-extension://') ||
          errorMessage.includes('chrome-extension://') ||
          errorSource.includes('contentScript') ||
          errorMessage.includes('ERR_FILE_NOT_FOUND')) {
        event.preventDefault(); // Prevent error from showing in console
        return false;
      }
    };

    // Global unhandled rejection handler
    const handleRejection = (event) => {
      const reason = event.reason?.message || event.reason?.toString() || '';
      
      // Check if rejection is from chrome extension
      if (reason.includes('chrome-extension://') ||
          reason.includes('contentScript') ||
          reason.includes('ERR_FILE_NOT_FOUND')) {
        event.preventDefault(); // Prevent rejection from showing in console
        return false;
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection, true);

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection, true);
    };
  }, []);

  return (
    <MUIThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <HMSRoomProvider>
        <CrossPlatformHydrator />
        <ReduxHydrator>
          <AuthCheck />
          {!isRitualPage && <Topbar key={currentUser?.userType || 'guest'} />}
          <AuthGate>
            <Component {...pageProps} />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
            <Toaster position="top-center" />
            {/* <CatchupNotification /> */}
            {/* <SessionNotification /> */}
          </AuthGate>
        </ReduxHydrator>
      </HMSRoomProvider>
    </MUIThemeProvider>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <PersistGate persistor={persistedStore} loading={null}>
          <ReduxAppContent Component={Component} pageProps={pageProps} />
        </PersistGate>
      </Provider>
    </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp
