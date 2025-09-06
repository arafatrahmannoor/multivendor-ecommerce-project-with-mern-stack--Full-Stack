import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import useCartStore from "../../store/useCartStore";
import { useLogout } from "../../hooks/useApi";
import useTheme from "../../hooks/useTheme";

const Navbar = () => {
    const navigate = useNavigate();
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const { getTotalItems } = useCartStore();
    const logoutMutation = useLogout();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const userMenuRef = useRef(null);
    const { theme, toggleTheme } = useTheme();

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
            setUserOpen(false);
            navigate("/signin");
        } catch {
            // Even if logout fails, clear local auth
            clearAuth();
            setUserOpen(false);
            navigate("/signin");
        }
    };

    const baseLink = "px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
    const underlineBase = "relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-indigo-500 after:w-full after:origin-left after:transition-transform";
    const linkClasses = ({ isActive }) => {
        if (theme === 'dark') {
            return `${baseLink} ${underlineBase} ${isActive ? 'text-white after:scale-x-100' : 'text-gray-300 hover:text-white after:scale-x-0 hover:after:scale-x-100'}`;
        }
        return `${baseLink} ${underlineBase} ${isActive ? 'text-gray-900 after:scale-x-100' : 'text-gray-700 hover:text-gray-900 after:scale-x-0 hover:after:scale-x-100'}`;
    };
    const userBtnBase = "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors";
    const userBtnClass = theme === 'dark'
        ? `${userBtnBase} text-gray-300 hover:bg-gray-700 hover:text-white`
        : `${userBtnBase} text-gray-600 hover:bg-gray-100 hover:text-gray-900`;

    return (
    <nav className={`sticky top-0 z-40 transition-colors backdrop-blur ${theme === 'dark' ? 'bg-gray-900/80 border-b border-white/10 shadow' : 'bg-white/80 border-b border-gray-200 shadow-sm'}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-indigo-600 grid place-items-center text-white font-bold shadow-sm">E</div>
                                <span className={`${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} text-lg font-semibold transition-colors whitespace-nowrap`}>E-Shop</span>
                        </Link>
                    </div>

                    {/* Desktop layout: center Home/Products; right auth + toggle */}
                    <div className="hidden md:block relative w-full">
                        {/* Centered links */}
                        <div className="absolute left-1/2 -translate-x-1/2 p-2 flex items-center gap-2">
                            <NavLink to="/" className={linkClasses} end>Home</NavLink>
                            <NavLink to="/products" className={linkClasses}>Products</NavLink>
                        </div>

                        {/* Right cluster */}
                        <div className="flex items-center gap-1 justify-end w-full">
                            {/* Cart Icon */}
                            <Link
                                to="/cart"
                                className={`relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                                title="Shopping Cart"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 6H3m4 7l-1 4h12m0 0a2 2 0 11-4 0m4 0a2 2 0 01-4 0M9 21a2 2 0 11-4 0" />
                                </svg>
                                {getTotalItems() > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {getTotalItems()}
                                    </span>
                                )}
                                <span className="hidden lg:inline">Cart</span>
                            </Link>

                            {!isLoggedIn && (
                                <>
                                    <NavLink to="/signin" className={linkClasses}>Sign in</NavLink>
                                    <NavLink to="/signup" className={linkClasses}>Sign up</NavLink>
                                </>
                            )}

                            {isLoggedIn && (
                <div className="relative" ref={userMenuRef}>
                                    <button
                    onClick={() => setUserOpen((v) => !v)}
                    className={userBtnClass}
                    aria-haspopup="menu"
                    aria-expanded={userOpen}
                                    >
                                        <img
                                            className="h-8 w-8 rounded-full object-cover"
                                            src={
                                                // Show profile picture from backend, or default.jpg for new users
                                                user?.profilePicture 
                                                    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${user.profilePicture}`
                                                : user?.avatar
                                                    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${user.avatar}`
                                                    : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/profile_pictures/default.jpg`
                                            }
                                            alt="avatar"
                                        />
                                        
                                        <span className="hidden lg:inline">{user?.name || "User"}</span>
                                        <svg className={`h-4 w-4 text-gray-400 transition-transform ${userOpen ? "rotate-180" : "rotate-0"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {userOpen && (
                                        <div className={`absolute right-0 mt-2 w-56 origin-top-right rounded-md py-2 shadow-lg ring-1 focus:outline-none ${theme === 'dark' ? 'bg-gray-800 text-gray-100 ring-white/10 border border-white/10' : 'bg-white text-gray-800 ring-black/5 border border-gray-100'}`} role="menu">
                                            <div className={`px-4 py-2 ${theme === 'dark' ? 'border-b border-white/10' : 'border-b border-gray-100'}`}>
                                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.name || "User"}</p>
                                                <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email || "user@example.com"}</p>
                                            </div>
                                            <Link to="/profile" className={`block px-4 py-2 text-sm ${theme === 'dark' ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`} role="menuitem">Profile</Link>
                                            <Link to="/orders" className={`block px-4 py-2 text-sm ${theme === 'dark' ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`} role="menuitem">My Orders</Link>
                                            {user?.role === 'admin' && (
                                                <Link to="/admin/dashboard" className={`block px-4 py-2 text-sm ${theme === 'dark' ? 'text-amber-300 hover:bg-amber-900/20' : 'text-amber-700 hover:bg-amber-50'}`} role="menuitem">Admin Dashboard</Link>
                                            )}
                                            {user?.role === 'vendor' && (
                                                <Link to="/vendor/dashboard" className={`block px-4 py-2 text-sm ${theme === 'dark' ? 'text-indigo-400 hover:bg-indigo-900/20' : 'text-indigo-600 hover:bg-indigo-50'}`} role="menuitem">Vendor Dashboard</Link>
                                            )}
                                            <Link to="/profile/update" className={`block px-4 py-2 text-sm ${theme === 'dark' ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`} role="menuitem">Update profile</Link>
                                            <Link to="/change-password" className={`block px-4 py-2 text-sm ${theme === 'dark' ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`} role="menuitem">Change password</Link>
                                            <Link to="/profile-picture" className={`block px-4 py-2 text-sm ${theme === 'dark' ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`} role="menuitem">Profile picture</Link>
                                            <button onClick={handleLogout} className={`block w-full text-left px-4 py-2 text-sm ${theme === 'dark' ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`} role="menuitem">Logout</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Theme toggle button (desktop) */}
                            <button
                                onClick={toggleTheme}
                                className={`ml-2 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300'}`}
                                title="Toggle theme"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                            <path d="M21.64 13.65A9 9 0 1110.35 2.36 7 7 0 0021.64 13.65z" />
                                        </svg>
                                        <span className="hidden lg:inline">Light</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                            <path d="M12 18a6 6 0 100-12 6 6 0 000 12zm0 4a1 1 0 011 1v1h-2v-1a1 1 0 011-1zm0-22a1 1 0 011-1V0h-2v1a1 1 0 011 1zM4.22 5.64l-.7-.7L2.1 6.36l.7.7L4.22 5.64zM1 13h1a1 1 0 010 2H1v-2zm20 0h1v2h-1a1 1 0 010-2zm-2.32-7.36l1.41-1.41.7.7-1.41 1.41-.7-.7zM12 22a1 1 0 011 1v1h-2v-1a1 1 0 011-1z" />
                                        </svg>
                                        <span className="hidden lg:inline">Dark</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile hamburger */}
            <div className="md:hidden">
                        <button
                onClick={() => setMobileOpen((v) => !v)}
                className={`inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white focus:ring-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300'}`}
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Icon */}
                            <svg className={`${mobileOpen ? "hidden" : "block"} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <svg className={`${mobileOpen ? "block" : "hidden"} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu panel */}
            {mobileOpen && (
                <div className={`md:hidden transition-colors ${theme === 'dark' ? 'border-t border-gray-700 bg-gray-900' : 'border-t border-gray-200 bg-white'}`}>
                    <div className="space-y-1 px-2 py-3">
                        <NavLink onClick={() => setMobileOpen(false)} to="/" end className={({isActive}) => `${theme === 'dark' ? (isActive ? 'text-white' : 'text-gray-300 hover:text-white') : (isActive ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900')} block rounded-md px-3 py-2 text-base font-medium relative after:absolute after:left-3 after:-bottom-0.5 after:h-0.5 after:bg-indigo-500 after:transition-transform after:origin-left ${isActive ? 'after:scale-x-100' : 'after:scale-x-0'} `}>Home</NavLink>
                        <NavLink onClick={() => setMobileOpen(false)} to="/products" className={({isActive}) => `${theme === 'dark' ? (isActive ? 'text-white' : 'text-gray-300 hover:text-white') : (isActive ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900')} block rounded-md px-3 py-2 text-base font-medium relative after:absolute after:left-3 after:-bottom-0.5 after:h-0.5 after:bg-indigo-500 after:transition-transform after:origin-left ${isActive ? 'after:scale-x-100' : 'after:scale-x-0'} `}>Products</NavLink>
                        <NavLink onClick={() => setMobileOpen(false)} to="/cart" className={({isActive}) => `${theme === 'dark' ? (isActive ? 'text-white' : 'text-gray-300 hover:text-white') : (isActive ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900')} flex items-center justify-between rounded-md px-3 py-2 text-base font-medium relative after:absolute after:left-3 after:-bottom-0.5 after:h-0.5 after:bg-indigo-500 after:transition-transform after:origin-left ${isActive ? 'after:scale-x-100' : 'after:scale-x-0'} `}>
                            <span>Cart</span>
                            {getTotalItems() > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {getTotalItems()}
                                </span>
                            )}
                        </NavLink>

                        {!isLoggedIn ? (
                            <>
                                <NavLink onClick={() => setMobileOpen(false)} to="/signin" className={({isActive}) => `${theme === 'dark' ? (isActive ? 'text-white' : 'text-gray-300 hover:text-white') : (isActive ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900')} block rounded-md px-3 py-2 text-base font-medium relative after:absolute after:left-3 after:-bottom-0.5 after:h-0.5 after:bg-indigo-500 after:transition-transform after:origin-left ${isActive ? 'after:scale-x-100' : 'after:scale-x-0'} `}>Sign in</NavLink>
                                <NavLink onClick={() => setMobileOpen(false)} to="/signup" className={({isActive}) => `${theme === 'dark' ? (isActive ? 'text-white' : 'text-gray-300 hover:text-white') : (isActive ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900')} block rounded-md px-3 py-2 text-base font-medium relative after:absolute after:left-3 after:-bottom-0.5 after:h-0.5 after:bg-indigo-500 after:transition-transform after:origin-left ${isActive ? 'after:scale-x-100' : 'after:scale-x-0'} `}>Sign up</NavLink>
                            </>
                        ) : (
                            <div className="border-t border-gray-700 mt-2 pt-2">
                                <div className="flex items-center gap-3 px-3 py-2">
                                    <img className="h-8 w-8 rounded-full object-cover" 
                                        src={
                                            // Show profile picture from backend, or default.jpg for new users
                                            user?.profilePicture 
                                                ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${user.profilePicture}`
                                            : user?.avatar
                                                ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${user.avatar}`
                                                : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/profile_pictures/default.jpg`
                                        }
                                        alt="avatar" 
                                    />
                                    <div>
                                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.name || "User"}</p>
                                        <p className="text-xs text-gray-400">{user?.email || "user@example.com"}</p>
                                    </div>
                                </div>
                                <NavLink onClick={() => setMobileOpen(false)} to="/profile" className={({isActive}) => `${theme === 'dark' ? (isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white') : (isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')} block rounded-md px-3 py-2 text-base font-medium`}>Profile</NavLink>
                                <NavLink onClick={() => setMobileOpen(false)} to="/orders" className={({isActive}) => `${theme === 'dark' ? (isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white') : (isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')} block rounded-md px-3 py-2 text-base font-medium`}>My Orders</NavLink>
                                <NavLink onClick={() => setMobileOpen(false)} to="/profile/update" className={({isActive}) => `${theme === 'dark' ? (isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white') : (isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')} block rounded-md px-3 py-2 text-base font-medium`}>Update profile</NavLink>
                                <NavLink onClick={() => setMobileOpen(false)} to="/change-password" className={({isActive}) => `${theme === 'dark' ? (isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white') : (isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')} block rounded-md px-3 py-2 text-base font-medium`}>Change password</NavLink>
                                <NavLink onClick={() => setMobileOpen(false)} to="/profile-picture" className={({isActive}) => `${theme === 'dark' ? (isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white') : (isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')} block rounded-md px-3 py-2 text-base font-medium`}>Profile picture</NavLink>
                                <button onClick={handleLogout} className="mt-1 block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-400 hover:bg-red-50/10">Logout</button>
                            </div>
                        )}
                        {/* Theme toggle (mobile) */}
                        <button
                            onClick={toggleTheme}
                            className={`mt-2 block w-full rounded-md px-3 py-2 text-base font-medium text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;