"use client";

import PageHeader from "~/components/page-header";

export default function ProfileHeader() {
//   const [user] = trpc.users.getById.useSuspenseQuery({ id });

//   const initials = useMemo(() => {
//     if (!user) return null;

//     return `${user.name.split(" ")[0]}`;
//   }, [user]);

  return (
    <div>
      <PageHeader
        title="Profile & Preferences"
        subtitle="Manage user account, securirty and preferences"
      />
    </div>
  );
}
