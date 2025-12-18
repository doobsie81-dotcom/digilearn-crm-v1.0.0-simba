import { redirect } from "next/navigation";
import { ProtectedRoute } from "~/components/auth";
import { getServerSession } from "~/lib/auth";
import { AbilityProvider } from "~/providers/app-abilities-provider";

export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // No valid session, redirect to login
  if (!session) {
    redirect("/api/v1/auth/clear-invalid-session");
  }

  return (
    <AbilityProvider>
      <ProtectedRoute redirectTo="/auth/login">
        <div className="min-h-screen bg-gray-50">
          {/* Add your admin navigation/sidebar here */}
          <main className="p-6 mx-auto">{children}</main>
        </div>
      </ProtectedRoute>
    </AbilityProvider>
  );
}
