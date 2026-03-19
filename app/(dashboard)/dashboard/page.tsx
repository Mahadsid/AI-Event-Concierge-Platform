import { serverClient } from "@/lib/orpc.server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
    // SSR — fetches on server, passes as initialData to client
    // This is what makes data persist on refresh
    const { events } = await serverClient.event.list();

    return <DashboardClient initialEvents={events} />;
}