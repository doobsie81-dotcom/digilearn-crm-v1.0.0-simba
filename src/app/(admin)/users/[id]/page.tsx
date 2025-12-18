import { redirect } from "next/navigation";
import { trpc } from "~/trpc/server";
import { getServerSession } from "~/lib/auth";
import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import ProfileHeader from "../_components/profile-header";
import ProfileInformation from "../_components/profile-information";
import ProfileActivity from "../_components/profile-activity";

interface UserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id } = await params;
  const session = await getServerSession();

  if (
    !session?.user ||
    (session.user.role !== "admin" && session.user.id !== id)
  ) {
    redirect("/unauthorized");
  }

  void (await trpc.users.getById.prefetch({ id: id }));

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="space-y-6 ">
            {/* header */}
            <ProfileHeader />
            {/* profile grid */}
            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-1">
                {/* Profile Information */}
                <ProfileInformation id={id} />
              </div>
              <div className="col-span-3">
                {/* Stats, Edits, Activities e.t.c. */}
                <ProfileActivity id={id} />
              </div>
            </div>
          </div>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
