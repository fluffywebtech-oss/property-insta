import {
  buildMaterials, buildServices, buildDesigns, buildDesigners,
  blogPosts, productVideos, podcasts, allReels, propertyStories,
} from '../data';
import { inr } from './ResourcePage';

const MAT_CATS = ['Cement', 'Steel & TMT', 'Bricks & Blocks', 'Tiles & Flooring', 'Paints', 'Plumbing', 'Electrical', 'Sanitaryware', 'Hardware & Fittings', 'Wood & Ply', 'Glass & Aluminium'];
const STOCK = ['In Stock', 'Low Stock', 'Out of Stock'];
const PROFESSIONS = ['Civil Contractor', 'Architect', 'Interior Designer', 'Structural Engineer', 'MEP Consultant', 'Landscape Designer', 'Vastu Consultant', 'Turnkey Builder', 'Renovation Contractor'];
const SCOPES = ['Interior', 'Exterior'];
const ZONES = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Facade', 'Landscape'];
const DES_ROLES = ['Interior Designer', 'Architect', 'Landscape Designer', 'Facade Architect'];

export const RESOURCES = {
  // ── Build With Us ──
  materials: {
    table: 'build_materials', seed: buildMaterials, orderBy: 'id', ascending: true,
    thumb: r => r.image, search: ['name', 'brand', 'supplier', 'category'], titleKey: 'name',
    columns: [
      { key: 'name', label: 'Name' }, { key: 'category', label: 'Category', muted: true },
      { key: 'price', label: 'Price', render: r => `${inr(r.price)} / ${r.unit || ''}` }, { key: 'stock', label: 'Stock', muted: true },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true, col2: true }, { key: 'category', label: 'Category', type: 'select', options: MAT_CATS },
      { key: 'brand', label: 'Brand' }, { key: 'supplier', label: 'Supplier' },
      { key: 'unit', label: 'Unit', placeholder: '50kg bag' }, { key: 'price', label: 'Price (₹)', type: 'number' },
      { key: 'stock', label: 'Stock', type: 'select', options: STOCK }, { key: 'image', label: 'Image URL', col2: true },
      { key: 'types', label: 'Project types', type: 'tags' }, { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  contractors: {
    table: 'build_services', seed: buildServices, orderBy: 'id', ascending: true,
    thumb: r => r.avatar, thumbRound: true, search: ['name', 'profession', 'specialization'], titleKey: 'name',
    columns: [
      { key: 'name', label: 'Name' }, { key: 'profession', label: 'Profession', muted: true },
      { key: 'rating', label: 'Rating', render: r => `⭐ ${r.rating} · ${r.projects || 0}` },
      { key: 'price', label: 'From', render: r => `${r.price} ${r.priceUnit || ''}` },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true, col2: true }, { key: 'profession', label: 'Profession', type: 'select', options: PROFESSIONS },
      { key: 'specialization', label: 'Specialization', col2: true },
      { key: 'experience', label: 'Experience', placeholder: '12 yrs' }, { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'projects', label: 'Projects', type: 'number' }, { key: 'location', label: 'Location' },
      { key: 'price', label: 'Price', placeholder: '₹1,650' }, { key: 'priceUnit', label: 'Price unit', placeholder: 'per sq.ft' },
      { key: 'avatar', label: 'Avatar URL' }, { key: 'verified', label: 'Verified', type: 'checkbox' },
      { key: 'tags', label: 'Tags', type: 'tags' },
    ],
  },
  designs: {
    table: 'build_designs', seed: buildDesigns, orderBy: 'id', ascending: true,
    thumb: r => r.image, search: ['title', 'style', 'zone', 'designer'], titleKey: 'title',
    columns: [
      { key: 'title', label: 'Title' }, { key: 'scope', label: 'Scope', muted: true }, { key: 'style', label: 'Style', muted: true },
      { key: 'priceFrom', label: 'From', render: r => `${inr(r.priceFrom)} ${r.priceUnit || ''}` },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true, col2: true }, { key: 'scope', label: 'Scope', type: 'select', options: SCOPES },
      { key: 'zone', label: 'Zone', type: 'select', options: ZONES }, { key: 'style', label: 'Style' },
      { key: 'designer', label: 'Designer' }, { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'priceFrom', label: 'Price from (₹)', type: 'number' }, { key: 'priceUnit', label: 'Price unit', placeholder: 'per room' },
      { key: 'timeline', label: 'Timeline', placeholder: '3–4 weeks' }, { key: 'image', label: 'Image URL', col2: true },
      { key: 'tags', label: 'Tags', type: 'tags' }, { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  designers: {
    table: 'build_designers', seed: buildDesigners, orderBy: 'id', ascending: true,
    thumb: r => r.avatar, thumbRound: true, search: ['name', 'role', 'bio'], titleKey: 'name',
    columns: [
      { key: 'name', label: 'Name' }, { key: 'role', label: 'Role', muted: true },
      { key: 'rating', label: 'Rating', render: r => `⭐ ${r.rating} · ${r.projects || 0}` },
      { key: 'price', label: 'From', render: r => `${r.price} ${r.priceUnit || ''}` },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true, col2: true }, { key: 'role', label: 'Role', type: 'select', options: DES_ROLES },
      { key: 'experience', label: 'Experience' }, { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'projects', label: 'Projects', type: 'number' }, { key: 'location', label: 'Location' },
      { key: 'price', label: 'Price', placeholder: '₹1,500' }, { key: 'priceUnit', label: 'Price unit', placeholder: 'per sq.ft' },
      { key: 'avatar', label: 'Avatar URL' }, { key: 'verified', label: 'Verified', type: 'checkbox' },
      { key: 'bio', label: 'Bio', type: 'textarea' }, { key: 'styles', label: 'Styles', type: 'tags' },
      { key: 'scope', label: 'Scope (Interior/Exterior)', type: 'tags' }, { key: 'portfolio', label: 'Portfolio image URLs', type: 'tags' },
    ],
  },

  // ── Content ──
  blogs: {
    table: 'blogs', seed: blogPosts, orderBy: 'id', ascending: false,
    thumb: r => r.image, search: ['title', 'author', 'category'], titleKey: 'title',
    columns: [
      { key: 'title', label: 'Title' }, { key: 'author', label: 'Author', muted: true },
      { key: 'category', label: 'Category', muted: true }, { key: 'date', label: 'Date', muted: true },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true, col2: true }, { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
      { key: 'author', label: 'Author' }, { key: 'category', label: 'Category' },
      { key: 'date', label: 'Date', placeholder: 'May 24, 2026' }, { key: 'readTime', label: 'Read time', placeholder: '10 min read' },
      { key: 'image', label: 'Image URL', col2: true }, { key: 'tags', label: 'Tags', type: 'tags' },
    ],
  },
  videos: {
    table: 'videos', seed: productVideos, orderBy: 'id', ascending: false,
    thumb: r => r.thumbnail, search: ['title', 'category'], titleKey: 'title',
    columns: [
      { key: 'title', label: 'Title' }, { key: 'category', label: 'Category', muted: true },
      { key: 'duration', label: 'Duration', muted: true }, { key: 'views', label: 'Views', muted: true },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true, col2: true }, { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'videoUrl', label: 'Video URL', col2: true }, { key: 'thumbnail', label: 'Thumbnail URL', col2: true },
      { key: 'duration', label: 'Duration', placeholder: '4:32' }, { key: 'category', label: 'Category' },
      { key: 'views', label: 'Views', type: 'number' }, { key: 'date', label: 'Date' },
      { key: 'featured', label: 'Featured', type: 'checkbox' },
    ],
  },
  podcasts: {
    table: 'podcasts', seed: podcasts, orderBy: 'id', ascending: false,
    thumb: r => r.poster, search: ['title', 'guest', 'category'], titleKey: 'title',
    columns: [
      { key: 'title', label: 'Title' }, { key: 'guest', label: 'Guest', muted: true },
      { key: 'duration', label: 'Duration', muted: true }, { key: 'listens', label: 'Listens', muted: true },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true, col2: true }, { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'guest', label: 'Guest' }, { key: 'guestRole', label: 'Guest role' },
      { key: 'audioUrl', label: 'Audio URL', col2: true }, { key: 'poster', label: 'Poster URL', col2: true },
      { key: 'duration', label: 'Duration', placeholder: '45:32' }, { key: 'date', label: 'Date' },
      { key: 'listens', label: 'Listens', type: 'number' }, { key: 'category', label: 'Category' },
      { key: 'featured', label: 'Featured', type: 'checkbox' },
    ],
  },
  reels: {
    table: 'reels', seed: allReels, orderBy: 'id', ascending: false,
    thumb: r => r.thumbnail, search: ['title', 'location', 'category'], titleKey: 'title',
    columns: [
      { key: 'title', label: 'Title' }, { key: 'location', label: 'Location', muted: true },
      { key: 'price', label: 'Price', render: r => inr(r.price) }, { key: 'views', label: 'Views', muted: true },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true, col2: true }, { key: 'location', label: 'Location' },
      { key: 'price', label: 'Price (₹)', type: 'number' }, { key: 'category', label: 'Category' },
      { key: 'video', label: 'Video URL', col2: true }, { key: 'thumbnail', label: 'Thumbnail URL', col2: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'views', label: 'Views', type: 'number' }, { key: 'likes', label: 'Likes', type: 'number' },
    ],
  },
  stories: {
    table: 'stories', seed: propertyStories, orderBy: 'id', ascending: true,
    thumb: r => r.image, search: ['label', 'agent'], titleKey: 'label',
    columns: [
      { key: 'label', label: 'Label' }, { key: 'agent', label: 'Agent', muted: true }, { key: 'propertyId', label: 'Property #', muted: true },
    ],
    fields: [
      { key: 'label', label: 'Label', required: true, col2: true }, { key: 'agent', label: 'Agent' },
      { key: 'propertyId', label: 'Property ID', type: 'number' }, { key: 'image', label: 'Image URL', col2: true },
    ],
  },
  agents: {
    table: 'agents', seed: [], orderBy: 'id', ascending: true,
    thumb: r => r.avatar, thumbRound: true, search: ['name', 'company', 'phone'], titleKey: 'name',
    columns: [
      { key: 'name', label: 'Name' }, { key: 'company', label: 'Company', muted: true },
      { key: 'phone', label: 'Phone', muted: true }, { key: 'rating', label: 'Rating', render: r => `⭐ ${r.rating || '—'}` },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true, col2: true }, { key: 'company', label: 'Company' },
      { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
      { key: 'avatar', label: 'Avatar URL' }, { key: 'experience', label: 'Experience' },
      { key: 'rating', label: 'Rating', type: 'number' }, { key: 'sales', label: 'Sales', type: 'number' },
    ],
  },
};
