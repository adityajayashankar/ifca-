// import useStateStore from "@zustand/index";
import Modal from "@mui/material/Modal";
import useStateStore from "@zustand/index";
import { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  dismissToast,
  errorToast,
  loadingToast,
  successToast,
} from "@helpers/toastconfig";
const AddEvaluatorModal = () => {
  const [open, setopen] = useState(false);
  const handleOpen = () => setopen(true);
  const handleClose = () => setopen(false);
  const services = useStateStore((state) => state.services);
  const [credsModalOpen, setcredsModalOpen] = useState(false);
  const credsModalOpenHandler = () => {
    setcredsModalOpen(true);
  };
  const credsModalCloseHandler = () => {
    setcredsModalOpen(false);
  };

  const [creds, setcreds] = useState(null);
  const handleSubmit = (e) => {
    e.preventDefault();
    const formValues = Object.fromEntries(new FormData(e.target));
    const toast = loadingToast("Creating evaluator...");
    services.evaluator.create(formValues).then((res) => {
      console.log(res);
      if (res.status) {
        setcreds(res.successObject);
        handleClose();
        credsModalOpenHandler();
      } else {
        errorToast(res.errorMessage);
      }
      dismissToast(toast);
    });
    //submit form
    // handleClose();
  };
  return (
    <>
      <div
        onClick={handleOpen}
        className="bg-[#DDE2E4] px-4 py-2 cursor-pointer hover:shadow text-black text-sm font-semibold shadow rounded"
      >
        Add Evaluator
      </div>
      <Modal open={credsModalOpen} onClose={credsModalCloseHandler}>
        <div className="focus:outline-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow min-w-1/3 flex flex-col gap-1">
          <p className="text-lg font-semibold text-headingColor">
            Evaluator Account Created 🎉
          </p>
          <p className="text-sm text-gray-400">
            Please note down the following credentials. You will not be able to
            see them again.
          </p>
          <hr />
          <div className="flex flex-col gap-2 bg-gray-100 p-2 rounded relative">
            <p>Email : {creds?.email}</p>
            <p>Password : {creds?.password}</p>
            <div
              onClick={() => {
                navigator.clipboard.writeText(
                  `Email: ${creds.email} Password: ${creds.password}`
                );
                successToast("Copied to clipboard");
              }}
              className="hover:bg-gray-200 cursor-pointer absolute top-0 right-2 p-1 px-2 border text-sm flex flex-row items-center justify-center gap-1"
            >
              <ContentCopyIcon fontSize="small" className="text-sm" />
              Copy
            </div>
          </div>
        </div>
      </Modal>
      <Modal open={open} onClose={handleClose}>
        <form
          onSubmit={handleSubmit}
          className="p-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3  cust_sm:inset-1/2 bg-white flex flex-col justify-evenly gap-3 rounded shadow focus:outline-none"
        >
          <p className="text-lg font-semibold text-headingColor">
            Add Evaluator
          </p>
          <hr />
          <div className="  flex flex-col justify-around  h-fit   gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-sm ">Name</p>
              <input
                type="text"
                name="name"
                className="border p-1 px-2 rounded border-gray-300 focus:outline-none focus:border-headingColor w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm ">Email</p>
              <input
                type="email"
                name="email"
                className="border p-1 px-2 rounded border-gray-300 focus:outline-none focus:border-headingColor w-full"
              />
            </div>

            <div className="flex flex-row-reverse gap-4">
              <button type="button" onClick={handleClose}>
                <p className=" text-red-600">Cancel</p>
              </button>
              <button
                type="submit"
                className="bg-actionbtnBlue text-white rounded px-4 py-2 font-semibold"
              >
                Create
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AddEvaluatorModal;
