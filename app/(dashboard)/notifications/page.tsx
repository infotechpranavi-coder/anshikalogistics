import { getNotifications } from "@/actions/notifications";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsList } from "@/features/notifications/notifications-list";

export default async function NotificationsPage() {
  const notifications = (await getNotifications()).data ?? [];

  return (
    <div className="page-stack">
      <PageHeader
        badge="Alerts"
        title="Notifications"
        description="Document expiry and fleet activity alerts."
      />
      <NotificationsList data={notifications} />
    </div>
  );
}
