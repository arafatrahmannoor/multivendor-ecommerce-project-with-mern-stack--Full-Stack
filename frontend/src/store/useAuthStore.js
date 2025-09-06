import { create } from "zustand";
import { Cookies } from "react-cookie";

const cookies = new Cookies();

// Function to safely get data from both cookies and localStorage
const getStoredData = (key) => {
    try {
        // Try cookies first
        const cookieValue = cookies.get(key);
        if (cookieValue) {
            console.log(`getStoredData(${key}) from cookies:`, cookieValue, typeof cookieValue);
            return cookieValue;
        }
        
        // Fallback to localStorage
        const localValue = localStorage.getItem(key);
        console.log(`getStoredData(${key}) from localStorage:`, localValue, typeof localValue);
        return localValue;
    } catch (error) {
        console.warn(`Error reading ${key}:`, error);
        return null;
    }
};

// Function to safely parse user data
const parseUserData = (rawUser) => {
    try {
        if (typeof rawUser === 'string') {
            return JSON.parse(rawUser);
        }
        return rawUser;
    } catch (error) {
        console.warn('Error parsing user data:', error);
        return null;
    }
};

//Initialize user authentication state from cookies/localStorage
const tokenFromStorage = getStoredData("token") || null;
const roleFromStorage = getStoredData("role") || null;
const userRawFromStorage = getStoredData("user") || null;
const userFromStorage = parseUserData(userRawFromStorage);

console.log('Auth Store Initialization:', {
    token: tokenFromStorage, // Show actual token, not just boolean
    tokenType: typeof tokenFromStorage,
    role: roleFromStorage,
    user: userFromStorage,
    isLoggedIn: !!tokenFromStorage
});

const useAuthStore = create((set) => ({
    token: tokenFromStorage,
    role: roleFromStorage,
    user: userFromStorage,
    isLoggedIn: !!tokenFromStorage,

    setAuth: (token, role, user) => {
        console.log('setAuth called with:', { 
            token: token, 
            tokenType: typeof token,
            tokenLength: token ? token.length : 0,
            role: role, 
            user: user 
        });
        
        // Store in both cookies and localStorage for redundancy
        if(token) {
            cookies.set("token", token, { path: '/', sameSite: 'lax', maxAge: 86400 });
            localStorage.setItem("token", token);
        }
        if(role) {
            cookies.set("role", role, { path: '/', sameSite: 'lax', maxAge: 86400 });
            localStorage.setItem("role", role);
        }
        if(user) {
            const userStr = JSON.stringify(user);
            cookies.set("user", userStr, { path: '/', sameSite: 'lax', maxAge: 86400 });
            localStorage.setItem("user", userStr);
        }

        set({ 
            token: token || null, 
            role: role || null, 
            user: user || null, 
            isLoggedIn: !!token 
        });
    },

    clearAuth: () => {
        console.log('Clearing auth');
        
        // Clear both cookies and localStorage
        cookies.remove("token", { path: '/' });
        cookies.remove("role", { path: '/' });
        cookies.remove("user", { path: '/' });
        
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        set({ token: null, role: null, user: null, isLoggedIn: false });
    },

    // Method to update just the user data (useful for profile updates)
    updateUser: (userData) => {
        console.log('Updating user data:', userData);
        
        if (userData) {
            const userStr = JSON.stringify(userData);
            cookies.set("user", userStr, { path: '/', sameSite: 'lax', maxAge: 86400 });
            localStorage.setItem("user", userStr);
        }

        set((state) => ({ 
            ...state, 
            user: userData 
        }));
    },

    // Method to refresh auth state from storage (useful after reload)
    refreshAuth: () => {
        const token = getStoredData("token");
        const role = getStoredData("role");
        const userRaw = getStoredData("user");
        const user = parseUserData(userRaw);
        
        console.log('Refreshing auth:', { 
            token: token, 
            tokenType: typeof token,
            tokenLength: token ? token.length : 0,
            role, 
            user 
        });
        
        set({
            token,
            role,
            user,
            isLoggedIn: !!token
        });
    }
}));

export default useAuthStore;
