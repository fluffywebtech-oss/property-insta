import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// ==================== Mobile Navigation ====================
export function MobileNav() {
  const { currentView, setCurrentView } = useApp();

  const tabs = [
    { id: 'feed', icon: 'home', label: 'Feed' },
    { id: 'reels', icon: 'play', label: 'Reels' },
    { id: 'mapView', icon: 'map', label: 'Map' },
    { id: 'saved', icon: 'bookmark', label: 'Saved' },
  ];

  return (
    <nav className="ig-mobile-nav" id="igMobileNav">
      <div className="mobile-nav-inner">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`mobile-nav-item ${currentView === tab.id ? 'active' : ''}`}
            data-tab={tab.id}
            onClick={() => setCurrentView(tab.id)}
          >
            {tab.icon === 'home' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill={currentView === tab.id ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            )}
            {tab.icon === 'play' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill={currentView === tab.id ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
            {tab.icon === 'map' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            )}
            {tab.icon === 'bookmark' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill={currentView === tab.id ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            )}
            <span>{tab.label}</span>
          </button>
        ))}
        <button
          className="mobile-nav-item"
          onClick={() => document.querySelector('.ig-search-panel')?.classList.toggle('hidden')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Search</span>
        </button>
      </div>
    </nav>
  );
}

// ==================== Chat Widget ====================
export function ChatWidget() {
  const { setActiveModal } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'agent', text: '👋 Hi! Welcome to PropertyInsta. How can I help you find your dream property today?' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const chatReplies = {
    'property': 'We have 10,000+ properties across 50+ cities! You can browse listings in the Feed view or search by city, budget, or type.',
    'price': 'Our properties range from affordable flats starting at ₹20 Lakhs to luxury penthouses at ₹10 Crore+. What\'s your budget range?',
    'mortgage': 'You can use our Mortgage Calculator (available in the sidebar) to estimate your monthly EMI. Most banks offer home loans starting at 8.5% interest.',
    'tour': 'I can help you schedule a property tour! Click "Schedule Tour" from the sidebar or any property detail page.',
    'default': 'That\'s a great question! You can browse properties in the Feed, check out Reels for video tours, or use our Quick Tools in the left sidebar.',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: msg }]);
    setInput('');

    // Simulate agent response
    setTimeout(() => {
      let reply = chatReplies.default;
      const lower = msg.toLowerCase();
      if (lower.includes('property') || lower.includes('listing') || lower.includes('home')) reply = chatReplies.property;
      else if (lower.includes('price') || lower.includes('budget') || lower.includes('cost')) reply = chatReplies.price;
      else if (lower.includes('loan') || lower.includes('mortgage') || lower.includes('emi')) reply = chatReplies.mortgage;
      else if (lower.includes('tour') || lower.includes('visit') || lower.includes('schedule')) reply = chatReplies.tour;

      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'agent', text: reply }]);
    }, 600);
  };

  const quickReplies = [
    { label: '🏠 Show Properties', action: () => sendMessage('properties') },
    { label: '💰 Pricing Help', action: () => sendMessage('price') },
    { label: '🏦 Mortgage', action: () => sendMessage('mortgage') },
    { label: '📅 Book Tour', action: () => { setOpen(false); setActiveModal({ type: 'tour', data: {} }); } },
  ];

  return (
    <div className="chat-widget" id="chatWidget">
      <button className="chat-toggle-btn" id="chatToggle" onClick={() => setOpen(!open)}>
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
        )}
      </button>

      {open && (
        <div className="chat-panel" id="chatPanel">
          <div className="chat-header">
            <div className="chat-agent-info">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                alt="Agent"
                width="36"
                height="36"
              />
              <div>
                <strong>Rahul Sharma</strong>
                <span>Property Advisor</span>
              </div>
            </div>
            <span className="chat-online-dot" />
          </div>

          <div className="chat-messages" id="chatMessages">
            {messages.map(m => (
              <div key={m.id} className={`chat-msg ${m.type}`}>
                <p>{m.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-quick-replies" id="chatQuickReplies">
            {quickReplies.map(qr => (
              <button key={qr.label} className="chat-quick-btn" onClick={qr.action}>
                {qr.label}
              </button>
            ))}
          </div>

          <div className="chat-input-wrap">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Footer ====================
export default function Footer() {
  const { setCurrentView, setActiveModal } = useApp();

  return (
    <footer className="ig-footer">
      <div className="ig-footer-inner">
        <div className="ig-footer-grid">
          <div className="ig-footer-col">
            <h4>PropertyInsta</h4>
            <p>Your trusted platform for discovering, comparing, and purchasing premium properties across India.</p>
            <div className="ig-footer-social">
              <a href="#" aria-label="Facebook"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg></a>
              <a href="#" aria-label="Twitter"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg></a>
              <a href="#" aria-label="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></a>
            </div>
          </div>

          <div className="ig-footer-col">
            <h4>Explore</h4>
            <ul>
              <li><a onClick={() => setCurrentView('feed')}>All Properties</a></li>
              <li><a onClick={() => setCurrentView('reels')}>Property Reels</a></li>
              <li><a onClick={() => setCurrentView('mapView')}>Map View</a></li>
              <li><a onClick={() => setCurrentView('blog')}>Blog & Insights</a></li>
            </ul>
          </div>

          <div className="ig-footer-col">
            <h4>Quick Tools</h4>
            <ul>
              <li><a onClick={() => setActiveModal({ type: 'mortgage' })}>Mortgage Calculator</a></li>
              <li><a onClick={() => setActiveModal({ type: 'roi' })}>ROI Calculator</a></li>
              <li><a onClick={() => setActiveModal({ type: 'currency' })}>Currency Converter</a></li>
              <li><a onClick={() => setCurrentView('compare')}>Compare Properties</a></li>
            </ul>
          </div>

          <div className="ig-footer-col">
            <h4>Support</h4>
            <ul>
              <li><a onClick={() => setActiveModal({ type: 'tour', data: {} })}>Schedule a Tour</a></li>
              <li><a onClick={() => setActiveModal({ type: 'alerts' })}>Price Alerts</a></li>
              <li><a onClick={() => setActiveModal({ type: 'reviews', data: { propertyId: 1 } })}>Property Reviews</a></li>
              <li><a href="#">Help Center</a></li>
            </ul>
          </div>
        </div>

        <div className="ig-footer-bottom">
          <p>&copy; {new Date().getFullYear()} PropertyInsta. All rights reserved.</p>
          <div className="ig-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">RERA Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  );
}