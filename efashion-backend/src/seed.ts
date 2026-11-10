import 'dotenv/config';
import * as dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {}
import './config/init';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { initDB } from './database/init';
import AdminModel from './database/models/admin';
import BrandModel from './database/models/brand';
import CategoryModel from './database/models/category';
import ProductModel from './database/models/product';
import CollectionModel from './database/models/collection';

async function seed() {
  console.log('🌱 Starting database seeding...');
  await initDB();

  // 1. Clear old data
  console.log('🧹 Clearing old collections...');
  await Promise.all([
    AdminModel.deleteMany({}),
    BrandModel.deleteMany({}),
    CategoryModel.deleteMany({}),
    ProductModel.deleteMany({}),
    CollectionModel.deleteMany({}),
  ]);

  // 2. Create Admin (Manager)
  console.log('👤 Creating Super Admin / Manager...');
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await AdminModel.create({
    name: 'Super Admin',
    email: 'admin@efashion.com',
    password: hashedPassword,
    role: 'manager',
    phone: '0912345678',
    address: 'Hanoi, Vietnam',
  });
  console.log('✅ Admin created: email: admin@efashion.com | password: Admin@123');

  // 3. Create Brands
  console.log('🏷️ Creating Brands...');
  const brands = await BrandModel.create([
    {
      name: 'Nike',
      description: 'Just Do It. Leading global sports and streetwear brand.',
      logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      link: 'https://nike.com',
    },
    {
      name: 'Adidas',
      description: 'Impossible is Nothing. Iconic sportswear and casual fashion.',
      logo: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=400',
      link: 'https://adidas.com',
    },
    {
      name: 'Zara',
      description: 'Trendy, fast-fashion urban collections for men and women.',
      logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      link: 'https://zara.com',
    },
    {
      name: 'H&M',
      description: 'Sustainable, affordable, and everyday fashion essentials.',
      logo: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400',
      link: 'https://hm.com',
    },
  ]);

  // 4. Create Categories
  console.log('📂 Creating Categories...');
  const categories = await CategoryModel.create([
    {
      name: 'T-Shirts & Tops',
      description: 'Comfortable everyday casual t-shirts and polo shirts.',
      imageURL: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600',
      gender: 1, // Men
      addedBy: admin._id,
    },
    {
      name: 'Hoodies & Jackets',
      description: 'Warm and stylish outerwear for all seasons.',
      imageURL: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600',
      gender: 1,
      addedBy: admin._id,
    },
    {
      name: 'Dresses & Skirts',
      description: 'Elegant evening dresses and casual skirts.',
      imageURL: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
      gender: 2, // Women
      addedBy: admin._id,
    },
    {
      name: 'Pants & Jeans',
      description: 'Modern fit denim jeans, chinos and trousers.',
      imageURL: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600',
      gender: 1,
      addedBy: admin._id,
    },
    {
      name: 'Sneakers & Shoes',
      description: 'Performance runners and lifestyle sneakers.',
      imageURL: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
      gender: 1,
      addedBy: admin._id,
    },
  ]);

  // 5. Create Products
  console.log('👕 Creating Products...');
  await ProductModel.create([
    {
      title: 'Nike Air Max Pulse Roam',
      description: 'Designed for durability and lifestyle aesthetics. Features breathable mesh and Air Max cushioning.',
      price: 150,
      discount: 10,
      stock: 45,
      rate: 4.8,
      is_new: true,
      available: true,
      gender: 1,
      brand: brands[0]._id,
      brandName: brands[0].name,
      category: categories[4]._id,
      addedBy: admin._id,
      tags: ['sneakers', 'nike', 'running', 'lifestyle'],
      imagesURL: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800',
      ],
      colors: [
        { name: 'Classic Red', hex: '#FF0000' },
        { name: 'Core Black', hex: '#000000' },
      ],
      sizes: ['39', '40', '41', '42', '43'],
    },
    {
      title: 'Adidas Ultraboost Light',
      description: 'Experience epic energy return with the lightest Ultraboost yet. Continental rubber outsole.',
      price: 180,
      discount: 15,
      stock: 30,
      rate: 4.9,
      is_new: true,
      available: true,
      gender: 1,
      brand: brands[1]._id,
      brandName: brands[1].name,
      category: categories[4]._id,
      addedBy: admin._id,
      tags: ['sneakers', 'adidas', 'ultraboost'],
      imagesURL: [
        'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800',
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
      ],
      colors: [
        { name: 'Cloud White', hex: '#FFFFFF' },
        { name: 'Triple Black', hex: '#111111' },
      ],
      sizes: ['40', '41', '42', '43'],
    },
    {
      title: 'Zara Oversized Vintage Denim Jacket',
      description: 'Faded denim trucker jacket with drop shoulders, metal button placket and front flap pockets.',
      price: 89,
      discount: 0,
      stock: 60,
      rate: 4.6,
      is_new: true,
      available: true,
      gender: 1,
      brand: brands[2]._id,
      brandName: brands[2].name,
      category: categories[1]._id,
      addedBy: admin._id,
      tags: ['jacket', 'denim', 'zara', 'vintage'],
      imagesURL: [
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800',
        'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800',
      ],
      colors: [
        { name: 'Washed Blue', hex: '#4A76A8' },
        { name: 'Charcoal Black', hex: '#333333' },
      ],
      sizes: ['M', 'L', 'XL'],
    },
    {
      title: 'H&M Regular Fit Cotton T-Shirt',
      description: 'Classic round-neck t-shirt in soft organic cotton jersey with ribbed neck trim.',
      price: 25,
      discount: 5,
      stock: 120,
      rate: 4.5,
      is_new: false,
      available: true,
      gender: 1,
      brand: brands[3]._id,
      brandName: brands[3].name,
      category: categories[0]._id,
      addedBy: admin._id,
      tags: ['tshirt', 'cotton', 'basic', 'hm'],
      imagesURL: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
      ],
      colors: [
        { name: 'Pure White', hex: '#FFFFFF' },
        { name: 'Navy Blue', hex: '#000080' },
        { name: 'Olive Green', hex: '#556B2F' },
      ],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      title: 'Zara Floral Print Midi Dress',
      description: 'Flowing V-neck dress with long sleeves, elastic cuffs, pleated hem and vintage flower patterns.',
      price: 95,
      discount: 20,
      stock: 35,
      rate: 4.7,
      is_new: true,
      available: true,
      gender: 2,
      brand: brands[2]._id,
      brandName: brands[2].name,
      category: categories[2]._id,
      addedBy: admin._id,
      tags: ['dress', 'floral', 'women', 'summer'],
      imagesURL: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800',
      ],
      colors: [
        { name: 'Rose Red', hex: '#C71585' },
        { name: 'Emerald Green', hex: '#50C878' },
      ],
      sizes: ['S', 'M', 'L'],
    },
    {
      title: 'H&M Slim Fit Cargo Pants',
      description: 'Comfortable stretch cotton twill cargo trousers with multi utility pockets and tapered ankles.',
      price: 55,
      discount: 0,
      stock: 50,
      rate: 4.4,
      is_new: false,
      available: true,
      gender: 1,
      brand: brands[3]._id,
      brandName: brands[3].name,
      category: categories[3]._id,
      addedBy: admin._id,
      tags: ['pants', 'cargo', 'streetwear', 'hm'],
      imagesURL: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
      ],
      colors: [
        { name: 'Khaki Beige', hex: '#F0E68C' },
        { name: 'Camo Green', hex: '#2E8B57' },
      ],
      sizes: ['30', '31', '32', '34'],
    },
  ]);

  // 6. Create Collections
  console.log('✨ Creating Fashion Collections...');
  await CollectionModel.create([
    {
      title: 'Urban Streetwear 2026',
      description: 'Best trending urban lifestyle outfits curated by top stylists.',
      price: 250,
      discount: 15,
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
      items: [
        {
          title: 'Streetwear Hoodie',
          description: 'Premium heavyweight cotton blend.',
          image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600',
        },
        {
          title: 'Cargo Pants',
          description: 'Multi-pocket tactical design.',
          image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600',
        },
      ],
    },
    {
      title: 'Summer Breeze Collection',
      description: 'Lightweight linen and breathable fabric sets for hot sunny days.',
      price: 190,
      discount: 25,
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
      items: [
        {
          title: 'Linen Shirt',
          description: 'Pure breathable summer linen.',
          image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600',
        },
      ],
    },
  ]);

  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('--------------------------------------------------');
  console.log('Admin Account: admin@efashion.com / Admin@123');
  console.log('--------------------------------------------------');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
