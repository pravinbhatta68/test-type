import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signIn } from "@/auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user?.email) redirect("/");

  const { error } = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-visual" aria-hidden="true">
          <span className="login-orbit login-orbit-yellow" />
          <span className="login-orbit login-orbit-pink" />
          <div className="login-keys">
            <b>T</b>
            <b>Y</b>
            <b>P</b>
            <b>E</b>
          </div>
          <p>Secure practice studio</p>
        </div>

        <div className="login-content">
          <Link className="login-brand" href="/" aria-label="Digital Pravin home">
            <span aria-hidden="true">DP</span>
            DIGITAL PRAVIN
          </Link>
          <p className="login-kicker">Members only</p>
          <h1 id="login-title">
            Sign in. <em>Type better.</em>
          </h1>
          <p className="login-copy">
            Continue with a verified Gmail account to unlock the complete typing
            studio, timed tests, and accuracy results.
          </p>

          {error && (
            <p className="login-error" role="alert">
              Access requires a verified address ending in @gmail.com.
            </p>
          )}

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button className="google-sign-in" type="submit">
              <span aria-hidden="true">G</span>
              Continue with Gmail
            </button>
          </form>

          <p className="login-privacy">
            Your password is handled by Google and is never shared with this
            website.
          </p>
        </div>
      </section>
    </main>
  );
}
