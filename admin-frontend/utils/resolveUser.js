import companyData from "./data";

export const resolveUnifiedUser = (user) => {
  // returns userId,email,name,photoURL,desc, role
  if (!user) return null;
  if (user.userId) {
    return {
      userId: user.user.id,
      email: user.user.email,
      name: user.user.name,
      photoURL: user.user.photoURL,
      desc: user.user.desc,
      role: "Member",
      uid: user.id,
    };
  }
  if (user.partnerId) {
    return {
      userId: user.partner.id,
      email: user.partner.email,
      name: user.partner.name,
      photoURL: user.partner.photoURL,
      desc: "user.partner.desc",
      role: "Partner",
      uid: user.id,
    };
  }
  if (user.expertId) {
    return {
      userId: user.expert.id,
      email: user.expert.email,
      name: user.expert.name,
      photoURL: user.expert.photoURL,
      desc: user.expert.desc,
      role: "Expert",
      uid: user.id,
    };
  }
  if (user.adminId) {
    return {
      userId: user.admin.id,
      email: user.admin.email,
      name: `Team ${companyData?.companyName}`,
      photoURL: companyData?.logo,
      desc: `By the creative team of ${companyData?.companyName}`,
      role: "Admin",
      uid: user.id,
    };
  }
};
