import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { allProperties as staticProperties, allReels as staticReels, formatPriceIndian } from '../data';
import { supabase } from '../lib/supabase';

// ============================================================================
// Derive a canonical city from a free-text location string
// ============================================================================
export function deriveCity(loc = '') {
  const l = (loc || '').toLowerCase();
  if (l.includes('faridabad')) return 'Faridabad';
  if (l.includes('ghaziabad') || l.includes('indirapuram') || l.includes('crossings') || l.includes('raj nagar')) return 'Ghaziabad';
  if (l.includes('greater noida') || l.includes('noida extension') || l.includes('noida west')) return 'Greater Noida';
  if (l.includes('noida') || l.includes('wish town') || l.includes('jaypee')) return 'Noida';
  // Other metros (Navi Mumbai must be checked before Mumbai)
  if (l.includes('navi mumbai') || l.includes('panvel')) return 'Navi Mumbai';
  if (l.includes('mumbai')) return 'Mumbai';
  if (l.includes('bangalore') || l.includes('bengaluru')) return 'Bangalore';
  if (l.includes('hyderabad')) return 'Hyderabad';
  if (l.includes('pune')) return 'Pune';
  if (l.includes('ahmedabad')) return 'Ahmedabad';
  if (l.includes('kolkata')) return 'Kolkata';
  if (l.includes('chandigarh') || l.includes('mohali')) return 'Chandigarh';
  if (l.includes('lucknow')) return 'Lucknow';
  if (l.includes('ludhiana')) return 'Ludhiana';
  if (l.includes('indore')) return 'Indore';
  if (l.includes('vrindavan') || l.includes('mathura')) return 'Vrindavan';
  // "Dwarka Expressway" (any abbreviation: exp / expwy / expressway) is a GURGAON corridor
  const isDwarkaExpwy = l.includes('dwarka') && /\bexp/.test(l);
  // Delhi — only the bare "Dwarka" sub-city (e.g., "Sector 23, Dwarka"), NOT the Gurgaon expressway
  if (l.includes('new delhi') || (l.includes('dwarka') && !isDwarkaExpwy)) return 'Delhi';
  // Gurgaon / Gurugram micro-markets
  if (
    isDwarkaExpwy ||
    l.includes('gurgaon') || l.includes('gurugram') || l.includes('golf course') ||
    l.includes('spr') || l.includes('southern peripheral') || l.includes('sohna') ||
    l.includes('dlf') || l.includes('sushant') ||
    l.includes('nirvana') || l.includes('cyber') || l.includes('mg road') || l.includes('manesar')
  ) return 'Gurgaon';
  return 'Other';
}

