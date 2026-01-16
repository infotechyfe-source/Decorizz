import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Auto-initialize default users on startup
async function initializeDefaultUsers() {
  try {
    const defaultUsers = [
      {
        email: 'admin@decorizz.com',
        password: 'Admin@123',
        name: 'Admin',
        role: 'admin',
      },
      {
        email: 'user@decorizz.com',
        password: 'User@123',
        name: 'Test User',
        role: 'user',
      },
    ];

    console.log('=== Initializing default users ===');

    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUsers = await kv.getByPrefix('user:');
        const userExists = existingUsers?.some((u: any) => u.email === userData.email);

        if (userExists) {
          console.log(`${userData.role} user already exists: ${userData.email}`);
          continue;
        }

        console.log(`Creating ${userData.role} user: ${userData.email}`);

        // Create user
        const { data, error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          user_metadata: { name: userData.name, role: userData.role },
          email_confirm: true,
        });

        if (error) {
          console.log(`Error creating ${userData.role}:`, error.message);
          continue;
        }

        // Store in KV
        await kv.set(`user:${data.user.id}`, {
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          createdAt: new Date().toISOString(),
        });

        console.log(`✓ ${userData.role} created: ${userData.email} / ${userData.password}`);
      } catch (err) {
        console.log(`Failed to create ${userData.role}:`, err);
      }
    }

    console.log('=== Initialization complete ===');
  } catch (error) {
    console.log('Failed to initialize users:', error);
  }
}

// Initialize gallery storage bucket
async function initializeGalleryBucket() {
  try {
    const bucketName = 'make-52d68140-gallery';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      console.log('Creating gallery bucket...');
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (error) {
        console.log('Error creating gallery bucket:', error);
      } else {
        console.log('✓ Gallery bucket created');
      }
    } else {
      console.log('Gallery bucket already exists');
    }
  } catch (error) {
    console.log('Failed to initialize gallery bucket:', error);
  }
}

// Initialize on startup
initializeDefaultUsers();
initializeGalleryBucket();

// Helper function to verify auth
async function verifyAuth(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) return null;

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
}

// Initialize default admin (call this endpoint to create default admin)
app.post('/make-server-52d68140/auth/init-admin', async (c) => {
  try {
    const defaultAdminEmail = 'admin@decorizz.com';
    const defaultAdminPassword = 'Admin@123';

    // Check if admin already exists
    const existingAdmin = await kv.getByPrefix('user:');
    const adminExists = existingAdmin?.some((u: any) => u.email === defaultAdminEmail);

    if (adminExists) {
      return c.json({ message: 'Admin user already exists', email: defaultAdminEmail });
    }

    // Create default admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: defaultAdminEmail,
      password: defaultAdminPassword,
      user_metadata: { name: 'Admin', role: 'admin' },
      email_confirm: true,
    });

    if (error) {
      console.log('Init admin error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store in KV
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: defaultAdminEmail,
      name: 'Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    return c.json({
      success: true,
      message: 'Default admin created successfully',
      credentials: {
        email: defaultAdminEmail,
        password: defaultAdminPassword
      }
    });
  } catch (error) {
    console.log('Init admin error:', error);
    return c.json({ error: 'Failed to initialize admin' }, 500);
  }
});

// Auth Routes
app.post('/make-server-52d68140/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'user' },
      email_confirm: true, // Auto-confirm since email server not configured
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: 'user',
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

app.post('/make-server-52d68140/auth/admin-signup', async (c) => {
  try {
    const { email, password, name, adminKey } = await c.req.json();

    // Simple admin key check (in production, use better validation)
    if (adminKey !== 'ADMIN_SECRET_2024') {
      return c.json({ error: 'Invalid admin key' }, 403);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      email_confirm: true,
    });

    if (error) {
      console.log('Admin signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Admin signup error:', error);
    return c.json({ error: 'Admin signup failed' }, 500);
  }
});

app.get('/make-server-52d68140/auth/user', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Try to get profile from KV store first
    let profile = await kv.get(`user:${user.id}`);

    // If not in KV, create from user metadata
    if (!profile) {
      console.log('Profile not found in KV, creating from user metadata:', user.user_metadata);
      profile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: user.user_metadata?.role || 'user',
        createdAt: new Date().toISOString(),
      };

      // Save to KV for next time
      await kv.set(`user:${user.id}`, profile);
    }

    return c.json({ user: profile });
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Admin: List Users
app.get('/make-server-52d68140/users', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const users = await kv.getByPrefix('user:');
    return c.json({ users: users || [] });
  } catch (error) {
    console.log('List users error:', error);
    return c.json({ error: 'Failed to list users' }, 500);
  }
});

