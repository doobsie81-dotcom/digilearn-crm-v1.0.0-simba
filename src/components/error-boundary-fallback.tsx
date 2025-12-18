"use client";

import ErrorMessage from "./error-message";

export default function FallbackRender({
  error,
  //resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div role="alert">
      <ErrorMessage title="Something went wrong" message={error.message} />
    </div>
  );
}
