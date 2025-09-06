import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import { useInitializePayment } from '../hooks/useEcommerceApi';

const Checkout = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { items, getTotalPrice, getShippingCost, getGrandTotal, clearCart } = useCartStore();
    const { isLoggedIn, user } = useAuthStore();
    const initializePaymentMutation = useInitializePayment();

    const [formData, setFormData] = useState({
        // Shipping Address
        fullName: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Bangladesh',
        
        // Payment
        paymentMethod: 'sslcommerz',
        
        // Notes
        orderNotes: ''
    });

    const [errors, setErrors] = useState({});

    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="text-center py-16">
                        <h1 className="text-3xl font-bold mb-4">Please sign in to checkout</h1>
                        <button
                            onClick={() => navigate('/signin')}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="text-center py-16">
                        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const totalPrice = getTotalPrice();
    const shippingCost = getShippingCost();
    const grandTotal = getGrandTotal();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
        if (!formData.country.trim()) newErrors.country = 'Country is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        const orderData = {
            items: items.map(item => ({
                productId: item.product._id,
                quantity: item.quantity,
                price: item.variant?.price || item.product.price,
                variant: item.variant
            })),
            shippingAddress: {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                country: formData.country
            },
            paymentMethod: formData.paymentMethod,
            orderNotes: formData.orderNotes
        };

        try {
            console.log('User logged in:', isLoggedIn);
            console.log('User object:', user);
            console.log('Auth token:', useAuthStore.getState().token);
            console.log('Submitting order data:', orderData);
            
            const response = await initializePaymentMutation.mutateAsync(orderData);
            console.log('Payment response:', response);
            
            if (formData.paymentMethod === 'sslcommerz' && response.data?.payment_url) {
                // Redirect to SSLCommerz payment gateway
                console.log('Redirecting to:', response.data.payment_url);
                window.location.href = response.data.payment_url;
            } else if (formData.paymentMethod === 'cod') {
                // Clear cart and redirect to success page
                clearCart();
                navigate(`/order-success/${response.data.orderNumber}`);
            }
        } catch (error) {
            console.error('Payment initialization failed:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error message:', error.message);
            console.error('Full error object:', error);
            
            // Show user-friendly error message
            alert(`Payment failed: ${error.response?.data?.message || error.message || 'Unknown error occurred'}`);
        }
    };

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className="mx-auto max-w-7xl px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Checkout</h1>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Shipping Address */}
                        <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} ${errors.fullName ? 'border-red-500' : ''}`}
                                    />
                                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} ${errors.email ? 'border-red-500' : ''}`}
                                    />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} ${errors.phone ? 'border-red-500' : ''}`}
                                    />
                                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Country *</label>
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} ${errors.country ? 'border-red-500' : ''}`}
                                    >
                                        <option value="Bangladesh">Bangladesh</option>
                                        <option value="India">India</option>
                                        <option value="Pakistan">Pakistan</option>
                                        <option value="USA">United States</option>
                                        <option value="UK">United Kingdom</option>
                                        <option value="Canada">Canada</option>
                                    </select>
                                    {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Address *</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Street address, apartment, suite, etc."
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} ${errors.address ? 'border-red-500' : ''}`}
                                    />
                                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">City *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} ${errors.city ? 'border-red-500' : ''}`}
                                    />
                                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">State/Province</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Zip Code *</label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} ${errors.zipCode ? 'border-red-500' : ''}`}
                                    />
                                    {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                            
                            <div className="space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="sslcommerz"
                                        checked={formData.paymentMethod === 'sslcommerz'}
                                        onChange={handleInputChange}
                                        className="mr-3"
                                    />
                                    <div>
                                        <span className="font-medium">Online Payment (SSLCommerz)</span>
                                        <p className="text-sm text-gray-500">Pay with credit card, debit card, or mobile banking</p>
                                    </div>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleInputChange}
                                        className="mr-3"
                                    />
                                    <div>
                                        <span className="font-medium">Cash on Delivery</span>
                                        <p className="text-sm text-gray-500">Pay when you receive your order</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Order Notes */}
                        <div className={`rounded-lg border p-6 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <h2 className="text-xl font-semibold mb-4">Order Notes (Optional)</h2>
                            <textarea
                                name="orderNotes"
                                value={formData.orderNotes}
                                onChange={handleInputChange}
                                placeholder="Any special instructions for your order..."
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                            />
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className={`rounded-lg border p-6 sticky top-4 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                            
                            {/* Order Items */}
                            <div className="space-y-4 mb-6">
                                {items.map((item) => {
                                    const price = item.variant?.price || item.product.price;
                                    const subtotal = price * item.quantity;
                                    return (
                                        <div key={item.id} className={`flex items-start gap-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <img
                                                src={item.product.images && item.product.images.length > 0 
                                                    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${item.product.images[0]}` 
                                                    : '/placeholder-image.png'
                                                }
                                                alt={item.product.name}
                                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-medium text-sm leading-relaxed mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                                    {item.product.name}
                                                </h4>
                                                <div className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    <p>Quantity: {item.quantity}</p>
                                                    {item.variant && (
                                                        <p className="break-words">
                                                            Variant: {item.variant.name}
                                                        </p>
                                                    )}
                                                    <p className="font-medium">Unit Price: ${price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                                    ${subtotal.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Totals */}
                            <div className={`space-y-2 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className={`flex justify-between text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <span>Subtotal:</span>
                                    <span>${totalPrice.toFixed(2)}</span>
                                </div>
                                <div className={`flex justify-between text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <span>Shipping:</span>
                                    <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                                </div>
                                <div className={`flex justify-between text-lg font-semibold pt-2 border-t ${theme === 'dark' ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'}`}>
                                    <span>Total:</span>
                                    <span>${grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Place Order Button */}
                            <button
                                type="submit"
                                disabled={initializePaymentMutation.isPending}
                                className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors ${
                                    initializePaymentMutation.isPending
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            >
                                {initializePaymentMutation.isPending 
                                    ? 'Processing...' 
                                    : `Place Order - $${grandTotal.toFixed(2)}`
                                }
                            </button>

                            <p className="text-xs text-gray-500 mt-3 text-center">
                                By placing your order, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Checkout;
