import React from "react";
import ActiveCompetions from "./incubator/micro/activeCompetitions";

function CompetitionDashboard() {
  return (
    <div className="p-4 py-8">
      <div className="pb-2border-b flex flex-row items-center justify-between ">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Events & Competitions</h2>
        <a
          href="/competitions/myApplications"
          className="bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-full px-5 py-2 text-base font-semibold shadow hover:from-orange-600 hover:to-orange-500 transition"
        >
          My Applications
        </a>
      </div>
      <ActiveCompetions />
    </div>
  );
}

export default CompetitionDashboard;
