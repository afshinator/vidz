import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { getUnwatchedVideosPaginated, getTagsByUser } from "@/lib/db/queries";
import { ListViewClient } from "./listview-client";

export default async function ListViewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const [initialData, allTags] = await Promise.all([
    getUnwatchedVideosPaginated(session.user.id, 50),
    getTagsByUser(session.user.id),
  ]);

  return (
    <>
      <Header title="List View" showViewToggle={false} />
      <ListViewClient initialData={initialData} allTags={allTags} />
    </>
  );
}
