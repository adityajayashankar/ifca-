import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PercentIcon from '@mui/icons-material/Percent';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import BookIcon from '@mui/icons-material/Book';

const CourseCard = ({ course, isEnrolled, onEdit, showEdit = false }) => {
  const router = useRouter();
  
  // Add null checks to prevent runtime errors
  if (!course) {
    return (
      <div className="rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden w-full max-w-xs flex flex-col justify-between">
        <div className="p-4 text-center text-gray-500">
          <SchoolIcon className="text-gray-300 mx-auto mb-2" style={{ fontSize: 36 }} />
          <p className="text-[14px]">Course not available</p>
        </div>
      </div>
    );
  }
  const [finalPrice, setFinalPrice] = useState(0);

  // Move finalPrice calculation here after null check
  useEffect(() => {
    const finalPrice = course?.discount > 0 ? course?.price - (course?.price * course?.discount) / 100 : course?.price;
    console.log(finalPrice);
    setFinalPrice(finalPrice);
  }, [course]);

  return (
    <div className="rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden w-full max-w-xs flex flex-col justify-between">
      {/* Banner */}
      <div className={`h-28 bg-gradient-to-r ${course.courseimage ? 'from-gray-400 to-gray-600' : 'from-orange-400 to-orange-600'} flex items-center justify-center`}>
        {course.courseimage || course.image ? (
            <img src={course.courseimage || course.image} alt={course.name} className="w-full h-full object-cover" />
        ) : (
            <SchoolIcon className="text-white" style={{ fontSize: 36 }} />
        )}
      </div>
      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="font-semibold text-gray-800 text-[16px] line-clamp-2 mb-1 h-12">{course.name}</div>
        <div className="text-gray-600 text-[13px] leading-tight line-clamp-1 mb-2 ">{course.description}</div>
        {/* Price and Discount */}
        <div className="flex items-center gap-2 mb-2">
            {(course.price && course.discount > 0 )&& (
                <span className={`font-bold text-[15px] text-gray-900 ${course.discount > 0 ? 'line-through' : ''}`}>{course.price ? `₹${course.price}` : "Free"}</span>
            )}
          <span className="font-bold text-[15px] text-gray-900">{finalPrice === 0 ? "Free" : `₹${finalPrice}`}</span>
          {course.discount > 0 && (
            <span className="bg-green-50 text-green-600 text-[12px] px-2 py-0.5 rounded font-medium flex items-center gap-1">
              {course.discount}% off
            </span>
          )}
        </div>
  
        {/* Status */}
        <div className="flex items-center justify-between mt-2 mb-2">
          <span className="bg-orange-50 text-orange-500 text-[12px] px-2 py-0.5 rounded-full font-medium lowercase">
            {course.status}
          </span>
        </div>
        {/* Actions: Always at the bottom, right-aligned, on the same line */}
        <div className="flex justify-end gap-2 mt-auto">
          {isEnrolled ? (
            <button
              className="bg-green-500 hover:bg-green-600 text-white text-[13px] px-3 py-1 rounded transition font-medium shadow flex items-center gap-1"
              onClick={() => router.push(`/courses/${course.id}`)}
            >
              <PlayCircleIcon className="w-4 h-4" />
              Continue
            </button>
          ):(
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white text-[13px] px-3 py-1 rounded transition font-medium shadow flex items-center gap-1"
              onClick={() => router.push(`/courses/${course.id}`)}
            >
              <BookIcon className="w-4 h-4" />
              View Details
            </button>
          )}
          {showEdit && (
            <button
              className="bg-indigo-700 hover:bg-indigo-800 text-white text-[13px] px-3 py-1 rounded transition font-medium shadow"
              onClick={() => onEdit?.(course)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard; 