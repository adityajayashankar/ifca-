import { IoIosFastforward, IoIosRewind, IoIosPause, IoIosPlay, IoIosSkipForward, IoIosVolumeHigh, IoIosVolumeOff } from "react-icons/io"
import { MdForward5 } from "react-icons/md"
import { RiFullscreenFill } from "react-icons/ri"

function Control({
    onPlayPause = () => { },
    playing,
    played,
    videoRef,
    onRewind = () => { },
    onForward = () => { },
    onSeek = () => { },
    onSeekMouseUp = () => { },
    onVolumeChangeHandler = () => { },
    onVolumeSeekUp = () => { },
    volume,
    mute,
    onMute = () => { },
    duration,
    currentTime,
    controlRef,
}) {

    function openFullscreen(elem) {
        console.log(elem)
        // if (elem.requestFullscreen) {
        //   elem.requestFullscreen();
        // } else if (elem.webkitRequestFullscreen) { /* Safari */
        //   elem.webkitRequestFullscreen();
        // } else if (elem.msRequestFullscreen) { /* IE11 */
        //   elem.msRequestFullscreen();
        // }
      }
    return (
        <div className="w-full absolute top-0 bottom-0 left-0 flex flex-col z-1 justify-between " ref={controlRef}>
            <div className="flex justify-center items-center">

                {/* <div className="px-1 py-4" onDoubleClick={onRewind}>
                    <IoIosRewind fontSize="medium" />
                </div>

                <div className="px-1 py-4" onClick={onPlayPause}>
                    {playing ? (
                        <IoIosPause fontSize="medium" />
                    ) : (
                        <IoIosPlay fontSize="medium" />
                    )} {"  "}
                </div>

                <div className="px-1 py-4" onDoubleClick={onForward}>
                    <IoIosFastforward fontSize="medium" />
                </div> */}
            </div>

            <div className="bottom__container">
                <div className="flex justify-center items-center px-0 py-5">
                    <input id="minmax-range"
                        type="range"
                        min={0}
                        max={100}
                        value={played * 100}
                        onSeek={onSeek}
                        onChange={(e) => { onSeek(e, e.target.value) }}
                        onMouseUp={(e) => { onSeekMouseUp(e, e.target.value) }}
                        style={{ 'background': `linear-gradient(to right, gray ${(parseInt(played * 100)) * 100 / (100)}%, white 0px` }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>
                <div className="flex items-center text-white justify-between bg-black w-full flex-wrap">
                    <div className="flex items-center flex-wrap p-[10px 0]">

                        <div className="px-1 py-4" onClick={onRewind}>
                            <IoIosRewind className="cursor-pointer" fontSize="medium" />
                        </div>

                        <div className="px-1 py-4" onClick={onPlayPause}>
                            {playing ? (
                                <IoIosPause className="cursor-pointer" fontSize="medium" />
                            ) : (
                                <IoIosPlay className="cursor-pointer" fontSize="medium" />
                            )} {"  "}
                        </div>

                        <div className="px-1 py-4" onClick={onForward}>
                            <IoIosFastforward className="cursor-pointer" fontSize="medium" />
                        </div>
                        <div className="px-1 py-4" onClick={() => openFullscreen(videoRef)}>

                            <RiFullscreenFill className="cursor-pointer" />
                        </div>
                        {/* <div className="px-1 py-4">
                            <IoIosPlay fontSize="medium" />
                        </div> */}
                        {/* <div className="px-1 py-4">
                            <IoIosSkipForward fontSize="medium" />
                        </div> */}
                        <div className="px-1 py-4" onClick={onMute} >
                            {
                                mute ? (
                                    <IoIosVolumeOff className="cursor-pointer" />
                                ) :
                                    (

                                        <IoIosVolumeHigh className="cursor-pointer" fontSize="medium" />
                                    )
                            }
                        </div>

                        {/* <Slider
                            className={`${classes.volumeSlider}`} />
                        <span>5/20</span> */}
                        <input id="minmax-range"
                            type="range"
                            min={0}
                            // max={100}
                            value={volume * 100}
                            onSeek={onSeek}
                            onChange={(e) => { onVolumeChangeHandler(e, e.target.value) }}
                            onMouseUp={(e) => { onVolumeSeekUp(e, e.target.value) }}
                            className="h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                        />
                        <span> {currentTime} / {duration}</span>
                        {/* <label for="minmax-range" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Min-max range</label> */}
                        {/* <input id="minmax-range" type="range" min="0" max="10" 
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            onChange={onVolumeChangeHandler}
                            value={volume * 100}
                            onChangeCommitted={onVolumeSeekUp}
                        /> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Control