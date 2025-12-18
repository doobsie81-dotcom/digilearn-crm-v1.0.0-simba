import { Suspense } from "react";
import {
  HydrateClient,
  // trpc
} from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import { ArchivedDeals } from "../_components/archived-deals-list";
import { getServerSession } from "~/lib/auth";
import { redirect } from "next/navigation";
import { can, getUserPermissions } from "~/lib/get-user-permissions";
import { subject } from "@casl/ability";
import { Deal } from "~/db/types";

export default async function ArchivedDealsPage() {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/unauthorized");
  }

  const abilities = await getUserPermissions(
    session.user,
    session.userPermissions
  );

  // only check permission with won, or lost since we only need to view archived deals
  const canRead = can(
    abilities,
    "read",
    subject("Deal", { closeStatus: "won" } as Deal)
  );

  if (!canRead) {
    redirect("/unauthorized");
  }

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <ArchivedDeals />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
