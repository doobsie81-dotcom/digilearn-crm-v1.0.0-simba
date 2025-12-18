import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import RaffleLeadForm from "../_components/raffle-lead-form";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <RaffleLeadForm raffleId={id} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
