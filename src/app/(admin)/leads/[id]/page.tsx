import { Suspense } from "react";
import { HydrateClient, trpc } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import LeadView from "../_components/view-lead-component";
import FallbackRender from "~/components/error-boundary-fallback";
import { getServerSession } from "~/lib/auth";
import { getUserPermissions } from "~/lib/get-user-permissions";
import { subject } from "@casl/ability";
import { User } from "~/db/types";

export const dynamic = "force-dynamic";

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Get session and abilities to check if user can view users
  const session = await getServerSession();
  const abilities = session
    ? await getUserPermissions(session.user, session.userPermissions)
    : null;

  // Always prefetch lead data
  void await trpc.leads.getLead.prefetch(id);

  // Only prefetch users if the user has permission to read users
  if (abilities?.can("read", subject("User", {id: 'dummy_user_id'} as User))) {
    void (await trpc.users.getByRole.prefetch({
      roles: ["sales-agent", "sales-manager"],
    }));
  }
    
  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <LeadView id={id} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
