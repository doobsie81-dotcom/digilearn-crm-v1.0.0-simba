import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import { HydrateClient, trpc } from "~/trpc/server";
import ViewDealComponent from "../_components/view-deal-component";

export const dynamic = "force-dynamic";

export default async function DealViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  void (await trpc.deals.getDealDetails.prefetch(id));

  void (await trpc.pipelines.getPipelines.prefetch({ stage: "" }));

  void (await trpc.users.getByRole.prefetch({
    roles: ["sales-agent", "sales-manager"],
  }));

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <ViewDealComponent id={id} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
