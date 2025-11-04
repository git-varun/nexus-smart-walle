import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';
import {apiClient} from '../../services/apiClient';
import {cn} from '../../utils/cn';

interface RegisterFormProps {
    onSuccess: (userData: { user: any; token: string }) => void;
    onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({onSuccess, onSwitchToLogin}) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Email validation
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            errors.password = 'Password must contain uppercase, lowercase, and number';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.register(formData.email, formData.password);

            if (response.success && response.data) {
                onSuccess(response.data);
            } else {
                setError(response.error?.message || 'Registration failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));

        // Clear errors when user starts typing
        if (error) setError(null);
        if (validationErrors[e.target.name]) {
            setValidationErrors(prev => ({
                ...prev,
                [e.target.name]: ''
            }));
        }
    };

    const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/\d/.test(password)) strength += 1;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

        if (strength <= 2) return {strength: strength * 20, label: 'Weak', color: 'bg-red-500'};
        if (strength <= 3) return {strength: strength * 20, label: 'Fair', color: 'bg-yellow-500'};
        if (strength <= 4) return {strength: strength * 20, label: 'Good', color: 'bg-blue-500'};
        return {strength: 100, label: 'Strong', color: 'bg-green-500'};
    };

    const passwordStrength = getPasswordStrength(formData.password);

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
                        Create Account
                    </motion.h2>
                    <motion.p
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.3}}
                        className="text-muted-foreground"
                    >
                        Start your journey with Nexus Smart Wallet
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
                        error={validationErrors.email}
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                            </svg>
                        }
                    />

                    <div className="space-y-2">
                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            variant="cyber"
                            placeholder="Create a strong password"
                            error={validationErrors.password}
                            leftIcon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                            }
                        />

                        {formData.password && (
                            <motion.div
                                initial={{opacity: 0, scale: 0.95}}
                                animate={{opacity: 1, scale: 1}}
                                className="space-y-2"
                            >
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">Strength:</span>
                                    <span className={cn(
                                        "font-semibold",
                                        passwordStrength.strength <= 40 ? "text-red-400" :
                                            passwordStrength.strength <= 60 ? "text-yellow-400" :
                                                passwordStrength.strength <= 80 ? "text-blue-400" : "text-green-400"
                                    )}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                    <div
                                        className={cn("h-2 rounded-full transition-all duration-300", passwordStrength.color)}
                                        style={{width: `${passwordStrength.strength}%`}}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <Input
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        variant="cyber"
                        placeholder="Confirm your password"
                        error={validationErrors.confirmPassword}
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
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
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <span>Already have an account?</span>
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="text-web3-primary hover:text-web3-primary/80 font-semibold transition-colors"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};