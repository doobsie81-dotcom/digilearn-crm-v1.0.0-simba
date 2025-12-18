import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import CompaniesOverview from "./_components/companies-overview";

export default async function CompaniesOverviewPage() {
  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <CompaniesOverview />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
