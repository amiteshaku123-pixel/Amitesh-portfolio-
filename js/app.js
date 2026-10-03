// Vyom 3D Lok - Core SPA Controller & State Management

(function () {
  // Global Application State (persisted via localStorage)
  let state = {
    user: {
      loggedIn: false,
      username: "Guest",
      xp: 150,
      level: 1,
      uploadedVideos: [],
      followingCreators: ["StudioKaze"],
      savedVideos: []
    },
    currentVideoId: null,
    currentBlogId: null,
    currentDashTab: "profile"
  };

  // Toast System Helper
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-holder");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast ${type === 'success' ? 'glass glow-cyan-hover' : 'glass glow-purple-hover'}`;
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("removing");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Load state from localStorage on init
  function loadState() {
    const saved = localStorage.getItem("vyom_user_state");
    if (saved) {
      try {
        state.user = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing user state", e);
      }
    }
  }

  // Sync state to localStorage and update navbar UI
  function syncState() {
    localStorage.setItem("vyom_user_state", JSON.stringify(state.user));
    updateNavbarUI();
  }

  // XP Progression Helper
  function gainXP(amount, actionName = "interaction") {
    state.user.xp += amount;
    showToast(`+${amount} XP gained for ${actionName}! ⚡`, "success");
    
    // Level up calculation: 500 XP per level
    const targetLevel = Math.floor(state.user.xp / 500) + 1;
    if (targetLevel > state.user.level) {
      state.user.level = targetLevel;
      showToast(`🎉 LEVEL UP! You reached Level ${state.user.level}! 🚀`, "success");
    }
    syncState();
  }

  // Navbar Dynamic rendering
  function updateNavbarUI() {
    const authWrapper = document.getElementById("auth-nav-wrapper");
    if (!authWrapper) return;

    if (state.user.loggedIn) {
      authWrapper.innerHTML = `
        <div class="xp-pill">
          <span>⚡ Level ${state.user.level}</span>
          <span style="opacity: 0.7; font-size: 0.75rem;">(${state.user.xp % 500}/500 XP)</span>
        </div>
        <button class="btn-dashboard-nav" onclick="location.hash='#dashboard'">
          <span>🎮 Dashboard</span>
        </button>
        <button class="btn-login" id="btn-logout-trigger" style="border-color: var(--accent-pink); color: var(--accent-pink);">Logout</button>
      `;
      // Bind logout trigger
      document.getElementById("btn-logout-trigger").addEventListener("click", () => {
        state.user.loggedIn = false;
        state.user.username = "Guest";
        state.user.xp = 150;
        state.user.level = 1;
        state.user.uploadedVideos = [];
        syncState();
        showToast("Logged out successfully.", "info");
        location.hash = "#home";
      });
    } else {
      authWrapper.innerHTML = `
        <button class="btn-login" id="btn-login-nav-trigger">Login / Join</button>
      `;
      document.getElementById("btn-login-nav-trigger").addEventListener("click", () => {
        openModal("auth-modal");
      });
    }
  }

  // ==========================================================================
  // SPA ROUTER
  // ==========================================================================
  function router() {
    const hash = window.location.hash || "#home";
    const appEl = document.getElementById("app-content");
    appEl.style.opacity = 0; // Fade out

    // Helper: update active links in Navbar
    const links = document.querySelectorAll(".nav-links a, .mobile-nav-links a");
    links.forEach(link => {
      const href = link.getAttribute("href");
      if (href && hash.startsWith(href)) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    setTimeout(() => {
      if (hash === "#home" || hash === "") {
        renderHome(appEl);
      } else if (hash === "#animations") {
        renderAnimations(appEl);
      } else if (hash.startsWith("#video")) {
        const urlParams = new URLSearchParams(hash.split("?")[1]);
        const id = urlParams.get("id");
        renderVideoPlayer(appEl, id);
      } else if (hash === "#games") {
        renderGames(appEl);
      } else if (hash === "#community") {
        renderCommunity(appEl);
      } else if (hash === "#blogs") {
        renderBlogs(appEl);
      } else if (hash.startsWith("#blog-read")) {
        const urlParams = new URLSearchParams(hash.split("?")[1]);
        const id = urlParams.get("id");
        renderBlogRead(appEl, id);
      } else if (hash === "#dashboard") {
        if (!state.user.loggedIn) {
          showToast("Please login to view your dashboard", "info");
          location.hash = "#home";
          openModal("auth-modal");
          return;
        }
        renderDashboard(appEl);
      } else if (hash === "#admin") {
        renderAdmin(appEl);
      } else {
        appEl.innerHTML = `<div class="page-view section-wrapper text-center"><h2>Page Not Found</h2><p>Entering parallel dimension failed.</p></div>`;
      }
      appEl.style.opacity = 1; // Fade back in
      window.scrollTo(0, 0);
    }, 200);
  }

  // ==========================================================================
  // VIEW RENDERERS
  // ==========================================================================

  // 1. HOME VIEW
  function renderHome(container) {
    // Generate featured video list, games, and creators template content
    const featuredVideos = window.VYOM_DATA.videos.slice(0, 3);
    const featuredGames = window.VYOM_DATA.games;
    const spotlights = window.VYOM_DATA.creators.slice(0, 4);

    let videosHtml = "";
    featuredVideos.forEach(v => {
      videosHtml += `
        <div class="video-card" onclick="location.hash='#video?id=${v.id}'">
          <div class="video-thumb-container">
            <img src="${v.thumbnail}" class="video-thumb-img" alt="${v.title}">
            <div class="video-overlay-glow"></div>
            <div class="video-duration">${v.duration}</div>
            <div class="video-play-btn"><i class="lucide-play">▶</i></div>
          </div>
          <div class="video-meta">
            <span class="video-category-tag">${v.category}</span>
            <h3 class="video-title">${v.title}</h3>
            <div class="video-author-views">
              <span>${v.creatorName}</span>
              <span>${v.views} views</span>
            </div>
          </div>
        </div>
      `;
    });

    let gamesHtml = "";
    featuredGames.forEach(g => {
      gamesHtml += `
        <div class="game-card">
          <img src="${g.banner}" class="game-banner-img" alt="${g.title}">
          <div class="game-shade"></div>
          <div class="game-card-content">
            <span class="game-status-badge">${g.status}</span>
            <h3 class="game-card-title">${g.title}</h3>
            <div class="game-card-genre">${g.genre} | ${g.platform}</div>
            <p class="game-card-desc">${g.description}</p>
            <button class="btn-game-trailer" onclick="window.playGameTrailer('${g.id}')">
              <span>▶ Watch Trailer</span>
            </button>
          </div>
        </div>
      `;
    });

    let creatorsHtml = "";
    spotlights.forEach(c => {
      const isFollowing = state.user.followingCreators.includes(c.username);
      creatorsHtml += `
        <div class="creator-card glass glow-purple-hover">
          <div class="creator-avatar-wrap">
            <img src="${c.avatar}" class="creator-avatar" alt="${c.username}">
          </div>
          <h4 class="creator-username">${c.username}</h4>
          <div class="creator-skill-tags">
            ${c.skills.map(s => `<span class="creator-skill-tag">${s}</span>`).join("")}
          </div>
          <div class="creator-followers">${c.followers} Followers</div>
          <button class="btn-creator-follow ${isFollowing ? 'following' : ''}" onclick="window.toggleFollowCreator('${c.username}', this)">
            ${isFollowing ? 'Following' : '+ Follow'}
          </button>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="page-view">
        <!-- Hero Section -->
        <section class="hero-section">
          <div class="hero-glow-sphere"></div>
          <div class="hero-content">
            <span class="hero-subtitle-tag">Enter The Digital Universe</span>
            <h1 class="hero-title text-gradient-neon">VYOM 3D LOK</h1>
            <p class="hero-desc">The next-generation realm where cinematic animation, futuristic game titles, and high-tier digital creators collide.</p>
            <div class="hero-actions">
              <button class="btn-primary" onclick="location.hash='#animations'">Explore Animations</button>
              <button class="btn-secondary" onclick="location.hash='#games'">Explore Games</button>
              <button class="btn-secondary" onclick="location.hash='#community'">Join Forums</button>
            </div>
          </div>
          <div class="scroll-indicator">
            <span>Scroll</span>
            <div class="mouse-icon"><div class="mouse-wheel"></div></div>
          </div>
        </section>

        <!-- Featured Animations -->
        <section class="section-wrapper">
          <div class="section-header">
            <div>
              <span class="section-tag">Cinematic Library</span>
              <h2 class="section-title">Trending Animations</h2>
            </div>
            <a href="#animations" class="section-link">View All Animations →</a>
          </div>
          <div class="animation-grid">${videosHtml}</div>
        </section>

        <!-- Premium Game Showcase -->
        <section class="section-wrapper" style="background: rgba(255,255,255,0.01); border-top: 1px solid var(--border-glass); border-bottom: 1px solid var(--border-glass);">
          <div class="section-header">
            <div>
              <span class="section-tag">Vyom Gaming Studios</span>
              <h2 class="section-title">Future Releases Showcase</h2>
            </div>
            <a href="#games" class="section-link">Explore Gameplay →</a>
          </div>
          <div class="games-grid">${gamesHtml}</div>
        </section>

        <!-- Creator Spotlight -->
        <section class="section-wrapper">
          <div class="section-header">
            <div>
              <span class="section-tag">Legendary Artisans</span>
              <h2 class="section-title">Creator Spotlight</h2>
            </div>
          </div>
          <div class="creators-grid">${creatorsHtml}</div>
        </section>

        <!-- Newsletter Sub -->
        <section class="newsletter-wrapper glass glow-cyan-hover">
          <div class="newsletter-glow"></div>
          <h2 class="newsletter-heading">Join the Cosmic Network</h2>
          <p class="newsletter-desc">Subscribe to get early beta codes for Vyom games, node shader updates, and creator alerts.</p>
          <form class="newsletter-form" onsubmit="event.preventDefault(); window.subscribeNewsletter(this);">
            <input type="email" class="newsletter-input" placeholder="Enter your cyber email..." required>
            <button type="submit" class="btn-primary">Subscribe</button>
          </form>
        </section>
      </div>
    `;
  }

  // 2. VIDEO LIBRARY
  function renderAnimations(container) {
    const list = window.VYOM_DATA.videos;
    let videosHtml = "";
    list.forEach(v => {
      videosHtml += `
        <div class="video-card" onclick="location.hash='#video?id=${v.id}'">
          <div class="video-thumb-container">
            <img src="${v.thumbnail}" class="video-thumb-img" alt="${v.title}">
            <div class="video-overlay-glow"></div>
            <div class="video-duration">${v.duration}</div>
            <div class="video-play-btn"><i class="lucide-play">▶</i></div>
          </div>
          <div class="video-meta">
            <span class="video-category-tag">${v.category}</span>
            <h3 class="video-title">${v.title}</h3>
            <div class="video-author-views">
              <span>${v.creatorName}</span>
              <span>${v.views} views</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="page-view section-wrapper">
        <div class="section-header">
          <div>
            <span class="section-tag">CREATOR ECOSYSTEM</span>
            <h2 class="section-title">Animation Library</h2>
          </div>
        </div>

        <div class="library-filters">
          <div class="filter-categories">
            <button class="btn-filter-tag active" onclick="window.filterVideos('All', this)">All Clips</button>
            <button class="btn-filter-tag" onclick="window.filterVideos('Anime', this)">Anime</button>
            <button class="btn-filter-tag" onclick="window.filterVideos('Gaming edits', this)">Gaming Edits</button>
            <button class="btn-filter-tag" onclick="window.filterVideos('Cinematic', this)">Cinematics</button>
            <button class="btn-filter-tag" onclick="window.filterVideos('Tutorials', this)">Tutorials</button>
          </div>
          <div class="library-search-wrap">
            <input type="text" class="search-input" id="search-video-lib" placeholder="Search title or tag..." onkeyup="window.searchVideos(this.value)">
          </div>
        </div>

        <div class="animation-grid" id="lib-videos-grid">${videosHtml}</div>
      </div>
    `;
  }

  // 3. CINEMATIC VIDEO PLAYER PAGE
  function renderVideoPlayer(container, id) {
    const video = window.VYOM_DATA.videos.find(v => v.id === id) || window.VYOM_DATA.videos[0];
    
    // Increment views mock
    const viewsNum = parseFloat(video.views) + 0.1;
    video.views = viewsNum.toFixed(1) + "K";

    // Build comments list
    let commentsHtml = "";
    video.comments.forEach(cm => {
      commentsHtml += `
        <div class="comment-item">
          <div>
            <div class="comment-author">${cm.user}<span class="comment-time">${cm.time || 'Just now'}</span></div>
            <div class="comment-text">${cm.text}</div>
          </div>
        </div>
      `;
    });

    // Build sidebar recommendations
    const recs = window.VYOM_DATA.videos.filter(v => v.id !== video.id).slice(0, 4);
    let sidebarHtml = "";
    recs.forEach(v => {
      sidebarHtml += `
        <div class="recommend-item" onclick="location.hash='#video?id=${v.id}'">
          <div class="recommend-thumb">
            <img src="${v.thumbnail}" class="recommend-thumb-img" alt="${v.title}">
          </div>
          <div class="recommend-info">
            <h4 class="recommend-item-title">${v.title}</h4>
            <div class="recommend-creator">${v.creatorName}</div>
            <div class="recommend-views">${v.views} views</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="page-view player-layout">
        <!-- Main Column -->
        <div class="player-main-block">
          <div class="video-player-wrapper">
            <video class="main-video-player" src="${video.videoUrl}" controls autoplay loop muted></video>
          </div>
          
          <div class="video-detail-meta">
            <div class="video-detail-tags">
              ${video.tags.map(t => `<span class="video-detail-tag">#${t}</span>`).join(" ")}
            </div>
            <h1 class="video-detail-title">${video.title}</h1>
            <div class="video-actions-toolbar">
              <div class="video-stats">
                <span>${video.views} views</span> • <span>${video.category}</span>
              </div>
              <div class="video-interact-actions">
                <button class="btn-video-action active" onclick="window.likeVideo('${video.id}', this)">
                  <span>👍 ${video.likes}</span>
                </button>
                <button class="btn-video-action" onclick="window.saveVideo('${video.id}', this)">
                  <span>⭐ Save</span>
                </button>
              </div>
            </div>
          </div>

          <div class="player-creator-row">
            <div class="creator-profile-info">
              <img src="https://images.unsplash.com/photo-1618077360395-f3068be8e001?auto=format&fit=crop&w=150&q=80" class="creator-avatar-l" alt="${video.creatorName}">
              <div>
                <div class="creator-name-txt">${video.creatorName}</div>
                <div class="creator-subs-count">Creator Verified</div>
              </div>
            </div>
            <button class="btn-primary" style="padding: 8px 20px; font-size: 0.85rem;" onclick="gainXP(20, 'subscribing to creator')">Subscribe</button>
          </div>

          <div class="video-description-box">
            ${video.description}
          </div>

          <div class="comments-container glass" style="padding: 25px;">
            <h3 class="comments-header-title">Discussion Forums (${video.comments.length})</h3>
            <form class="comment-submit-form" onsubmit="event.preventDefault(); window.addComment('${video.id}');">
              <textarea class="comment-input" id="new-comment-txt" placeholder="Add a public comment..." required></textarea>
              <button type="submit" class="btn-comment-submit">Comment</button>
            </form>
            <div class="comments-list" id="video-comments-list">${commentsHtml}</div>
          </div>
        </div>

        <!-- Sidebar Recommendations -->
        <div class="player-sidebar">
          <h3 class="sidebar-title">Recommended Animations</h3>
          ${sidebarHtml}
        </div>
      </div>
    `;
  }

  // 4. GAME SHOWCASE PAGE
  function renderGames(appEl) {
    const list = window.VYOM_DATA.games;
    let listHtml = "";
    list.forEach(g => {
      listHtml += `
        <div class="game-card" style="aspect-ratio: auto; min-height: 480px;">
          <img src="${g.banner}" class="game-banner-img" alt="${g.title}" style="height: 250px;">
          <div class="game-shade"></div>
          <div class="game-card-content" style="position: relative; padding: 25px; background: rgba(7,7,11,0.95); border-top: 1px solid var(--border-glass);">
            <span class="game-status-badge">${g.status}</span>
            <h3 class="game-card-title">${g.title}</h3>
            <div class="game-card-genre" style="margin-bottom: 10px;">${g.genre} | ${g.platform}</div>
            <p class="game-card-desc" style="display: block; -webkit-line-clamp: none; margin-bottom: 20px;">${g.description}</p>
            <button class="btn-primary" onclick="window.playGameTrailer('${g.id}')">
              <span>▶ Play Trailer Demo</span>
            </button>
          </div>
        </div>
      `;
    });

    appEl.innerHTML = `
      <div class="page-view section-wrapper">
        <div class="section-header">
          <div>
            <span class="section-tag">VYOM GAMING PLATFORM</span>
            <h2 class="section-title">Games & Playtests</h2>
          </div>
        </div>
        <div class="games-grid">${listHtml}</div>
      </div>
    `;
  }

  // 5. COMMUNITY VIEW (Feed + Leaderboard)
  function renderCommunity(appEl) {
    const posts = window.VYOM_DATA.posts;
    const leads = window.VYOM_DATA.leaderboard;

    let feedHtml = "";
    posts.forEach(p => {
      feedHtml += `
        <div class="forum-preview-card glass glow-purple-hover" style="margin-bottom: 20px;">
          <div class="forum-preview-header">
            <img src="${p.avatar}" class="forum-avatar" alt="${p.author}">
            <div>
              <div class="forum-poster-name">${p.author}</div>
              <div class="forum-post-time">${p.time} in <span style="color: var(--accent-cyan);">${p.category}</span></div>
            </div>
          </div>
          <div class="forum-preview-content">${p.content}</div>
          ${p.media ? `<img src="${p.media}" class="forum-preview-media" alt="post asset">` : ""}
          <div class="forum-preview-footer">
            <div class="forum-reactions">
              <button class="btn-reaction" onclick="window.reactPost('${p.id}', 'like', this)">👍 <span>${p.reactions.like}</span></button>
              <button class="btn-reaction" onclick="window.reactPost('${p.id}', 'rocket', this)">🚀 <span>${p.reactions.rocket || 0}</span></button>
            </div>
            <span class="forum-comments-count">${p.commentsCount} comments</span>
          </div>
        </div>
      `;
    });

    let boardHtml = "";
    leads.forEach(l => {
      boardHtml += `
        <div class="leaderboard-item">
          <div class="leaderboard-rank-name">
            <div class="leaderboard-rank">${l.rank}</div>
            <div class="leaderboard-username">${l.name}</div>
          </div>
          <div class="leaderboard-lvl-xp">
            <div class="leaderboard-level">Lvl ${l.level}</div>
            <div class="leaderboard-xp">${l.xp} XP</div>
          </div>
        </div>
      `;
    });

    appEl.innerHTML = `
      <div class="page-view community-feed-layout">
        <!-- Left panel - User Stats -->
        <div class="comm-left-panel">
          <div class="community-profile-widget glass">
            <div class="community-level-circle">
              <span class="level-number">${state.user.loggedIn ? state.user.level : 1}</span>
              <span class="xp-label">Level</span>
            </div>
            <h4 style="font-weight: 700;">${state.user.username}</h4>
            <div class="xp-progress-bar-wrap">
              <div class="xp-progress-bar-fill" style="width: ${(state.user.xp % 500) / 5}%"></div>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px;">
              ${state.user.xp} Total XP
            </div>
          </div>
          
          <div class="glass" style="padding: 20px;">
            <h4 style="margin-bottom: 12px; font-weight: 700;">XP Guide</h4>
            <ul style="font-size: 0.85rem; color: var(--text-secondary); padding-left: 15px; display:flex; flex-direction:column; gap:8px;">
              <li>Leave a video comment (+30 XP)</li>
              <li>Publish forum post (+60 XP)</li>
              <li>Upload a new video (+100 XP)</li>
              <li>Subscribe/Follow (+20 XP)</li>
            </ul>
          </div>
        </div>

        <!-- Middle panel - Post Creator & Feed -->
        <div class="feed-mid-panel">
          <div class="feed-share-card glass">
            <div class="share-input-row">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" class="share-avatar" alt="avatar">
              <textarea class="share-textarea" id="new-post-txt" placeholder="Share fan art, game concepts, or write updates..." required></textarea>
            </div>
            <div class="share-actions-row">
              <label class="share-media-trigger" onclick="window.attachMockMedia()">
                📷 Add Artwork (Mock)
              </label>
              <button class="btn-post-submit" onclick="window.createPost()">Post</button>
            </div>
          </div>
          <div id="posts-feed-wrapper">${feedHtml}</div>
        </div>

        <!-- Right panel - Leaderboard -->
        <div class="comm-right-panel">
          <div class="leaderboard-widget glass">
            <h3 class="leaderboard-title">🏆 Top Sentinels</h3>
            <div class="leaderboard-list">${boardHtml}</div>
          </div>
        </div>
      </div>
    `;
  }

  // 6. BLOGS LIST VIEW
  function renderBlogs(appEl) {
    const featured = window.VYOM_DATA.blogs[0];
    const list = window.VYOM_DATA.blogs.slice(1);

    let listHtml = "";
    list.forEach(b => {
      listHtml += `
        <div class="blog-card glass" onclick="location.hash='#blog-read?id=${b.id}'">
          <img src="${b.cover}" class="blog-card-cover" alt="${b.title}">
          <div class="blog-card-content">
            <span class="blogs-hero-tag">${b.category}</span>
            <h3 class="video-title" style="white-space: normal; font-size: 1.1rem; line-height: 1.4; margin-bottom: 12px;">${b.title}</h3>
            <div class="blogs-hero-meta">
              <span>By ${b.author}</span> • <span>${b.readTime}</span>
            </div>
          </div>
        </div>
      `;
    });

    appEl.innerHTML = `
      <div class="page-view section-wrapper">
        <div class="section-header">
          <div>
            <span class="section-tag">Vyom Chronicles</span>
            <h2 class="section-title">Blogs & Tech News</h2>
          </div>
          <button class="btn-primary" style="padding: 8px 18px; font-size: 0.85rem;" onclick="window.openBlogEditor()">📝 Write Blog</button>
        </div>

        <!-- Featured Big Blog Card -->
        <div class="blogs-hero-card glass" onclick="location.hash='#blog-read?id=${featured.id}'">
          <img src="${featured.cover}" class="blogs-hero-cover" alt="${featured.title}">
          <div class="blogs-hero-content">
            <span class="blogs-hero-tag">FEATURED ${featured.category}</span>
            <h2 class="blogs-hero-title text-gradient-cyan">${featured.title}</h2>
            <p class="blogs-hero-desc">How real-time pipelines and GPU advancements allow single independent animators to build AAA visual frames...</p>
            <div class="blogs-hero-meta">
              <span>By ${featured.author}</span> • <span>${featured.date}</span> • <span>${featured.readTime}</span>
            </div>
          </div>
        </div>

        <!-- Blogs grid -->
        <div class="blogs-grid">${listHtml}</div>
      </div>
    `;
  }

  // 7. BLOG READING PAGE
  function renderBlogRead(appEl, id) {
    const blog = window.VYOM_DATA.blogs.find(b => b.id === id) || window.VYOM_DATA.blogs[0];

    appEl.innerHTML = `
      <div class="page-view blog-reading-container">
        <div class="blog-progress-bar-container">
          <div class="blog-progress-bar" id="blog-reading-scroll-bar"></div>
        </div>

        <div class="blog-read-header">
          <span class="blogs-hero-tag">${blog.category}</span>
          <h1 class="blog-read-title">${blog.title}</h1>
          <div class="blog-read-meta">
            <span>By <strong>${blog.author}</strong></span> • <span>${blog.date}</span> • <span>${blog.readTime}</span>
          </div>
        </div>

        <img src="${blog.cover}" class="blog-read-cover" alt="cover">

        <div class="blog-read-content glass" style="padding: 40px; margin-bottom: 40px;">
          ${blog.content.replace(/\n/g, "<br>").replace(/## (.*)/g, "<h2>$1</h2>").replace(/### (.*)/g, "<h3>$1</h3>")}
        </div>

        <div style="text-align: center;">
          <button class="btn-video-action" onclick="window.likeBlog('${blog.id}', this)" style="display: inline-flex; margin-right: 10px;">
            👍 Like Article (${blog.likes})
          </button>
          <button class="btn-secondary" onclick="location.hash='#blogs'">Back to Chronicles</button>
        </div>
      </div>
    `;

    // Hook scroll event for reading progress bar
    window.addEventListener("scroll", updateReadingProgress);
  }

  function updateReadingProgress() {
    const scrollBar = document.getElementById("blog-reading-scroll-bar");
    if (!scrollBar) {
      window.removeEventListener("scroll", updateReadingProgress);
      return;
    }
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    scrollBar.style.width = scrolled + "%";
  }

  // 8. CREATOR DASHBOARD RENDER
  function renderDashboard(appEl) {
    let tabContent = "";
    
    if (state.currentDashTab === "profile") {
      tabContent = `
        <div class="glass" style="padding: 30px;">
          <h3 style="margin-bottom: 20px; font-weight: 700;">Sentinel Control Center</h3>
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 25px; flex-wrap: wrap;">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--accent-cyan);" alt="avatar">
            <div>
              <h2 style="font-weight: 700;">${state.user.username}</h2>
              <div style="color: var(--accent-cyan); font-weight: 600; font-size: 0.95rem;">Rank: Novice Sentinel</div>
            </div>
          </div>

          <div style="max-width: 400px;">
            <form onsubmit="event.preventDefault(); window.saveDashboardProfile();">
              <div class="form-group">
                <label class="form-label">Cosmic Tag / Username</label>
                <input type="text" class="form-input" id="dash-username-input" value="${state.user.username}" required>
              </div>
              <button type="submit" class="btn-primary" style="padding: 10px 20px; font-size: 0.9rem;">Save Updates</button>
            </form>
          </div>
        </div>
      `;
    } else if (state.currentDashTab === "uploads") {
      let uploadItems = "";
      if (state.user.uploadedVideos.length === 0) {
        uploadItems = `<p style="color: var(--text-muted);">No cosmic frames submitted yet. Become a pioneer animator!</p>`;
      } else {
        state.user.uploadedVideos.forEach(v => {
          uploadItems += `
            <div class="leaderboard-item" style="padding: 15px; margin-bottom: 10px;">
              <div>
                <strong style="color: var(--accent-cyan);">${v.title}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${v.category} • Pending Moderator Review</div>
              </div>
              <div>⚡ Under Scan</div>
            </div>
          `;
        });
      }

      tabContent = `
        <div class="glass" style="padding: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h3 style="font-weight: 700;">My Visual Submissions</h3>
            <button class="btn-primary" style="padding: 8px 16px; font-size: 0.85rem;" onclick="window.openVideoUploadModal()">Upload Animation</button>
          </div>
          <div>${uploadItems}</div>
        </div>
      `;
    } else if (state.currentDashTab === "achievements") {
      let badgeList = "";
      window.VYOM_DATA.badges.forEach(b => {
        badgeList += `
          <div class="badge-item-card glass glow-purple-hover">
            <div class="badge-item-icon">${b.icon}</div>
            <div class="badge-item-name">${b.name}</div>
            <div class="badge-item-desc">${b.desc}</div>
          </div>
        `;
      });

      tabContent = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <h3 style="font-weight: 700;">Badges Room</h3>
          <div class="badges-bento-grid">${badgeList}</div>
        </div>
      `;
    } else if (state.currentDashTab === "monetize") {
      tabContent = `
        <div class="glass" style="padding: 30px;">
          <h3 style="margin-bottom: 20px; font-weight: 700;">Creator Revenue Center</h3>
          
          <div class="dash-stats-grid" style="margin-bottom: 30px;">
            <div class="dash-stat-card glass" style="background: rgba(0, 188, 212, 0.03);">
              <div class="stat-label">Total Subscriptions</div>
              <div class="stat-val-row">
                <div class="stat-value">0</div>
                <div class="stat-trend">Novice Tier</div>
              </div>
            </div>
            <div class="dash-stat-card glass" style="background: rgba(123, 31, 162, 0.03);">
              <div class="stat-label">Monthly Revenue</div>
              <div class="stat-value">$0.00</div>
            </div>
            <div class="dash-stat-card glass">
              <div class="stat-label">Vyom Vault points</div>
              <div class="stat-value">0</div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-glass); padding-top: 25px;">
            <h4 style="margin-bottom: 12px; font-weight: 700;">Join Creator Partner Program</h4>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px;">
              Requires Level 5 (XP: 2500) and at least 3 uploaded animations with approval to apply for monetization streams.
            </p>
            <button class="btn-primary" disabled style="opacity: 0.5; cursor: not-allowed;">Unlock Vault Partner</button>
          </div>
        </div>
      `;
    }

    appEl.innerHTML = `
      <div class="page-view dashboard-layout">
        <!-- Dash Side navigation -->
        <div class="dashboard-sidebar-menu">
          <button class="btn-dash-tab ${state.currentDashTab === 'profile' ? 'active' : ''}" onclick="window.switchDashTab('profile')">👤 My Profile</button>
          <button class="btn-dash-tab ${state.currentDashTab === 'uploads' ? 'active' : ''}" onclick="window.switchDashTab('uploads')">🎬 Video Uploads</button>
          <button class="btn-dash-tab ${state.currentDashTab === 'achievements' ? 'active' : ''}" onclick="window.switchDashTab('achievements')">🏆 Badges Room</button>
          <button class="btn-dash-tab ${state.currentDashTab === 'monetize' ? 'active' : ''}" onclick="window.switchDashTab('monetize')">💎 Vault & Revenue</button>
          <button class="btn-dash-tab" onclick="location.hash='#admin'">⚙ Admin Panel</button>
        </div>

        <!-- Dash main layout -->
        <div class="dashboard-main-content">
          <div class="dashboard-header-row">
            <h2 class="dashboard-title-heading">Control Center</h2>
            <div style="font-size: 0.9rem; color: var(--text-muted);">Sentinel Status: <span style="color: var(--accent-cyan); font-weight: 600;">ACTIVE</span></div>
          </div>

          <!-- Quick Stats row -->
          <div class="dash-stats-grid">
            <div class="dash-stat-card glass">
              <div class="stat-label">Sentinel Level</div>
              <div class="stat-value">${state.user.level}</div>
            </div>
            <div class="dash-stat-card glass">
              <div class="stat-label">Total XP</div>
              <div class="stat-value">${state.user.xp}</div>
            </div>
            <div class="dash-stat-card glass">
              <div class="stat-label">Followed Creators</div>
              <div class="stat-value">${state.user.followingCreators.length}</div>
            </div>
          </div>

          <!-- Dynamic Tab panel content -->
          <div id="dash-tab-content-panel">${tabContent}</div>
        </div>
      </div>
    `;
  }

  // 9. ADMIN PANEL RENDER
  function renderAdmin(appEl) {
    appEl.innerHTML = `
      <div class="page-view section-wrapper">
        <div class="section-header">
          <div>
            <span class="section-tag">Vyom Analytics Server</span>
            <h2 class="section-title">Superuser Dashboard</h2>
          </div>
          <button class="btn-secondary" onclick="location.hash='#dashboard'">Back to Sentinel Hub</button>
        </div>

        <div class="dash-stats-grid" style="margin-bottom: 30px;">
          <div class="dash-stat-card glass">
            <div class="stat-label">System Bandwidth</div>
            <div class="stat-value">99.8%</div>
          </div>
          <div class="dash-stat-card glass">
            <div class="stat-label">Pending Videos Scan</div>
            <div class="stat-value" id="admin-pending-count">${state.user.uploadedVideos.length}</div>
          </div>
          <div class="dash-stat-card glass">
            <div class="stat-label">Global Active Users</div>
            <div class="stat-value">1,489</div>
          </div>
        </div>

        <!-- Interactive SVG Analytics Chart -->
        <div class="dash-analytics-box glass" style="margin-bottom: 40px;">
          <h3 style="font-weight: 700;">Website Viewership Dynamics</h3>
          <svg class="analytics-chart-svg" viewBox="0 0 800 200">
            <defs>
              <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent-cyan)" />
                <stop offset="100%" stop-color="var(--accent-purple)" />
              </linearGradient>
              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent-cyan)" stop-opacity="0.4" />
                <stop offset="100%" stop-color="var(--accent-purple)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <line x1="50" y1="180" x2="750" y2="180" class="chart-gridline" />
            <line x1="50" y1="100" x2="750" y2="100" class="chart-gridline" />
            <line x1="50" y1="20" x2="750" y2="20" class="chart-gridline" />
            <path class="chart-area" d="M 50 180 L 100 140 L 200 160 L 300 80 L 400 120 L 500 50 L 600 70 L 700 30 L 750 60 L 750 180 Z" />
            <path class="chart-line" d="M 50 180 L 100 140 L 200 160 L 300 80 L 400 120 L 500 50 L 600 70 L 700 30 L 750 60" />
            <circle cx="700" cy="30" r="6" fill="var(--accent-cyan)" />
          </svg>
        </div>

        <!-- Moderation List -->
        <div class="glass" style="padding: 25px;">
          <h3 style="margin-bottom: 15px; font-weight: 700;">Content Moderation Queue</h3>
          <div id="admin-queue-list">
            ${state.user.uploadedVideos.length === 0 
              ? `<p style="color: var(--text-muted);">Queue is empty. No uploads waiting scan.</p>`
              : state.user.uploadedVideos.map((v, idx) => `
                  <div class="leaderboard-item" style="padding: 15px; margin-bottom: 10px;" id="mod-item-${idx}">
                    <div>
                      <strong>${v.title}</strong>
                      <div style="font-size: 0.8rem; color: var(--text-secondary);">${v.category} • Sent by Sentinel: ${state.user.username}</div>
                    </div>
                    <div>
                      <button class="btn-primary" style="padding: 4px 10px; font-size: 0.75rem; background: var(--accent-cyan); color: #000;" onclick="window.adminApproveUpload(${idx})">Approve</button>
                      <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--accent-pink); color: var(--accent-pink);" onclick="window.adminRejectUpload(${idx})">Reject</button>
                    </div>
                  </div>
                `).join("")
            }
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // INTERACTIVE GLOBAL HANDLERS (EXPOSED ON WINDOW)
  // ==========================================================================

  // Follow Creator
  window.toggleFollowCreator = function (creatorName, button) {
    if (state.user.followingCreators.includes(creatorName)) {
      state.user.followingCreators = state.user.followingCreators.filter(name => name !== creatorName);
      button.classList.remove("following");
      button.textContent = "+ Follow";
      showToast(`Stopped following ${creatorName}`, "info");
    } else {
      state.user.followingCreators.push(creatorName);
      button.classList.add("following");
      button.textContent = "Following";
      gainXP(20, `following ${creatorName}`);
    }
    syncState();
  };

  // Follow trigger variant from user Dashboard tab refresh
  window.switchDashTab = function (tabName) {
    state.currentDashTab = tabName;
    const appEl = document.getElementById("app-content");
    renderDashboard(appEl);
  };

  // Save Dashboard profile name
  window.saveDashboardProfile = function () {
    const input = document.getElementById("dash-username-input");
    if (!input) return;
    state.user.username = input.value;
    syncState();
    showToast("Profile name saved!", "success");
    location.hash = "#dashboard";
  };

  // Like a video
  window.likeVideo = function (videoId, button) {
    const video = window.VYOM_DATA.videos.find(v => v.id === videoId);
    if (!video) return;

    if (button.classList.contains("active")) {
      button.classList.remove("active");
      video.likes--;
      button.innerHTML = `<span>👍 ${video.likes}</span>`;
    } else {
      button.classList.add("active");
      video.likes++;
      button.innerHTML = `<span>👍 ${video.likes}</span>`;
      gainXP(30, "liking a video");
    }
  };

  // Save video
  window.saveVideo = function (videoId, button) {
    if (state.user.savedVideos.includes(videoId)) {
      state.user.savedVideos = state.user.savedVideos.filter(id => id !== videoId);
      button.classList.remove("active");
      showToast("Video removed from library", "info");
    } else {
      state.user.savedVideos.push(videoId);
      button.classList.add("active");
      showToast("Video saved to library", "success");
    }
    syncState();
  };

  // Add Comment under player
  window.addComment = function (videoId) {
    const input = document.getElementById("new-comment-txt");
    const video = window.VYOM_DATA.videos.find(v => v.id === videoId);
    if (!input || !video) return;

    const newComment = {
      id: "cm_" + Date.now(),
      user: state.user.username,
      text: input.value,
      time: "Just now"
    };

    video.comments.unshift(newComment);
    input.value = "";
    gainXP(30, "adding comment");
    
    // Rerender video comments list
    const listEl = document.getElementById("video-comments-list");
    if (listEl) {
      let commentsHtml = "";
      video.comments.forEach(cm => {
        commentsHtml += `
          <div class="comment-item">
            <div>
              <div class="comment-author">${cm.user}<span class="comment-time">${cm.time}</span></div>
              <div class="comment-text">${cm.text}</div>
            </div>
          </div>
        `;
      });
      listEl.innerHTML = commentsHtml;
    }
  };

  // Like a blog post
  window.likeBlog = function (blogId, button) {
    const blog = window.VYOM_DATA.blogs.find(b => b.id === blogId);
    if (!blog) return;
    blog.likes++;
    button.textContent = `👍 Like Article (${blog.likes})`;
    gainXP(15, "liking blog");
  };

  // Filter video library
  window.filterVideos = function (category, button) {
    // Toggle active state
    document.querySelectorAll(".filter-categories .btn-filter-tag").forEach(b => b.classList.remove("active"));
    button.classList.add("active");

    const grid = document.getElementById("lib-videos-grid");
    if (!grid) return;

    const filtered = category === "All" 
      ? window.VYOM_DATA.videos 
      : window.VYOM_DATA.videos.filter(v => v.category === category);

    let html = "";
    filtered.forEach(v => {
      html += `
        <div class="video-card" onclick="location.hash='#video?id=${v.id}'">
          <div class="video-thumb-container">
            <img src="${v.thumbnail}" class="video-thumb-img" alt="${v.title}">
            <div class="video-overlay-glow"></div>
            <div class="video-duration">${v.duration}</div>
            <div class="video-play-btn"><i class="lucide-play">▶</i></div>
          </div>
          <div class="video-meta">
            <span class="video-category-tag">${v.category}</span>
            <h3 class="video-title">${v.title}</h3>
            <div class="video-author-views">
              <span>${v.creatorName}</span>
              <span>${v.views} views</span>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  };

  // Search videos
  window.searchVideos = function (query) {
    const grid = document.getElementById("lib-videos-grid");
    if (!grid) return;

    const q = query.toLowerCase();
    const filtered = window.VYOM_DATA.videos.filter(v => 
      v.title.toLowerCase().includes(q) || 
      v.tags.some(t => t.toLowerCase().includes(q))
    );

    let html = "";
    filtered.forEach(v => {
      html += `
        <div class="video-card" onclick="location.hash='#video?id=${v.id}'">
          <div class="video-thumb-container">
            <img src="${v.thumbnail}" class="video-thumb-img" alt="${v.title}">
            <div class="video-overlay-glow"></div>
            <div class="video-duration">${v.duration}</div>
            <div class="video-play-btn"><i class="lucide-play">▶</i></div>
          </div>
          <div class="video-meta">
            <span class="video-category-tag">${v.category}</span>
            <h3 class="video-title">${v.title}</h3>
            <div class="video-author-views">
              <span>${v.creatorName}</span>
              <span>${v.views} views</span>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  };

  // Newsletter email subscribe
  window.subscribeNewsletter = function (form) {
    const input = form.querySelector("input");
    showToast(`Cyber email: "${input.value}" synced! Access code coming shortly.`, "success");
    input.value = "";
    gainXP(50, "joining cosmic network");
  };

  // React to Forum posts
  window.reactPost = function (postId, reactionType, button) {
    const post = window.VYOM_DATA.posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.reacted) {
      post.reacted = true;
      post.reactions[reactionType]++;
      button.querySelector("span").textContent = post.reactions[reactionType];
      button.style.borderColor = "var(--accent-cyan)";
      gainXP(15, "reacting to post");
    } else {
      showToast("Already reacted to this post", "info");
    }
  };

  // Create forum post
  window.createPost = function () {
    const textEl = document.getElementById("new-post-txt");
    if (!textEl || !textEl.value.trim()) return;

    const newPost = {
      id: "p_" + Date.now(),
      author: state.user.username,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      content: textEl.value,
      category: "Creators",
      reactions: { like: 0, rocket: 0 },
      commentsCount: 0,
      time: "Just now"
    };

    window.VYOM_DATA.posts.unshift(newPost);
    textEl.value = "";
    gainXP(60, "sharing forum post");

    // Render list
    const wrapper = document.getElementById("posts-feed-wrapper");
    if (wrapper) {
      let feedHtml = "";
      window.VYOM_DATA.posts.forEach(p => {
        feedHtml += `
          <div class="forum-preview-card glass glow-purple-hover" style="margin-bottom: 20px;">
            <div class="forum-preview-header">
              <img src="${p.avatar}" class="forum-avatar" alt="${p.author}">
              <div>
                <div class="forum-poster-name">${p.author}</div>
                <div class="forum-post-time">${p.time} in <span style="color: var(--accent-cyan);">${p.category}</span></div>
              </div>
            </div>
            <div class="forum-preview-content">${p.content}</div>
            ${p.media ? `<img src="${p.media}" class="forum-preview-media" alt="post asset">` : ""}
            <div class="forum-preview-footer">
              <div class="forum-reactions">
                <button class="btn-reaction" onclick="window.reactPost('${p.id}', 'like', this)">👍 <span>${p.reactions.like}</span></button>
                <button class="btn-reaction" onclick="window.reactPost('${p.id}', 'rocket', this)">🚀 <span>${p.reactions.rocket || 0}</span></button>
              </div>
              <span class="forum-comments-count">${p.commentsCount} comments</span>
            </div>
          </div>
        `;
      });
      wrapper.innerHTML = feedHtml;
    }
  };

  // Mock post artwork attachment
  window.attachMockMedia = function () {
    showToast("Mock fan art loaded into post buffer! 🌌", "success");
    const textEl = document.getElementById("new-post-txt");
    if (textEl && !textEl.value.includes("Attachment buffer active")) {
      textEl.value += " [Cosmic fan art attached]";
    }
  };

  // ==========================================================================
  // MODALS LAUNCH & CONTROLS
  // ==========================================================================
  window.openModal = function (modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) overlay.classList.add("active");
  };

  window.closeModal = function (modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) overlay.classList.remove("active");
  };

  // Auth form submissions
  window.handleLoginSubmit = function (form) {
    const username = form.querySelector("#login-username").value;
    state.user.loggedIn = true;
    state.user.username = username;
    syncState();
    closeModal("auth-modal");
    showToast(`Welcome back, Sentinel ${username}! 🛡️`, "success");
    location.hash = "#dashboard";
  };

  // Switch Auth state
  window.switchAuthView = function (target) {
    const container = document.getElementById("auth-fields-container");
    const heading = document.getElementById("auth-modal-title");
    const btn = document.getElementById("auth-submit-btn");
    
    if (target === 'signup') {
      heading.innerText = "Access Registration";
      container.innerHTML = `
        <div class="form-group">
          <label class="form-label">Sentinel Username</label>
          <input type="text" class="form-input" id="login-username" required placeholder="Choose your cyber tag...">
        </div>
        <div class="form-group">
          <label class="form-label">Space coordinates (Email)</label>
          <input type="email" class="form-input" required placeholder="name@space.com">
        </div>
        <div class="form-group">
          <label class="form-label">Encryption Key (Password)</label>
          <input type="password" class="form-input" required onkeyup="window.checkPasswordStrength(this.value)">
          <div class="password-strength-container"><div class="password-strength-fill" id="pass-strength-bar"></div></div>
        </div>
      `;
      btn.innerText = "Register Account";
      document.getElementById("auth-switch-prompt").innerHTML = `
        Already verified? <span class="modal-switch-link" onclick="window.switchAuthView('login')">Login here</span>
      `;
    } else {
      heading.innerText = "Sentinel Verification";
      container.innerHTML = `
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" class="form-input" id="login-username" required placeholder="Enter sentinel tag...">
        </div>
        <div class="form-group">
          <label class="form-label">Encryption Key</label>
          <input type="password" class="form-input" required>
        </div>
      `;
      btn.innerText = "Access Platform";
      document.getElementById("auth-switch-prompt").innerHTML = `
        First time here? <span class="modal-switch-link" onclick="window.switchAuthView('signup')">Register here</span>
      `;
    }
  };

  window.checkPasswordStrength = function (val) {
    const bar = document.getElementById("pass-strength-bar");
    if (!bar) return;
    let strength = 0;
    if (val.length > 5) strength += 30;
    if (val.match(/[A-Z]/)) strength += 35;
    if (val.match(/[0-9]/)) strength += 35;
    bar.style.width = strength + "%";
    bar.style.background = strength < 65 ? "var(--accent-pink)" : "var(--accent-cyan)";
  };

  // Video Upload Trigger
  window.openVideoUploadModal = function () {
    openModal("upload-modal");
  };

  window.handleVideoUpload = function (form) {
    const title = form.querySelector("#up-title").value;
    const cat = form.querySelector("#up-category").value;
    const desc = form.querySelector("#up-desc").value;

    const newVideo = {
      id: "v_" + Date.now(),
      title: title,
      category: cat,
      duration: "05:00",
      views: "0",
      likes: 0,
      dislikes: 0,
      creatorId: "u1",
      creatorName: state.user.username,
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-futuristic-tunnel-31355-large.mp4",
      description: desc,
      tags: ["Creator", cat],
      comments: []
    };

    // Store in user list & globally
    state.user.uploadedVideos.unshift(newVideo);
    window.VYOM_DATA.videos.unshift(newVideo);
    
    syncState();
    closeModal("upload-modal");
    form.reset();
    gainXP(100, "uploading animation");
    
    // Rerender active dashboard
    if (location.hash === "#dashboard") {
      renderDashboard(document.getElementById("app-content"));
    }
  };

  // Blog Editor Trigger
  window.openBlogEditor = function () {
    if (!state.user.loggedIn) {
      showToast("Please login to write blogs", "info");
      openModal("auth-modal");
      return;
    }
    openModal("blog-editor-modal");
  };

  window.handleBlogSubmit = function (form) {
    const title = form.querySelector("#blog-up-title").value;
    const cat = form.querySelector("#blog-up-category").value;
    const content = form.querySelector("#blog-up-content").value;

    const newBlog = {
      id: "b_" + Date.now(),
      title: title,
      category: cat,
      author: state.user.username,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: Math.max(1, Math.round(content.length / 500)) + " min read",
      likes: 0,
      cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      content: content
    };

    window.VYOM_DATA.blogs.unshift(newBlog);
    closeModal("blog-editor-modal");
    form.reset();
    gainXP(150, "publishing blog");
    
    if (location.hash === "#blogs") {
      renderBlogs(document.getElementById("app-content"));
    }
  };

  // Play Game Trailer Modal
  window.playGameTrailer = function (gameId) {
    const game = window.VYOM_DATA.games.find(g => g.id === gameId);
    if (!game) return;

    const modal = document.getElementById("trailer-modal");
    const container = document.getElementById("trailer-video-container");
    if (!modal || !container) return;

    container.innerHTML = `
      <video src="${game.trailerUrl}" style="width: 100%; border-radius: 8px;" controls autoplay loop></video>
    `;
    modal.classList.add("active");
  };

  window.closeTrailerModal = function () {
    const modal = document.getElementById("trailer-modal");
    const container = document.getElementById("trailer-video-container");
    if (container) container.innerHTML = "";
    if (modal) modal.classList.remove("active");
  };

  // Admin Queue Actions
  window.adminApproveUpload = function (index) {
    const approved = state.user.uploadedVideos[index];
    showToast(`Animation "${approved.title}" approved! Published globally.`, "success");
    
    // Remove from moderation list
    state.user.uploadedVideos.splice(index, 1);
    syncState();
    
    // Refresh admin page
    if (location.hash === "#admin") {
      renderAdmin(document.getElementById("app-content"));
    }
  };

  window.adminRejectUpload = function (index) {
    const rejected = state.user.uploadedVideos[index];
    showToast(`Upload "${rejected.title}" flagged & rejected.`, "info");
    
    // Remove globally
    window.VYOM_DATA.videos = window.VYOM_DATA.videos.filter(v => v.id !== rejected.id);
    state.user.uploadedVideos.splice(index, 1);
    syncState();

    if (location.hash === "#admin") {
      renderAdmin(document.getElementById("app-content"));
    }
  };

  // ==========================================================================
  // AI TOOLS SIMULATION (CHAT ASSISTANT + THUMB GENERATOR)
  // ==========================================================================
  window.toggleAiDrawer = function () {
    const drawer = document.getElementById("ai-drawer");
    if (drawer) drawer.classList.toggle("active");
  };

  window.sendAiMessage = function () {
    const input = document.getElementById("ai-chat-val");
    if (!input || !input.value.trim()) return;

    const userText = input.value;
    input.value = "";

    const msgHolder = document.getElementById("ai-chat-messages");
    if (!msgHolder) return;

    // Render User Message
    const uMsg = document.createElement("div");
    uMsg.className = "ai-msg user";
    uMsg.innerText = userText;
    msgHolder.appendChild(uMsg);
    msgHolder.scrollTop = msgHolder.scrollHeight;

    // Trigger Bot Typing simulation
    setTimeout(() => {
      const bMsg = document.createElement("div");
      bMsg.className = "ai-msg bot";
      bMsg.innerHTML = getAiBotReply(userText);
      msgHolder.appendChild(bMsg);
      msgHolder.scrollTop = msgHolder.scrollHeight;
    }, 800);
  };

  window.aiSuggestedPrompt = function (text) {
    const input = document.getElementById("ai-chat-val");
    if (input) {
      input.value = text;
      window.sendAiMessage();
    }
  };

  function getAiBotReply(text) {
    const q = text.toLowerCase();
    
    if (q.includes("recommend") || q.includes("suggest") || q.includes("watch")) {
      const v = window.VYOM_DATA.videos[Math.floor(Math.random() * window.VYOM_DATA.videos.length)];
      return `🚀 I suggest watching **"${v.title}"**. It's trending in our *${v.category}* space right now! [Watch here](#video?id=${v.id})`;
    }
    if (q.includes("anime") || q.includes("series")) {
      return `🌌 Direct access link to **"Chrono Shift" [Official Trailer]**: [Launch Stream](#video?id=v2). NPR toon shading files can be accessed via creator *StudioKaze*.`;
    }
    if (q.includes("game") || q.includes("playtest")) {
      const g = window.VYOM_DATA.games[0];
      return `🎮 The most anticipated game is **"${g.title}"** (RPG). Status: *${g.status}*. You can watch its trailer here: [Watch Trailer](#games).`;
    }
    if (q.includes("xp") || q.includes("level")) {
      return `⚡ Gain XP by completing operations: <br>• Like a video (+30 XP)<br>• Add comments (+30 XP)<br>• Share forums posts (+60 XP)<br>• Upload animations (+100 XP)`;
    }
    if (q.includes("creator") || q.includes("spotlight")) {
      const c = window.VYOM_DATA.creators[0];
      return `✨ Artist spotlight: **${c.username}**. Skills: *${c.skills.join(", ")}*. Follow them on their dashboard profile!`;
    }

    return `🛡️ Vyom 3D Lok mainframes online. I can help recommend *animations*, suggest *games*, check your *XP levels*, or locate verified *creators*. What coordinates shall we explore next?`;
  }

  // AI Thumbnail Generator Mockup
  window.openAiThumbnailModal = function () {
    openModal("ai-thumbnail-modal");
  };

  window.generateAiThumbnail = function () {
    const prompt = document.getElementById("ai-prompt-input").value;
    if (!prompt.trim()) return;

    const progress = document.getElementById("ai-thumb-progress");
    const previewImg = document.getElementById("ai-thumb-preview-img");
    const placeholder = document.getElementById("ai-thumb-placeholder");

    placeholder.style.display = "block";
    placeholder.innerText = "Synthesizing graphics from Vyom neural nodes...";
    previewImg.style.display = "none";
    progress.style.width = "0%";

    // Animate progress
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      progress.style.width = prog + "%";
      if (prog >= 100) {
        clearInterval(interval);
        
        // Load mock visual assets based on keywords
        let thumbUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"; // cosmic purple
        if (prompt.toLowerCase().includes("game") || prompt.toLowerCase().includes("play")) {
          thumbUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"; // cyberpunk gamer
        } else if (prompt.toLowerCase().includes("space") || prompt.toLowerCase().includes("star")) {
          thumbUrl = "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=800&q=80"; // green nebula
        } else if (prompt.toLowerCase().includes("anime") || prompt.toLowerCase().includes("girl")) {
          thumbUrl = "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"; // anime character
        }

        previewImg.src = thumbUrl;
        previewImg.style.display = "block";
        placeholder.style.display = "none";
        
        showToast("AI Graphic synthesized successfully! 🎨", "success");
        gainXP(40, "synthesizing AI thumbnail");
      }
    }, 300);
  };

  window.saveGeneratedThumbnail = function () {
    const previewImg = document.getElementById("ai-thumb-preview-img");
    if (previewImg.style.display === "block") {
      showToast("Thumbnail saved to device cache!", "success");
      closeModal("ai-thumbnail-modal");
    } else {
      showToast("Generate a thumbnail first", "info");
    }
  };

  // Global Search Autocomplete
  window.searchGlobal = function (query) {
    const list = document.getElementById("global-search-results");
    if (!list) return;
    
    if (!query.trim()) {
      list.style.display = "none";
      return;
    }

    const q = query.toLowerCase();
    let matches = [];

    // Search videos
    window.VYOM_DATA.videos.forEach(v => {
      if (v.title.toLowerCase().includes(q)) {
        matches.push({ title: v.title, type: "Animation", hash: `#video?id=${v.id}` });
      }
    });

    // Search games
    window.VYOM_DATA.games.forEach(g => {
      if (g.title.toLowerCase().includes(q)) {
        matches.push({ title: g.title, type: "Game", hash: `#games` });
      }
    });

    // Search blogs
    window.VYOM_DATA.blogs.forEach(b => {
      if (b.title.toLowerCase().includes(q)) {
        matches.push({ title: b.title, type: "Blog", hash: `#blog-read?id=${b.id}` });
      }
    });

    if (matches.length === 0) {
      list.innerHTML = `<div style="padding: 10px; font-size: 0.8rem; color: var(--text-muted);">No dimensions match query.</div>`;
    } else {
      list.innerHTML = matches.slice(0, 5).map(m => `
        <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border-glass); font-size: 0.85rem;" 
             onclick="location.hash='${m.hash}'; document.getElementById('global-search-input').value=''; this.parentElement.style.display='none';">
          <span style="color: var(--accent-cyan); font-weight: 700; font-size: 0.7rem; text-transform: uppercase;">[${m.type}]</span> ${m.title}
        </div>
      `).join("");
    }
    list.style.display = "block";
  };

  // Close search suggestions on click away
  document.addEventListener("click", (e) => {
    const list = document.getElementById("global-search-results");
    const input = document.getElementById("global-search-input");
    if (list && e.target !== input) {
      list.style.display = "none";
    }
  });

  // Mobile Menu drawer
  window.toggleMobileNav = function () {
    const panel = document.getElementById("mobile-nav");
    if (panel) panel.classList.toggle("active");
  };

  // Initialize Navbar Scroll effects
  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }
  });

  // ==========================================================================
  // INITIALIZATION RUN
  // ==========================================================================
  window.addEventListener("DOMContentLoaded", () => {
    loadState();
    syncState();
    
    // Spawn particles background
    if (window.initCosmicParticles) {
      window.initCosmicParticles("particles-canvas");
    }

    // Set routing
    window.addEventListener("hashchange", router);
    router(); // run initially
  });

})();
