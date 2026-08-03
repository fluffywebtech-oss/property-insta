import {
  buildMaterials, buildServices, buildDesigns, buildDesigners,
  blogPosts, productVideos, podcasts, allReels, propertyStories,
  propertyReviews, quizQuestions, builders,
} from '../data';
import { inr } from './ResourcePage';

// Flatten / normalise the non-tabular seeds into row arrays.
const REVIEWS_SEED = Object.entries(propertyReviews || {}).flatMap(([pid, arr]) =>
  (arr || []).map(r => ({ id: r.id || `${pid}-${Math.random().toString(36).slice(2, 6)}`, user: r.user, rating: r.rating, text: r.text, date: r.date, propertyId: Number(pid) })));
const QUIZ_SEED = (quizQuestions || []).map((q, i) => ({
  id: i + 1, question: q.question, category: q.category || 'Preference',
  options: (q.options || []).map(o => o.label || o.value || o), answer: q.answer || '',
}));
const NOTIF_SEED = [
  { id: 1, text: 'New enquiry received for DLF Privana North', time: '2 min ago', type: 'lead' },
  { id: 2, text: 'Site visit confirmed — Godrej Aristocrat', time: '1 hr ago', type: 'meeting' },
  { id: 3, text: 'Price updated on 3 listings in New Gurgaon', time: 'Yesterday', type: 'system' },
];
const MEET_SEED = [
  { id: 1, title: 'Site visit — DLF Privana North', attendee: 'Aarav Gupta', date: '2026-07-05', time: '11:00', type: 'Site Visit', status: 'Confirmed', notes: '' },
  { id: 2, title: 'Investor call — Sohna Rd portfolio', attendee: 'Neha Rao', date: '2026-07-06', time: '16:00', type: 'Call', status: 'New', notes: '' },
];
const TXN_SEED = [
  { id: 1, property: 'Godrej Aristocrat – 3 BHK', buyer: 'R. Sethi', seller: 'Godrej Properties', amount: 85000000, status: 'Token Paid', date: '2026-06-20', notes: '' },
];
const INV_SEED = [
  { id: 1, name: 'SPR Pre-launch Pool', amount: 25000000, roi: '18% IRR', tenure: '3 yrs', status: 'Open', notes: '' },
];
const CP_SEED = [
  { id: 1, name: 'Anil Verma', company: 'Verma Realty', phone: '9810000001', email: 'anil@verma.in', deals: 42, status: 'Active', notes: '' },
];

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

  // ── Team ──
  employees: {
    table: 'employees', seed: [], orderBy: 'id', ascending: true,
    thumb: r => r.avatar, thumbRound: true, search: ['name', 'role', 'phone', 'email'], titleKey: 'name',
    columns: [
      { key: 'name', label: 'Name' }, { key: 'role', label: 'Role', muted: true },
      { key: 'phone', label: 'Phone', muted: true }, { key: 'email', label: 'Email', muted: true },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true, col2: true },
      { key: 'role', label: 'Role', type: 'select', options: ['Agent', 'Senior Agent', 'Team Lead', 'Manager', 'Admin'] },
      { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
      { key: 'avatar', label: 'Avatar URL' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ── Platform ──
  reviews: {
    table: 'reviews', seed: REVIEWS_SEED, orderBy: 'id', ascending: true,
    search: ['user', 'text'], titleKey: 'user',
    columns: [
      { key: 'user', label: 'Reviewer' }, { key: 'rating', label: 'Rating', render: r => `⭐ ${r.rating}` },
      { key: 'text', label: 'Review', render: r => (r.text || '').slice(0, 60) + '…' }, { key: 'date', label: 'Date', muted: true },
    ],
    fields: [
      { key: 'user', label: 'Reviewer', required: true }, { key: 'rating', label: 'Rating', type: 'number', default: 5 },
      { key: 'propertyId', label: 'Property ID', type: 'number' }, { key: 'date', label: 'Date', placeholder: '3 days ago' },
      { key: 'text', label: 'Review', type: 'textarea' },
    ],
  },
  quiz: {
    table: 'quiz', seed: QUIZ_SEED, orderBy: 'id', ascending: true,
    search: ['question', 'category'], titleKey: 'question',
    columns: [
      { key: 'question', label: 'Question' }, { key: 'category', label: 'Category', muted: true },
      { key: 'options', label: 'Options', render: r => `${(r.options || []).length} options` },
    ],
    fields: [
      { key: 'question', label: 'Question', required: true, type: 'textarea' }, { key: 'category', label: 'Category' },
      { key: 'options', label: 'Options', type: 'tags' }, { key: 'answer', label: 'Answer' },
    ],
  },
  notifications: {
    table: 'notifications', seed: NOTIF_SEED, orderBy: 'id', ascending: false,
    search: ['text', 'type'], titleKey: 'text',
    columns: [
      { key: 'text', label: 'Message' }, { key: 'type', label: 'Type', muted: true }, { key: 'time', label: 'When', muted: true },
    ],
    fields: [
      { key: 'text', label: 'Message', required: true, type: 'textarea' },
      { key: 'type', label: 'Type', type: 'select', options: ['lead', 'meeting', 'system', 'alert'] },
      { key: 'time', label: 'When', placeholder: '2 min ago' },
    ],
  },

  // ── Content: Meetings ──
  meetings: {
    table: 'meetings', seed: MEET_SEED, orderBy: 'id', ascending: false,
    search: ['title', 'attendee'], titleKey: 'title',
    columns: [
      { key: 'title', label: 'Title' }, { key: 'attendee', label: 'With', muted: true },
      { key: 'date', label: 'Date', render: r => `${r.date} ${r.time || ''}` },
      { key: 'status', label: 'Status', pill: true },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true, col2: true }, { key: 'attendee', label: 'Attendee' },
      { key: 'type', label: 'Type', type: 'select', options: ['Site Visit', 'Call', 'Office', 'Video'] },
      { key: 'date', label: 'Date', placeholder: '2026-07-05' }, { key: 'time', label: 'Time', placeholder: '11:00' },
      { key: 'status', label: 'Status', type: 'select', options: ['New', 'Confirmed', 'Done', 'Cancelled'] },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ── Operations ──
  transactions: {
    table: 'transactions', seed: TXN_SEED, orderBy: 'id', ascending: false,
    search: ['property', 'buyer', 'seller'], titleKey: 'property',
    columns: [
      { key: 'property', label: 'Property' }, { key: 'buyer', label: 'Buyer', muted: true },
      { key: 'amount', label: 'Amount', render: r => inr(r.amount) },
      { key: 'status', label: 'Status', pill: true },
    ],
    fields: [
      { key: 'property', label: 'Property', required: true, col2: true }, { key: 'buyer', label: 'Buyer' }, { key: 'seller', label: 'Seller' },
      { key: 'amount', label: 'Amount (₹)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Enquiry', 'Token Paid', 'Agreement', 'Registered', 'Closed'] },
      { key: 'date', label: 'Date' }, { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  investments: {
    table: 'investments', seed: INV_SEED, orderBy: 'id', ascending: false,
    search: ['name', 'status'], titleKey: 'name',
    columns: [
      { key: 'name', label: 'Opportunity' }, { key: 'amount', label: 'Ticket', render: r => inr(r.amount) },
      { key: 'roi', label: 'Returns', muted: true }, { key: 'status', label: 'Status', pill: true },
    ],
    fields: [
      { key: 'name', label: 'Opportunity', required: true, col2: true }, { key: 'amount', label: 'Ticket size (₹)', type: 'number' },
      { key: 'roi', label: 'Returns', placeholder: '18% IRR' }, { key: 'tenure', label: 'Tenure', placeholder: '3 yrs' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Funding', 'Closed', 'Exited'] }, { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'builder-erp': {
    table: 'builders', seed: builders, orderBy: 'id', ascending: true,
    thumb: r => null, search: ['name', 'headquarters'], titleKey: 'name',
    columns: [
      { key: 'name', label: 'Builder' }, { key: 'headquarters', label: 'HQ', muted: true },
      { key: 'totalProjects', label: 'Projects', muted: true }, { key: 'rating', label: 'Rating', render: r => `⭐ ${r.rating}` },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true, col2: true }, { key: 'slug', label: 'Slug' }, { key: 'founded', label: 'Founded', type: 'number' },
      { key: 'headquarters', label: 'HQ' }, { key: 'totalProjects', label: 'Total projects', type: 'number' },
      { key: 'rating', label: 'Rating', type: 'number' }, { key: 'reviewCount', label: 'Reviews', type: 'number' },
      { key: 'logo', label: 'Logo text' }, { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  'channel-partners': {
    table: 'channel_partners', seed: CP_SEED, orderBy: 'id', ascending: true,
    thumb: r => null, search: ['name', 'company'], titleKey: 'name',
    columns: [
      { key: 'name', label: 'Partner' }, { key: 'company', label: 'Company', muted: true },
      { key: 'deals', label: 'Deals', muted: true }, { key: 'status', label: 'Status', pill: true },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true, col2: true }, { key: 'company', label: 'Company' },
      { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
      { key: 'deals', label: 'Deals closed', type: 'number' }, { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Inactive'] },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
};
