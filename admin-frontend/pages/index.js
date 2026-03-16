import Head from "next/head";
import Landing from "@/components/landing";
import Footer from "@/components/footer";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const currentUser = useSelector(selectUser);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        if (currentUser) {
          if (mounted) {
            setIsLoading(false);
            // Redirect based on user type, but only if not already on the target page
            const userType = localStorage.getItem('ifca-userType');
            const currentPath = router.pathname;
            
            if (userType === 'admin' && currentPath !== '/admin') {
              router.push('/admin');
            } else if (userType === 'partner' && currentPath !== '/partner') {
              router.push('/partner');
            } else if (userType === 'expert' && currentPath !== '/expert') {
              router.push('/expert');
            } else if (!userType && currentPath !== '/admin') {
              router.push('/admin');
            }
          }
      } else {
          if (mounted) {
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [currentUser, router]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 3000); // Max 3 seconds loading

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>IFCA Admin Portal</title>
      <style jsx global>{`
          html, body {
            overflow-x: hidden;
            overscroll-behavior-x: none;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          #__next {
            width: 100%;
            overflow-x: hidden;
        }
      `}</style>
      </Head>
      <div className="w-full min-h-screen overflow-x-hidden">
        <main className="bg-transparent relative z-10">
          <Landing />
        </main>
        <footer className="relative z-10">
          <Footer />
        </footer>
    </div>
    </>
  );
}
