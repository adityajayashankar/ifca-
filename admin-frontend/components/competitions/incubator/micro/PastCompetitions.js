import Link from "next/link";
import { useState } from "react";
import { MdClose } from "react-icons/md";

function PastCompetitions({ competitions = [], owner, partner, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [targetName, setTargetName] = useState("");

  const openModal = (id, name) => {
    setDeleteId(id);
    setTargetName(name);
    setDeleteInput("");
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setDeleteId(null);
    setDeleteInput("");
    setTargetName("");
  };
  const handleDelete = () => {
    if (onDelete && deleteId) {
      onDelete(deleteId);
    }
    closeModal();
  };

  if (!competitions.length) return null;
  return (
    <>
      {competitions.map((item) => (
        <div key={item.id} className="relative rounded-2xl shadow-lg bg-white flex flex-col overflow-hidden transition-transform hover:scale-[1.02] border border-gray-100">
              <div className="relative">
                <img
                  src={item.bannerUrl}
              className="object-cover w-full h-44"
              alt={item.title}
                />
            <p className="absolute bottom-2 right-2 bg-white rounded text-orange-600 p-1 font-semibold text-xs shadow">
              Deadline: {item.endDate?.split("T")[0]}
                </p>
              </div>
          <div className="p-4 flex flex-col gap-2 grow">
            <p className="text-xs font-semibold text-orange-600">Stages: {item?.Stage?.length}</p>
            <div className="flex flex-row justify-between font-semibold text-lg items-center">
              <span className="line-clamp-1 text-gray-900">{item.title}</span>
            </div>
            <p className="capitalize line-clamp-2 text-sm text-gray-500">{item.description}</p>
            <div className="flex flex-row justify-between items-center gap-3 mt-2">
              {owner && (
                    <>
                  <button
                    className="text-sm font-semibold text-red-700 border border-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition"
                    onClick={() => openModal(item.id, item.title)}
                  >
                      Delete
                  </button>
                  <Link href={partner ? `/partner/competitions/submissions/${item.id}` : `/admin/competitions/submissions/${item.id}` } passHref>
                    <a className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-orange-600 transition text-sm shadow">
                          Submissions
                    </a>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
      ))}
      {/* Delete Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold" aria-label="Close">
              <MdClose className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-orange-700">Delete Competition</h2>
            <p className="text-gray-700">To confirm deletion, please type the competition name below:</p>
            <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded font-semibold text-center select-all cursor-pointer" onClick={() => navigator.clipboard.writeText(targetName)}>
              {targetName}
            </div>
            <input
              type="text"
              className="border border-orange-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
              placeholder="Type competition name to confirm..."
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300 ${deleteInput !== targetName ? 'cursor-not-allowed opacity-60' : ''}`}
                onClick={handleDelete}
                disabled={deleteInput !== targetName}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center z-10">Delete</span>
              </button>
            </div>
      </div>
    </div>
      )}
    </>
  );
}

export default PastCompetitions;
