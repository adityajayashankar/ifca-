import Footer from "@/components/footer";
import CreateSessionForm from "@/components/session/CreateSessionForm";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";

function CreateSession() {
  const router = useRouter();    const user = useSelector((state) => state.user.user);


  return (
    <>
      <Head>
        <title>IFCA - Home</title>
      </Head>
      <header>
        <Topbar />
      </header>
      <main className="overflow-x-hidden mt-10 mb-40 flex flex-col gap-y-[75px]">
        <div className="page flex flex-col gap-6 items-center">
          <h1 className="text-center">Create Session</h1>
          <CreateSessionForm />
        </div>
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  );
}

export default CreateSession;
