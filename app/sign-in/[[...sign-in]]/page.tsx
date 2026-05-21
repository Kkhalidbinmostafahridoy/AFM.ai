import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "rounded-2xl shadow-xl",
          },
        }}
      />
    </div>
  );
}
