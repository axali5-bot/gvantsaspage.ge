export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  gender: 'men' | 'women' | 'unisex';
  category_id: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
}

export const mockCategories: Category[] = [
  { id: '1', name: 'Eau de Parfum' },
  { id: '2', name: 'Eau de Toilette' },
  { id: '3', name: 'Parfum' },
  { id: '4', name: 'Body Mist' },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Noir Élégance',
    brand: 'Maison Luxe',
    price: 185,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop',
    gender: 'men',
    category_id: '1',
    description: 'A sophisticated blend of oud and amber',
  },
  {
    id: '2',
    name: 'Rose Mystique',
    brand: 'Atelier Parfum',
    price: 220,
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&h=500&fit=crop',
    gender: 'women',
    category_id: '1',
    description: 'Enchanting Bulgarian rose with a velvet finish',
  },
  {
    id: '3',
    name: 'Ocean Breeze',
    brand: 'Côte Azur',
    price: 145,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=500&fit=crop',
    gender: 'unisex',
    category_id: '2',
    description: 'Fresh marine notes with citrus undertones',
  },
  {
    id: '4',
    name: 'Velvet Oud',
    brand: 'Arabian Nights',
    price: 350,
    image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=500&fit=crop',
    gender: 'unisex',
    category_id: '3',
    description: 'Pure oud essence with smoky undertones',
  },
  {
    id: '5',
    name: 'Fleur de Nuit',
    brand: 'Parisian Dreams',
    price: 195,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=500&fit=crop',
    gender: 'women',
    category_id: '1',
    description: 'Night-blooming jasmine and tuberose',
  },
  {
    id: '6',
    name: 'Leather & Smoke',
    brand: 'Gentleman\'s Club',
    price: 275,
    image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400&h=500&fit=crop',
    gender: 'men',
    category_id: '3',
    description: 'Bold leather with whiskey accord',
  },
];