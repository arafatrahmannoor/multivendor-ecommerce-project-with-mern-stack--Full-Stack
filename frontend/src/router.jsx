import { createBrowserRouter } from "react-router-dom";
import FrontLayout from "./Layouts/FrontLayout";
import AdminLayout from "./Layouts/AdminLayout";
import VendorLayout from "./Layouts/VendorLayout";
import Home from "./Pages/Home";
import Signup from "./Pages/Signup";
import Products from "./Pages/Products";
import ProductDetail from "./Pages/ProductDetail";
import Signin from "./Pages/Signin";
import Profile from "./Pages/Profile";
import UpdateProfile from "./Pages/UpdateProfile";
import ChangePassword from "./Pages/ChangePassword";
import ProfilePicture from "./Pages/ProfilePicture";
import Cart from "./Pages/Cart";
import Checkout from "./Pages/Checkout";
import Orders from "./Pages/Orders";
import UserOrders from "./Pages/UserOrders";
import VendorDashboard from "./Pages/VendorDashboard";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminOrders from "./Pages/AdminOrders";
import AdminPendingOrders from "./Pages/AdminPendingOrders";
import AdminCategories from "./Pages/AdminCategories";
import AdminBrands from "./Pages/AdminBrands";
import AdminStats from "./Pages/AdminStats";
import AdminUsers from "./Pages/AdminUsers";
import AdminPayments from "./Pages/AdminPayments";
import AdminProducts from "./Pages/AdminProducts";
import AdminPendingProducts from "./Pages/AdminPendingProducts";
import AdminAnalytics from "./Pages/AdminAnalytics";
import AdminSettings from "./Pages/AdminSettings";
// import APITest from "./Pages/APITest";
import VendorProducts from "./Pages/VendorProducts";
import VendorOrders from "./Pages/VendorOrders";
import VendorAssignedOrders from "./Pages/VendorAssignedOrders";
import VendorAnalytics from "./Pages/VendorAnalytics";
import VendorInventory from "./Pages/VendorInventory";
import VendorSettings from "./Pages/VendorSettings";



const router = createBrowserRouter([
    {
        path: "/",
        element: <FrontLayout />,
        children: [
            {
                path: "/",
                element: <Home />,
            },
            {
                path: "/products",
                element: <Products />,
            },
            {
                path: "/products/:id",
                element: <ProductDetail />,
            },
            {
                path: "/cart",
                element: <Cart />,
            },
            {
                path: "/checkout",
                element: <Checkout />,
            },
            {
                path: "/orders",
                element: <UserOrders />,
            },
            {
                path: "/signin",
                element: <Signin />,
            },
            {
                path: "/signup",
                element: <Signup />,
            },
            {
                path: "/profile",
                element: <Profile />,
            },
            {
                path: "/profile/update",
                element: <UpdateProfile />,
            },
            {
                path: "/change-password",
                element: <ChangePassword />,
            },
            {
                path: "/profile-picture",
                element: <ProfilePicture />,
            },
        ]
    },
    // Admin Routes with AdminLayout
    {
        path: "/admin",
        element: <AdminLayout />,
        children: [
            {
                path: "dashboard",
                element: <AdminDashboard />,
            },
            {
                path: "products",
                element: <AdminProducts />,
            },
            {
                path: "pending-products",
                element: <AdminPendingProducts />,
            },
            {
                path: "pending-orders",
                element: <AdminPendingOrders />,
            },
            {
                path: "orders",
                element: <AdminOrders />,
            },
            {
                path: "users",
                element: <AdminUsers />,
            },
            {
                path: "categories",
                element: <AdminCategories />,
            },
            {
                path: "brands",
                element: <AdminBrands />,
            },
            {
                path: "payments",
                element: <AdminPayments />,
            },
            {
                path: "stats",
                element: <AdminStats />,
            },
            {
                path: "analytics",
                element: <AdminAnalytics />,
            },
            {
                path: "settings",
                element: <AdminSettings />,
            }
        ]
    },
    // Vendor Routes with VendorLayout
    {
        path: "/vendor",
        element: <VendorLayout />,
        children: [
            {
                path: "dashboard",
                element: <VendorDashboard />,
            },
            {
                path: "products",
                element: <VendorProducts />,
            },
            {
                path: "assigned-orders",
                element: <VendorAssignedOrders />,
            },
            {
                path: "orders",
                element: <VendorOrders />,
            },
            {
                path: "analytics",
                element: <VendorAnalytics />,
            },
            {
                path: "inventory",
                element: <VendorInventory />,
            },
            {
                path: "settings",
                element: <VendorSettings />,
            },
        ]
    },
]);

export default router;