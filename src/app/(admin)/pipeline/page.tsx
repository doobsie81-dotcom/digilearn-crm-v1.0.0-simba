import { Suspense } from "react";
import { HydrateClient, trpc } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import ManagePipeline from "./_components/manage-pipeline";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  void (await trpc.pipelines.getPipelinesWithDeals.prefetch({
    stage: "",
  }));

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array.from({ length: 4 })].map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          }
        >
          <ManagePipeline />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
