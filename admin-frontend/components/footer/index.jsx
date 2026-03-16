import Link from "next/link";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { SiGoogleplay, SiAppstore } from 'react-icons/si';

const Footer = () => {
  const user = useSelector(selectUser);
  const isLoggedIn = !!user;

  return (
    <footer className="bg-[#1a1a1a] text-white w-full border-t border-gray-800">
      {isLoggedIn ? (
        // Logged in - Show only contact details
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <div className="text-xs text-gray-400 order-2 sm:order-1">
                © 2025 IFCA. All rights reserved.
              </div>
              
              {/* Contact Details - Right Aligned */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 order-1 sm:order-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                    <EmailIcon className="text-white text-xs" />
                  </div>
                  <a
                    href="mailto:analyst@pesuventurelabs.com"
                    className="text-xs sm:text-sm hover:text-orange-400 transition-colors font-medium"
                  >
                    analyst@pesuventurelabs.com
                  </a>
                </div>

                <div className="hidden sm:block w-px h-5 bg-gray-700"></div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                    <PhoneIcon className="text-white text-xs" />
                  </div>
                  <a
                    href="tel:+918310535589"
                    className="text-xs sm:text-sm hover:text-orange-400 transition-colors font-medium"
                  >
                    +91 83105 35589
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Not logged in - Show full footer
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Column 1: Contact Us */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white mb-4">Contact Us</h3>
                <div className="space-y-3">
                  <a 
                    href="mailto:analyst@pesuventurelabs.com" 
                    className="flex items-center gap-3 group hover:text-orange-400 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                      <EmailIcon className="text-white text-sm" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-orange-400">analyst@pesuventurelabs.com</span>
                  </a>
                  <a 
                    href="tel:+918310535589" 
                    className="flex items-center gap-3 group hover:text-orange-400 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                      <PhoneIcon className="text-white text-sm" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-orange-400">+91 83105 35589</span>
                  </a>
                </div>
              </div>

              {/* Column 2: Powered by IFCA */}
              <div className="space-y-4">
                <div className="flex flex-col items-start md:items-center lg:items-start">
                  <h3 className="text-base font-bold text-white mb-4">Powered by</h3>
                  <img 
                    src="/poweredByLogo4.png" 
                    alt="IFCA Logo" 
                    className="h-24 md:h-28 lg:h-32 w-auto object-contain mb-4" 
                  />
                </div>
              </div>

              {/* Column 3: Download Our App */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white mb-4">Download Our App</h3>
                <div className="flex flex-col gap-3">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.app.ifca_flutter_app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-black hover:bg-gray-900 border border-gray-700 hover:border-orange-500 px-4 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg group"
                  >
                    <SiGoogleplay className="text-2xl text-white group-hover:text-orange-400 transition-colors" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Get it on</span>
                      <span className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">Google Play</span>
                    </div>
                  </a>
                  <a
                    href="https://apps.apple.com/in/app/ifca/id6740889552"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-black hover:bg-gray-900 border border-gray-700 hover:border-orange-500 px-4 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg group"
                  >
                    <SiAppstore className="text-2xl text-white group-hover:text-orange-400 transition-colors" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Download on the</span>
                      <span className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">App Store</span>
                    </div>
                  </a>
                </div>
              </div>

              {/* Column 4: Our Information */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white mb-4">OUR INFORMATION</h3>
                <ul className="space-y-2.5">
                  <li>
                    <Link 
                      href="/support" 
                      className="text-sm text-gray-300 hover:text-orange-400 transition-colors inline-block hover:translate-x-1 transform duration-200"
                    >
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/accountDeletion" 
                      className="text-sm text-gray-300 hover:text-orange-400 transition-colors inline-block hover:translate-x-1 transform duration-200"
                    >
                      Account Deletion
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/privacyPolicy" 
                      className="text-sm text-gray-300 hover:text-orange-400 transition-colors inline-block hover:translate-x-1 transform duration-200"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/termsAndConditions" 
                      className="text-sm text-gray-300 hover:text-orange-400 transition-colors inline-block hover:translate-x-1 transform duration-200"
                    >
                      Terms and Conditions
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/returnAndRefund" 
                      className="text-sm text-gray-300 hover:text-orange-400 transition-colors inline-block hover:translate-x-1 transform duration-200"
                    >
                      Return and Refund Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Copyright Bar */}
          <div className="border-t border-gray-800 bg-[#151515]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-center text-xs sm:text-sm text-gray-400">
                © 2025 IFCA. All rights reserved.
              </p>
            </div>
          </div>
        </>
      )}
    </footer>
  );
};

export default Footer;

