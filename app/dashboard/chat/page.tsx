import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { AFM_AI_NAME } from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardSidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">AI Chat</h1>
            <p className="text-muted-foreground mt-1">
              {AFM_AI_NAME} multi-model chat — voice, auto routing, fusion, structured answers.
            </p>
          </div>
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
