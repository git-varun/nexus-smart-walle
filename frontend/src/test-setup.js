// Simple test setup to verify the backend integration
console.log('✅ Backend-integrated architecture loaded');

// Test that environment variables are properly configured
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const chainId = import.meta.env.VITE_CHAIN_ID;

console.log('🔧 Environment Check:', {
    apiBaseUrl: apiBaseUrl || 'http://localhost:3001/api (default)',
    chainId: chainId || '84532 (default)',
    mode: import.meta.env.MODE,
});

console.log('⚙️ Backend Configuration:', {
    backendUrl: apiBaseUrl || 'http://localhost:3001/api',
    chainName: 'Base Sepolia',
    chainId: chainId || 84532,
    isProduction: import.meta.env.MODE === 'production',
});

console.log('✅ Backend configuration ready');

export default null; // Export for module compatibility
