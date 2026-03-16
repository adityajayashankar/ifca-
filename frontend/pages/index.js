import Head from "next/head";
import Topbar from "@/components/topbar/Topbar";
import Landing from "@/components/landing";
import Footer from "@/components/footer";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, setUser } from "@/store/features/userSlice";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import CryptoJS from "crypto-js";
import api from "@/utils/apiSetup";
import BottomNav from "@/components/bottomNav";

export default function Home({ pageData }) {
  const currentUser = useSelector(selectUser);
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, from } = router.query;
  const [isLoading, setIsLoading] = useState(true);

  const decryptEmail = (cipherText) => {
    const secretKey = "6inc"; // Replace with your actual secret key
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  };
  console.log('token', token);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        if (token && from === '6inc') {
          const email = decryptEmail(token);
          console.log('email', email);

          const response = await api.post('/auth/email-bypass', {
            email,
            userType: 'user',
          });

          if (mounted && response.data) {
            dispatch(setUser(response.data.user));
            setIsLoading(false);
            router.push("/home/feed");
          }
        } else if (currentUser) {
          if (mounted) {
            setIsLoading(false);
            router.push("/home/feed");
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
          router.push("/onBoard");
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [currentUser, token, from]);

  // Show loading state or content based on authentication check
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
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>IFCA</title>
      </Head>
      <div className="w-screen min-h-screen overflow-x-hidden">
        <header className="relative z-50">
          <Topbar />
        </header>
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

// export async function getServerSideProps(context) {
//   const res = await fetch(`https://test.getsubspace.tech/contentapi/landing`);
//   const { page } = await res.json();

//   return {
//     props: { pageData: page },
//   };
// }
