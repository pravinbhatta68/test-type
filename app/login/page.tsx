import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import GoogleSignInButton from "./google-sign-in-button";

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
          <div className="login-brand" aria-label="Digital Pravin">
            <span aria-hidden="true">DP</span>
            DIGITAL PRAVIN
          </div>
          <p className="login-kicker">Typing studio</p>
          <h1 id="login-title">
            Welcome <em>Back</em>
          </h1>
          <p className="login-copy">Sign in to continue</p>

          {error && (
            <p className="login-error" role="alert">
              Google authentication could not be completed. Please try again.
            </p>
          )}

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <GoogleSignInButton />
          </form>

          <p className="login-privacy">
            Google handles your password securely. This website only receives
            your name, email address, and profile picture.
          </p>
        </div>
      </section>
    </main>
  );
}
