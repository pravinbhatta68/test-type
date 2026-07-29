import { redirect } from "next/navigation";
import { auth } from "@/auth";
import TypingPractice from "./typing-practice";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  return (
    <TypingPractice
      userEmail={email}
      userName={session.user?.name?.trim() || email.split("@")[0]}
    />
  );
}
