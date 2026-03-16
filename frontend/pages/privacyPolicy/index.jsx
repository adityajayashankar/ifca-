import React from "react";
import { Helmet } from "react-helmet";
import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Image from "next/image";

export default function PrivacyPolicy() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>Privacy Policy | IFCA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      <Topbar />
      {/* Banner Image */}
      <div className="relative w-full h-48 md:h-64 flex items-center justify-center overflow-hidden shadow-md">
        <Image
          src="/cooking-banner.jpg"
          alt="Cooking Banner"
          layout="fill"
          objectFit="cover"
          className="z-0"
          priority
        />
        {/* Enhanced gradient overlay for texture */}
        <div className="absolute inset-0 z-10" style={{
          background: "radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 60%, rgba(0,0,0,0.35) 100%), linear-gradient(120deg, rgba(255,153,0,0.10) 0%, rgba(255,255,255,0.00) 60%, rgba(0,0,0,0.25) 100%)"
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-20" />
        <div className="relative z-30 flex flex-col items-center justify-center w-full">
          <Image
            src="/logoifca.png"
            alt="IFCA Logo"
            width={178}
            height={38}
            objectFit="contain"
            className="drop-shadow-lg"
            priority
          />
        </div>
      </div>
      <div className="pt-8 max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 -mt-16 relative z-30">
          <div data-custom-class="body">
            <div className="text-center mb-8">
              <div data-custom-class="title">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
              </div>
              <div data-custom-class="subtitle">
                <span className="text-gray-500 text-base">Last updated: June 13, 2025</span>
              </div>
            </div>
            <div data-custom-class="body_text text-gray-700 leading-relaxed space-y-4">
              <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
              <p>We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy. This Privacy Policy has been created with the help of the <a href="https://www.freeprivacypolicy.com/free-privacy-policy-generator/" target="_blank" className="text-blue-600 underline">Free Privacy Policy Generator</a>.</p>

              <h2 className="text-2xl font-bold mt-8 mb-2">Interpretation and Definitions</h2>
              <h3 className="text-lg font-semibold mt-4 mb-1">Interpretation</h3>
              <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
              <h3 className="text-lg font-semibold mt-4 mb-1">Definitions</h3>
              <p>For the purposes of this Privacy Policy:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</li>
                <li><strong>Affiliate</strong> means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</li>
                <li><strong>Application</strong> refers to IFCA, the software program provided by the Company.</li>
                <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Campus CoCreate Venture LLP, #1208, 12th Floor, Be Block, PES University Ring Road Campus, 100 Feet Ring Road, Dwaraka Nagar, Banashankari 3rd Stage, Bangalore, Karnataka - 560085.</li>
                <li><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses.</li>
                <li><strong>Country</strong> refers to: Karnataka, India</li>
                <li><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</li>
                <li><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</li>
                <li><strong>Service</strong> refers to the Application or the Website or both.</li>
                <li><strong>Service Provider</strong> means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used.</li>
                <li><strong>Third-party Social Media Service</strong> refers to any website or any social network website through which a User can log in or create an account to use the Service.</li>
                <li><strong>Usage Data</strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).</li>
                <li><strong>Website</strong> refers to IFCA India PVL, accessible from <a href="https://pvl.ifcaindia.com" rel="external nofollow noopener" target="_blank" className="text-blue-600 underline">https://pvl.ifcaindia.com</a></li>
                <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8 mb-2">Collecting and Using Your Personal Data</h2>
              <h3 className="text-lg font-semibold mt-4 mb-1">Types of Data Collected</h3>
              <h4 className="font-semibold mt-4 mb-1">Personal Data</h4>
              <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Address, State, Province, ZIP/Postal code, City</li>
                <li>Usage Data</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8 mb-2">Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, You can contact us:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>By email: <a href="mailto:analyst@pesuventurelabs.com" className="text-blue-600 underline">analyst@pesuventurelabs.com</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}






