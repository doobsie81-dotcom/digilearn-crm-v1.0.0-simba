import { redirect } from "next/navigation";
import { trpc } from "~/trpc/server";
import { getServerSession } from "~/lib/auth";
import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import Settings from "./_client";
import PageHeader from "~/components/page-header";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  void (await trpc.settings.getAll.prefetch());

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="space-y-6">
            <PageHeader title="Settings" subtitle="Manage site settings" />
            <Settings />
          </div>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
