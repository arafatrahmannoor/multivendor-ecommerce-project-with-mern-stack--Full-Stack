import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import useAuthStore from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import useTheme from "../hooks/useTheme";
import { useRegister } from "../hooks/useApi";

const Signup = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    const navigate = useNavigate();
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    const { theme } = useTheme();


    useEffect(() =>{
        if (isLoggedIn) navigate('/'); //redirect to home if already logged in
    }, [isLoggedIn, navigate]);



    //TanStack Query mutation for registration
    const mutation = useRegister();

    // Override the success handler to add navigation and alert
    const onSubmit = (data) => {
        // Don't override the role - let user select it
        mutation.mutate(data, {
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Registration successful',
                    text: 'You have been registered successfully!',
                    timer: 3000,
                    showConfirmButton: false
                }).then(() => {
                    navigate('/'); //redirect to home after successful registration
                });
            },
            onError: (error) => {
                console.log('Registration error:', error);
                
                // Handle validation errors specifically
                if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                    const validationErrors = error.response.data.errors.map(err => err.msg).join('\n');
                    Swal.fire({
                        icon: 'error',
                        title: 'Validation Error',
                        text: validationErrors,
                        timer: 5000,
                        showConfirmButton: true
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Registration failed',
                        text: error.response?.data?.message || 'An error occurred during registration.',
                        timer: 3000,
                        showConfirmButton: false
                    });
                }
            }
        });
    };


    //password match
    const password = watch('password');

    return (
        <div className={`flex justify-center items-center min-h-screen transition-colors relative overflow-hidden ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-100'}`}>
            <div className={`pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-3xl ${theme === 'dark' ? 'bg-purple-700/20' : 'bg-purple-300/40'}`}></div>

            <form onSubmit={handleSubmit(onSubmit)} className={`p-8 rounded-xl border w-full max-w-md transition-colors ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                <h2 className={`text-2xl font-bold mb-2 text-center transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Create your account</h2>
                <p className={`text-center text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Join us to start shopping smarter.</p>

                {/* Name */}
                <div className="mb-4">
                    <label className={`block mb-1 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="name">Name</label>
                    <input
                        type="text"
                        {...register('name', { required: "Name is required" })}

                        className={`px-2 py-2 w-full  border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                        placeholder="Name"
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                </div>

                {/* Email */}
                <div className="mb-4">
                    <label className={`block mb-1 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="email">Email</label>
                    <input
                        type="email"
                        {...register('email', {
                            required: "Email is required",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Invalid email address"
                            }
                        })}

                        className={`px-2 py-2 w-full  border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                        placeholder="Email"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                </div>

                {/* Role: User or Vendor */}
                <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
                    <select
                        {...register('role', { required: "Role is required" })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                    >
                        <option value="">Select Role</option>
                        <option value="user">User</option>
                        <option value="vendor">Vendor</option>
                    </select>
                    {errors.role && (
                        <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                    )}
                </div>

                {/* Password */}
                <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="password">Password</label>
                    <input
                        type="password"
                        {...register('password', {
                            required: "Password is required",
                            minLength: {
                                value: 8,
                                message: "Password must be at least 8 characters long"
                            },
                        })}
                        className={`px-2 py-2 w-full  border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                        placeholder="Password"
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                    )}
                </div>
                {/* Confirm Password */}
                <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        {...register('confirmPassword', {
                            required: "Confirm Password is required",
                            validate: (value) => value === password || "Passwords do not match"
                        })}
                        className={`px-2 py-2 w-full  border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                        placeholder="Confirm Password"
                    />

                    {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                    )}
                </div>


                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={mutation.isLoading}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    {mutation.isLoading ? "Registering..." : "Register"}
                </button>
            </form>

        </div>
    );
};

export default Signup;