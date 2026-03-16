import api from "@/utils/apiSetup";
import React, { useEffect, PureComponent, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function UserAnalytics() {
  const [userAnalytics, setUserAnalytics] = useState([]);

  useEffect(() => {
    api.get(`/analytics/users/time`).then((res) => {
      console.log(res?.data);
      res?.data?.userTime?.forEach((element) => {
        setUserAnalytics((prev) => [
          ...prev,
          {
            createdAt: new Date(element.createdAt).toLocaleDateString(),
            sum: element?.sum,
          },
        ]);
      });
    });
  }, []);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="text-xl font-bold text-center mt-3">User Growth</div>
      <div className="flex mt-10 justify-center">
        <LineChart
          width={1000}
          height={300}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          data={userAnalytics}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="createdAt" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="sum"
            name="Number of users "
            fill="#8884d8"
          />
        </LineChart>
      </div>
    </div>
  );
}

export default UserAnalytics;
