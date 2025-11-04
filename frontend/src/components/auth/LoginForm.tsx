import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';
import {apiClient} from '../../services/apiClient';

interface LoginFormProps {
    onSuccess: (userData: { user: any; token: string }) => void;
    onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({onSuccess, onSwitchToRegister}) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.login(formData.email, formData.password);

            if (response.success && response.data) {
                onSuccess(response.data);
            } else {
                setError(response.error?.message || 'Login failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        if (error) setError(null);
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="w-full max-w-md"
        >
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <motion.h2
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.2}}
                        className="text-3xl font-bold text-foreground mb-2"
                    >
                        Welcome Back
                    </motion.h2>
                    <motion.p
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.3}}
                        className="text-muted-foreground"
                    >
                        Sign in to your Nexus Smart Wallet
                    </motion.p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        variant="cyber"
                        placeholder="Enter your email"
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                            </svg>
                        }
                    />

                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        variant="cyber"
                        placeholder="Enter your password"
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                        }
                    />

                    {error && (
                        <motion.div
                            initial={{opacity: 0, x: -10}}
                            animate={{opacity: 1, x: 0}}
                            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                            <div className="flex items-center gap-2 text-red-400">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                          clipRule="evenodd"/>
                                </svg>
                                <span className="text-sm">{error}</span>
                            </div>
                        </motion.div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={isLoading}
                        glow={!isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <span>Don't have an account?</span>
                        <button
                            type="button"
                            onClick={onSwitchToRegister}
                            className="text-web3-primary hover:text-web3-primary/80 font-semibold transition-colors"
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};