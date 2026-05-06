import { useEffect } from 'react';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation
} from '../../features/notifications/notificationsApi';
import { formatDateTime } from '../../utils/formatters';

const NotificationCenter = ({ isConnected, refreshTick }) => {
  const notificationsQuery = useGetNotificationsQuery({ page: 1, limit: 20 });
  const [markRead, markReadState] = useMarkNotificationReadMutation();
  const [markAllRead, markAllReadState] = useMarkAllNotificationsReadMutation();

  useEffect(() => {
    if (refreshTick > 0) {
      notificationsQuery.refetch();
    }
  }, [refreshTick]);

  const rows = notificationsQuery.data?.data || [];
  const unreadCount = notificationsQuery.data?.meta?.unreadCount || 0;

  const onMarkRead = async (notificationId) => {
    try {
      await markRead(notificationId).unwrap();
    } catch (_error) {
      // no-op
    }
  };

  const onMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
    } catch (_error) {
      // no-op
    }
  };

  return (
    <section className="card">
      <div className="notifications-head">
        <h3>Notifications ({unreadCount} unread)</h3>
        <div className="inline-actions">
          <span className={isConnected ? 'status-live' : 'status-offline'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0 || markAllReadState.isLoading}
          >
            Mark All Read
          </button>
        </div>
      </div>

      {notificationsQuery.isLoading ? <p className="small">Loading notifications...</p> : null}
      {notificationsQuery.error ? <p className="error-text">Failed to load notifications.</p> : null}
      {!rows.length && !notificationsQuery.isLoading ? <p className="small">No notifications yet.</p> : null}

      <div className="notifications-list">
        {rows.map((item) => (
          <article key={item._id} className={`notification-item ${item.isRead ? '' : 'notification-unread'}`}>
            <div className="notification-top">
              <strong>{item.title || item.type || 'Notification'}</strong>
              <span className="small">{formatDateTime(item.createdAt)}</span>
            </div>
            <p>{item.message || '-'}</p>
            {!item.isRead ? (
              <button type="button" onClick={() => onMarkRead(item._id)} disabled={markReadState.isLoading}>
                Mark Read
              </button>
            ) : (
              <span className="small">Read</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default NotificationCenter;
