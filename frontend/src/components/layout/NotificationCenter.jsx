import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BellDot, CheckCheck, CircleDot } from 'lucide-react';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation
} from '../../features/notifications/notificationsApi';
import { formatDateTime } from '../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

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
    <Card className="mt-6 overflow-hidden">
      <CardHeader className="mb-0 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <BellDot size={18} />
          </div>
          <div>
            <CardTitle>Notifications</CardTitle>
            <p className="text-sm text-slate-500">{unreadCount} unread</p>
          </div>
        </div>
        <div className="inline-actions">
          <Badge variant={isConnected ? 'default' : 'danger'}>{isConnected ? 'Connected' : 'Disconnected'}</Badge>
          <Button
            variant="secondary"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0 || markAllReadState.isLoading}
          >
            <CheckCheck size={16} />
            Mark All Read
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {notificationsQuery.isLoading ? <p className="small">Loading notifications...</p> : null}
        {notificationsQuery.error ? <p className="error-text">Failed to load notifications.</p> : null}
        {!rows.length && !notificationsQuery.isLoading ? <p className="small">No notifications yet.</p> : null}

        <div className="notifications-list">
          {rows.map((item, index) => (
            <motion.article
              key={item._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className={`notification-item ${item.isRead ? '' : 'notification-unread'}`}
            >
              <div className="notification-top">
                <div className="flex items-start gap-2">
                  {!item.isRead ? <CircleDot size={14} className="mt-1 text-emerald-600" /> : null}
                  <div>
                    <strong className="text-sm text-slate-800">{item.title || item.type || 'Notification'}</strong>
                    <p className="mt-1 text-sm text-slate-600">{item.message || '-'}</p>
                  </div>
                </div>
                <span className="small">{formatDateTime(item.createdAt)}</span>
              </div>
              <div className="mt-3">
                {!item.isRead ? (
                  <Button type="button" size="sm" onClick={() => onMarkRead(item._id)} disabled={markReadState.isLoading}>
                    Mark Read
                  </Button>
                ) : (
                  <Badge variant="neutral">Read</Badge>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;