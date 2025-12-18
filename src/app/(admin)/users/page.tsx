import { redirect } from "next/navigation";
import { trpc } from "~/trpc/server";
import { getServerSession } from "~/lib/auth";
import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import UserList from "./_components/user-list";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getServerSession();

  console.log(session?.user);
  if (!session?.user || session.user.role !== "admin") {
    
    redirect("/unauthorized");
  }

  void (await trpc.users.getAll.prefetch({}));

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <UserList />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
