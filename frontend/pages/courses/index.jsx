import React, { useState, useEffect } from 'react';
import {
  Search as SearchIcon,
  Sort as SortIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  PlayCircle as PlayIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import api from '@/utils/apiSetup';
import CourseCard from '@/components/CourseCard';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import Head from 'next/head';
import Topbar from '@/components/topbar/Topbar';

const CoursesPage = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('az');
  const router = useRouter();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [enrolledRes, availableRes] = await Promise.all([
        api.get(`/course/users/${user.id}/enrolled-courses`),
        api.get(`/course/users/${user.id}/not-enrolled-courses`)
      ]);
      setEnrolledCourses(enrolledRes.data);
      setAvailableCourses(availableRes.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort courses
  const filterAndSortCourses = (courses) => {
    return courses
      .filter(course => {
        const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || course.status === filter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        switch (sort) {
          case 'az':
            return a.name.localeCompare(b.name);
          case 'za':
            return b.name.localeCompare(a.name);
          case 'communities':
            return (b.communities?.length || 0) - (a.communities?.length || 0);
          default:
            return 0;
        }
      });
  };

  const filteredEnrolledCourses = filterAndSortCourses(enrolledCourses);
  const filteredAvailableCourses = filterAndSortCourses(availableCourses);

  return (
    <div className="w-full bg-gray-50">
      <Head>
        <title>Courses - IFCA</title>
      </Head>
      <Topbar />

      <div className="max-w-6xl mx-auto px-4 mt-[60px]">
        <div className="pt-8 pb-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <HomeIcon className="text-gray-400" />
              <ChevronRightIcon className="text-gray-400" />
              <span className="text-gray-600">Courses</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-2">Explore and manage your learning journey</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Courses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>

                {/* Sort */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="az">A-Z</option>
                  <option value="za">Z-A</option>
                  <option value="communities">Most Communities</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading courses...</p>
            </div>
          )}

          {/* Enrolled Courses */}
          {!loading && filteredEnrolledCourses.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <BookIcon className="text-orange-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Enrolled Courses</h2>
                <span className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full">
                  {filteredEnrolledCourses.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEnrolledCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CourseCard course={course} isEnrolled={true} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Available Courses */}
          {!loading && filteredAvailableCourses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <SchoolIcon className="text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Available Courses</h2>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {filteredAvailableCourses.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAvailableCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CourseCard course={course} isEnrolled={false} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredEnrolledCourses.length === 0 && filteredAvailableCourses.length === 0 && (
            <div className="text-center py-12">
              <SchoolIcon className="text-gray-400 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filter !== 'all' || sort !== 'az'
                  ? 'Try adjusting your search or filters'
                  : 'No courses are available at the moment'}
              </p>
              {(searchTerm || filter !== 'all' || sort !== 'az') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('all');
                    setSort('az');
                  }}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage; 