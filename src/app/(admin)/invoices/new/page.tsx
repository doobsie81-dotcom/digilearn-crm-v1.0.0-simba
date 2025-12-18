import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import CreateInvoiceForm from "../_components/create-invoice-form";

export default async function CreateInvoicePage() {
  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <CreateInvoiceForm />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
