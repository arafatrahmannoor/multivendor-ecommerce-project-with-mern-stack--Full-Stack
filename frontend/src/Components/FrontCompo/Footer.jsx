import { Link } from "react-router-dom";
import useTheme from "../../hooks/useTheme";

const Footer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <footer className={`mt-auto transition-colors ${isDark ? 'bg-gray-950 text-gray-300 border-t border-white/10' : 'bg-white text-gray-700 border-t border-gray-200'}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-md bg-indigo-600 grid place-items-center text-white font-bold shadow-sm">E</div>
                            <span className={`${isDark ? 'text-gray-100' : 'text-gray-900'} text-lg font-semibold`}>E-Shop</span>
                        </div>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your trusted e‑commerce platform for quality products.</p>
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Shop</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className={`hover:underline ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Home</Link></li>
                            <li><Link to="/products" className={`hover:underline ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Products</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Account</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/signin" className={`hover:underline ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Sign in</Link></li>
                            <li><Link to="/signup" className={`hover:underline ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Sign up</Link></li>
                            <li><Link to="/profile" className={`hover:underline ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Profile</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Contact</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="mailto:info@eshop.com" className={`hover:underline ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>info@eshop.com</a></li>
                            <li><a href="tel:+15551234567" className={`hover:underline ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>(555) 123-4567</a></li>
                        </ul>
                    </div>
                </div>
                <div className={`mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-t border-white/10' : 'border-t border-gray-200'}`}>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>&copy; {new Date().getFullYear()} E-Shop. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-xs">
                        <Link to="#" className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Privacy</Link>
                        <span className={`${isDark ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
                        <Link to="#" className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;