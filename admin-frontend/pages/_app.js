import { Provider } from 'react-redux';
import Navbar from '../components/common/Navbar';
import store from '../store/store';
import '../styles/globals.css';
import { injectStore } from '@/utils/apiSetup';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from '@/components/common/Loader';
import { PersistGate } from 'redux-persist/integration/react'
import {persistedStore} from '@/store/store'
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../store/features/userSlice';
import AuthCheck from '../components/common/AuthCheck';
import CrossPlatformHydrator from '../components/common/CrossPlatformHydrator';
import { HMSRoomProvider } from '@100mslive/react-sdk';
import data from '@/utils/data';
injectStore(store);

// NEW: ReduxHydrator component
function ReduxHydrator({ children }) {
    const dispatch = useDispatch();
    useEffect(() => {
        const jwt = localStorage.getItem('ifca-jwt');
        const userType = localStorage.getItem('ifca-userType');
        const user = JSON.parse(localStorage.getItem('ifca-user') || 'null');
        if (jwt && ['admin', 'expert', 'partner'].includes(userType) && user) {
            Promise.resolve().then(() => {
                dispatch(setUser(user));
            });
        }
    }, [dispatch]);
    return children;
}

// AppContent component that can access Redux state
function AppContent({ Component, pageProps }) {
    const user = useSelector((state) => state.user.user);
    const router = useRouter();
    
    // Hide Navbar on ritual pages (fullscreen experience) and auth page
    const isRitualPage = router.pathname?.startsWith('/admin/ritual');
    const isAuthPage = router.pathname === '/auth';
    const shouldShowNavbar = !isRitualPage && !isAuthPage;
    
    return (
        <>
            <CrossPlatformHydrator />
            <ReduxHydrator>
                <AuthCheck />
                <Loader/>
                {shouldShowNavbar && <Navbar key={user?.userType || 'guest'} />}
                <HMSRoomProvider>
                    {!isRitualPage && !isAuthPage ? (
                        <div className="max-w-[1920px] mx-auto  overflow-y-auto min-h-[calc(100vh-72px)] max-h-[calc(100vh-72px)]">
                            <Component {...pageProps} />
                        </div>
                    ) : (
                        <Component {...pageProps} />
                    )}
                    <ToastContainer autoClose={2000} />
                </HMSRoomProvider>
            </ReduxHydrator>
        </>
    );
}

function MyApp({ Component, pageProps }) {
    return (
        <>
        <Head>
            <link 
                href={data?.favicon || "/favicon.ico"} 
                rel="shortcut icon" 
                type="image/x-icon" 
            />
            <title>{data?.title || data?.companyName || "IFCA Admin Portal"}</title>
        </Head>
        <Provider store={store}>
            <PersistGate persistor={persistedStore} loading={null}>
                <AppContent Component={Component} pageProps={pageProps} />
            </PersistGate>
        </Provider>
        </>
    );
}

export default MyApp;