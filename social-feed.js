class SocialMediaFeed {
    constructor() {
        this.blueskyHandle = 'greatcoltiniinc.bsky.social';
        this.youtubeChannelId = 'greatcoltiniindustries';
        
        this.feedContainer = null;
        this.heroFeedContainer = null;
        this.posts = [];
        this.heroPosts = [];
        this.maxPosts = 6;
        this.maxHeroPosts = 3;
    }

    async init() {
        this.feedContainer = document.getElementById('social-feed');
        this.heroFeedContainer = document.getElementById('hero-social-feed');
        
        if (!this.feedContainer && !this.heroFeedContainer) {
            console.warn('No social feed containers found');
            return;
        }

        if (this.feedContainer) {
            this.showLoadingState();
        }
        if (this.heroFeedContainer) {
            this.showHeroLoadingState();
        }

        await this.loadAllPosts();
        
        if (this.feedContainer) {
            this.renderPosts();
        }
        if (this.heroFeedContainer) {
            this.renderHeroPosts();
        }
    }

    showLoadingState() {
        if (this.feedContainer) {
            this.feedContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-warning" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-light">Loading latest posts...</p>
                </div>
            `;
        }
    }

    showHeroLoadingState() {
        if (this.heroFeedContainer) {
            this.heroFeedContainer.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border text-warning" role="status" style="width: 1.5rem; height: 1.5rem;">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-light small">Loading updates...</p>
                </div>
            `;
        }
    }

    async loadAllPosts() {
        const promises = [
            this.fetchBlueskyPosts()
        ];

        try {
            const results = await Promise.allSettled(promises);
            
            const allPosts = [];
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    allPosts.push(...result.value);
                }
            });

            allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            this.posts = allPosts.slice(0, this.maxPosts);
            this.heroPosts = allPosts.filter(post => post.platform === 'bluesky').slice(0, this.maxHeroPosts);

        } catch (error) {
            console.error('Error loading social media posts:', error);
            if (this.feedContainer) this.showErrorState();
            if (this.heroFeedContainer) this.showHeroErrorState();
        }
    }

    async getBlueSkyDID() {
        try {
            const response = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${this.blueskyHandle}`);
            if (response.ok) {
                const data = await response.json();
                return data.did;
            }
        } catch (error) {
            console.warn('Could not resolve BlueSky DID:', error);
        }
        return this.blueskyHandle;
    }

    async fetchBlueskyPosts() {
        try {
            const did = await this.getBlueSkyDID();
            
            const response = await fetch(`https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${this.blueskyHandle}&collection=app.bsky.feed.post&limit=10`);
            
            if (!response.ok) {
                throw new Error(`BlueSky API error: ${response.status}`);
            }

            const data = await response.json();
            
            const originalPosts = data.records.filter(record => {
                if (record.value.reply) return false;
                
                if (record.value.embed && record.value.embed.$type === 'app.bsky.embed.record') {
                    if (!record.value.text || record.value.text.trim().length === 0) return false;
                }
                
                return true;
            });

            return originalPosts.map(record => {
                const post = {
                    platform: 'bluesky',
                    id: record.uri,
                    content: record.value.text || '',
                    timestamp: record.value.createdAt,
                    url: `https://bsky.app/profile/${this.blueskyHandle}/post/${record.uri.split('/').pop()}`,
                    author: this.blueskyHandle,
                    media: []
                };

                if (record.value.embed) {
                    if (record.value.embed.$type === 'app.bsky.embed.images' && record.value.embed.images) {
                        post.media = record.value.embed.images.map(img => {
                            const cid = img.image?.ref?.$link || img.image?.cid;
                            
                            return {
                                type: 'image',
                                url: cid ? `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}` : null,
                                alt: img.alt || 'Image from BlueSky post',
                                aspectRatio: img.aspectRatio
                            };
                        }).filter(media => media.url);
                        
                    } else if (record.value.embed.$type === 'app.bsky.embed.external' && record.value.embed.external) {
                        const external = record.value.embed.external;
                        if (external.thumb) {
                            const cid = external.thumb?.ref?.$link || external.thumb?.cid;
                            
                            post.media = [{
                                type: 'external',
                                url: cid ? `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}` : null,
                                alt: external.title || 'External link preview',
                                linkUrl: external.uri,
                                title: external.title,
                                description: external.description
                            }].filter(media => media.url);
                        }
                        
                    } else if (record.value.embed.$type === 'app.bsky.embed.video' && record.value.embed.video) {
                        const cid = record.value.embed.video?.ref?.$link || record.value.embed.video?.cid;
                        
                        post.media = [{
                            type: 'video',
                            url: cid ? `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}` : null,
                            alt: 'Video from BlueSky post'
                        }].filter(media => media.url);
                    }
                    
                    if (post.media.length === 0 && record.value.embed.images) {
                        post.media = record.value.embed.images.map(img => {
                            const imageRef = img.image || img;
                            const cid = imageRef?.ref?.$link || imageRef?.cid || imageRef?.$link;
                            
                            if (cid) {
                                return {
                                    type: 'image',
                                    url: `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`,
                                    alt: img.alt || 'Image from BlueSky post'
                                };
                            }
                            return null;
                        }).filter(Boolean);
                    }
                }

                if (record.value.embed && post.media.length === 0) {
                    console.log('BlueSky embed structure not recognized:', record.value.embed);
                }

                return post;
            });

        } catch (error) {
            console.error('Error fetching BlueSky posts:', error);
            return [];
        }
    }

    async fetchYouTubeShorts() {
        try {
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${this.youtubeChannelId}`;
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=10`;
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`YouTube RSS error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error('RSS2JSON service error');
            }
            
            return data.items.slice(0, 5).map(item => {
                const videoId = item.link.match(/watch\?v=([^&]+)/)?.[1] || '';
                
                return {
                    platform: 'youtube',
                    id: videoId,
                    content: item.title,
                    description: item.description || '',
                    timestamp: item.pubDate,
                    url: item.link,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                    author: data.feed.title
                };
            });

        } catch (error) {
            console.error('Error fetching YouTube videos:', error);
            return this.getYouTubeFallbackData();
        }
    }
    
    getYouTubeFallbackData() {
        return [
            {
                platform: 'youtube',
                id: 'fallback',
                content: 'Check out my latest videos on YouTube!',
                description: 'Visit my channel for the latest Lone Survivors content',
                timestamp: new Date().toISOString(),
                url: '#youtube-link',
                thumbnail: 'assets/Library Capsule LONE SUVIVOR.png',
                author: 'Great Coltini Industries'
            }
        ];
    }

    renderPosts() {
        if (!this.feedContainer) return;
        
        if (this.posts.length === 0) {
            this.showEmptyState();
            return;
        }

        const postsHTML = this.posts.map(post => this.renderPost(post)).join('');
        
        this.feedContainer.innerHTML = `
            <div class="row">
                ${postsHTML}
            </div>
        `;
    }

    renderHeroPosts() {
        if (!this.heroFeedContainer) return;
        
        if (this.heroPosts.length === 0) {
            this.showHeroEmptyState();
            return;
        }

        const postsHTML = this.heroPosts.map(post => this.renderHeroPost(post)).join('');
        this.heroFeedContainer.innerHTML = postsHTML;
    }

    renderPost(post) {
        const timeAgo = this.getTimeAgo(post.timestamp);
        const platformIcon = this.getPlatformIcon(post.platform);
        const platformColor = this.getPlatformColor(post.platform);

        if (post.platform === 'youtube') {
            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="social-post" data-platform="${post.platform}">
                        <div class="post-header">
                            <div class="platform-badge" style="background: ${platformColor}">
                                ${platformIcon}
                                YouTube
                            </div>
                            <span class="post-time">${timeAgo}</span>
                        </div>
                        <div class="post-content">
                            <div class="youtube-thumbnail">
                                <img src="${post.thumbnail}" alt="${post.content}" class="img-fluid">
                                <div class="play-overlay">
                                    <i class="bi bi-play-fill"></i>
                                </div>
                            </div>
                            <h6 class="post-title">${this.truncateText(post.content, 60)}</h6>
                        </div>
                        <div class="post-footer">
                            <a href="${post.url}" target="_blank" class="btn btn-sm btn-outline-light">
                                Watch Short
                                <i class="bi bi-external-link ms-1"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const mediaHTML = this.renderBlueSkyMedia(post.media || []);
            
            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="social-post" data-platform="${post.platform}">
                        <div class="post-header">
                            <div class="platform-badge" style="background: ${platformColor}">
                                ${platformIcon}
                                BlueSky
                            </div>
                            <span class="post-time">${timeAgo}</span>
                        </div>
                        <div class="post-content">
                            ${mediaHTML}
                            ${post.content ? `<p class="post-text">${this.truncateText(post.content, 150)}</p>` : ''}
                        </div>
                        <div class="post-footer">
                            <a href="${post.url}" target="_blank" class="btn btn-sm btn-outline-light">
                                View Post
                                <i class="bi bi-external-link ms-1"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderBlueSkyMedia(media) {
        if (!media || media.length === 0) return '';
        
        return media.map(item => {
            if (item.type === 'image') {
                return `
                    <div class="bluesky-media mb-2">
                        <img src="${item.url}" alt="${item.alt}" class="img-fluid rounded bluesky-image" loading="lazy">
                    </div>
                `;
            } else if (item.type === 'video') {
                return `
                    <div class="bluesky-media mb-2">
                        <video controls class="img-fluid rounded bluesky-video" preload="metadata">
                            <source src="${item.url}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                `;
            } else if (item.type === 'external' && item.url) {
                return `
                    <div class="bluesky-media mb-2">
                        <a href="${item.linkUrl}" target="_blank" class="external-link-preview">
                            <img src="${item.url}" alt="${item.alt}" class="img-fluid rounded bluesky-external">
                            ${item.title ? `<div class="external-title">${item.title}</div>` : ''}
                        </a>
                    </div>
                `;
            }
            return '';
        }).join('');
    }

    getPlatformIcon(platform) {
        const icons = {
            'bluesky': '<i class="bi bi-cloud"></i>',
            'youtube': '<i class="bi bi-youtube"></i>'
        };
        return icons[platform] || '<i class="bi bi-chat"></i>';
    }

    getPlatformColor(platform) {
        const colors = {
            'bluesky': '#1DA1F2',
            'youtube': '#FF0000'
        };
        return colors[platform] || '#6c757d';
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    renderHeroPost(post) {
        const timeAgo = this.getTimeAgo(post.timestamp);
        const mediaHTML = this.renderHeroBlueSkyMedia(post.media || []);
        
        return `
            <div class="hero-social-post">
                <div class="hero-post-header">
                    <div class="hero-platform-badge">
                        <i class="bi bi-cloud"></i>
                        BlueSky
                    </div>
                    <span class="hero-post-time">${timeAgo}</span>
                </div>
                <div class="hero-post-content">
                    ${mediaHTML}
                    ${post.content ? `<p class="hero-post-text">${this.truncateText(post.content, 120)}</p>` : ''}
                </div>
                <div class="hero-post-footer">
                    <a href="${post.url}" target="_blank" class="btn btn-sm btn-outline-light">
                        View <i class="bi bi-external-link ms-1"></i>
                    </a>
                </div>
            </div>
        `;
    }

    renderHeroBlueSkyMedia(media) {
        if (!media || media.length === 0) return '';
        
        const item = media[0];
        
        if (item.type === 'image') {
            return `
                <div class="hero-bluesky-media mb-2">
                    <img src="${item.url}" alt="${item.alt}" class="hero-bluesky-image" loading="lazy">
                </div>
            `;
        } else if (item.type === 'external' && item.url) {
            return `
                <div class="hero-bluesky-media mb-2">
                    <img src="${item.url}" alt="${item.alt}" class="hero-bluesky-image">
                </div>
            `;
        }
        return '';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const postTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        const diffInWeeks = Math.floor(diffInDays / 7);
        return `${diffInWeeks}w ago`;
    }

    showErrorState() {
        this.feedContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-exclamation-triangle text-warning fs-1"></i>
                <p class="mt-2 text-light">Unable to load social media posts</p>
                <button class="btn btn-outline-warning btn-sm" onclick="socialFeed.init()">
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Try Again
                </button>
            </div>
        `;
    }

    showEmptyState() {
        if (this.feedContainer) {
            this.feedContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-chat-dots text-muted fs-1"></i>
                    <p class="mt-2 text-light">No recent posts found</p>
                </div>
            `;
        }
    }

    showHeroErrorState() {
        if (this.heroFeedContainer) {
            this.heroFeedContainer.innerHTML = `
                <div class="text-center py-3">
                    <i class="bi bi-exclamation-triangle text-warning fs-4"></i>
                    <p class="mt-2 text-light small">Unable to load updates</p>
                    <button class="btn btn-outline-warning btn-sm" onclick="socialFeed.init()">
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        Retry
                    </button>
                </div>
            `;
        }
    }

    showHeroEmptyState() {
        if (this.heroFeedContainer) {
            this.heroFeedContainer.innerHTML = `
                <div class="text-center py-3">
                    <i class="bi bi-chat-dots text-muted fs-4"></i>
                    <p class="mt-2 text-light small">No recent updates found</p>
                </div>
            `;
        }
    }

    async refresh() {
        await this.init();
    }
}

let socialFeed;
document.addEventListener('DOMContentLoaded', function() {
    socialFeed = new SocialMediaFeed();
    
    socialFeed.init();
    
    setInterval(() => {
        if (socialFeed) {
            socialFeed.refresh();
        }
    }, 300000);
});

window.refreshSocialFeed = () => {
    if (socialFeed) {
        socialFeed.refresh();
    }
};