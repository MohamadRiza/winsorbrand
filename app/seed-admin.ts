import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
});

async function seedAdmin() {
  const { connectDB } = await import('../lib/db');
  const Admin = (await import('../lib/models/Admin')).default;

  await connectDB();

  // DELETE existing admin if exists
  await Admin.deleteMany({ username: 'admin' });

  // CREATE fresh admin
  const admin = await Admin.create({
    username: 'admin',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
  });

  console.log('✅ NEW ADMIN CREATED');
  console.log(admin);
}

seedAdmin()
  .catch(console.error)
  .finally(() => process.exit(0));