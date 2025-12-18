import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import InvoicesOverview from "./_components/invoice-overview";

export default async function InvoicesPage() {
  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <InvoicesOverview />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
