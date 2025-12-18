import { Suspense } from "react";
import { HydrateClient, trpc } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import TaskListComponent from "./_components/tasks-overview";

export const dynamic = "force-dynamic";

export default async function TaskOverviewPage() {
  void (await trpc.tasks.getTasks.prefetch({ limit: 50, offset: 1 }));
  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <TaskListComponent />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
