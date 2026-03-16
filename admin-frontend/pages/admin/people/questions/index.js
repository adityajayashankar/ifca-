import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const RemoveModal = ({ setRemove, id, question }) => {

    const handleRemove = async () => {
        const res = await api.delete(`/questions/remove/${id}`)
        if (res.data.success) {
            setRemove(false)
            toast(`${res.data.msg}`, { type: "success" })
            window.location.reload()
        }
        else
            toast(`${res.data.msg}`, { type: "error" })
    }

    const handleCancel = () => {
        setRemove(false)
    }
    return <div
        className="w-full h-full fixed top-0 left-0 backdrop-blur-md flex justify-center items-center"
    >
        <div
            className="bg-white relative p-4 lg:min-w-[500px] border-2 border-black rounded-md"
        >
            <div className="py-4">
                <label
                    className="w-full text-lg font-bold">
                    Do you want to remove this question?
                </label><br />
                <label
                    className="w-full text-lg">
                    {question}
                </label><br />
            </div>
            <div className="flex w-full my-3">
                <div className="w-full pr-2">
                    <button
                        className="w-full bg-blue-600 text-white text-lg p-2"
                        onClick={() => handleRemove(id)}>
                        Yes
                    </button>
                </div>
                <div className="w-full pl-2">
                    <button
                        className="w-full bg-red-600 text-white text-lg p-2"
                        onClick={handleCancel}
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    </div >
}

const CreateModal = ({ setCreate, email }) => {

    const [question, setQuestion] = useState('')

    const handleChange = (e) => {
        setQuestion(e.target.value)
    }

    const handleAdd = async () => {
        const res = await api.post('/questions/create', {
            question: question,
            email: email
        })

        if (res.data.success) {
            setCreate(false)
            toast(`${res.data.msg}`, { type: "success" })
            window.location.reload()
        }
        else toast(`${res.data.msg}`, { type: "error" })
    }

    const handleCancel = () => {
        setCreate(false)
    }
    return <div
        className="w-full h-full fixed top-0 left-0 backdrop-blur-md flex justify-center items-center">
        <div
            className="bg-white relative p-4 lg:min-w-[500px] border-2 border-black rounded-md">
            <div className="w-full">
                <label
                    className="my-12 text-lg"
                >Enter the Question to be added</label><br />
                <input
                    className="border-2 border-black rounded-md my-2 w-full p-2"
                    type='text'
                    value={question}
                    onChange={handleChange}
                /><br />
                <div className="flex w-full text-lg text-white">
                    <div className="w-full pr-2">
                        <button
                            className="w-full bg-blue-600 p-2"
                            onClick={handleAdd}>Add</button>
                    </div>
                    <div className="w-full pl-2">
                        <button
                            className="w-full bg-red-600 p-2"
                            onClick={handleCancel}>Cancel</button>
                    </div>

                </div>
            </div>
        </div>
    </div>
}

const Questions = () => {

    const user = useSelector(selectUser)

    const [create, setCreate] = useState(false)
    const [remove, setRemove] = useState(false)
    const [questions, setQuestions] = useState([])

    const [current, setCurrent] = useState({})

    const handleViewQuestions = async () => {
        const res = await api.get('/questions/show/all')
        if (res.data.success) setQuestions(res.data.questions)
    }

    const handleActiveQuestion = async (id, isEnable) => {
        const res = await api.patch(`/questions/update/toggle/`, {
            id: id,
            isEnable: isEnable
        })

        if (res.data.success) toast(`${res.data.msg}`, { type: "success" })
        else toast(`${res.data.msg}`, { type: "error" })
        window.location.reload()
    }

    const handleRemove = (item) => {
        setCurrent({
            id: item.id,
            question: item.question
        })
        setRemove(true)
    }
    useEffect(() => {
        const timer = setTimeout(() => {
            handleViewQuestions()
        }, 500)
        return () => clearTimeout(timer)
    }, [])
    return <div>
        <div
            className="px-4 pt-8 pb-4">
            <button
                className="button button-blue"
                onClick={() => setCreate(true)}> + Question</button>
        </div>
        <div
            className="w-full p-4">
            {
                questions?.map(item => {
                    return <div
                        className="w-full flex p-4 border-2 border-black rounded-md my-2"
                    >
                        <div
                            className="w-full text-lg flex items-center font-bold">
                            {item.question}
                        </div>
                        <div
                            className="w-full flex justify-end">
                            <div className="px-8">
                                <button
                                    className={item.isEnable ? "bg-green-500 p-3 rounded-md text-white" : "bg-red-500 p-3 rounded-md text-white"}
                                    onClick={() => handleActiveQuestion(item.id, item.isEnable)}>
                                    {item.isEnable ? "Active" : "Not Active"}
                                </button>
                            </div>
                            <div className="px-8">
                                <button
                                    className="bg-red-600 text-lg text-white p-2 rounded-md"
                                    onClick={() => handleRemove(item)}>
                                    Remove
                                </button>
                            </div>
                        </div>

                    </div>
                })
            }
        </div>
        {create ? <CreateModal setCreate={setCreate} email={user.email} /> : <></>}
        {remove ? <RemoveModal setRemove={setRemove} id={current.id} question={current.question} /> : <></>}
    </div>
}

export default Questions