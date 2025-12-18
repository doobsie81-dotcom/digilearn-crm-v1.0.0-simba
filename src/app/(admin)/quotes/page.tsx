import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import QuotesOverview from "./_components/quotes-overview";

export default async function QuoteOverviewPage() {
  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <QuotesOverview />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
