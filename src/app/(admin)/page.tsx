import { getServerSession } from "~/lib/auth";
import { redirect } from "next/navigation";
import PageHeader from "~/components/page-header";
import { Dashboard } from "./_dashboard";
import { getUserPermissions } from "~/lib/get-user-permissions";

export default async function Home() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/unauthorized");
  }

  const abilities = await getUserPermissions(
    session?.user,
    session.userPermissions
  );

  // we need to have a set of redirects here...
  if (!abilities.can("read", "Dashboard")) {
    redirect("/pipeline");
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of system metrics"
      />
      <Dashboard />
    </main>
  );
}
