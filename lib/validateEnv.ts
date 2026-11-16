export function validateEnv() {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'TURNSTILE_SECRET_KEY',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  ];

  // Only require Cloudinary credentials when explicitly configured to use Cloudinary
  if ((process.env.STORAGE_DRIVER || 'local').trim().toLowerCase() === 'cloudinary') {
    required.push('CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET');
  }

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (process.env.JWT_SECRET!.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
}