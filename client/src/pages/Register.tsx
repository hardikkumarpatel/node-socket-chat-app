/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '../context/ToastContext';
import { USER_REGISTER_URL } from '../constant/Endpoint.constant';
import { ClientApiResponseDTO, UserRegisterRequestDTO } from '../interface/Common.interface';

const RegisterPage = () => {
    const [form, setForm] = useState<UserRegisterRequestDTO>({} as UserRegisterRequestDTO);
    const navigate = useNavigate();
    const { toast } = useToastContext();
    const handleRedirectToSignin = () => {
        navigate("/login");
    }

    const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { target: { name, value } } = event;
        setForm({
            ...form,
            [name]: value
        })
    }

    const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const { email, username, password } = form;
            const res = await fetch(USER_REGISTER_URL, {
                method: 'POST',
                headers: {
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify({ email, username, password })
            });
            const { success, message } = await res.json() as ClientApiResponseDTO<{}>;
            if (!success) {
                return toast('error', message);
            }

            toast('success', message);
            await new Promise(r => setTimeout(r, 1000));
            navigate('/login');
        } catch (LoginException: any) {
            toast('error', LoginException.message);
        }
    }

    return (
        <section className="bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                <div className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
                    <img className="w-8 h-8 mr-2" src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg" alt="logo" />
                    Hunt
                </div>
                <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                            Sign up to your account
                        </h1>
                        <form className="space-y-4 md:space-y-6" action="#" onSubmit={handleRegister}>
                            <div>
                                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
                                <input type="email" name="email" id="email" onChange={handleOnChange} value={form.email} className="bg-gray-50 border outline-none border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@company.com" required />
                            </div>
                            <div>
                                <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your username</label>
                                <input type="text" name="username" id="username" onChange={handleOnChange} value={form.username} className="bg-gray-50 border outline-none border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name" required />
                            </div>
                            <div>
                                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                <input type="password" name="password" id="password" onChange={handleOnChange} value={form.password} placeholder="••••••••" className="bg-gray-50 border outline-none border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required />
                            </div>
                            <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Sign up</button>
                            <div className="flex text-sm font-light text-gray-500 dark:text-gray-400 cursor-pointer"
                                onClick={handleRedirectToSignin}>
                                Already have an account? <p className="ml-1 font-medium text-primary-600 hover:underline dark:text-primary-500">Sign in</p>
                            </div>
                        </form>
                    </div>
                </div>
                <p className="flex mt-5 items-center mb-0 text-lg font-semibold text-gray-900 dark:text-white">
                    Made in React with ❤️
                </p>
                <p className="flex mt-1 items-center mb-6 text-sm font-light text-gray-500 dark:text-white">
                    Design by HARDIK PATEL
                </p>
            </div>
        </section>
    )
}

export default RegisterPage;