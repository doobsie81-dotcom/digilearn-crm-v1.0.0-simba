"use client";

import { TrendingUp } from "lucide-react";
import { Contact, DealStakeholder } from "~/db/types";

// Utility Functions
const getRoleColor = (role: string): string => {
  switch (role) {
    case "primary":
      return "bg-red-100 text-red-800";
    case "secondary":
      return "bg-blue-100 text-blue-800";
    case "influencer":
      return "bg-purple-100 text-purple-800";
    case "champion":
      return "bg-green-100 text-green-800";
    case "blocker":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case "positive":
      return "text-green-600";
    case "neutral":
      return "text-gray-600";
    case "negative":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

const getInfluenceIndicator = (influence: number): React.ReactNode => {
  if (influence >= 75) return <span className="text-lg">⭐⭐⭐</span>;
  if (influence >= 50) return <span className="text-lg">⭐⭐</span>;
  return <span className="text-lg">⭐</span>;
};

export const StakeholderItem: React.FC<{
  stakeholder: DealStakeholder & {
    contact: Pick<Contact, "firstName" | "lastName" | "email">;
  };
}> = ({ stakeholder }) => {
  const fullName = `${stakeholder.contact.firstName} ${stakeholder.contact.lastName}`;

  return (
    <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap- flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">{fullName}</p>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getRoleColor(stakeholder.role)}`}
            >
              {stakeholder.role}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">
            {stakeholder.contact.email}
          </p>
          <div className={getSentimentColor(stakeholder?.sentiment ?? "")}>
            {getInfluenceIndicator(stakeholder.influence)}
            <span className="text-xs  text-gray-500 capitalize">
              {stakeholder.sentiment}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex flex-col items-center gap-1"></div>
        {stakeholder.engaged && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">Active</span>
          </div>
        )}
      </div>
    </div>
  );
};