// Products Routes
app.get('/make-server-52d68140/products', async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    return c.json({ products: products || [] });
  } catch (error) {
    console.log('Get products error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Best Sellers
app.get('/make-server-52d68140/best-sellers', async (c) => {
  try {
    const all = await kv.getByPrefix('product:') || [];
    const flagged = all.filter((p: any) => !!p.bestSeller);
    const pick = (flagged.length > 0 ? flagged : all).slice(0, 20);
    return c.json({ products: pick });
  } catch (error) {
    console.log('Get best sellers error:', error);
    return c.json({ error: 'Failed to fetch best sellers' }, 500);
  }
});

// Home Sections (generic)
const sectionFieldMap: Record<string, string> = {
  best: 'bestSeller',
  premium: 'premiumCollection',
  new: 'newArrival',
  budget: 'budgetFind',
};

app.get('/make-server-52d68140/home-section/:section', async (c) => {
  try {
    const section = c.req.param('section');
    const field = sectionFieldMap[section] || 'bestSeller';
    const all = await kv.getByPrefix('product:') || [];
    const filtered = all.filter((p: any) => !!p[field]).slice(0, 15);
    return c.json({ products: filtered });
  } catch (error) {
    console.log('Get home section error:', error);
    return c.json({ error: 'Failed to fetch home section' }, 500);
  }
});

app.put('/make-server-52d68140/home-section/:section/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const section = c.req.param('section');
    const id = c.req.param('id');
    const field = sectionFieldMap[section];
    if (!field) return c.json({ error: 'Invalid section' }, 400);
    const existing = await kv.get(`product:${id}`);
    if (!existing) return c.json({ error: 'Product not found' }, 404);
    const body = await c.req.json();
    const updated = { ...existing, [field]: !!body.flag, updatedAt: new Date().toISOString() };
    await kv.set(`product:${id}`, updated);
    return c.json({ success: true, product: updated });
  } catch (error) {
    console.log('Set home section flag error:', error);
    return c.json({ error: 'Failed to update home section flag' }, 500);
  }
});

app.put('/make-server-52d68140/best-sellers/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    const existing = await kv.get(`product:${id}`);
    if (!existing) return c.json({ error: 'Product not found' }, 404);
    const body = await c.req.json();
    const updated = { ...existing, bestSeller: !!body.bestSeller, updatedAt: new Date().toISOString() };
    await kv.set(`product:${id}`, updated);
    return c.json({ success: true, product: updated });
  } catch (error) {
    console.log('Set best seller error:', error);
    return c.json({ error: 'Failed to update product flag' }, 500);
  }
});

// Contact Messages Routes
app.get('/make-server-52d68140/contact-messages', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const contacts = await kv.getByPrefix('contact:');
    return c.json({ contacts: contacts || [] });
  } catch (error) {
    console.log('Get contacts error:', error);
    return c.json({ error: 'Failed to fetch contacts' }, 500);
  }
});

// FAQs Routes
app.get('/make-server-52d68140/faqs', async (c) => {
  try {
    const faqs = await kv.getByPrefix('faq:');
    // Sort by order then createdAt
    const list = (faqs || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    return c.json({ faqs: list });
  } catch (error) {
    console.log('Get FAQs error:', error);
    return c.json({ error: 'Failed to fetch FAQs' }, 500);
  }
});

app.post('/make-server-52d68140/faqs', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const payload = await c.req.json();
    const id = `${Date.now()}-${crypto.randomUUID()}`;
    const faq = {
      id,
      question: payload.question || '',
      answer: payload.answer || '',
      order: Number(payload.order || 0),
      createdAt: new Date().toISOString(),
    };
    await kv.set(`faq:${id}`, faq);
    return c.json({ success: true, faq });
  } catch (error) {
    console.log('Create FAQ error:', error);
    return c.json({ error: 'Failed to create FAQ' }, 500);
  }
});

app.put('/make-server-52d68140/faqs/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(`faq:${id}`);
    if (!existing) return c.json({ error: 'FAQ not found' }, 404);
    const updated = { ...existing, ...updates, order: Number(updates.order ?? existing.order), updatedAt: new Date().toISOString() };
    await kv.set(`faq:${id}`, updated);
    return c.json({ success: true, faq: updated });
  } catch (error) {
    console.log('Update FAQ error:', error);
    return c.json({ error: 'Failed to update FAQ' }, 500);
  }
});

app.delete('/make-server-52d68140/faqs/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    await kv.del(`faq:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete FAQ error:', error);
    return c.json({ error: 'Failed to delete FAQ' }, 500);
  }
});

app.post('/make-server-52d68140/contact-messages', async (c) => {
  try {
    const payload = await c.req.json();
    const id = `${Date.now()}-${crypto.randomUUID()}`;
    const contact = {
      id,
      name: payload.name || 'Anonymous',
      email: payload.email || '',
      phone: payload.phone || '',
      subject: payload.subject || '',
      message: payload.message || '',
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    await kv.set(`contact:${id}`, contact);
    return c.json({ success: true, contact });
  } catch (error) {
    console.log('Create contact error:', error);
    return c.json({ error: 'Failed to submit message' }, 500);
  }
});

app.put('/make-server-52d68140/contact-messages/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(`contact:${id}`);
    if (!existing) return c.json({ error: 'Contact not found' }, 404);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`contact:${id}`, updated);
    return c.json({ success: true, contact: updated });
  } catch (error) {
    console.log('Update contact error:', error);
    return c.json({ error: 'Failed to update contact' }, 500);
  }
});

