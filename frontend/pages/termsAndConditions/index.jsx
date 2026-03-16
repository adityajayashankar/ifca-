import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import React from "react";
import Head from "next/head";
import Image from "next/image";


const TermsAndConditions = () => {
  return (
    <div>
      <Head>
        <title>Terms and Conditions | IFCA</title>
      </Head>
      <style>{`
        [data-custom-class='body'], [data-custom-class='body'] * {
          background: transparent !important;
        }
        [data-custom-class='title'], [data-custom-class='title'] * {
          font-family: Arial !important;
          font-size: 26px !important;
          color: #000000 !important;
        }
        [data-custom-class='subtitle'], [data-custom-class='subtitle'] * {
          font-family: Arial !important;
          color: #595959 !important;
          font-size: 14px !important;
        }
        [data-custom-class='heading_1'], [data-custom-class='heading_1'] * {
          font-family: Arial !important;
          font-size: 19px !important;
          color: #000000 !important;
        }
        [data-custom-class='heading_2'], [data-custom-class='heading_2'] * {
          font-family: Arial !important;
          font-size: 17px !important;
          color: #000000 !important;
        }
        [data-custom-class='body_text'], [data-custom-class='body_text'] * {
          color: #595959 !important;
          font-size: 14px !important;
          font-family: Arial !important;
        }
        [data-custom-class='link'], [data-custom-class='link'] * {
          color: #3030F1 !important;
          font-size: 14px !important;
          font-family: Arial !important;
          word-break: break-word !important;
        }
      `}</style>
      <Topbar />
      {/* Banner Image */}
      <div className="relative w-full h-48 md:h-64 flex items-center justify-center overflow-hidden shadow-md">
        <Image
          src="/cooking-banner.jpg" // Place a relevant cooking image in public/cooking-banner.jpg
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
      <div data-custom-class="body" className="pt-8 max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 -mt-16 relative z-30">
          <div className="text-center mb-8">
            <div data-custom-class="title">
              <h1>TERMS AND CONDITIONS</h1>
            </div>
            <div data-custom-class="subtitle">
              <strong>Last updated</strong> <strong>April 01, 2025</strong>
            </div>
          </div>
          <div data-custom-class="heading_1">
            <h2>AGREEMENT TO OUR LEGAL TERMS</h2>
          </div>
          <div data-custom-class="body_text" style={{ marginBottom: 16 }}>
            We are <b>Campus CoCreate Ventures LLP</b> ("Company", "we", "us", or "our"), a company registered in India at #96, Snehasri, 5th Main Road, Banashankari 3rd Stage, Chennammannakere Achukattu, Near Chennammannakere Achukattu Telephone Exchange, Bangalore, Karnataka 560085.
          </div>
          <div className="px-4 md:px-10 py-6  mt-[80px]">
            <h2>
              <strong>Terms and Conditions</strong>
            </h2>

            <p>Welcome to IFCA!</p>
            <br />

            <p>
              These terms and conditions outline the rules and regulations for the
              use of IFCA's Website, located at
              <a
                href=" https://www.pvl.ifcaindia.com"
                target="_blank"
                className="text-orange-500 font-semibold"
              >
                {" "}
                https://www.pvl.ifcaindia.com,
              </a>{" "}
            </p>

            <p>
              By accessing this website we assume you accept these terms and
              conditions. Do not continue to use IFCA if you do not
              agree to take all of the terms and conditions stated on this page.
            </p>

            <p>
              The following terminology applies to these Terms and Conditions,
              Privacy Statement and Disclaimer Notice and all Agreements: "Client",
              "You" and "Your" refers to you, the person log on this website and
              compliant to the Company's terms and conditions. "The Company",
              "Ourselves", "We", "Our" and "Us", refers to our Company. "Party",
              "Parties", or "Us", refers to both the Client and ourselves. All terms
              refer to the offer, acceptance and consideration of payment necessary
              to undertake the process of our assistance to the Client in the most
              appropriate manner for the express purpose of meeting the Client's
              needs in respect of provision of the Company's stated services, in
              accordance with and subject to, prevailing law of Netherlands. Any use
              of the above terminology or other words in the singular, plural,
              capitalization and/or he/she or they, are taken as interchangeable and
              therefore as referring to same. Our Terms and Conditions were created
              with the help of the{" "}
              <a
                href="https://www.privacypolicyonline.com/terms-conditions-generator/"
                target="_blank"
                className="text-blue-600 font-medium"
              >
                Terms & Conditions Generator
              </a>
              .
            </p>

            <h3>
              <strong>Cookies</strong>
            </h3>

            <p>
              We employ the use of cookies. By accessing IFCA, you
              agreed to use cookies in agreement with the IFCA's
              Privacy Policy.
            </p>

            <p>
              Most interactive websites use cookies to let us retrieve the user's
              details for each visit. Cookies are used by our website to enable the
              functionality of certain areas to make it easier for people visiting
              our website. Some of our affiliate/advertising partners may also use
              cookies.
            </p>

            <h3>
              <strong>License</strong>
            </h3>

            <p>
              Unless otherwise stated, IFCA and/or its licensors own
              the intellectual property rights for all material on Startup
              Roundtable. All intellectual property rights are reserved. You may
              access this from IFCA for your own personal use
              subjected to restrictions set in these terms and conditions.
            </p>

            <p>You must not:</p>
            <ul className="list-disc px-10">
              <li>Republish material from IFCA</li>
              <li>Sell, rent or sub-license material from IFCA</li>
              <li>Reproduce, duplicate or copy material from IFCA</li>
              <li>Redistribute content from IFCA</li>
            </ul>
            <br />
            <p>This Agreement shall begin on the date hereof.</p>

            <p>
              Parts of this website offer an opportunity for users to post and
              exchange opinions and information in certain areas of the website.
              IFCA does not filter, edit, publish or review Comments
              prior to their presence on the website. Comments do not reflect the
              views and opinions of IFCA,its agents and/or affiliates.
              Comments reflect the views and opinions of the person who post their
              views and opinions. To the extent permitted by applicable laws,
              IFCA shall not be liable for the Comments or for any
              liability, damages or expenses caused and/or suffered as a result of
              any use of and/or posting of and/or appearance of the Comments on this
              website.
            </p>

            <p>
              IFCA reserves the right to monitor all Comments and to
              remove any Comments which can be considered inappropriate, offensive
              or causes breach of these Terms and Conditions.
            </p>
            <br />
            <p>You warrant and represent that:</p>

            <ul className="list-disc px-10">
              <li>
                You are entitled to post the Comments on our website and have all
                necessary licenses and consents to do so;
              </li>
              <li>
                The Comments do not invade any intellectual property right,
                including without limitation copyright, patent or trademark of any
                third party;
              </li>
              <li>
                The Comments do not contain any defamatory, libelous, offensive,
                indecent or otherwise unlawful material which is an invasion of
                privacy
              </li>
              <li>
                The Comments will not be used to solicit or promote business or
                custom or present commercial activities or unlawful activity.
              </li>
            </ul>
            <br />
            <p>
              You hereby grant IFCA a non-exclusive license to use,
              reproduce, edit and authorize others to use, reproduce and edit any of
              your Comments in any and all forms, formats or media.
            </p>

            <h3>
              <strong>Hyperlinking to our Content</strong>
            </h3>

            <p>
              The following organizations may link to our Website without prior
              written approval:
            </p>

            <ul className="list-disc px-10">
              <li>Government agencies;</li>
              <li>Search engines;</li>
              <li>News organizations;</li>
              <li>
                Online directory distributors may link to our Website in the same
                manner as they hyperlink to the Websites of other listed businesses;
                and
              </li>
              <li>
                System wide Accredited Businesses except soliciting non-profit
                organizations, charity shopping malls, and charity fundraising
                groups which may not hyperlink to our Web site.
              </li>
            </ul>

            <p>
              These organizations may link to our home page, to publications or to
              other Website information so long as the link: (a) is not in any way
              deceptive; (b) does not falsely imply sponsorship, endorsement or
              approval of the linking party and its products and/or services; and
              (c) fits within the context of the linking party's site.
            </p>
            <br />
            <p>
              We may consider and approve other link requests from the following
              types of organizations:
            </p>

            <ul className="list-disc px-10">
              <li>commonly-known consumer and/or business information sources;</li>
              <li>dot.com community sites;</li>
              <li>associations or other groups representing charities;</li>
              <li>online directory distributors;</li>
              <li>internet portals;</li>
              <li>accounting, law and consulting firms; and</li>
              <li>educational institutions and trade associations.</li>
            </ul>
            <br />
            <p>
              We will approve link requests from these organizations if we decide
              that: (a) the link would not make us look unfavorably to ourselves or
              to our accredited businesses; (b) the organization does not have any
              negative records with us; (c) the benefit to us from the visibility of
              the hyperlink compensates the absence of IFCA; and (d)
              the link is in the context of general resource information.
            </p>

            <p>
              These organizations may link to our home page so long as the link: (a)
              is not in any way deceptive; (b) does not falsely imply sponsorship,
              endorsement or approval of the linking party and its products or
              services; and (c) fits within the context of the linking party's site.
            </p>

            <p>
              If you are one of the organizations listed in paragraph 2 above and
              are interested in linking to our website, you must inform us by
              sending an e-mail to IFCA. Please include your name,
              your organization name, contact information as well as the URL of your
              site, a list of any URLs from which you intend to link to our Website,
              and a list of the URLs on our site to which you would like to link.
              Wait 2-3 weeks for a response.
            </p>
            <br />
            <p>Approved organizations may hyperlink to our Website as follows:</p>

            <ul className="list-disc px-10">
              <li>By use of our corporate name; or</li>
              <li>By use of the uniform resource locator being linked to; or</li>
              <li>
                By use of any other description of our Website being linked to that
                makes sense within the context and format of content on the linking
                party's site.
              </li>
            </ul>

            <p>
              No use of IFCA's logo or other artwork will be allowed
              for linking absent a trademark license agreement.
            </p>

            <h3>
              <strong>iFrames</strong>
            </h3>

            <p>
              Without prior approval and written permission, you may not create
              frames around our Webpages that alter in any way the visual
              presentation or appearance of our Website.
            </p>

            <h3>
              <strong>Content Liability</strong>
            </h3>

            <p>
              We shall not be hold responsible for any content that appears on your
              Website. You agree to protect and defend us against all claims that is
              rising on your Website. No link(s) should appear on any Website that
              may be interpreted as libelous, obscene or criminal, or which
              infringes, otherwise violates, or advocates the infringement or other
              violation of, any third party rights.
            </p>

            <h3>
              <strong>Reservation of Rights</strong>
            </h3>

            <p>
              We reserve the right to request that you remove all links or any
              particular link to our Website. You approve to immediately remove all
              links to our Website upon request. We also reserve the right to amen
              these terms and conditions and it's linking policy at any time. By
              continuously linking to our Website, you agree to be bound to and
              follow these linking terms and conditions.
            </p>

            <h3>
              <strong>Removal of links from our website</strong>
            </h3>

            <p>
              If you find any link on our Website that is offensive for any reason,
              you are free to contact and inform us any moment. We will consider
              requests to remove links but we are not obligated to or so or to
              respond to you directly.
            </p>

            <p>
              We do not ensure that the information on this website is correct, we
              do not warrant its completeness or accuracy; nor do we promise to
              ensure that the website remains available or that the material on the
              website is kept up to date.
            </p>

            <h3>
              <strong>Disclaimer</strong>
            </h3>

            <p>
              To the maximum extent permitted by applicable law, we exclude all
              representations, warranties and conditions relating to our website and
              the use of this website. Nothing in this disclaimer will:
            </p>

            <ul className="list-disc px-10">
              <li>
                limit or exclude our or your liability for death or personal injury;
              </li>
              <li>
                limit or exclude our or your liability for fraud or fraudulent
                misrepresentation;
              </li>
              <li>
                limit any of our or your liabilities in any way that is not
                permitted under applicable law; or
              </li>
              <li>
                exclude any of our or your liabilities that may not be excluded
                under applicable law.
              </li>
            </ul>

            <p>
              The limitations and prohibitions of liability set in this Section and
              elsewhere in this disclaimer: <br />
              (a) are subject to the preceding paragraph; and <br /> (b) govern all
              liabilities arising under the disclaimer, including liabilities
              arising in contract, in tort and for breach of statutory duty.
            </p>

            <p>
              As long as the website and the information and services on the website
              are provided free of charge, we will not be liable for any loss or
              damage of any nature.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
