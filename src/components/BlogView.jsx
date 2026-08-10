import { useState, useEffect, useCallback } from 'react';
import { blogPosts, productVideos, podcasts } from '../data';
import { setSeo, setJsonLd, removeJsonLd, origin } from '../utils/seo';

export default function BlogView() {
  const [activeView, setActiveView] = useState('blog'); // 'blog', 'videos', or 'podcasts'
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...new Set(blogPosts.map(p => p.category).filter(Boolean))];
  const filtered = activeCategory === 'All' ? blogPosts : blogPosts.filter(p => p.category === activeCategory);

  // ── Deep-link: open an article from /blog/{slug} on load + on back/forward ──
  useEffect(() => {
    const fromUrl = () => {
      const m = window.location.pathname.match(/^\/blog\/(.+)$/);
      if (m) { const p = blogPosts.find(b => b.slug === decodeURIComponent(m[1])); setSelectedPost(p || null); }
      else setSelectedPost(null);
    };
    fromUrl();
    window.addEventListener('popstate', fromUrl);
    return () => window.removeEventListener('popstate', fromUrl);
  }, []);

  const openPost = useCallback((post) => {
    setSelectedPost(post);
    window.history.pushState({}, '', '/blog/' + post.slug);
    window.scrollTo(0, 0);
  }, []);

  const closePost = useCallback(() => {
    setSelectedPost(null);
    window.history.pushState({}, '', '/blog');
    window.scrollTo(0, 0);
  }, []);

  // ── SEO: title, meta, Open Graph + JSON-LD structured data per view ──
  useEffect(() => {
    if (selectedPost) {
      setSeo({
        title: selectedPost.title,
        description: selectedPost.metaDescription || selectedPost.excerpt,
        image: selectedPost.image,
        type: 'article',
        keywords: (selectedPost.tags || []).join(', '),
        canonical: origin() + '/blog/' + selectedPost.slug,
      });
      setJsonLd('ld-article', {
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: selectedPost.title,
        description: selectedPost.metaDescription || selectedPost.excerpt,
        image: selectedPost.image,
        datePublished: selectedPost.isoDate,
        dateModified: selectedPost.isoDate,
        author: { '@type': 'Person', name: selectedPost.author },
        publisher: { '@type': 'Organization', name: 'PropertyInsta', logo: { '@type': 'ImageObject', url: origin() + '/favicon.svg' } },
        mainEntityOfPage: origin() + '/blog/' + selectedPost.slug,
        articleSection: selectedPost.category,
        keywords: (selectedPost.tags || []).join(', '),
      });
      setJsonLd('ld-breadcrumb', {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: origin() + '/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: origin() + '/blog' },
          { '@type': 'ListItem', position: 3, name: selectedPost.title, item: origin() + '/blog/' + selectedPost.slug },
        ],
      });
    } else {
      setSeo({
        title: 'Property Insights & Real-Estate Blog',
        description: 'Expert Gurgaon & Delhi-NCR real-estate guides — market trends, new-launch analysis, corridor comparisons and home-buying advice from PropertyInsta.',
        type: 'website',
        keywords: 'Gurgaon real estate, property blog, new launches 2026, home buying guide, RERA, real estate investment, Dwarka Expressway, SPR',
        canonical: origin() + '/blog',
      });
      removeJsonLd('ld-article');
      removeJsonLd('ld-breadcrumb');
      setJsonLd('ld-blog', {
        '@context': 'https://schema.org', '@type': 'Blog',
        name: 'PropertyInsta Blog',
        description: 'Real-estate insights, market trends and home-buying guides.',
        url: origin() + '/blog',
        blogPost: blogPosts.map(p => ({
          '@type': 'BlogPosting', headline: p.title, url: origin() + '/blog/' + p.slug,
          datePublished: p.isoDate, image: p.image, author: { '@type': 'Person', name: p.author },
        })),
      });
    }
    return () => {};
  }, [selectedPost]);

  const related = selectedPost
    ? blogPosts.filter(p => p.id !== selectedPost.id && (p.category === selectedPost.category || (p.tags || []).some(t => (selectedPost.tags || []).includes(t)))).slice(0, 3)
    : [];

  const videoCategories = ['All', ...new Set(productVideos.map(v => v.category).filter(Boolean))];
  const filteredVideos = activeCategory === 'All' ? productVideos : productVideos.filter(v => v.category === activeCategory);

  const podcastCategories = ['All', ...new Set(podcasts.map(p => p.category).filter(Boolean))];
  const filteredPodcasts = activeCategory === 'All' ? podcasts : podcasts.filter(p => p.category === activeCategory);

  return (
    <div id="blogView" className="">
      <div className="ig-blog-header">
        <h1>Property Insights &amp; Blog</h1>
        <p>Expert advice, market trends, and home buying guides</p>

        {/* Blog / Videos / Podcasts Tabs */}
        <div className="ig-blog-tabs">
          <button
            className={`ig-blog-tab ${activeView === 'blog' ? 'active' : ''}`}
            onClick={() => { setActiveView('blog'); setSelectedPost(null); setSelectedVideo(null); setSelectedPodcast(null); }}
          >
            📝 Blog
          </button>
          <button
            className={`ig-blog-tab ${activeView === 'videos' ? 'active' : ''}`}
            onClick={() => { setActiveView('videos'); setSelectedPost(null); setSelectedVideo(null); setSelectedPodcast(null); }}
          >
            🎬 Videos
          </button>
          <button
            className={`ig-blog-tab ${activeView === 'podcasts' ? 'active' : ''}`}
            onClick={() => { setActiveView('podcasts'); setSelectedPost(null); setSelectedVideo(null); setSelectedPodcast(null); }}
          >
            🎙️ Podcasts
          </button>
        </div>

        {/* Categories */}
        <div className="ig-blog-categories">
          {(activeView === 'blog' ? categories : activeView === 'videos' ? videoCategories : podcastCategories).map(cat => (
            <button
              key={cat}
              className={`ig-blog-cat-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {selectedVideo ? (
        <div className="ig-video-detail">
          <button className="ig-back-btn" onClick={() => setSelectedVideo(null)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to videos
          </button>
          <div className="ig-video-player">
            <video
              src={selectedVideo.videoUrl}
              controls
              autoPlay
              style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
            />
          </div>
          <div className="ig-video-info">
            <h1>{selectedVideo.title}</h1>
            <div className="ig-video-meta">
              <span>📅 {selectedVideo.date}</span>
              <span>👁️ {selectedVideo.views.toLocaleString()} views</span>
              <span>⏱️ {selectedVideo.duration}</span>
            </div>
            <p className="ig-video-desc">{selectedVideo.description}</p>
          </div>
        </div>
      ) : activeView === 'podcasts' && selectedPodcast ? (
        <div className="ig-podcast-detail">
          <button className="ig-back-btn" onClick={() => setSelectedPodcast(null)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to podcasts
          </button>
          <div className="ig-podcast-player">
            <audio controls autoPlay style={{ width: '100%', marginBottom: '20px' }}>
              <source src={selectedPodcast.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <h1>{selectedPodcast.title}</h1>
            <div className="ig-podcast-meta">
              <span>📅 {selectedPodcast.date}</span>
              <span>👂 {selectedPodcast.listens.toLocaleString()} listens</span>
              <span>⏱️ {selectedPodcast.duration}</span>
            </div>
            <p className="ig-podcast-desc">{selectedPodcast.description}</p>

            <div className="ig-podcast-guest">
              <img src={selectedPodcast.guestAvatar} alt={selectedPodcast.guest} />
              <div>
                <strong>{selectedPodcast.guest}</strong>
                <span>{selectedPodcast.guestRole}</span>
              </div>
            </div>

            <div className="ig-podcast-section">
              <h2>📄 Transcript</h2>
              <p>{selectedPodcast.transcript}</p>
            </div>

            {selectedPodcast.tags && (
              <div className="ig-podcast-tags">
                {selectedPodcast.tags.map(tag => (
                  <span key={tag} className="ig-podcast-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeView === 'podcasts' ? (
        <div className="ig-podcasts-section">
          {filteredPodcasts.length === 0 ? (
            <div className="ig-empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1z" /><path d="M10 8h4v7h-4z" /><path d="M8 17h8" /></svg>
              <h3>No podcasts found</h3>
            </div>
          ) : (
            <>
              {filteredPodcasts.filter(p => p.featured).map(podcast => (
                <div key={podcast.id} className="ig-podcast-featured">
                  <div className="ig-podcast-featured-left">
                    <div className="ig-podcast-icon">🎙️</div>
                    <div className="ig-podcast-featured-info">
                      <span className="ig-featured-badge">⭐ Featured</span>
                      <h2>{podcast.title}</h2>
                      <p>{podcast.description}</p>
                      <div className="ig-podcast-stats">
                        <span>👂 {podcast.listens.toLocaleString()}</span>
                        <span>⏱️ {podcast.duration}</span>
                      </div>
                      <button className="ig-featured-play-btn" onClick={() => setSelectedPodcast(podcast)}>
                        ▶ Play Episode
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="ig-podcast-grid">
                <h3>All Episodes</h3>
                {filteredPodcasts.filter(p => !p.featured).map(podcast => (
                  <div key={podcast.id} className="ig-podcast-card" onClick={() => setSelectedPodcast(podcast)}>
                    <div className="ig-podcast-card-icon">🎙️</div>
                    <div className="ig-podcast-card-info">
                      <h4>{podcast.title}</h4>
                      <div className="ig-podcast-card-meta">
                        <span>{podcast.guest}</span>
                      </div>
                      <div className="ig-podcast-card-stats">
                        <span>👂 {podcast.listens.toLocaleString()}</span>
                        <span>⏱️ {podcast.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : activeView === 'videos' ? (
        <div className="ig-videos-section">
          {filteredVideos.length === 0 ? (
            <div className="ig-empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
              <h3>No videos found</h3>
            </div>
          ) : (
            <>
              {/* Featured Video */}
              {filteredVideos.find(v => v.featured) && (
                <div className="ig-featured-video">
                  <div className="ig-featured-video-thumb" onClick={() => setSelectedVideo(filteredVideos.find(v => v.featured))}>
                    <img src={filteredVideos.find(v => v.featured).thumbnail} alt={filteredVideos.find(v => v.featured).title} />
                    <div className="ig-featured-video-overlay">
                      <span className="ig-play-btn">▶</span>
                    </div>
                  </div>
                  <div className="ig-featured-video-info">
                    <span className="ig-featured-badge">⭐ Featured</span>
                    <h2>{filteredVideos.find(v => v.featured).title}</h2>
                    <p>{filteredVideos.find(v => v.featured).description}</p>
                    <div className="ig-video-stats">
                      <span>👁️ {filteredVideos.find(v => v.featured).views.toLocaleString()}</span>
                      <span>⏱️ {filteredVideos.find(v => v.featured).duration}</span>
                    </div>
                    <button className="ig-featured-play-btn" onClick={() => setSelectedVideo(filteredVideos.find(v => v.featured))}>
                      ▶ Play Video
                    </button>
                  </div>
                </div>
              )}

              {/* Video Grid */}
              <div className="ig-video-grid">
                {filteredVideos.filter(v => !v.featured).map(video => (
                  <div key={video.id} className="ig-video-card" onClick={() => setSelectedVideo(video)}>
                    <div className="ig-video-thumb">
                      <img src={video.thumbnail} alt={video.title} loading="lazy" />
                      <span className="ig-play-btn-small">▶</span>
                    </div>
                    <div className="ig-video-card-info">
                      <h3>{video.title}</h3>
                      <div className="ig-video-card-stats">
                        <span>👁️ {video.views.toLocaleString()}</span>
                        <span>⏱️ {video.duration}</span>
                      </div>
                      <span className="ig-video-date">{video.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : selectedPost ? (
        <div className="ig-blog-detail">
          <button className="ig-back-btn" onClick={closePost}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to articles
          </button>
          <article className="ig-blog-article">
            <img className="ig-blog-hero-img" src={selectedPost.image} alt={selectedPost.title} />
            <div className="ig-blog-article-meta">
              <span className="ig-blog-article-cat">{selectedPost.category}</span>
              <time dateTime={selectedPost.isoDate}>{selectedPost.date}</time>
              <span>{selectedPost.readTime}</span>
            </div>
            <h1 className="ig-blog-article-title">{selectedPost.title}</h1>
            <div className="ig-blog-article-author">
              <img
                src={selectedPost.authorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'}
                alt={selectedPost.author}
                width="40"
                height="40"
              />
              <div>
                <strong>{selectedPost.author}</strong>
                <span>Property Expert</span>
              </div>
            </div>
            <div className="ig-blog-article-content">
              {selectedPost.content?.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {selectedPost.tags && (
                <div className="ig-blog-article-tags">
                  {selectedPost.tags.map(tag => (
                    <span key={tag} className="ig-blog-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {related.length > 0 && (
              <div className="ig-blog-related">
                <h2>Related reading</h2>
                <div className="ig-blog-related-grid">
                  {related.map(p => (
                    <button key={p.id} className="ig-blog-related-card" onClick={() => openPost(p)}>
                      <img src={p.image} alt={p.title} loading="lazy" />
                      <span>{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      ) : (
        <div className="ig-blog-grid">
          {filtered.length === 0 ? (
            <div className="ig-empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              <h3>No articles found</h3>
            </div>
          ) : (
            filtered.map(post => (
              <article key={post.id} className="ig-blog-card" onClick={() => openPost(post)}>
                <div className="ig-blog-card-img-wrap">
                  <img src={post.image} alt={post.title} loading="lazy" />
                  {post.category && <span className="ig-blog-card-cat">{post.category}</span>}
                </div>
                <div className="ig-blog-card-body">
                  <div className="ig-blog-card-meta">
                    <time dateTime={post.isoDate}>{post.date}</time>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="ig-blog-card-title">{post.title}</h2>
                  <p className="ig-blog-card-excerpt">{post.excerpt}</p>
                  <div className="ig-blog-card-author">
                    <img
                      src={post.authorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=30&h=30&fit=crop&crop=face'}
                      alt={post.author}
                      width="24"
                      height="24"
                    />
                    <span>{post.author}</span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
