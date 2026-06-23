import { useState, useEffect, useCallback } from 'react';
import { blogPosts, productVideos, podcasts } from '../data';
import { setSeo, setJsonLd, origin } from '../utils/seo';

export default function ContentHub() {
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentType, setContentType] = useState('all'); // 'all', 'blog', 'video', 'podcast'
  const [searchTerm, setSearchTerm] = useState('');

  // Combine all content
  const allContent = [
    ...blogPosts.map(p => ({ ...p, contentType: 'blog', icon: '📝' })),
    ...productVideos.map(v => ({ ...v, contentType: 'video', icon: '🎬', title: v.title, date: v.date })),
    ...podcasts.map(p => ({ ...p, contentType: 'podcast', icon: '🎙️' })),
  ];

  // Filter by type and search
  let filtered = allContent;
  if (contentType !== 'all') {
    filtered = filtered.filter(c => c.contentType === contentType);
  }
  if (searchTerm) {
    filtered = filtered.filter(c =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || c.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.isoDate || b.date) - new Date(a.isoDate || a.date));

  // Featured from each type
  const featuredBlog = blogPosts[0];
  const featuredVideo = productVideos.find(v => v.featured) || productVideos[0];
  const featuredPodcast = podcasts.find(p => p.featured) || podcasts[0];

  // SEO
  useEffect(() => {
    setSeo({
      title: 'Content Hub',
      description: 'Expert real estate insights through blog articles, property videos, and market podcasts',
      canonical: origin() + '/content-hub',
      keywords: 'real estate blog, property videos, real estate podcast, market insights',
    });
    setJsonLd('ld-hub', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'PropertyInsta Content Hub',
      description: 'Blog, videos, and podcasts about real estate',
      url: origin() + '/content-hub',
    });
  }, []);

  const openContent = useCallback((content) => {
    setSelectedContent(content);
    window.scrollTo(0, 0);
  }, []);

  const closeContent = useCallback(() => {
    setSelectedContent(null);
  }, []);

  if (selectedContent?.contentType === 'blog') {
    return (
      <div className="ig-content-detail">
        <button className="ig-back-btn" onClick={closeContent}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to hub
        </button>
        <article>
          <img src={selectedContent.image} alt={selectedContent.title} className="ig-content-hero" />
          <h1>{selectedContent.title}</h1>
          <p className="ig-content-date">{selectedContent.date}</p>
          <div className="ig-content-body">
            {selectedContent.content?.split('\n').map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </article>
      </div>
    );
  }

  if (selectedContent?.contentType === 'video') {
    return (
      <div className="ig-content-detail">
        <button className="ig-back-btn" onClick={closeContent}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to hub
        </button>
        <video src={selectedContent.videoUrl} controls autoPlay style={{ width: '100%', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }} />
        <h1>{selectedContent.title}</h1>
        <p className="ig-content-date">{selectedContent.date}</p>
        <p className="ig-content-body">{selectedContent.description}</p>
      </div>
    );
  }

  if (selectedContent?.contentType === 'podcast') {
    return (
      <div className="ig-content-detail">
        <button className="ig-back-btn" onClick={closeContent}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to hub
        </button>
        <audio controls autoPlay style={{ width: '100%', marginBottom: '20px' }}>
          <source src={selectedContent.audioUrl} type="audio/mpeg" />
        </audio>
        <h1>{selectedContent.title}</h1>
        <p className="ig-content-date">{selectedContent.date}</p>
        {selectedContent.guest && (
          <div className="ig-content-guest">
            <img src={selectedContent.guestAvatar} alt={selectedContent.guest} />
            <div>
              <strong>{selectedContent.guest}</strong>
              <span>{selectedContent.guestRole}</span>
            </div>
          </div>
        )}
        <p className="ig-content-body">{selectedContent.description}</p>
        {selectedContent.transcript && (
          <div className="ig-content-transcript">
            <h2>📄 Transcript</h2>
            <p>{selectedContent.transcript}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ig-content-hub">
      <div className="ig-hub-header">
        <h1>📚 Content Hub</h1>
        <p>Expert insights through blog, video, and podcast</p>

        {/* Search Bar */}
        <div className="ig-hub-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search articles, videos, podcasts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ig-hub-search-input"
          />
        </div>

        {/* Filter Tabs */}
        <div className="ig-hub-filters">
          {['all', 'blog', 'video', 'podcast'].map(type => (
            <button
              key={type}
              className={`ig-hub-filter ${contentType === type ? 'active' : ''}`}
              onClick={() => setContentType(type)}
            >
              {type === 'all' && '📌 All'}
              {type === 'blog' && '📝 Articles'}
              {type === 'video' && '🎬 Videos'}
              {type === 'podcast' && '🎙️ Podcasts'}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Carousel */}
      {contentType === 'all' && (
        <div className="ig-hub-featured">
          <div className="ig-featured-item" onClick={() => openContent(featuredBlog)}>
            <div className="ig-featured-img">
              <img src={featuredBlog.image} alt={featuredBlog.title} />
              <span className="ig-featured-icon">📝</span>
            </div>
            <div className="ig-featured-info">
              <span className="ig-featured-type">Article</span>
              <h3>{featuredBlog.title}</h3>
              <span className="ig-featured-meta">{featuredBlog.date}</span>
            </div>
          </div>

          <div className="ig-featured-item" onClick={() => openContent(featuredVideo)}>
            <div className="ig-featured-img">
              <img src={featuredVideo.thumbnail} alt={featuredVideo.title} />
              <span className="ig-featured-icon">🎬</span>
            </div>
            <div className="ig-featured-info">
              <span className="ig-featured-type">Video</span>
              <h3>{featuredVideo.title}</h3>
              <span className="ig-featured-meta">{featuredVideo.views.toLocaleString()} views</span>
            </div>
          </div>

          <div className="ig-featured-item" onClick={() => openContent(featuredPodcast)}>
            <div className="ig-featured-img">
              <div className="ig-featured-podcast-bg">🎙️</div>
              <span className="ig-featured-icon">▶</span>
            </div>
            <div className="ig-featured-info">
              <span className="ig-featured-type">Podcast</span>
              <h3>{featuredPodcast.title}</h3>
              <span className="ig-featured-meta">{featuredPodcast.duration}</span>
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="ig-hub-grid">
        {filtered.length === 0 ? (
          <div className="ig-empty-state">
            <p>No {contentType !== 'all' ? contentType : 'content'} found</p>
          </div>
        ) : (
          filtered.map(content => (
            <div key={`${content.contentType}-${content.id}`} className="ig-hub-card" onClick={() => openContent(content)}>
              <div className="ig-hub-card-visual">
                {content.contentType === 'blog' && <img src={content.image} alt={content.title} />}
                {content.contentType === 'video' && <img src={content.thumbnail} alt={content.title} />}
                {content.contentType === 'podcast' && <div className="ig-podcast-visual">🎙️</div>}
                <span className="ig-card-icon">{content.icon}</span>
              </div>
              <div className="ig-hub-card-info">
                <span className="ig-card-type">
                  {content.contentType === 'blog' && 'Article'}
                  {content.contentType === 'video' && 'Video'}
                  {content.contentType === 'podcast' && 'Podcast'}
                </span>
                <h3>{content.title}</h3>
                <p className="ig-card-excerpt">
                  {(content.description || content.excerpt || '').slice(0, 100)}...
                </p>
                <div className="ig-card-meta">
                  {content.contentType === 'blog' && <span>📅 {content.date}</span>}
                  {content.contentType === 'video' && <span>👁️ {content.views.toLocaleString()}</span>}
                  {content.contentType === 'podcast' && <span>👂 {content.listens.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
