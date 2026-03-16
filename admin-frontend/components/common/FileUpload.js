import { useState } from "react";

import Modal from "./Modal";
// icons
import { ImCross } from "react-icons/im";

const MultiFileInput = ({
  placeholder,
  value,
  setValue,
  required = true,
  accept,
  type,
}) => {
  const [showModal, setShowModal] = useState(false);
  let regex = new RegExp("[^.]+$");

  const onSelectFile = (event) => {
    const selectedFiles = event.target.files;
    console.log("selectedFiles", selectedFiles);

    const selectedFilesArray = Array.from(selectedFiles);
    console.log(selectedFilesArray);
    selectedFilesArray?.forEach((x, index) => {
      console.log(x);
      setValue((prev) => [
        ...prev,
        { url: URL.createObjectURL(x), index: index, name: x.name, file: x },
      ]);
    });
    // FOR BUG IN CHROME
    event.target.value = "";
  };

  // console.log("images are ", images)
  function deleteHandler(image) {
    setValue(value.filter((item) => item !== image));
  }
  return (
    <div className="overflow-x-hidden w-full">
      <input
        type="file"
        onChange={onSelectFile}
        id={`inp` + `${accept}`}
        multiple
        accept={accept}
        className="hidden"
      />
      <label
        className="flex cursor-pointer m-auto items-center text-3xl text-center content-center ml-4"
        htmlFor={`inp` + `${accept}`}
      >
        {placeholder}
      </label>
      {type === "img" && (
        <div className="max-w-full flex flex-row overflow-x-auto h-auto mt-2">
          {value?.length > 0 &&
            value?.map((image, index) => (
              <div key={index}>
                <div>
                  <img
                    htmlFor="inp"
                    className="object-contain h-[150px] p-2 w-[150px]̦"
                    src={image?.url}
                    alt="uploaded image"
                  />
                  <ImCross
                    onClick={() => deleteHandler(image)}
                    className="cursor-pointer float-right mr-[10px]"
                  />
                </div>
              </div>
            ))}
        </div>
      )}
      {type !== "img" && (
        <div className="flex flex-wrap mt-2">
          {value?.length > 0 &&
            value?.map((file, index) => (
              <div className="flex mt-3 p-2 rounded-3xl">
                <div
                  onClick={() => setShowModal(true)}
                  key={index}
                  className="flex bg-slate-400 p-1 ml-3 hover:underline cursor-pointer hover:text-blue-600"
                >
                  {file?.name} {index}
                </div>
                <div className="">
                  <ImCross
                    onClick={() => deleteHandler(file)}
                    className="cursor-pointer float-right"
                  />
                </div>
                {showModal && (
                  <Modal
                    showModal={showModal}
                    setShowModal={setShowModal}
                    src={file?.url}
                  />
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default MultiFileInput;
