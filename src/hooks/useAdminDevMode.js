import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';

const STORAGE_KEY = 'adminDevMode';
const EVENT_NAME = 'admin-dev-mode-change';

const readStoredDevMode = () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
};

const persistDevMode = (enabled, notify = true) => {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: enabled }));
    if (notify) {
        message.info(enabled ? 'Modo técnico activado' : 'Modo técnico desactivado');
    }
};

export const useAdminDevMode = ({ listenShortcuts = false } = {}) => {
    const [devMode, setDevModeState] = useState(readStoredDevMode);

    const setDevMode = useCallback((enabled, { notify = true } = {}) => {
        persistDevMode(enabled, notify);
        setDevModeState(enabled);
    }, []);

    const toggleDevMode = useCallback(() => {
        setDevMode(!readStoredDevMode());
    }, [setDevMode]);

    useEffect(() => {
        const onDevModeChange = (event) => {
            setDevModeState(Boolean(event.detail));
        };

        const onStorage = (event) => {
            if (event.key === STORAGE_KEY) {
                setDevModeState(event.newValue === 'true');
            }
        };

        window.addEventListener(EVENT_NAME, onDevModeChange);
        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener(EVENT_NAME, onDevModeChange);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    useEffect(() => {
        if (!listenShortcuts) return undefined;

        const params = new URLSearchParams(window.location.search);
        if (params.get('devTools') === '1' && !readStoredDevMode()) {
            setDevMode(true);
        }

        const onKeyDown = (event) => {
            const hasModifier = event.ctrlKey || event.metaKey;
            if (hasModifier && event.shiftKey && event.key.toLowerCase() === 'd') {
                event.preventDefault();
                toggleDevMode();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [listenShortcuts, setDevMode, toggleDevMode]);

    return { devMode, setDevMode, toggleDevMode };
};

export default useAdminDevMode;
