import api from "@/utils/apiSetup";
import Table from "@/components/common/Table";
import { oneSession } from "@/store/features/session";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { allSessions } from "@/store/features/session";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

function Sessions() {
  const [sessionAnalytics, setSessionAnalytics] = useState([]);
  const sessions = useSelector(allSessions);
  // const selectedSession = useSelector(oneSession);
  const [selectedSessionId, setSelectedSessionId] = useState(0);
  const [summaryData, setSummaryData] = useState([]);
  const [sessionTimeData, setSessionTimeData] = useState([]);

  console.log(sessions);
  useEffect(() => {
    if (sessions) {
      setSelectedSessionId(sessions[0]?.id);
    }
  }, [sessions]);

  useEffect(() => {
    let config = { headers: { noLoad: true } };

    api.get(`/analytics/session/time`, config).then((res) => {
      console.log(res?.data);
    });

    api.get(`/analytics/session/time`, config).then((res) => {
      console.log(res?.data?.sessionTime);
      res?.data?.sessionTime?.forEach((element) => {
        setSessionTimeData((prev) => [
          ...prev,
          {
            createdAt: new Date(element.createdAt).toLocaleDateString(),
            sum: element?.sum,
          },
        ]);
      });
    });

    if (selectedSessionId !== 0) {
      api
        .get(
          `http://localhost:5000/api/v1/analytics/session/${selectedSessionId}/people/summary`,
          config
        )
        .then((res) => {
          console.log(res?.data?.summary);
          setSummaryData(res?.data?.summary);
        });
    }
  }, [selectedSessionId]);

  function handleChange(e) {
    console.log(e.target.value);
    setSelectedSessionId(e.target.value);
    let config = { headers: { noLoad: true } };
    api
      .get(
        `http://localhost:5000/api/v1/analytics/session/${selectedSessionId}/people/summary`,
        config
      )
      .then((res) => {
        console.log(res?.data?.summary);
        setSummaryData(res?.data?.summary);
      });
  }

  return (
    <div className="flex w-full flex-col text-center">
      <h2 className="text-center my-4">Growth of Sessions In Number</h2>
      <div className="flex justify-center mt-10">
        <hr />
        <LineChart
          width={1000}
          height={300}
          data={sessionTimeData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="createdAt" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line dataKey="sum" fill="#8884d8" name="Number of sessions" />
        </LineChart>
      </div>

      <div className="text-xl font-bold mt-3">
        <h2 className="my-4">View session-wise analytics</h2>
        <select
          className="m-2 bg-slate-200 rounded-lg"
          name="session"
          onChange={handleChange}
          value={selectedSessionId}
        >
          {sessions.map((session) => (
            <option key={session?.id} value={session?.id}>
              {session?.title}
            </option>
          ))}
        </select>
      </div>
      <div className="max-w-7xl mx-auto px-4 lg:px-0">
        <Table
          mode={"sessionAnalytics"}
          headers={["Slot", "StartTime", "EndTime", "Num Signups", "Num RSVPs"]}
          data={summaryData}
        />
      </div>
    </div>
  );
}

export default Sessions;

// export async function getServerSideProps(context) {
//     const res = await fetch(
//         `http://localhost:5000/api/v1/analytics/session/${context.query["sessionId"]}/people/summary`
//     );
//     const { summary } = await res.json();
//     return {
//         props: { summaryData: summary }, // will be passed to the page component as props
//     };
// }