app.delete('/make-server-52d68140/contact-messages/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    await kv.del(`contact:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete contact error:', error);
    return c.json({ error: 'Failed to delete contact' }, 500);
  }
});

app.get('/make-server-52d68140/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const product = await kv.get(`product:${id}`);

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({ product });
  } catch (error) {
    console.log('Get product error:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});


// Cloudinary credentials (read from environment)
const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME') ?? '';
const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY') ?? '';
const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET') ?? '';

// Helper function to generate Cloudinary signature
function generateCloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');

  // Create SHA-1 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString + apiSecret);

  // Using Web Crypto API for SHA-1
  return '';  // Will use timestamp-based unsigned upload instead
}

// Product Image Upload - Now using Cloudinary
app.post('/make-server-52d68140/products/upload', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) return c.json({ error: 'No file provided' }, 400);

    const fileExtension = file.name.split('.').pop();
    const fileName = `products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from('make-52d68140-gallery')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.log('Supabase Storage upload error:', error);
      return c.json({ error: error.message || 'Upload failed' }, 500);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('make-52d68140-gallery')
      .getPublicUrl(fileName);

    return c.json({ success: true, url: publicUrl });
  } catch (error) {
    console.log('Upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});
app.post('/make-server-52d68140/products', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const productData = await c.req.json();
    const productId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const product = {
      id: productId,
      ...productData,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`product:${productId}`, product);

    return c.json({ success: true, product });
  } catch (error) {
    console.log('Create product error:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

app.put('/make-server-52d68140/products/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    const updates = await c.req.json();

    const existing = await kv.get(`product:${id}`);
    if (!existing) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`product:${id}`, updated);

    return c.json({ success: true, product: updated });
  } catch (error) {
    console.log('Update product error:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

app.delete('/make-server-52d68140/products/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    await kv.del(`product:${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete product error:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// Cart Routes
app.get('/make-server-52d68140/cart', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const cart = await kv.get(`cart:${user.id}`) || { items: [] };
    return c.json({ cart });
  } catch (error) {
    console.log('Get cart error:', error);
    return c.json({ error: 'Failed to fetch cart' }, 500);
  }
});

app.post('/make-server-52d68140/cart', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { productId, quantity, size, color, format, frameColor, price, subsection, name, image } = await c.req.json();

    const cart = await kv.get(`cart:${user.id}`) || { items: [] };
    const existingIndex = cart.items.findIndex(
      (item: any) => item.productId === productId && item.size === size && item.color === color && item.format === format
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, size, color, format, frameColor, price, subsection, name, image });
    }

    await kv.set(`cart:${user.id}`, cart);

    return c.json({ success: true, cart });
  } catch (error) {
    console.log('Add to cart error:', error);
    return c.json({ error: 'Failed to add to cart' }, 500);
  }
});

app.delete('/make-server-52d68140/cart/:productId', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const productId = c.req.param('productId');
    const cart = await kv.get(`cart:${user.id}`) || { items: [] };

    cart.items = cart.items.filter((item: any) => item.productId !== productId);

    await kv.set(`cart:${user.id}`, cart);

    return c.json({ success: true, cart });
  } catch (error) {
    console.log('Remove from cart error:', error);
    return c.json({ error: 'Failed to remove from cart' }, 500);
  }
});

// Wishlist Routes
app.get('/make-server-52d68140/wishlist', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const wishlist = await kv.get(`wishlist:${user.id}`) || { items: [] };
    return c.json({ wishlist });
  } catch (error) {
    console.log('Get wishlist error:', error);
    return c.json({ error: 'Failed to fetch wishlist' }, 500);
  }
});

app.post('/make-server-52d68140/wishlist', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { productId } = await c.req.json();

    const wishlist = await kv.get(`wishlist:${user.id}`) || { items: [] };

    // Toggle: add if not exists, remove if exists
    const index = wishlist.items.indexOf(productId);
    let action: 'added' | 'removed';

    if (index === -1) {
      wishlist.items.push(productId);
      action = 'added';
    } else {
      wishlist.items.splice(index, 1);
      action = 'removed';
    }

    await kv.set(`wishlist:${user.id}`, wishlist);

    return c.json({ success: true, wishlist, action });
  } catch (error) {
    console.log('Toggle wishlist error:', error);
    return c.json({ error: 'Failed to update wishlist' }, 500);
  }
});

// Delete from wishlist
app.delete('/make-server-52d68140/wishlist/:productId', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const productId = c.req.param('productId');
    const wishlist = await kv.get(`wishlist:${user.id}`) || { items: [] };

    wishlist.items = wishlist.items.filter((id: string) => id !== productId);
    await kv.set(`wishlist:${user.id}`, wishlist);

    return c.json({ success: true, wishlist });
  } catch (error) {
    console.log('Remove from wishlist error:', error);
    return c.json({ error: 'Failed to remove from wishlist' }, 500);
  }
});


