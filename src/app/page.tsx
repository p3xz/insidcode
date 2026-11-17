import { auth } from "@/lib/auth";
import GuestWelcomePage from "@/components/landing/GuestWelcomePage";
import AuthenticatedHomeView from "@/components/landing/AuthenticatedHomeView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    return <GuestWelcomePage />;
  }

  return <AuthenticatedHomeView user={session.user} />;
}
