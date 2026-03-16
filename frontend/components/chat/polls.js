import React, { useEffect, useState } from "react";
import { LeafPoll, Result } from 'react-leaf-polls';
import 'react-leaf-polls/dist/index.css';

import { AiOutlineCloseCircle, AiOutlinePlus } from "react-icons/ai";
import { FiClock, FiBarChart2 } from "react-icons/fi";
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";

const customTheme = {
    textColor: 'black',
    mainColor: '#00B87B',
    backgroundColor: 'rgb(255,255,255)',
    alignment: 'center'
};

function Poll({
    showPoll,
    question,
    setQuestion,
    options = [],
    setOptions,
    expiresAt,
    setExpiresAt,
    onSubmit,
    results = [],
    threadId,
    isVoted,
    votedOption,
    userPollOptionSelect
}) {

    const loggedUser = useSelector(selectUser);
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        // Check if user has already voted
        if (isVoted || (userPollOptionSelect && Array.isArray(userPollOptionSelect) && 
            userPollOptionSelect.some(vote => vote.unifiedUserId === loggedUser?.unifiedUser?.id))) {
            setHasVoted(true);
        }
    }, [isVoted, userPollOptionSelect, loggedUser]);

    function vote(item, Result) {
        let config = { headers: { noLoad: true } };

        api
            .patch(`/thread/${threadId}/user/${loggedUser?.unifiedUser?.id}/option/${item.optionId}`, {}, config)
            .then(() => {
                console.log("Option selected");
                setHasVoted(true);
            });
    }

    function setPollOption(textx, index) {
        let temp = JSON.parse(JSON.stringify(options));
        temp[index].text = textx;
        setOptions(temp);
    }

    function addPollOption() {
        setOptions([...options, { text: "" }]);
    }

    function removeOption(idx) {
        setOptions(options.filter((item, index) => index !== idx));
    }

    // Ensure options is always an array
    const safeOptions = Array.isArray(options) ? options : [];
    const safeResults = Array.isArray(results) ? results : [];

    return (
        <>
            {showPoll ? (
                <div className="w-full bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">{question}</h3>
                    {hasVoted ? (
                        <div className="space-y-4">
                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                <FiBarChart2 className="mr-1" />
                                <span>Poll results</span>
                            </div>
                            <ul className="space-y-3">
                                {safeResults.map((result, index) => (
                                    <li key={index} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center border border-gray-100">
                                        <span className="font-medium text-gray-700">{result.text || result.option}</span>
                                        <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {result.votes} votes
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 text-sm text-gray-500 italic">
                                You have already voted in this poll.
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                <FiClock className="mr-1" />
                                <span>Select your answer</span>
                            </div>
                            <ul className="space-y-3">
                                {safeResults.map((option, index) => (
                                    <li key={index}>
                                        <button
                                            className="w-full bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-left p-4 rounded-lg transition-all duration-200 flex items-center shadow-sm"
                                            onClick={() => vote(option, safeResults)}
                                        >
                                            <span className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3 flex items-center justify-center">
                                                <span className="w-2 h-2 bg-transparent rounded-full"></span>
                                            </span>
                                            <span className="text-gray-700">{option.text || option.option}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Create a Poll</h2>
                    <form onSubmit={onSubmit} method="POST" className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 rounded-lg p-3 border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all duration-200"
                                placeholder="What would you like to ask?"
                                value={question}
                                autoFocus
                                required
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    className="w-full bg-gray-50 rounded-lg p-3 border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all duration-200"
                                    value={expiresAt}
                                    min={new Date().toISOString().slice(0, -8)}
                                    required
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                />
                                {/* <FiClock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> */}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                            <div className="max-h-[200px] overflow-y-auto space-y-2">
                                {safeOptions.map((item, index) => (
                                    <div key={index} className="flex items-center">
                                        <input
                                            type="text"
                                            className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all duration-200"
                                            placeholder={`Option ${index + 1}`}
                                            value={safeOptions[index].text}
                                            required
                                            onChange={(e) => setPollOption(e.target.value, index)}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => removeOption(index)} 
                                            className="ml-2 text-gray-400 hover:text-red-500 transition-colors duration-200 p-2"
                                        >
                                            <AiOutlineCloseCircle size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="pt-2">
                            <button 
                                type="button" 
                                onClick={addPollOption}
                                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                            >
                                <AiOutlinePlus className="mr-1" />
                                Add Option
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}

export default Poll;
