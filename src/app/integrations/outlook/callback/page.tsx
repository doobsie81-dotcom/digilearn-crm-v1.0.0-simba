import { Suspense } from "react";
import OutlookCallback from "./client";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OutlookCallback />
    </Suspense>
  );
}