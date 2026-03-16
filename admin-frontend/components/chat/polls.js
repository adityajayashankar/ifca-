import React, { useEffect, useState } from "react";
import { AiOutlineCloseCircle } from "react-icons/ai"
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import Modal from "@/components/common/Modal";
import { BiArrowBack } from "react-icons/bi";

// Persistent data array (typically fetched from the server)
const resData = [
    { id: 0, text: 'Answer 1', votes: 0 },
    { id: 1, text: 'Answer 2', votes: 10 },
    { id: 2, text: 'Answer 3', votes: 0 }
]

// {optionsData:[{option:text}]}

// sample poll object

// {
//     question : "question",
//     resultData : [
// { id: 0, text: 'Answer 1', votes: 0 },
// { id: 1, text: 'Answer 2', votes: 10 },
// { id: 2, text: 'Answer 3', votes: 0 }
//     ]
// }

// Object keys may vary on the poll type (see the 'Theme options' table below)
const customTheme = {
    textColor: 'black',
    mainColor: '#00B87B',
    backgroundColor: 'rgb(255,255,255)',
    alignment: 'center'
}

function Poll({
    showPoll,
    question,
    setQuestion,
    options,
    setOptions,
    expiresAt,
    setExpiresAt,
    onSubmit,
    results,
    threadId,
    isVoted,
    votedOption,
    creatorId,
    setShowPoll,
    onClose
}) {
    const loggedUser = useSelector(selectUser)
    const [showVoters, setShowVoters] = useState(false);
    const [voters, setVoters] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const isAdmin = loggedUser?.userType === 'admin';
    const isCreator = loggedUser?.unifiedUser?.id === creatorId;
    const [localVotedOption, setLocalVotedOption] = useState(votedOption);
    const [localResults, setLocalResults] = useState(results || []);
    const [hasVoted, setHasVoted] = useState(!!isVoted);
    
    useEffect(() => {
        setLocalResults(results || []);
        setLocalVotedOption(votedOption);
        setHasVoted(!!isVoted);
    }, [results, votedOption, isVoted]);

    // Calculate total votes
    const totalVotes = localResults.reduce((sum, opt) => sum + (opt.votes || 0), 0);

    // Calculate percentage for each option
    const getPercent = (votes) => {
        if (totalVotes === 0) return 0;
        return Math.round((votes / totalVotes) * 100);
    };

    // Voting handler
    function vote(option, idx) {
        if (hasVoted) return;
        let config = { headers: { noLoad: true } };
        api
            .patch(`/thread/${threadId}/user/${loggedUser?.unifiedUser?.id}/option/${option.optionId}`, {}, config)
            .then(() => {
                // Simulate local update for instant feedback
                const updatedResults = localResults.map((opt, i) =>
                    i === idx ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
                );
                setLocalResults(updatedResults);
                setLocalVotedOption(option.optionId);
                setHasVoted(true);
            });
    }

    function setPollOption(textx, index) {
        let temp = JSON.parse(JSON.stringify(options))
        temp[index].text = textx
        setOptions(temp)
    }

    function addPollOption() {
        setOptions([...options, { text: "" }])
    }

    function removeOption(idx) {
        setOptions(options.filter((item, index) => index !== idx))
    }

    return (
        <>
            {showPoll ?
                <div className="w-full ">
                    <div className=" text-[14px] font-semibold text-gray-800">{question}</div>
                    <div className="flex flex-col gap-3">
                        {localResults.map((opt, idx) => {
                            const percent = getPercent(opt.votes || 0);
                            const isSelected = hasVoted && localVotedOption === opt.optionId;
                            return (
                                <button
                                    key={opt.optionId || idx}
                                    disabled={hasVoted}
                                    onClick={() => vote(opt, idx)}
                                    className={`w-full text-left rounded-xl px-4 py-3 border transition-all flex flex-col items-start relative
                                        ${hasVoted ? (isSelected ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 border-gray-200') : 'bg-white border-gray-200 hover:bg-orange-50'}
                                        ${hasVoted && isSelected ? 'outline outline-2 outline-gray-400' : ''}
                                    `}
                                >
                                    <div className="flex justify-between w-full items-center">
                                        <span className={`font-[12px] ${isSelected ? 'text-gray-800' : 'text-gray-800'}`}>{opt.text}</span>
                                        {hasVoted && (
                                            <span className="text-sm text-gray-500 ml-2">{opt.votes || 0} vote{(opt.votes || 0) !== 1 ? 's' : ''}</span>
                                        )}
                                    </div>
                                    {hasVoted && (
                                        <>
                                            <div className="w-full h-3 bg-gray-200 rounded mt-2 relative overflow-hidden">
                                                <div
                                                    className={`h-full rounded transition-all duration-300 ${isSelected ? 'bg-green-600' : 'bg-orange-500'}`}
                                                    style={{ width: percent + '%' }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">{percent}%</div>
                                            {isSelected && (
                                                <span className="absolute bottom-2 right-4 text-xs text-gray-500 bg-white px-2 py-0.5 rounded shadow">Your selection</span>
                                            )}
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {hasVoted && (
                        <div className="mt-4 text-sm text-gray-600 font-medium text-center">
                            Total votes: {totalVotes}
                        </div>
                    )}
                </div>
                :
                // Modern, responsive modal for poll creation
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-0 relative">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="text-orange-500 hover:text-orange-600 text-2xl p-1 rounded-full transition mr-2"
                                onClick={() => { if (typeof setShowPoll === 'function') setShowPoll(false); }}
                              >
                                <BiArrowBack />
                              </button>
                              <h2 className="text-xl font-bold text-orange-700">Create Poll</h2>
                            </div>
                            <button
                                onClick={() => { if (typeof onClose === 'function') onClose(); }}
                                className="text-gray-400 hover:text-orange-500 text-2xl p-1 rounded-full transition"
                                aria-label="Close"
                                type="button"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={onSubmit} method="POST" className="px-6 pb-6 pt-2 flex flex-col gap-2">
                            <input
                                type="text"
                                className="bg-orange-50 border border-orange-200 rounded-lg p-3 w-full focus:border-orange-400 outline-none focus:ring-0 text-base mb-2"
                                placeholder="Ask question"
                                value={question}
                                autoFocus={true}
                                required
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                            <div className="mb-1 text-gray-700 font-medium">Expires At</div>
                            <input
                                type="datetime-local"
                                className="bg-orange-50 border border-orange-200 rounded-lg p-3 w-full focus:border-orange-400 outline-none focus:ring-0 text-base mb-2"
                                value={expiresAt}
                                min={new Date().toISOString().slice(0, -8)}
                                required
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                            {options?.map((item, index) => (
                                <div className="flex items-center gap-2" key={index}>
                                    <input
                                        type="text"
                                        className="bg-sky-50 border border-sky-200 rounded-lg p-3 w-full focus:border-orange-400 outline-none focus:ring-0 text-base"
                                        placeholder={"Option " + (index + 1)}
                                        value={options[index].text}
                                        required
                                        onChange={(e) => setPollOption(e.target.value, index)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeOption(index)}
                                        className="text-red-500 hover:text-red-700 text-2xl px-1"
                                    >
                                        <AiOutlineCloseCircle />
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="text-orange-400 mt-2" onClick={addPollOption}>Add option</button>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    className="px-5 py-2 rounded-lg border border-gray-200 text-gray-600 font-semibold bg-gray-50 hover:bg-gray-100 transition"
                                    onClick={() => { if (typeof setShowPoll === 'function') setShowPoll(false); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-orange-400 to-pink-400 shadow hover:opacity-90 transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </>
    )
}

export default Poll