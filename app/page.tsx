import { redirect } from "next/navigation";
import { auth } from "@/auth";
import TypingPractice from "./typing-practice";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return (
    <TypingPractice
      user={{
        name: session.user.name ?? "Google user",
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    />
  );
}
