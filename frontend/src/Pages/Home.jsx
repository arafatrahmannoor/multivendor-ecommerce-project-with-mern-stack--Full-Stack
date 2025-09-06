import { Link } from 'react-router-dom';
import { useProducts, useCategories } from '../hooks/useEcommerceApi';
import useTheme from "../hooks/useTheme";

const Home = () => {
    const { theme } = useTheme();
    const { data: products, isLoading: productsLoading } = useProducts({ limit: 6 });
    const { data: categories, isLoading: categoriesLoading } = useCategories();
    
    return (
        <div className={`min-h-screen transition-colors relative overflow-hidden ${theme === 'dark' ? 'bg-gray-950' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
            {/* Decorative gradients */}
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden">
                <div className={`h-[18rem] w-[36rem] blur-3xl ${theme === 'dark' ? 'bg-indigo-800/20' : 'bg-indigo-300/30'}`}></div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-20">
                {/* Hero Section */}
                <div className="grid md:grid-cols-2 items-center gap-10 mb-16">
                    <div className="text-center md:text-left">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium mb-4 ${theme === 'dark' ? 'bg-indigo-900/40 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>Your trusted marketplace</span>
                        <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Discover, shop, and save with E‑Shop
                        </h1>
                        <p className={`text-lg sm:text-xl mb-10 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Find products you'll love with great deals and fast checkout.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 md:justify-start justify-center">
                            <Link to="/products" className="inline-flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
                                Browse Products
                            </Link>
                            <Link to="/signup" className={`inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors shadow-sm ${theme === 'dark' ? 'bg-gray-800 text-gray-100 hover:bg-gray-700' : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'}`}>
                                Get Started
                            </Link>
                        </div>
                    </div>

                    {/* Right illustration */}
                    <div className="relative hidden md:block">
                        <div className={`absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl ${theme === 'dark' ? 'bg-purple-800/30' : 'bg-purple-300/40'}`}></div>
                        <div className={`rounded-2xl border shadow-sm p-6 ${theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <div className="grid grid-cols-3 gap-4">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className={`aspect-square rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} grid place-items-center text-2xl`}>
                                        🛒
                                    </div>
                                ))}
                            </div>
                            <p className={`mt-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Thousands of items across categories.</p>
                        </div>
                    </div>
                </div>

                {/* Categories Section */}
                <section className="mb-16">
                    <h2 className={`text-3xl font-bold mb-8 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Shop by Category
                    </h2>
                    {categoriesLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1,2,3,4].map(i => (
                                <div key={i} className={`h-32 rounded-xl animate-pulse ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                            ))}
                        </div>
                    ) : categories?.data?.categories?.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {categories.data.categories.slice(0, 4).map((category) => (
                                <Link 
                                    key={category._id} 
                                    to={`/products?category=${category._id}`}
                                    className={`p-6 rounded-xl border transition-all hover:scale-105 text-center ${theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-200 hover:shadow-lg'}`}
                                >
                                    <div className="text-3xl mb-2">📱</div>
                                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {category.name}
                                    </h3>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {category.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            No categories available
                        </div>
                    )}
                </section>

                {/* Featured Products Section */}
                <section>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Featured Products
                        </h2>
                        <Link 
                            to="/products" 
                            className={`text-indigo-600 hover:text-indigo-500 font-medium`}
                        >
                            View All →
                        </Link>
                    </div>
                    
                    {productsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1,2,3,4,5,6].map(i => (
                                <div key={i} className={`border rounded-xl p-4 animate-pulse ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <div className={`h-48 rounded-lg mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                                    <div className={`h-4 rounded mb-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                                    <div className={`h-4 rounded w-2/3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                                </div>
                            ))}
                        </div>
                    ) : products?.data?.products?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.data.products.slice(0, 6).map((product) => (
                                <Link 
                                    key={product._id} 
                                    to={`/products/${product._id}`}
                                    className={`border rounded-xl p-4 transition-all hover:scale-105 ${theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-200 hover:shadow-lg'}`}
                                >
                                    <div className={`h-48 rounded-lg mb-4 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${theme === 'dark' ? 'from-gray-700 to-gray-800' : ''}`}>
                                        <span className="text-4xl">📱</span>
                                    </div>
                                    <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {product.name}
                                    </h3>
                                    <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {product.description?.slice(0, 100)}...
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <span className={`font-bold text-lg ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            ${product.price}
                                        </span>
                                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {product.stock} in stock
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            No products available
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Home;
