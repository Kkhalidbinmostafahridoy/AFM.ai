import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AnalyticsProvider>{children}</AnalyticsProvider>;
}
