/**
 * Get user photo URL with proper fallbacks
 * @param {Object} user - The user object from Redux store
 * @returns {string} - The photo URL to display
 */
export const getUserPhotoURL = (user) => {
  if (!user) return "/t6.svg";
  
  // Check direct photoURL first
  if (user.photoURL && user.photoURL.trim() !== '') {
    return user.photoURL;
  }
  
  // Check nested photoURL in unifiedUser
  if (user.unifiedUser?.user?.photoURL) return user.unifiedUser.user.photoURL;
  if (user.unifiedUser?.partner?.photoURL) return user.unifiedUser.partner.photoURL;
  if (user.unifiedUser?.expert?.photoURL) return user.unifiedUser.expert.photoURL;
  if (user.unifiedUser?.admin?.photoURL) return user.unifiedUser.admin.photoURL;
  
  // Check if user has a name and generate a default avatar
  if (user.name && user.name.trim() !== '') {
    // Use PNG format to avoid SVG issues
    const cleanName = user.name.trim().replace(/\s+/g, '+');
    return `https://ui-avatars.com/api/?name=${cleanName}&background=ffe5b4&color=000000&size=256&bold=true&format=png`;
  }
  
  // Final fallback
  return "/t6.svg";
}; 