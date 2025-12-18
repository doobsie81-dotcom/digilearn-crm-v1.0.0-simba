import { redirect } from "next/navigation";
import { trpc } from "~/trpc/server";
import { getServerSession } from "~/lib/auth";
import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import PaymentTermsClient from "./_client";
import PageHeader from "~/components/page-header";

export const dynamic = "force-dynamic";

export default async function PaymentTermsPage() {
  const session = await getServerSession();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  void (await trpc.paymentTerms.getAll.prefetch({ includeInactive: true }));

  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="space-y-6">
            <PageHeader
              title="Payment Terms"
              subtitle="Manage payment terms and interest rates for invoices and quotations"
            />
            <PaymentTermsClient />
          </div>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
