import api from "@/utils/apiSetup"
import react, { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function RevenueAnalytics() {

    const [revenueAnalytics, setRevenueAnalytics] = useState([])

    useEffect(() => {
        api.get(`/analytics/revenue/time`)
            .then((res) => {
                console.log(res?.data?.revenueTime)
                res?.data?.revenueTime?.forEach(element => {
                    setRevenueAnalytics((prev) => [...prev, { createdAt: (new Date(element?.createdAt)).toLocaleDateString(), sum: element?.sum }])
                });
            })
    }, [])

    return (
        <div className='flex w-full flex-col'>
            <div className='text-xl font-bold text-center mt-3'>
                Revenue Analytics
            </div>
            <div className='flex mt-10 justify-center'>
                <LineChart width={1000}
                    height={300}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                    data={revenueAnalytics}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="createdAt" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sum" name='Revenue in Rs. ' fill="#8884d8" />
                </LineChart>
            </div>
        </div>
    )
}

export default RevenueAnalytics