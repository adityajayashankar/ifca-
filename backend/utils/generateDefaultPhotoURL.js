// Utility to generate a default photo URL based on name or fallback to a chef avatar

/**
 * Generates a default photo URL for a user based on their name.
 * Uses UI Avatars API for reliable avatar generation.
 * Falls back to a generic chef avatar if name is not provided.
 * @param {string} name - The name of the user (optional)
 * @returns {string} - The generated photo URL
 */
function generateDefaultPhotoURL(name) {
  if (name && name.trim().length > 0) {
    // Use UI Avatars API for reliable avatar generation
    // Use PNG format to avoid SVG issues
    const cleanName = name.trim().replace(/\s+/g, '+');
    return `https://ui-avatars.com/api/?name=${cleanName}&background=ffe5b4&color=000000&size=256&bold=true&format=png`;
  }
  // Fallback to a generic chef/cooking avatar
  return 'https://cdn.pixabay.com/photo/2014/04/03/10/32/chef-312186_1280.png';
}

module.exports = generateDefaultPhotoURL; 