// Email notification function
async function sendOrderEmail(orderData: any, userEmail: string) {
  try {
    const emailContent = {
      from: 'Decorizz Orders <onboarding@resend.dev>',
      to: 'adhirasudhir@gmail.com', // Send to admin email
      reply_to: userEmail, // Customer can reply directly
      subject: `🎉 New Order Received - ${orderData.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 New Order Received!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">Order Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 10px 0;"><strong>Order ID:</strong> ${orderData.id}</p>
              <p style="margin: 10px 0;"><strong>Customer Email:</strong> ${userEmail}</p>
              <p style="margin: 10px 0;"><strong>Total Amount:</strong> &#8377;${orderData.total?.toFixed(2)}</p>
              <p style="margin: 10px 0;"><strong>Payment Status:</strong> <span style="color: ${orderData.paymentStatus === 'completed' ? '#10b981' : '#f59e0b'}; text-transform: capitalize;">${orderData.paymentStatus}</span></p>
              <p style="margin: 10px 0;"><strong>Order Date:</strong> ${new Date(orderData.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>

            <h3 style="color: #1f2937;">Shipping Address</h3>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>${orderData.shippingAddress?.name || 'N/A'}</strong></p>
              <p style="margin: 5px 0;">${orderData.shippingAddress?.phone || 'N/A'}</p>
              <p style="margin: 5px 0;">${orderData.shippingAddress?.address || 'N/A'}</p>
              <p style="margin: 5px 0;">${orderData.shippingAddress?.city || 'N/A'}, ${orderData.shippingAddress?.state || 'N/A'} - ${orderData.shippingAddress?.zipCode || 'N/A'}</p>
            </div>

            <h3 style="color: #1f2937;">Order Items</h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              ${orderData.items?.map((item: any) => `
                <div style="border-bottom: 1px solid #e5e7eb; padding: 15px 0;">
                  <p style="margin: 5px 0;"><strong>${item.name || 'Product'}</strong></p>
                  <p style="margin: 5px 0; color: #6b7280;">Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</p>
                  <p style="margin: 5px 0;">Quantity: ${item.quantity} &times; &#8377;${item.price} = &#8377;${(item.quantity * item.price).toFixed(2)}</p>
                </div>
              `).join('') || '<p>No items</p>'}
            </div>

            
          </div>

          <div style="background: #1f2937; padding: 20px; text-align: center; color: white;">
            <p style="margin: 0;">&copy; 2024 Decorizz. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Log email content
    console.log('📧 Sending email notification to:', emailContent.to);

    // Send email via Resend
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailContent)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Resend API error:', result);
        return false;
      }

      console.log('✅ Email sent successfully:', result.id);
      return true;
    } catch (emailError) {
      console.error('Failed to send email via Resend:', emailError);
      return false;
    }
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
// Orders Routes
app.post('/make-server-52d68140/orders', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orderData = await c.req.json();
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = {
      id: orderId,
      userId: user.id,
      ...orderData,
      status: orderData.status || 'pending',
      paymentStatus: orderData.paymentStatus || 'pending',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`order:${orderId}`, order);

    // Clear cart
    await kv.set(`cart:${user.id}`, { items: [] });

    // Send notification to user
    await createNotification(
      user.id,
      'order_placed',
      'Order Placed Successfully',
      `Your order ${orderId} has been placed successfully. Total: ₹${orderData.total}`,
      { orderId, total: orderData.total }
    );

    // Send notification to all admins
    const allUsers = await kv.getByPrefix('user:');
    const admins = allUsers?.filter((u: any) => u.role === 'admin');

    for (const admin of admins || []) {
      await createNotification(
        admin.id,
        'new_order',
        'New Order Received',
        `New order ${orderId} from customer. Total: ₹${orderData.total}`,
        { orderId, userId: user.id, total: orderData.total }
      );
    }

    // Send email notification
    const userProfile = await kv.get(`user:${user.id}`);
    await sendOrderEmail(order, userProfile?.email || 'customer@example.com');

    return c.json({ success: true, order });
  } catch (error) {
    console.log('Create order error:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

app.get('/make-server-52d68140/orders', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allOrders = await kv.getByPrefix('order:');
    const userProfile = await kv.get(`user:${user.id}`);

    let orders;
    if (userProfile?.role === 'admin') {
      orders = allOrders;
    } else {
      orders = allOrders.filter((order: any) => order.userId === user.id);
    }

    return c.json({ orders: orders || [] });
  } catch (error) {
    console.log('Get orders error:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.put('/make-server-52d68140/orders/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    const updates = await c.req.json();

    const existing = await kv.get(`order:${id}`);
    if (!existing) {
      return c.json({ error: 'Order not found' }, 404);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`order:${id}`, updated);

    // Send notification to customer if status changed
    if (updates.status && updates.status !== existing.status) {
      const statusMessages: any = {
        'confirmed': 'Your order has been confirmed and is being prepared.',
        'processing': 'Your order is being processed.',
        'shipped': 'Your order has been shipped and is on its way!',
        'delivered': 'Your order has been delivered. Thank you for shopping with us!',
        'cancelled': 'Your order has been cancelled.',
      };

      if (statusMessages[updates.status]) {
        await createNotification(
          existing.userId,
          'order_status',
          `Order ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`,
          `${statusMessages[updates.status]} Order ID: ${id}`,
          { orderId: id, status: updates.status }
        );
      }
    }

    return c.json({ success: true, order: updated });
  } catch (error) {
    console.log('Update order error:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

// Testimonials Routes
app.get('/make-server-52d68140/testimonials', async (c) => {
  try {
    const testimonials = await kv.getByPrefix('testimonial:');
    return c.json({ testimonials: testimonials || [] });
  } catch (error) {
    console.log('Get testimonials error:', error);
    return c.json({ error: 'Failed to fetch testimonials' }, 500);
  }
});

app.post('/make-server-52d68140/testimonials', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const testimonialData = await c.req.json();
    const testimonialId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const testimonial = {
      id: testimonialId,
      ...testimonialData,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`testimonial:${testimonialId}`, testimonial);

    return c.json({ success: true, testimonial });
  } catch (error) {
    console.log('Create testimonial error:', error);
    return c.json({ error: 'Failed to create testimonial' }, 500);
  }
});

// Gallery Routes
app.get('/make-server-52d68140/gallery', async (c) => {
  try {
    const galleryItems = await kv.getByPrefix('gallery:');

    // Images are now stored on Cloudinary, so just return them directly
    return c.json({ galleryItems: galleryItems || [] });
  } catch (error) {
    console.log('Get gallery error:', error);
    return c.json({ error: 'Failed to fetch gallery' }, 500);
  }
});

app.post('/make-server-52d68140/gallery', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { title, description, category, year, imageUrl, publicId } = body;

    if (!title || !category || !year || !imageUrl) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const galleryId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const galleryItem = {
      id: galleryId,
      title,
      description: description || '',
      category,
      year: parseInt(year),
      image: imageUrl,
      publicId: publicId || '',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`gallery:${galleryId}`, galleryItem);

    return c.json({ success: true, galleryItem });
  } catch (error) {
    console.log('Create gallery item error:', error);
    return c.json({ error: 'Failed to create gallery item' }, 500);
  }
});

// Gallery Update Endpoint
app.put('/make-server-52d68140/gallery/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    const { title, description, category, year, image, thumbUrl, productId } = body;

    // Get existing item
    const existingItem = await kv.get(`gallery:${id}`);
    if (!existingItem) {
      return c.json({ error: 'Gallery item not found' }, 404);
    }

    // Update item with new data
    const updatedItem = {
      ...existingItem,
      title: title ?? existingItem.title,
      description: description ?? existingItem.description,
      category: category ?? existingItem.category,
      year: year ?? existingItem.year,
      productId: productId ?? existingItem.productId,
      updatedAt: new Date().toISOString(),
    };

    // If new image URL is provided, update it
    if (image) {
      updatedItem.image = image;
      updatedItem.thumbUrl = thumbUrl || image;
    }

    await kv.set(`gallery:${id}`, updatedItem);

    return c.json({ success: true, galleryItem: updatedItem });
  } catch (error) {
    console.log('Update gallery item error:', error);
    return c.json({ error: 'Failed to update gallery item' }, 500);
  }
});

app.delete('/make-server-52d68140/gallery/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    const galleryItem = await kv.get(`gallery:${id}`);

    if (!galleryItem) {
      return c.json({ error: 'Gallery item not found' }, 404);
    }

    // Optionally delete from Cloudinary (if publicId is stored)
    // This is optional since Cloudinary has its own management interface

    // Delete from KV
    await kv.del(`gallery:${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete gallery error:', error);
    return c.json({ error: 'Failed to delete photo' }, 500);
  }
});

// Videos Routes
app.get('/make-server-52d68140/videos', async (c) => {
  try {
    const videos = await kv.getByPrefix('video:');
    // sort by 'order' ascending if present
    const sorted = (videos || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    return c.json({ videos: sorted });
  } catch (error) {
    console.log('Get videos error:', error);
    return c.json({ error: 'Failed to fetch videos' }, 500);
  }
});

app.post('/make-server-52d68140/videos', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const body = await c.req.json();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
    const video = {
      id,
      title: body.title || '',
      url: body.url || '',
      caption: body.caption || '',
      thumbnail: body.thumbnail || '',
      order: body.order || 0,
      productId: body.productId || null,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`video:${id}`, video);
    return c.json({ success: true, video });
  } catch (error) {
    console.log('Create video error:', error);
    return c.json({ error: 'Failed to create video' }, 500);
  }
});

