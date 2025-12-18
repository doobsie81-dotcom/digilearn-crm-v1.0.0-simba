import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import CreateQuoteForm from "../_components/create-quote-form";

interface PageProps {
  searchParams: Promise<{
    dealId?: string;
    companyId?: string;
  }>;
}

export default async function CreateQuotePage({ searchParams }: PageProps) {
  // Await the searchParams (Next.js 15+)
  const params = await searchParams;

  const defaultDealId = params.dealId || null;
  const defaultCompanyId = params.companyId || null;
  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <CreateQuoteForm
            defaultDealId={defaultDealId}
            defaultCompanyId={defaultCompanyId}
          />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
