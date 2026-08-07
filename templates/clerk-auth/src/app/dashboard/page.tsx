import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth.protect();

  return (
    <main className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Signed in as <code className="font-mono text-sm">{userId}</code>
      </p>
    </main>
  );
}
