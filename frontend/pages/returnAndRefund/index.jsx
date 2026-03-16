import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import Image from "next/image";

export default function ReturnAndRefund() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>Return and Refund Policy | IFCA</title>
      </Head>
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
      <div className="pt-8 max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 -mt-16 relative z-30">
          <div data-custom-class="body">
            <div className="text-center mb-8">
              <div data-custom-class="title">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Return and Refund Policy</h1>
              </div>
              <div data-custom-class="subtitle">
                <span className="text-gray-500 text-base">Last updated: June 13, 2025</span>
              </div>
            </div>
            <div data-custom-class="body_text text-gray-700 leading-relaxed space-y-4">
              <p>Thank you for shopping at IFCA PVL website and IFCA app.</p>
              <p>If, for any reason, You are not completely satisfied with a purchase We invite You to review our policy on refunds and returns. This Return and Refund Policy has been created with the help of the <a href="https://www.freeprivacypolicy.com/free-return-refund-policy-generator/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Free Return and Refund Policy Generator</a>.</p>
              <p>The following terms are applicable for any products that You purchased with Us.</p>
              <h2 className="text-2xl font-bold mt-8 mb-2">Interpretation and Definitions</h2>
              <h3 className="text-lg font-semibold mt-4 mb-1">Interpretation</h3>
              <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
              <h3 className="text-lg font-semibold mt-4 mb-1">Definitions</h3>
              <p>For the purposes of this Return and Refund Policy:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Application</strong> means the software program provided by the Company downloaded by You on any electronic device, named IFCA</li>
                <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Campus CoCreate Venture LLP, #1208, 12th Floor, Be Block, PES University Ring Road Campus, 100 Feet Ring Road, Dwaraka Nagar, Banashankari 3rd Stage, Bangalore, Karnataka - 560085.</li>
                <li><strong>Goods</strong> refer to the items offered for sale on the Service.</li>
                <li><strong>Orders</strong> mean a request by You to purchase Goods from Us.</li>
                <li><strong>Service</strong> refers to the Application or the Website or both.</li>
                <li><strong>Website</strong> refers to IFCA PVL, accessible from <a href="https://pvl.ifcaindia.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://pvl.ifcaindia.com</a></li>
                <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
              </ul>
              <h2 className="text-2xl font-bold mt-8 mb-2">Your Order Cancellation Rights</h2>
              <p>You are entitled to cancel Your Order within 7 days without giving any reason for doing so.</p>
              <p>The deadline for cancelling an Order is 7 days from the date on which You received the Goods or on which a third party you have appointed, who is not the carrier, takes possession of the product delivered.</p>
              <p>In order to exercise Your right of cancellation, You must inform Us of your decision by means of a clear statement. You can inform us of your decision by:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>By email: analyst@pesuventurelabs.com</li>
              </ul>
              <p>We will reimburse You no later than 14 days from the day on which We receive the returned Goods. We will use the same means of payment as You used for the Order, and You will not incur any fees for such reimbursement.</p>
              <h2 className="text-2xl font-bold mt-8 mb-2">Conditions for Returns</h2>
              <p>In order for the Goods to be eligible for a return, please make sure that:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The Goods were purchased in the last 7 days</li>
              </ul>
              <p>The following Goods cannot be returned:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The supply of Goods made to Your specifications or clearly personalized.</li>
                <li>The supply of Goods which according to their nature are not suitable to be returned, deteriorate rapidly or where the date of expiry is over.</li>
                <li>The supply of Goods which are not suitable for return due to health protection or hygiene reasons and were unsealed after delivery.</li>
                <li>The supply of Goods which are, after delivery, according to their nature, inseparably mixed with other items.</li>
              </ul>
              <p>We reserve the right to refuse returns of any merchandise that does not meet the above return conditions in our sole discretion.</p>
              <p>Only regular priced Goods may be refunded. Unfortunately, Goods on sale cannot be refunded. This exclusion may not apply to You if it is not permitted by applicable law.</p>
              <h2 className="text-2xl font-bold mt-8 mb-2">Returning Goods</h2>
              <p>You are responsible for the cost and risk of returning the Goods to Us. You should send the Goods at the following address:</p>
              <p>Any items purchased on the website are solely digital</p>
              <p>We cannot be held responsible for Goods damaged or lost in return shipment. Therefore, We recommend an insured and trackable mail service. We are unable to issue a refund without actual receipt of the Goods or proof of received return delivery.</p>
              <h2 className="text-2xl font-bold mt-8 mb-2">Gifts</h2>
              <p>If the Goods were marked as a gift when purchased and then shipped directly to you, You'll receive a gift credit for the value of your return. Once the returned product is received, a gift certificate will be mailed to You.</p>
              <p>If the Goods weren't marked as a gift when purchased, or the gift giver had the Order shipped to themselves to give it to You later, We will send the refund to the gift giver.</p>
              <h3 className="text-lg font-semibold mt-4 mb-1">Contact Us</h3>
              <p>If you have any questions about our Returns and Refunds Policy, please contact us:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>By email: analyst@pesuventurelabs.com</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 