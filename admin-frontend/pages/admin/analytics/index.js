import { useRouter } from "next/router";
import React, { useEffect } from "react";

const AnalyticsPage = () => {
  const router = useRouter();
  useEffect(() => {
    router?.replace("/admin");
  }, []);
  return <div>AnalyticsPage</div>;
};

export default AnalyticsPage;