// ============================================================================
// Property mapping: snake_case (DB) → camelCase (React)
// ============================================================================
function mapDBProperty(db) {
  return {
    id: db.id,
    city: deriveCity(db.location),
    title: db.title,
    location: db.location,
    price: db.price,
    bedrooms: db.beds,
    bathrooms: db.baths,
    area: db.sqft,
    type: db.type ? db.type.charAt(0).toUpperCase() + db.type.slice(1) : 'Apartment',
    status: db.status === 'sale' ? 'For Sale' : db.status === 'rent' ? 'For Rent' : db.status,
    builder: db.builder,
    rera: !!db.rera_id,
    reraId: db.rera_id,
    possession: db.possession_status,
    possessionStatus: db.possession_status,
    floor: db.floor,
    furnishing: db.furnishing,
    emiEstimate: db.emi_estimate,
    bankOffers: db.bank_offers,
    media: db.images || [],
    images: db.images || [],
    amenities: (db.amenities || []).map(a => {
      const amenityMap = { pool: 'Pool', gym: 'Gym', parking: 'Parking', garden: 'Garden', security: 'Security', smartHome: 'Smart Home' };
      return amenityMap[a] || (typeof a === 'string' ? a.charAt(0).toUpperCase() + a.slice(1) : a);
    }),
    featured: db.featured,
    hot: db.hot,
    trending: db.hot,
    badge: db.hot ? 'Hot Deal' : (db.featured ? 'Featured' : null),
    badgeType: db.hot ? 'hot' : (db.featured ? 'featured' : ''),
    openHouse: db.open_house,
    facing: db.facing || 'Not Set',
    parking: db.parking || 'None',
    pricePerSqft: db.price_per_sqft || Math.round(db.price / (db.sqft || 1)),
    verified: db.verified,
    views: db.views || 0,
    description: db.description,
    agent: {
      id: db.agent_id || `agent-${db.id}`,
      name: db.agent_name || 'Agent',
      avatar: db.agent_avatar || 'https://i.pravatar.cc/150?img=1',
      rating: db.agent_rating || 4.0,
      sales: db.agent_sales || 0,
      phone: db.agent_phone || '',
      email: db.agent_email || '',
    },
    agentAvatar: db.agent_avatar || 'https://i.pravatar.cc/150?img=1',
    postDate: db.post_date || 'Recently',
    comments: db.comments || 0,
    shares: db.shares || 0,
    lat: db.lat,
    lng: db.lng,
    neighborhood: Array.isArray(db.neighborhood) ? db.neighborhood : ['Schools: N/A', 'Transit: N/A', 'Walk Score: 0/100', 'Crime Rate: N/A'],
    floorPlan: db.floor_plan,
    developerLogo: db.developer_logo || '',
    developerWebsite: db.developer_website || '',
    age: db.age || 'New',
    mediaAspectRatio: db.media_aspect_ratio || '4/3',
    listingStatus: db.listing_status || db.possession_status || 'Ready to Move',
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

function mapDBReel(db) {
  return {
    id: db.id,
    propertyId: db.property_id,
    title: db.title,
    location: db.location,
    price: db.price,
    category: db.category,
    video: db.video,
    thumbnail: db.thumbnail,
    description: db.description,
    views: db.views || 0,
    likes: db.likes || 0,
    status: db.status,
    duration: db.duration || '',
    tags: db.tags || [],
    agentName: db.agent_name,
    builder: db.builder,
    reraId: db.rera_id,
    possessionDate: db.possession_date,
    sqft: db.sqft,
    furnishing: db.furnishing,
    floor: db.floor,
    emiEstimate: db.emi_estimate,
    bankOffers: db.bank_offers,
    created_at: db.created_at,
  };
}

// ============================================================================
// Merge Supabase properties with static fallback
// ============================================================================
function mergeWithStatic(supabaseProps, staticProps) {
  const dbIds = new Set(supabaseProps.map(p => p.id));
  const merged = [...supabaseProps];
  staticProps.forEach(sp => {
    if (!dbIds.has(sp.id)) {
      merged.push(sp);
    }
  });
  return merged;
}

// ============================================================================
// Context
// ============================================================================
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Supabase availability flag
  const [dbReady, setDbReady] = useState(false);

  // View management
  const [currentView, setCurrentView] = useState('feed');

  // Properties — start with static data, upgrade to Supabase when available
  const [allProperties, setAllProperties] = useState(staticProperties);
  const [allReels, setAllReels] = useState(staticReels);

  // ==========================================================================
  // Supabase Real-Time Subscription
  // ==========================================================================
  useEffect(() => {
    if (!supabase) {
      console.warn('[PropertyInsta] Supabase not configured — using static data only');
      return;
    }

    let propertiesChannel;
    let reelsChannel;

    async function initSupabase() {
      try {
        console.log('[PropertyInsta] Fetching properties & reels from Supabase...');
        // 1. Fetch initial data
        const [{ data: props, error: propsErr }, { data: reels, error: reelsErr }] = await Promise.all([
          supabase.from('properties').select('*').order('id', { ascending: false }),
          supabase.from('reels').select('*').order('id', { ascending: false }),
        ]);

        if (propsErr) {
          console.error('[PropertyInsta] Properties fetch error:', propsErr.message);
        }
        if (reelsErr) {
          console.error('[PropertyInsta] Reels fetch error:', reelsErr.message);
        }

        if (!propsErr && props) {
          console.log('[PropertyInsta] Loaded ' + props.length + ' properties from Supabase');
          const mapped = props.map(mapDBProperty);
          const merged = mergeWithStatic(mapped, staticProperties);
          setAllProperties(merged);
          setDbReady(true);
        }
        if (!reelsErr && reels) {
          console.log('[PropertyInsta] Loaded ' + reels.length + ' reels from Supabase');
          const mapped = reels.map(mapDBReel);
          const merged = mergeWithStatic(mapped, staticReels);
          setAllReels(merged);
        }
      } catch (err) {
        console.error('[PropertyInsta] initSupabase failed:', err);
      }

      // 2. Subscribe to real-time changes on properties
      propertiesChannel = supabase
        .channel('properties-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'properties' },
          (payload) => {
            setAllProperties(prev => {
              const updated = [...prev];
              if (payload.eventType === 'INSERT') {
                const newProp = mapDBProperty(payload.new);
                updated.unshift(newProp);
              } else if (payload.eventType === 'UPDATE') {
                const idx = updated.findIndex(p => p.id === payload.new.id);
                if (idx !== -1) updated[idx] = mapDBProperty(payload.new);
              } else if (payload.eventType === 'DELETE') {
                const idx = updated.findIndex(p => p.id === payload.old.id);
                if (idx !== -1) updated.splice(idx, 1);
              }
              return mergeWithStatic(updated, staticProperties);
            });
          }
        )
        .subscribe();

      // 3. Subscribe to real-time changes on reels
      reelsChannel = supabase
        .channel('reels-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reels' },
          (payload) => {
            setAllReels(prev => {
              const updated = [...prev];
              if (payload.eventType === 'INSERT') {
                updated.unshift(mapDBReel(payload.new));
              } else if (payload.eventType === 'UPDATE') {
                const idx = updated.findIndex(r => r.id === payload.new.id);
                if (idx !== -1) updated[idx] = mapDBReel(payload.new);
              } else if (payload.eventType === 'DELETE') {
                const idx = updated.findIndex(r => r.id === payload.old.id);
                if (idx !== -1) updated.splice(idx, 1);
              }
              return mergeWithStatic(updated, staticReels);
            });
          }
        )
        .subscribe();
    }

    initSupabase();

    return () => {
      if (propertiesChannel) supabase.removeChannel(propertiesChannel);
      if (reelsChannel) supabase.removeChannel(reelsChannel);
    };
  }, []);

  // ==========================================================================
  // Dark mode
  // ==========================================================================
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('propertyInsta_dark') === 'true';
  });

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('propertyInsta_dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);

  // ==========================================================================
  // Filters
  // ==========================================================================
  const [filters, setFilters] = useState({
    search: '', city: '', priceRange: '', priceMin: '', priceMax: '',
    propertyType: [], bedrooms: null, amenities: [],
    listingStatus: [], sortBy: 'newest'
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  const [currentPage, setCurrentPage] = useState(1);
  const propsPerPage = 24;

  const sortProperties = useCallback((props) => {
    const sorted = [...props];
    switch (filters.sortBy) {
      case 'price_asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price_desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'newest': sorted.sort((a, b) => b.id - a.id); break;
      case 'popular': sorted.sort((a, b) => (b.views || 0) - (a.views || 0)); break;
      case 'area_desc': sorted.sort((a, b) => (b.area || 0) - (a.area || 0)); break;
      default: break;
    }
    return sorted;
  }, [filters.sortBy]);

  const filteredProperties = useMemo(() => {
    let result = [...allProperties];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q)
      );
    }
    if (filters.city) {
      result = result.filter(p => (p.city || deriveCity(p.location)) === filters.city);
    }
    if (filters.priceRange) {
      const priceRanges = {
        'Under ₹30L': [0, 3000000],
        '₹30L-60L': [3000000, 6000000],
        '₹60L-1Cr': [6000000, 10000000],
        '₹1Cr-2Cr': [10000000, 20000000],
        '₹2Cr-5Cr': [20000000, 50000000],
        '₹5Cr+': [50000000, Infinity],
      };
      const [min, max] = priceRanges[filters.priceRange] || [0, Infinity];
      result = result.filter(p => p.price >= min && p.price <= max);
    }
    const minPrice = filters.priceMin ? Number(filters.priceMin) : 0;
    const maxPrice = filters.priceMax ? Number(filters.priceMax) : Infinity;
    if (minPrice > 0) result = result.filter(p => p.price >= minPrice);
    if (maxPrice < Infinity) result = result.filter(p => p.price <= maxPrice);
    if (filters.propertyType.length) result = result.filter(p => filters.propertyType.includes(p.type));
    if (filters.bedrooms !== null) result = result.filter(p => p.bedrooms === filters.bedrooms);
    if (filters.amenities.length) result = result.filter(p => filters.amenities.every(a => (p.amenities || []).includes(a)));
    if (filters.listingStatus.length) result = result.filter(p => filters.listingStatus.includes(p.listingStatus));
    return sortProperties(result);
  }, [allProperties, filters, sortProperties]);

  const displayedProperties = useMemo(() => {
    return filteredProperties.slice(0, currentPage * propsPerPage);
  }, [filteredProperties, currentPage]);

  const loadMore = useCallback(() => {
    if (currentPage * propsPerPage < filteredProperties.length) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, filteredProperties.length]);

  const hasMore = currentPage * propsPerPage < filteredProperties.length;
  const filteredCount = filteredProperties.length;

  // ==========================================================================
  // Saved / Liked
  // ==========================================================================
  const [savedIds, setSavedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('propertyInsta_saved') || '[]'); } catch { return []; }
  });
  const [likedIds, setLikedIds] = useState([]);

  useEffect(() => {
    localStorage.setItem('propertyInsta_saved', JSON.stringify(savedIds));
  }, [savedIds]);

  const toggleSave = useCallback((id) => {
    setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const toggleLike = useCallback((id) => {
    setLikedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  // ==========================================================================
  // Recently viewed
  // ==========================================================================
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('propertyInsta_recent') || '[]'); } catch { return []; }
  });
  const addRecentView = useCallback((propId) => {
    setRecentlyViewed(prev => {
      const updated = [propId, ...prev.filter(id => id !== propId)].slice(0, 8);
      localStorage.setItem('propertyInsta_recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ==========================================================================
  // Compare
  // ==========================================================================
  const [compareIds, setCompareIds] = useState([]);
  const toggleCompare = useCallback((id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  // ==========================================================================
  // Notifications
  // ==========================================================================
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Price drop alert: Skyline Tower down 5%", time: "10 min ago", icon: "fa-tag", read: false },
    { id: 2, text: "New property matching your search: Lakeside Retreat", time: "1 hour ago", icon: "fa-home", read: false },
    { id: 3, text: "Your scheduled tour for Penthouse Executive is confirmed", time: "3 hours ago", icon: "fa-calendar-check", read: false },
    { id: 4, text: "Sarah Kim accepted your connection request", time: "5 hours ago", icon: "fa-user-check", read: true },
    { id: 5, text: "Compare ready: 3 saved properties analyzed", time: "1 day ago", icon: "fa-balance-scale", read: true },
  ]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const markNotifRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  // ==========================================================================
  // Modal state
  // ==========================================================================
  const [activeModal, setActiveModal] = useState(null);
  const openModal = useCallback((type, data = null) => setActiveModal({ type, data }), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  // ==========================================================================
  // Reels category
  // ==========================================================================
  const [activeReelCategory, setActiveReelCategory] = useState('All');

  // ==========================================================================
  // Admin: CRUD helpers exposed via context
  // ==========================================================================
  const adminAddProperty = useCallback(async (property) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('properties').insert({
      title: property.title,
      location: property.location,
      price: property.price,
      beds: property.beds || property.bedrooms,
      baths: property.baths || property.bathrooms,
      sqft: property.sqft || property.area,
      type: property.type?.toLowerCase(),
      status: property.status,
      builder: property.builder,
      rera_id: property.reraId,
      possession_status: property.possessionStatus || property.possession,
      floor: property.floor,
      furnishing: property.furnishing,
      emi_estimate: property.emiEstimate,
      bank_offers: property.bankOffers,
      images: property.images || property.media,
      amenities: property.amenities,
      featured: property.featured,
      hot: property.hot,
      open_house: property.openHouse,
      facing: property.facing,
      parking: property.parking,
      price_per_sqft: property.pricePerSqft,
      verified: property.verified,
      views: property.views || 0,
      description: property.description,
      agent_id: property.agent?.id,
      agent_name: property.agent?.name,
      agent_avatar: property.agent?.avatar,
      agent_rating: property.agent?.rating,
      agent_sales: property.agent?.sales,
      agent_phone: property.agent?.phone,
      agent_email: property.agent?.email,
      post_date: property.postDate,
      lat: property.lat,
      lng: property.lng,
      neighborhood: property.neighborhood,
      floor_plan: property.floorPlan,
      trending: property.trending,
      age: property.age,
      media_aspect_ratio: property.mediaAspectRatio,
      listing_status: property.listingStatus,
    }).select().single();
    if (error) throw error;
    return data;
  }, []);

  const adminUpdateProperty = useCallback(async (id, updates) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('properties').update(updates).eq('id', id);
    if (error) throw error;
  }, []);

  const adminDeleteProperty = useCallback(async (id) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;
  }, []);

  const toggleSearchPanel = useCallback(() => {
    const panel = document.querySelector('.ig-search-panel');
    if (panel) panel.classList.toggle('hidden');
  }, []);

  const value = {
    currentView, setCurrentView,
    darkMode, toggleDarkMode,
    filters, setFilters,
    filteredProperties, displayedProperties,
    allProperties, allReels,
    dbReady,
    currentPage, loadMore, hasMore, filteredCount,
    savedIds, toggleSave,
    likedIds, toggleLike,
    recentlyViewed, addRecentView,
    compareIds, toggleCompare, setCompareIds,
    notifications, unreadCount, markNotifRead,
    activeModal, openModal, closeModal, setActiveModal,
    activeReelCategory, setActiveReelCategory,
    toggleSearchPanel,
    sidebarOpen, toggleSidebar,
    // Admin CRUD
    adminAddProperty, adminUpdateProperty, adminDeleteProperty,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;