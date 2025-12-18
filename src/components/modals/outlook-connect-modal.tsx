// components/modals/OutlookConnectionModal.tsx
"use client";

import { useEffect, useState } from "react";
import { trpc } from "~/trpc/client";
import { useOutlookStore } from "~/store/use-outlook-store";

export function OutlookConnectionModal() {
  const { isConnected, hydrate } = useOutlookStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const getAuthUrlQuery = trpc.emailing.getAuthUrl.useQuery();

  useEffect(() => {
    setIsMounted(true);
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isMounted && !isConnected) {
      setIsOpen(true);
    }
  }, [isMounted, isConnected]);

  const handleConnect = () => {
    if (getAuthUrlQuery.data) {
      window.location.href = getAuthUrlQuery.data;
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (!isMounted || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-2">Connect Outlook</h2>
        <p className="text-gray-600 mb-6">
          To use email features, please connect your Outlook account.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
          >
            Maybe Later
          </button>
          <button
            onClick={handleConnect}
            disabled={!getAuthUrlQuery.data}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {getAuthUrlQuery.isLoading ? "Loading..." : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}
