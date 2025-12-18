import { Suspense } from "react";
import { HydrateClient, trpc } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
//import LeadsClientPage from "./_components/leads-component";
import FallbackRender from "~/components/error-boundary-fallback";
import LeadsListComponent from "./_components/leads-overview";

export const dynamic = "force-dynamic";
export default async function LeadsPage() {
  void (await trpc.leads.getMany.prefetch({ status: [], searchTerm: "", includeArchived: false }));

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <LeadsListComponent />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
