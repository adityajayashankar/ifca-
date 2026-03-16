import Notifications from "@mui/icons-material/Notifications";
import moment from "moment";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const Notification = ({ posts }) => {
  const router = useRouter();

  const handleNotificationClick = (data) => {
    if (data.assets.length > 0) {
      router.push(`/partner/comThreads/6?postId=${data.id}`);
    } else {
      router.push(`/partner/comThreads/6?postId=${data.id}`);
    }
  };

  return (
    <div className="space-y-1">
      {posts?.length > 0 ? (
        posts?.map((data, index) => (
          <motion.div 
            key={data.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            // onClick={() => handleNotificationClick(data)}
            onClick={null}
            className="bg-white border border-gray-300 rounded-xl p-3 hover:shadow-lg hover:border-primary-100 transition-all duration-300 no-cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-1">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <img 
                      src={data?.creator?.user?.photoURL || "/notImg.svg"} 
                      alt={`${data?.creator?.user?.name || 'User'}'s avatar`} 
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  </div>
                  {data.assets.length > 0 ? (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px]">📢</span>
                    </div>
                  ) : (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px]">📊</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 ">
                  <span className="font-semibold text-gray-800 group-hover:text-primary-500 transition-colors text-sm">
                    {data?.creator?.user?.name}
                  </span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-500 text-xs">posted on</span>
                  <span className="text-primary-500 font-medium text-xs px-2 py-0.5 bg-primary-50 rounded-full">
                    {data.assets.length > 0 ? "announcements" : "polls"}
                  </span>
                </div>
                <div className="flex items-center gap-2 ">
                  <p className="text-xs text-gray-500">
                    {moment(data.createdAt).fromNow()}
                  </p>
                  <span className="text-gray-300">•</span>
                  <h3 className="text-sm font-medium m-0 p-0 text-gray-800 group-hover:text-primary-500 transition-colors truncate">
                    {data.title}
                  </h3>
                </div>
                {/* {data.content && (
                  <p className="text-xs text-gray-600 truncate">
                    {data.content}
                  </p>
                )} */}
              </div>
            </div>
          </motion.div>
        ))
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="min-h-[60vh] flex flex-col gap-4 items-center justify-center bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100 p-6"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
            <Notifications className="text-3xl text-primary-500" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700 mb-1">No notifications yet</p>
            <p className="text-sm text-gray-400 max-w-sm">You'll see your notifications here when there are new announcements or polls in your community.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Notification;
