import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';

const AuthInitializer = ({ children }) => {
    const refreshAuth = useAuthStore((state) => state.refreshAuth);

    useEffect(() => {
        // Refresh auth state on app load
        refreshAuth();
    }, [refreshAuth]);

    return children;
};

export default AuthInitializer;
