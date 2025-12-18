"use client";

import { trpc } from "~/trpc/client";

export default function OutlookIntegration() {
  const getAuthUrlQuery = trpc.emailing.getAuthUrl.useQuery();

  const handleConnect = () => {
    if (getAuthUrlQuery.data) {
      window.location.href = getAuthUrlQuery.data;
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Connect Outlook</h1>
      <button
        onClick={handleConnect}
        disabled={!getAuthUrlQuery.data}
        className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        Connect to Outlook
      </button>
    </div>
  );
}
