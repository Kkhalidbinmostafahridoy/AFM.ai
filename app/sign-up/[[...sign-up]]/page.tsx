import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <SignUp
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
