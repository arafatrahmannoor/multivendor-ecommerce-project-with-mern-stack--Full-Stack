import { Outlet } from "react-router-dom";
import Footer from "../Components/FrontCompo/Footer";
import Header from "../Components/FrontCompo/Header";
import useTheme from "../hooks/useTheme";

const FrontLayout = () => {
    const { theme } = useTheme();
    return (
        <div className={`min-h-screen flex flex-col transition-colors ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default FrontLayout;