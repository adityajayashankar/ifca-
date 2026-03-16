import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaWhatsapp, 
  FaTwitter, 
  FaTelegram, 
  FaLinkedin 
} from 'react-icons/fa';
import { 
  MdEmail, 
  MdContentCopy, 
  MdQrCode2, 
  MdClose, 
  MdCheck 
} from 'react-icons/md';

const ShareModal = ({ isOpen, onClose, shareData }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const {
    title = "Check this out!",
    text = "I found this interesting content on IFCA",
    url = window.location.href,
    hashtags = "#IFCA #Community",
    communityName = "IFCA Community",
    communityDesc = "Join our vibrant community",
    communityImage = "/comPic.svg",
    postId = null
  } = shareData || {};

  // Create URL with post ID if available and fix domain
  const createShareUrl = (baseUrl) => {
    let shareUrl = postId ? `${baseUrl}?postId=${postId}` : baseUrl;
    
    // Replace localhost:3005 with localhost:3001
    shareUrl = shareUrl.replace('localhost:3005', 'localhost:3001');
    
    // Replace admin.dev.ifcaindia.com with dev.ifcaindia.com
    shareUrl = shareUrl.replace('admin.dev.ifcaindia.com', 'dev.ifcaindia.com');
    
    // Replace admin.pvl.ifcaindia.com with pvl.ifcaindia.com
    shareUrl = shareUrl.replace('admin.pvl.ifcaindia.com', 'pvl.ifcaindia.com');
    
    return shareUrl;
  };

  const shareUrl = createShareUrl(url);
  
  // Professional share messages like other companies
  const professionalText = `${text}`;
  const professionalMessage = `${professionalText}\n\nJoin ${communityName} on IFCA India Platform - ${communityDesc}\n\n${shareUrl}\n\n${hashtags}`;
  
  // Shorter message for platforms with character limits
  const shortMessage = `${text}\n\nJoin ${communityName} on IFCA!\n\n${shareUrl}\n\n${hashtags}`;

  // Generate QR Code
  const generateQRCode = async () => {
    try {
      // Using a simple QR code generation approach
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  useEffect(() => {
    if (showQR && shareUrl) {
      generateQRCode();
    }
  }, [showQR, shareUrl]);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: '#25D366',
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(professionalMessage)}`;
        window.open(whatsappUrl, '_blank');
      }
    },
    {
      name: 'X',
      icon: FaTwitter,
      color: '#000000',
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortMessage)}`;
        window.open(twitterUrl, '_blank');
      }
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      color: '#0088cc',
      action: () => {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(professionalText)}`;
        window.open(telegramUrl, '_blank');
      }
    },
    {
      name: 'Email',
      icon: MdEmail,
      color: '#EA4335',
      action: () => {
        const emailSubject = encodeURIComponent(`${title} - ${communityName}`);
        const emailBody = encodeURIComponent(professionalMessage);
        const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
        window.open(emailUrl);
      }
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: '#0077B5',
      action: () => {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(professionalText)}`;
        window.open(linkedinUrl, '_blank');
      }
    },
    {
      name: 'Copy Link',
      icon: copied ? MdCheck : MdContentCopy,
      color: copied ? '#10B981' : '#6B7280',
      action: async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    },
    {
      name: 'QR Code',
      icon: MdQrCode2,
      color: '#000000',
      action: () => setShowQR(true)
    }
  ];

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Share</h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <MdClose className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {showQR ? (
              <div className="text-center">
                <div className="mb-3">
                  <h4 className="text-base font-medium text-gray-900 mb-1">QR Code</h4>
                  <p className="text-xs text-gray-600 mb-3">Scan this QR code to open the link</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <div className="w-40 h-40 mx-auto bg-white p-3 rounded-lg">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                        <div className="text-center">
                          <MdQrCode2 className="w-12 h-12 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Loading...</p>
                        </div>
                      </div>
                    )}
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center hidden">
                      <div className="text-center">
                        <MdQrCode2 className="w-12 h-12 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500 break-all">{shareUrl}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowQR(false)}
                  className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                >
                  ← Back to share options
                </button>
              </div>
            ) : (
              <>
                {/* Community Info */}
                <div className="mb-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <img 
                      src={communityImage} 
                      alt={communityName}
                      className="w-10 h-10 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src = '/comPic.svg';
                      }}
                    />
                    <div>
                      <h4 className="text-base font-medium text-gray-900">{title}</h4>
                      <p className="text-xs text-gray-600">{communityName}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{professionalText}</p>
                </div>

                {/* Share Options Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {shareOptions.map((option) => (
                    <motion.button
                      key={option.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={option.action}
                      className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: `${option.color}15` }}
                      >
                        <option.icon
                          className="w-5 h-5"
                          style={{ color: option.color }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center">
                        {option.name}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* Copy Link Section */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 mb-0.5">Direct Link</p>
                      <p className="text-xs text-gray-500 truncate">{shareUrl}</p>
                    </div>
                    <button
                      onClick={shareOptions[5].action} // Copy Link action
                      className="ml-2 p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    >
                      {copied ? (
                        <MdCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <MdContentCopy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
