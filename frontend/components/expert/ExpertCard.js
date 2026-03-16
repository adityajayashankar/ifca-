import { useState } from "react";
import ExpertModal from "./ExpertModal";
import { Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import Image from "next/image";

const imageVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const ExpertCard = (props) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {showModal && (
        <ExpertModal item={props.item} setShowModal={setShowModal} />
      )}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-72 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <motion.div 
          variants={imageVariants} 
          initial="hidden" 
          whileInView="visible"
          className="flex-shrink-0"
        >
          <div className={`${props.height || "w-20 h-20"} relative rounded-full overflow-hidden border border-gray-100`}>
            <img
              src={props.item?.photoURL || "/Landing_Our Expert_Expand.png"}
              alt={props.item?.name || "Expert"}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
        <div className="flex-1 min-w-0">
          <Tooltip title={props.item?.name || ""}>
            <h3 className="text-lg font-semibold mb-1 truncate">
              {props.item?.name}
            </h3>
          </Tooltip>
          <p className="text-sm text-gray-600 line-clamp-2">
            {props.item?.desc}
          </p>
        </div>
      </motion.div>
    </>
  );
};

export default ExpertCard;
