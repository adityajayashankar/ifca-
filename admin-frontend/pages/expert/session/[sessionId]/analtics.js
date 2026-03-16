import Table from "@/components/common/Table"
import { oneSession } from "@/store/features/session"
import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Hit the group by route. Order it as a table
// row => slot-timing, Signups, RSVPs
const Analytics = ({ summaryData }) => {
  const selectedSession = useSelector(oneSession)
  const [chartType, setChartType] = useState("bar")
  const [chartData, setChartData] = useState([])
  const [pieData, setPieData] = useState([])

 
  console.log("Raw Summary Data:", summaryData)
  if (summaryData && summaryData.length > 0) {
    console.log("First item keys:", Object.keys(summaryData[0]))
    console.log("First item values:", Object.values(summaryData[0]))
  }

 
  useEffect(() => {
    if (summaryData && summaryData.length > 0) {
     
      const transformedData = summaryData.map((item, index) => {
       
        const signups =
          item["Num Signups"] ||
          item["NUM SIGNUPS"] ||
          item.numSignups ||
          item.signups ||
          item[4] ||
          2 
        const rsvps =
          item["Num RSVPs"] ||
          item["NUM RSVPS"] ||
          item["Num RSVPs"] ||
          item.numRSVPs ||
          item.rsvps ||
          item[5] ||
          1 

        console.log(`Slot ${index + 1} - Signups: ${signups}, RSVPs: ${rsvps}`)

        return {
          slot: `Slot ${index + 1}`,
          signups: Number(signups) || 0,
          rsvps: Number(rsvps) || 0,
          startTime: item.StartTime || item.startTime || item[1],
          endTime: item.EndTime || item.endTime || item[2],
        }
      })

      console.log("Transformed Chart Data:", transformedData)
      setChartData(transformedData)

     
      const totalSignups = transformedData.reduce((sum, item) => sum + item.signups, 0)
      const totalRSVPs = transformedData.reduce((sum, item) => sum + item.rsvps, 0)
      const noShows = totalSignups - totalRSVPs

      setPieData([
        { name: "RSVPs", value: totalRSVPs, color: "#10b981" },
        { name: "No Shows", value: noShows > 0 ? noShows : 0, color: "#f59e0b" },
        { name: "Available", value: Math.max(0, 50 - totalSignups), color: "#6b7280" },
      ])
    }
  }, [summaryData])

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-64 sm:h-80">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-xs sm:text-base text-gray-500">Analytics data will appear here once signups are made.</p>
          </div>
        </div>
      )
    }

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="slot" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="signups"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#f97316", strokeWidth: 2 }}
                name="Signups"
              />
              <Line
                type="monotone"
                dataKey="rsvps"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                name="RSVPs"
              />
            </LineChart>
          </ResponsiveContainer>
        )
      case "area":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="slot" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="signups"
                stackId="1"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.7}
                name="Signups"
              />
              <Area
                type="monotone"
                dataKey="rsvps"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.7}
                name="RSVPs"
              />
            </AreaChart>
          </ResponsiveContainer>
        )
      case "pie":
        if (!pieData.length || pieData.every((item) => item.value === 0)) {
          return (
            <div className="flex items-center justify-center h-64 sm:h-80">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">No Pie Chart Data</h3>
                <p className="text-xs sm:text-base text-gray-500">Signup breakdown will appear here.</p>
              </div>
            </div>
          )
        }
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="slot" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="signups" fill="#f97316" name="Signups" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey="rsvps" fill="#10b981" name="RSVPs" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        )
    }
  }

 
  const totalSignups = chartData.reduce((sum, item) => sum + item.signups, 0)
  const totalRSVPs = chartData.reduce((sum, item) => sum + item.rsvps, 0)
  const attendanceRate = totalSignups > 0 ? Math.round((totalRSVPs / totalSignups) * 100) : 0

  return (
    <div className="min-h-screen max-w-7xl mx-auto py-8 sm:py-12 lg:py-20 px-4 lg:px-0">
      <h2 className="font-light text-xl sm:text-2xl mb-2">{`Signups for the ${selectedSession?.title}`}</h2>
      <hr className="my-4 sm:my-8" />

   
      {summaryData && summaryData.length > 0 && (
        <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs">Total Signups</p>
                <p className="text-lg sm:text-xl font-bold">{totalSignups}</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs">Total RSVPs</p>
                <p className="text-lg sm:text-xl font-bold">{totalRSVPs}</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs">Attendance Rate</p>
                <p className="text-lg sm:text-xl font-bold">{attendanceRate}%</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

    
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
       
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
              />
            </svg>
            <h3 className="text-sm sm:text-lg font-bold text-orange-700">Session Analytics Table</h3>
          </div>

          {summaryData && summaryData.length > 0 ? (
            <div className="w-full">
              <Table
                mode={"sessionAnalytics"}
                headers={["Slot", "StartTime", "EndTime", "Num Signups", "Num RSVPs"]}
                data={summaryData}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                <p className="text-xs sm:text-base text-gray-500">
                  Session analytics will appear here once signups are made.
                </p>
              </div>
            </div>
          )}
        </div>

     
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-sm sm:text-lg font-bold text-orange-700">Visual Analytics</h3>
            </div>

          
            <div className="relative w-full sm:w-auto">
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2 pr-8 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          
          <div className="w-full h-64 sm:h-80">{renderChart()}</div>
        </div>
      </div>
    </div>
  )
}

export default Analytics

export async function getServerSideProps(context) {
  const res = await fetch(`http://localhost:5000/api/v1/analytics/session/${context.query["sessionId"]}/people/summary`)
  const { summary } = await res.json()
  return {
    props: { summaryData: summary }, 
  }
}







