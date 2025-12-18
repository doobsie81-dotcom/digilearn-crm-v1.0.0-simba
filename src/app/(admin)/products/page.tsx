import { Suspense } from "react";
import { HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "~/components/error-boundary-fallback";
import ProductList from "./_components/products-list";

export default async function CreateQuotePage() {
  return (
    <HydrateClient>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <Suspense fallback={<div>Loading...</div>}>
          <ProductList />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
