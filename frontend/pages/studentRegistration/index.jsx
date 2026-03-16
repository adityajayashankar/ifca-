import React, { useEffect } from "react";

const StudentRegistration = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//embed.typeform.com/next/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div data-tf-live="01HPYG26ZKB9PHCX145QE6ANA2"></div>;
};

export default StudentRegistration;
