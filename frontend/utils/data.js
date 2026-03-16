// Backward compatibility wrapper for existing code
// New code should import from '@/config/appConfig' instead
import appConfig from '@/config/appConfig';

let companyData = {
  companyName: appConfig.branding.companyName,
  logo: appConfig.branding.logo.main,
  email: appConfig.branding.contact.email,
  phone: appConfig.branding.contact.phone,
  title: appConfig.branding.description.title,
  url: appConfig.branding.contact.url,
  description: appConfig.branding.description.subtitle,
  accessToken: appConfig.app.storage.accessToken,
  refreshToken: appConfig.app.storage.refreshToken,
  store: appConfig.app.storage.store,
};

export default companyData;