app.put('/make-server-52d68140/videos/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const id = c.req.param('id');
    const existing = await kv.get(`video:${id}`);
    if (!existing) return c.json({ error: 'Video not found' }, 404);
    const updates = await c.req.json();
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`video:${id}`, updated);
    return c.json({ success: true, video: updated });
  } catch (error) {
    console.log('Update video error:', error);
    return c.json({ error: 'Failed to update video' }, 500);
  }
});

app.delete('/make-server-52d68140/videos/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);
    const id = c.req.param('id');
    await kv.del(`video:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete video error:', error);
    return c.json({ error: 'Failed to delete video' }, 500);
  }
});

// Video Likes
app.get('/make-server-52d68140/videos/:id/likes', async (c) => {
  try {
    const id = c.req.param('id');
    const likeData = await kv.get(`video_likes:${id}`) || { users: [] };
    return c.json({ count: (likeData.users || []).length });
  } catch (error) {
    console.log('Get video likes error:', error);
    return c.json({ count: 0 });
  }
});

app.post('/make-server-52d68140/videos/:id/like', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const likeData = await kv.get(`video_likes:${id}`) || { users: [] };
    const users: string[] = likeData.users || [];
    const idx = users.indexOf(user.id);
    if (idx >= 0) users.splice(idx, 1); else users.push(user.id);
    await kv.set(`video_likes:${id}`, { users });
    return c.json({ count: users.length });
  } catch (error) {
    console.log('Toggle video like error:', error);
    return c.json({ error: 'Failed', count: 0 }, 500);
  }
});

// Video/Thumbnail Upload (Cloudinary)
app.post('/make-server-52d68140/videos/thumbnail/upload', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const raw = await c.req.text();
    let body: any = {};
    try { body = JSON.parse(raw); } catch {}
    const { image, fileName } = body;
    if (!image || !fileName) return c.json({ error: 'Image and fileName are required' }, 400);

    const publicId = `videos/thumbs/${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`;
    const timestamp = Math.floor(Date.now()/1000).toString();
    const paramsToSign: Record<string,string> = { public_id: publicId, timestamp };
    const sortedKeys = Object.keys(paramsToSign).sort();
    const signatureString = sortedKeys.map(k => `${k}=${(paramsToSign as any)[k]}`).join('&') + CLOUDINARY_API_SECRET;
    const encoder = new TextEncoder();
    const dataToHash = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', dataToHash);
    const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');

    const form = new FormData();
    form.append('file', image);
    form.append('public_id', publicId);
    form.append('timestamp', timestamp);
    form.append('api_key', CLOUDINARY_API_KEY);
    form.append('signature', signature);

    const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
    const cd = await resp.json();
    if (!resp.ok) return c.json({ error: cd.error?.message || 'Upload failed' }, 400);
    return c.json({ success: true, url: cd.secure_url });
  } catch (error) {
    console.log('Thumbnail upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

app.post('/make-server-52d68140/videos/upload', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const raw = await c.req.text();
    let body: any = {};
    try { body = JSON.parse(raw); } catch {}
    const { video, fileName } = body;
    if (!video || !fileName) return c.json({ error: 'Video and fileName are required' }, 400);

    const publicId = `videos/${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`;
    const timestamp = Math.floor(Date.now()/1000).toString();
    const paramsToSign: Record<string,string> = { public_id: publicId, timestamp };
    const sortedKeys = Object.keys(paramsToSign).sort();
    const signatureString = sortedKeys.map(k => `${k}=${(paramsToSign as any)[k]}`).join('&') + CLOUDINARY_API_SECRET;
    const encoder = new TextEncoder();
    const dataToHash = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', dataToHash);
    const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');

    const form = new FormData();
    form.append('file', video);
    form.append('public_id', publicId);
    form.append('timestamp', timestamp);
    form.append('api_key', CLOUDINARY_API_KEY);
    form.append('signature', signature);

    const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, { method: 'POST', body: form });
    const cd = await resp.json();
    if (!resp.ok) return c.json({ error: cd.error?.message || 'Upload failed' }, 400);
    return c.json({ success: true, url: cd.secure_url });
  } catch (error) {
    console.log('Video upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Stats Route for Admin
app.get('/make-server-52d68140/stats', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const orders = await kv.getByPrefix('order:');
    const products = await kv.getByPrefix('product:');
    const users = await kv.getByPrefix('user:');

    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const pendingOrders = orders.filter((order: any) => order.status === 'pending').length;

    return c.json({
      totalOrders: orders.length,
      totalRevenue,
      totalUsers: users.length,
      totalProducts: products.length,
      pendingDeliveries: pendingOrders,
    });
  } catch (error) {
    console.log('Get stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Password Reset Routes
app.post('/make-server-52d68140/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    // Check if user exists
    const users = await kv.getByPrefix('user:');
    const user = users?.find((u: any) => u.email === email);

    if (!user) {
      // Return success anyway to prevent email enumeration
      return c.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    // Store reset token
    await kv.set(`reset:${resetToken}`, {
      userId: user.id,
      email: user.email,
      expiry: resetExpiry,
      used: false,
    });

    // Also store by email for lookup
    await kv.set(`reset-email:${email}`, resetToken);

    console.log(`Password reset requested for ${email}. Token: ${resetToken}`);

    return c.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
      // In production, send email. For demo, return token
      resetToken,
    });
  } catch (error) {
    console.log('Forgot password error:', error);
    return c.json({ error: 'Failed to process password reset request' }, 500);
  }
});

app.post('/make-server-52d68140/auth/verify-reset-token', async (c) => {
  try {
    const { token } = await c.req.json();

    const resetData = await kv.get(`reset:${token}`);

    if (!resetData) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    if (resetData.used) {
      return c.json({ error: 'Reset token has already been used' }, 400);
    }

    if (new Date(resetData.expiry) < new Date()) {
      return c.json({ error: 'Reset token has expired' }, 400);
    }

    return c.json({ success: true, email: resetData.email });
  } catch (error) {
    console.log('Verify reset token error:', error);
    return c.json({ error: 'Failed to verify reset token' }, 500);
  }
});

app.post('/make-server-52d68140/auth/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json();

    const resetData = await kv.get(`reset:${token}`);

    if (!resetData || resetData.used) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    if (new Date(resetData.expiry) < new Date()) {
      return c.json({ error: 'Reset token has expired' }, 400);
    }

    // Update password in Supabase
    const { error } = await supabase.auth.admin.updateUserById(
      resetData.userId,
      { password: newPassword }
    );

    if (error) {
      console.log('Password update error:', error);
      return c.json({ error: 'Failed to update password' }, 400);
    }

    // Mark token as used
    await kv.set(`reset:${token}`, { ...resetData, used: true });

    // Clean up email reference
    await kv.del(`reset-email:${resetData.email}`);

    console.log(`Password reset successful for ${resetData.email}`);

    return c.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.log('Reset password error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// Notification Routes
app.get('/make-server-52d68140/notifications', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    const notifications = await kv.getByPrefix(`notification:${user.id}:`);

    // Sort by timestamp descending
    const sorted = (notifications || []).sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({ notifications: sorted });
  } catch (error) {
    console.log('Get notifications error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

app.post('/make-server-52d68140/notifications/:id/read', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const notification = await kv.get(`notification:${user.id}:${id}`);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    await kv.set(`notification:${user.id}:${id}`, { ...notification, read: true });

    return c.json({ success: true });
  } catch (error) {
    console.log('Mark notification read error:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

app.delete('/make-server-52d68140/notifications/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    await kv.del(`notification:${user.id}:${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete notification error:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

// Helper function to create notification
async function createNotification(userId: string, type: string, title: string, message: string, data?: any) {
  const notificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await kv.set(`notification:${userId}:${notificationId}`, {
    id: notificationId,
    userId,
    type,
    title,
    message,
    data,
    read: false,
    timestamp: new Date().toISOString(),
  });

  console.log(`Notification created for user ${userId}: ${title}`);
}



// Gallery Upload - Now using Cloudinary
app.post("/make-server-52d68140/gallery/upload", async (c) => {
  try {
    // AUTH CHECK
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    // IMPORTANT FIX → read raw text instead of JSON
    const raw = await c.req.text();

    let body;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      console.log("JSON parse error", err);
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { image, fileName, title, description, category, year, mimeType } = body;

    if (!image || !fileName)
      return c.json({ error: "Image and fileName are required" }, 400);

    // Generate unique public_id for Cloudinary
    const publicId = `gallery/${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Create signature for signed upload
    const paramsToSign = {
      public_id: publicId,
      timestamp: timestamp,
    };

    const sortedKeys = Object.keys(paramsToSign).sort();
    const signatureString = sortedKeys.map(key => `${key}=${(paramsToSign as any)[key]}`).join('&') + CLOUDINARY_API_SECRET;

    // Create SHA-1 hash using SubtleCrypto
    const encoder = new TextEncoder();
    const dataToHash = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', dataToHash);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', image); // image is already a data URI
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('api_key', CLOUDINARY_API_KEY);
    cloudinaryFormData.append('signature', signature);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    const cloudinaryData = await cloudinaryResponse.json();

    if (!cloudinaryResponse.ok) {
      console.log("Cloudinary upload error:", cloudinaryData);
      return c.json({ error: cloudinaryData.error?.message || "Upload failed" }, 400);
    }

    // SAVE IN KV
    const galleryId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const galleryItem = {
      id: galleryId,
      title,
      description: description || "",
      category,
      year,
      image: cloudinaryData.secure_url,
      filePath: publicId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`gallery:${galleryId}`, galleryItem);

    console.log('Cloudinary gallery upload success:', cloudinaryData.secure_url);
    return c.json({ success: true, galleryItem });
  } catch (e) {
    console.log("Cloudinary upload error:", e);
    return c.json({ error: "Upload failed" }, 500);
  }
});

app.delete('/make-server-52d68140/gallery/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== "admin")
      return c.json({ error: "Admin access required" }, 403);

    const id = c.req.param("id");
    const item = await kv.get(`gallery:${id}`);

    if (!item) return c.json({ error: "Gallery item not found" }, 404);

    await supabase.storage
      .from("make-52d68140-gallery")
      .remove([item.filePath]);

    await kv.del(`gallery:${id}`);

    return c.json({ success: true });
  } catch (error) {
    console.log("Gallery delete error:", error);
    return c.json({ error: "Failed to delete" }, 500);
  }
});




// Payment Routes
app.get('/make-server-52d68140/payments', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const payments = await kv.getByPrefix('payment:');
    return c.json({ payments: payments || [] });
  } catch (error) {
    console.log('Get payments error:', error);
    return c.json({ error: 'Failed to fetch payments' }, 500);
  }
});

app.post('/make-server-52d68140/payments', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const paymentData = await c.req.json();
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const payment = {
      id: paymentId,
      userId: user.id,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod || 'razorpay',
      paymentId: paymentData.paymentId || '',
      paymentSignature: paymentData.paymentSignature || '',
      status: paymentData.status || 'pending',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`payment:${paymentId}`, payment);

    if (paymentData.orderId) {
      const order = await kv.get(`order:${paymentData.orderId}`);
      if (order) {
        order.paymentStatus = payment.status;
        order.paymentId = paymentId;
        await kv.set(`order:${paymentData.orderId}`, order);
      }
    }

    return c.json({ success: true, payment });
  } catch (error) {
    console.log('Create payment error:', error);
    return c.json({ error: 'Failed to create payment' }, 500);
  }
});

app.put('/make-server-52d68140/payments/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const id = c.req.param('id');
    const payment = await kv.get(`payment:${id}`);

    if (!payment) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    const updates = await c.req.json();
    const updatedPayment = { ...payment, ...updates, updatedAt: new Date().toISOString() };

    await kv.set(`payment:${id}`, updatedPayment);

    if (updates.status && payment.orderId) {
      const order = await kv.get(`order:${payment.orderId}`);
      if (order) {
        order.paymentStatus = updates.status;
        await kv.set(`order:${payment.orderId}`, order);
      }
    }

    return c.json({ success: true, payment: updatedPayment });
  } catch (error) {
    console.log('Update payment error:', error);
    return c.json({ error: 'Failed to update payment' }, 500);
  }
});

// Offers Routes (Postgres)
app.get('/make-server-52d68140/offers', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const { data: offers, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ offers });
  } catch (error) {
    console.log('Get offers error:', error);
    return c.json({ error: 'Failed to fetch offers', details: (error as Error).message }, 500);
  }
});

app.get('/make-server-52d68140/offers/active', async (c) => {
  try {
    const { data: offer, error } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return c.json({ offer });
  } catch (error) {
    console.log('Get active offer error:', error);
    return c.json({ error: 'Failed to fetch active offer' }, 500);
  }
});

app.post('/make-server-52d68140/offers/verify-coupon', async (c) => {
  try {
    const { code, cartTotal } = await c.req.json();
    if (!code) return c.json({ error: 'Coupon code required' }, 400);

    const { data: offer, error } = await supabase
      .from('offers')
      .select('*')
      .eq('coupon_code', code)
      .eq('is_active', true)
      .single();

    if (error || !offer) {
      return c.json({ error: 'Invalid or expired coupon' }, 404);
    }

    if (offer.min_order_amount && cartTotal < offer.min_order_amount) {
      return c.json({ error: `Minimum order of ₹${offer.min_order_amount} required` }, 400);
    }

    return c.json({ success: true, offer });
  } catch (error) {
    console.log('Verify coupon error:', error);
    return c.json({ error: 'Failed to verify coupon' }, 500);
  }
});

app.post('/make-server-52d68140/offers', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const payload = await c.req.json();
    const { data, error } = await supabase
      .from('offers')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return c.json({ success: true, offer: data });
  } catch (error) {
    console.log('Create offer error:', error);
    return c.json({ error: 'Failed to create offer', details: (error as Error).message }, 500);
  }
});

app.put('/make-server-52d68140/offers/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const { data, error } = await supabase
      .from('offers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return c.json({ success: true, offer: data });
  } catch (error) {
    console.log('Update offer error:', error);
    return c.json({ error: 'Failed to update offer', details: (error as Error).message }, 500);
  }
});

app.delete('/make-server-52d68140/offers/:id', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'admin') return c.json({ error: 'Admin access required' }, 403);

    const id = c.req.param('id');
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete offer error:', error);
    return c.json({ error: 'Failed to delete offer', details: (error as Error).message }, 500);
  }
});

// Cloudinary Signature Endpoint - for secure uploads from frontend
app.post('/make-server-52d68140/cloudinary-signature', async (c) => {
  try {
    const user = await verifyAuth(c.req.raw);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const { public_id, timestamp, folder, format } = body;

    if (!timestamp) {
      return c.json({ error: 'Timestamp is required' }, 400);
    }

    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
    if (!apiSecret) {
      console.error('CLOUDINARY_API_SECRET not configured');
      return c.json({ error: 'Cloudinary not configured' }, 500);
    }

    // Build params to sign - must include ALL params sent to Cloudinary
    const paramsToSign: Record<string, string> = { timestamp };
    if (folder) paramsToSign.folder = folder;
    if (format) paramsToSign.format = format;
    if (public_id) paramsToSign.public_id = public_id;

    // Generate signature
    const sortedKeys = Object.keys(paramsToSign).sort();
    const signatureString = sortedKeys.map(k => `${k}=${paramsToSign[k]}`).join('&') + apiSecret;
    
    const encoder = new TextEncoder();
    const dataToHash = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', dataToHash);
    const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return c.json({ 
      signature,
      api_key: Deno.env.get('CLOUDINARY_API_KEY') || '393724131116165',
      cloud_name: Deno.env.get('CLOUDINARY_CLOUD_NAME') || 'dxpabpzkf'
    });
  } catch (error) {
    console.log('Cloudinary signature error:', error);
    return c.json({ error: 'Failed to generate signature' }, 500);
  }
});

Deno.serve(app.fetch);
