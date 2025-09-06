import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { useLogin } from "../hooks/useApi";
import Swal from "sweetalert2";
import { useEffect } from "react";
import useTheme from "../hooks/useTheme";

const Signin = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const loginMutation = useLogin();
  const { theme } = useTheme();

  useEffect(() => {
    if (isLoggedIn) navigate('/');
  }, [isLoggedIn, navigate]);

  const onSubmit = async (data) => {
    try {
      await loginMutation.mutateAsync(data);
      Swal.fire({
        icon: 'success',
        title: 'Login successful',
        text: 'Welcome back!',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/');
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login failed',
        text: error.response?.data?.message || 'Invalid credentials',
        timer: 3000,
        showConfirmButton: false
      });
    }
  };

  return (
    <div className={`min-h-screen transition-colors flex items-center justify-center px-4 relative overflow-hidden ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`pointer-events-none absolute -top-10 right-10 h-40 w-40 rounded-full blur-3xl ${theme === 'dark' ? 'bg-indigo-700/20' : 'bg-indigo-300/40'}`}></div>
      <div className="w-full max-w-md">
        <div className={`rounded-xl border ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} shadow-sm p-8 transition-colors`}>
          <h1 className={`text-2xl font-bold text-center mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Sign in to your account</h1>
          <p className={`text-center text-sm mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Welcome back! Please enter your details.</p>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email address</label>
              <input 
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address"
                  }
                })} 
                type="email" 
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`} 
                placeholder="you@example.com" 
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-1 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
              <input 
                {...register("password", { required: "Password is required" })} 
                type="password" 
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`} 
                placeholder="••••••••" 
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            
            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              Sign in
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signin;
