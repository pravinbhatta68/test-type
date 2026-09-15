"use client";

import { useFormStatus } from "react-dom";

export default function GoogleSignInButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="google-sign-in"
      type="submit"
      disabled={pending}
      aria-disabled={pending}
    >
      <svg
        className="google-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path fill="#4285f4" d="M21.6 12.23c0-.71-.06-1.24-.2-1.8H12v3.46h5.52a4.71 4.71 0 0 1-2.05 3.01v2.25h3.32c1.94-1.79 3.06-4.42 3.06-7.5 0-.47-.04-.93-.1-1.37l-.15 1.95Z" />
        <path fill="#34a853" d="M12 22c2.77 0 5.1-.92 6.79-2.49l-3.32-2.61c-.92.62-2.1.99-3.47.99-2.67 0-4.93-1.8-5.74-4.23H2.83v2.69A10 10 0 0 0 12 22Z" />
        <path fill="#fbbc05" d="M6.26 13.66A6.02 6.02 0 0 1 5.94 12c0-.58.1-1.14.32-1.66V7.65H2.83A10 10 0 0 0 2 12c0 1.61.39 3.13.83 4.35l3.43-2.69Z" />
        <path fill="#ea4335" d="M12 6.11c1.51 0 2.86.52 3.93 1.53l2.95-2.95C17.09 3.02 14.77 2 12 2a10 10 0 0 0-9.17 5.65l3.43 2.69C7.07 7.91 9.33 6.11 12 6.11Z" />
      </svg>
      <span>{pending ? "Connecting to Google…" : "Continue with Google"}</span>
    </button>
  );
}
