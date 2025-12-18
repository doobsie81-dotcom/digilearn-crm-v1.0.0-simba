import { Suspense } from "react";
import { HydrateClient, trpc } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import ActivitiesComponent from "./_components/activities-overview";

export const dynamic = "force-dynamic";

export default async function TaskOverviewPage() {
  void (await trpc.activities.getAllActivities.prefetch({
    leadId: null,
    dealId: null,
  }));
  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <ActivitiesComponent />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
