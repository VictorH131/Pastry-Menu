
import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    useMemo,
    type ReactNode,
} from 'react';

export type NoticeType = 'info' | 'success' | 'error';

export interface Notice {
    id: string;
    type: NoticeType;
    title: string;
    message: string;
}

interface NotificationContextType {
    notices: Notice[];
    notify: (
        type: NoticeType,
        title: string,
        message: string
    ) => void;
    dismiss: (id: string) => void;
    clear: () => void;
}

const MAX_NOTICES = 5;
const NOTICE_DURATION = 5000;

const NotificationContext =
    createContext<NotificationContextType | null>(null);

export function NotificationProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [notices, setNotices] = useState<Notice[]>([]);

    const timers = useRef<
        Map<string, ReturnType<typeof setTimeout>>
    >(new Map());

    const dismiss = useCallback((id: string) => {
        const timer = timers.current.get(id);

        if (timer !== undefined) {
            clearTimeout(timer);
            timers.current.delete(id);
        }

        setNotices((current) =>
            current.filter((notice) => notice.id !== id)
        );
    }, []);

    const clear = useCallback(() => {
        timers.current.forEach(clearTimeout);
        timers.current.clear();
        setNotices([]);
    }, []);

    const notify = useCallback(
        (type: NoticeType, title: string, message: string) => {
            const id = crypto.randomUUID();

            const notice: Notice = {
                id,
                type,
                title,
                message,
            };

            setNotices((current) => [
                ...current.slice(-(MAX_NOTICES - 1)),
                notice,
            ]);

            const timer = setTimeout(() => {
                dismiss(id);
            }, NOTICE_DURATION);

            timers.current.set(id, timer);
        },
        [dismiss]
    );

    useEffect(() => {
        const activeTimers = timers.current;

        return () => {
            activeTimers.forEach(clearTimeout);
            activeTimers.clear();
        };
    }, []);

    const value = useMemo(
        () => ({
            notices,
            notify,
            dismiss,
            clear,
        }),
        [notices, notify, dismiss, clear]
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error(
            'useNotifications deve ser utilizado dentro de NotificationProvider.'
        );
    }

    return context;
}
