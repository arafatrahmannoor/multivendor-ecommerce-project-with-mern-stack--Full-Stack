/* eslint-env node */
/* global process */
import bcrypt from 'bcrypt';
import User from '../model/user.js';

/**
 * Ensures a predefined admin user (from environment variables) exists.
 * Creates or updates the admin user safely without exposing credentials in logs.
 */
async function ensureAdmin() {
  const name = process.env.ADMIN_NAME || 'Admin';
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('[ensureAdmin] ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin bootstrap.');
    return;
  }

  // Basic email sanity check
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.warn('[ensureAdmin] ADMIN_EMAIL appears invalid. Skipping admin bootstrap.');
    return;
  }

  try {
    let user = await User.findOne({ email });
    const hashedNeedsUpdate = async (existingHash) => {
      try { return !(await bcrypt.compare(password, existingHash)); } catch { return true; }
    };

    if (!user) {
      const hash = await bcrypt.hash(password, 10);
      user = new User({ name, email, password: hash, role: 'admin', passwordHistory: [{ hash }] });
      await user.save();
      console.log(`[ensureAdmin] Admin user created: ${email}`);
      return;
    }

    let updated = false;
    if (user.role !== 'admin') {
      user.role = 'admin';
      updated = true;
    }

    if (await hashedNeedsUpdate(user.password)) {
      const newHash = await bcrypt.hash(password, 10);
      // Maintain password history (limit last 5 to avoid unbounded growth)
      user.passwordHistory = user.passwordHistory || [];
      user.passwordHistory.push({ hash: newHash });
      if (user.passwordHistory.length > 5) {
        user.passwordHistory = user.passwordHistory.slice(-5);
      }
      user.password = newHash;
      user.passwordChangedAt = new Date();
      updated = true;
    }

    if (updated) {
      await user.save();
      console.log('[ensureAdmin] Admin user updated.');
    } else {
      console.log('[ensureAdmin] Admin user already up-to-date.');
    }
  } catch (err) {
    console.error('[ensureAdmin] Failed to ensure admin user:', err.message);
  }
}

export default ensureAdmin;
