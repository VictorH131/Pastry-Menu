import { useNotifications } from '../context/NotificationContext';
export default function NotificationModal() {
  const { notices, dismiss } = useNotifications();
  return <div className="toast-stack" aria-live="polite">{notices.map(n =>
    <div key={n.id} className={`toast ${n.type}`} role={n.type === 'error' ? 'alert' : 'status'}>
      <div><strong>{n.title}</strong><p>{n.message}</p></div>
      <button onClick={() => dismiss(n.id)} aria-label="Fechar notificação">×</button>
    </div>)}</div>;
}
