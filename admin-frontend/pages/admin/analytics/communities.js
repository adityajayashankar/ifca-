import api from "@/utils/apiSetup";
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend as LineLegend,
  ResponsiveContainer,
} from "recharts";
import { BarChart, Bar, Cell, Legend as BarLegend } from "recharts";

function Communities() {
  const [communityTime, setCommunityTime] = useState([]);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    api.get(`/analytics/community/time`).then((res) => {
      res?.data?.communityTime?.forEach((element) => {
        setCommunityTime((prev) => [
          ...prev,
          {
            createdAt: new Date(element.createdAt).toLocaleDateString(),
            sum: element?.sum,
          },
        ]);
      });
    });

    api.get(`/analytics/community/people`).then((res) => {
      setPeople(res?.data?.people);
    });
  }, []);

  return (
    <div className="flex w-full flex-col justify-center items-center">
      <div className="text-xl font-bold text-center mt-3">
        Growth of Number of communities
      </div>
      <div className=" mt-10 justify-center">
        <div className="w-full justify-center">
          <LineChart
            width={1000}
            height={300}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            data={communityTime}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="createdAt" />
            <YAxis />
            <Tooltip />
            <LineLegend />
            <Line
              type="monotone"
              dataKey="sum"
              name="Number of users "
              fill="#8884d8"
            />
          </LineChart>
        </div>
        <div className="text-xl font-bold text-center mt-6 mb-5">
          Community popularity
        </div>
        <div className="">
          {/* <ResponsiveContainer width="100%" height="100%"> */}
          <BarChart
            width={1000}
            height={300}
            data={people}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="communityName" />
            <YAxis />
            <Tooltip />
            <BarLegend />
            <Bar dataKey="people" fill="#8884d8" />
          </BarChart>
          {/* </ResponsiveContainer> */}
        </div>
      </div>
    </div>
  );
}

export default Communities;
