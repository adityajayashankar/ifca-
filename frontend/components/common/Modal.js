import React from "react";

export default function Modal({
    showModal = false,
    setShowModal,
    title,
    btn,
    children,
    src
}) {
    //   const [showModal, setShowModal] = React.useState(false);
    return (
        <>
            {showModal ? (
                <>
                    <div
                        className="justify-center h-screen w-screen items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
                    >
                        <div className="relative max-w-[100vw] h-[500px] px-3 py-1 md:max-w-3xl my-10 mx-auto">
                            {/*content*/}
                            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                                {/*header*/}
                                <div className="flex items-start justify-between px-5 rounded-t">
                                    <h3 className="text-3xl text-black mx-auto font-semibold">
                                        {title}
                                    </h3>
                                    {/* <button
                                        className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                                        onClick={() => setShowModal(false)}
                                    >
                                        <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                                            ×
                                        </span>
                                    </button> */}
                                </div>
                                {/*body*/}
                                <div className="relative flex-auto">
                                    {children}
                                    {src && <iframe title="g" src={src} width="540" height="400"></iframe>}
                                </div>
                                {/*footer*/}
                                <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 rounded-b">
                                    <button
                                        className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
                </>
            ) : null}
        </>
    );
}