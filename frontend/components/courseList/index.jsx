import { useState } from "react"
import CourseCard from "../courseCard"

const CourseList = ({ sessionSlots, isUser, isCourse }) => {

  const [type, setType] = useState(0)

  return (
    <><div className="max-w-[1350px] mx-auto w-full mt-[50px]">
      <div className="flex items-center justify-between">
        <h1 className="mb-[40px] text-[#333] text-[42px] font-bold">Course Content</h1>
        {/* {!isCourse && <div className="mb-[40px]">
          <button className={type === 0 ? "px-[30px] py-[15px] mr-[10px] border-[2px] rounded-[30px] font-semibold cursor-pointer outline-none gradient_background text-white " : "px-[30px] py-[15px] rounded-[30px] mr-[10px] border-[2px] border-[#888] font-semibold bg-white outline-none cursor-pointer"} onClick={() => setType(0)}>All Content</button>
          <button className={type === 1 ? "px-[30px] py-[15px] mr-[10px] border-[2px] rounded-[30px] font-semibold cursor-pointer outline-none gradient_background text-white " : "px-[30px] py-[15px] rounded-[30px] mr-[10px] border-[2px] border-[#888] font-semibold bg-white outline-none cursor-pointer"} onClick={() => setType(1)}>Free</button>
          <button className={type === 2 ? "px-[30px] py-[15px] mr-[10px] border-[2px] rounded-[30px] font-semibold cursor-pointer outline-none gradient_background text-white " : "px-[30px] py-[15px] rounded-[30px] mr-[10px] border-[2px] border-[#888] font-semibold bg-white outline-none cursor-pointer"} onClick={() => setType(2)}>Paid</button>
        </div>} */}
      </div>
      <div className="flex flex-col gap-[20px] w-[75%]">
        {type === 0 ? sessionSlots?.map((item, index) => (
          <CourseCard isCourse={isCourse} key={index} idx={index} isUser={isUser} details={item} />
        )) : type === 1 ? sessionSlots?.filter((i) => {
          return i.price === 0
        }).map((item, index) => (
          <CourseCard isCourse={isCourse} key={index} idx={index} isUser={isUser} details={item} />
        )) : sessionSlots?.filter((i) => {
          return i.price > 0
        }).map((item, index) => (
          <CourseCard isCourse={isCourse} key={index} idx={index} isUser={isUser} details={item} />
        ))}
      </div>
    </div></>

  )
}

export default CourseList