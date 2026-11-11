import Link from "next/link";

const sampleHeadlines = [
  {
    category: "TECHNOLOGY",
    title: "The next wave of AI is being built for everyday work",
    source: "The Verge · 12 min ago",
    color: "lavender",
  },
  {
    category: "CLIMATE",
    title: "A new energy milestone is changing the outlook",
    source: "Reuters · 28 min ago",
    color: "mint",
  },
  {
    category: "BUSINESS",
    title: "Markets look ahead as a pivotal week begins",
    source: "Bloomberg · 46 min ago",
    color: "peach",
  },
];

export default function Home() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Daily CatchUp home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>daily<span className="brand-light">catchup</span></span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#what-you-get">What you get</a>
        </nav>
        <div className="header-actions">
          <Link className="header-login" href="/login">Log in</Link>
          <Link className="button button-dark button-small" href="/signup">
            Get started <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR DAILY BRIEFING, REIMAGINED</div>
          <h1>Know what matters.<br /><span>Skip the noise.</span></h1>
          <p className="hero-description">
            The world moves fast. Get a clear, thoughtful summary of the stories
            you care about—in less time than it takes to scroll.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/signup">Create your free account <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" href="/dashboard">Explore the briefing <span aria-hidden="true">→</span></Link>
          </div>
          <div className="social-proof">
            <div className="avatar-stack" aria-hidden="true">
              <span>J</span><span>M</span><span>A</span><span>+</span>
            </div>
            <p><strong>A little more informed, every day.</strong><br />A calmer way to keep up with the world.</p>
          </div>
        </div>

        <div className="hero-visual" aria-label="Preview of a personalized news briefing">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="briefing-card">
            <div className="briefing-topline">
              <span className="mini-brand"><span className="brand-mark brand-mark-small"><span /><span /><span /></span> DAILY BRIEFING</span>
              <span className="briefing-date">MONDAY, 9:41 AM</span>
            </div>
            <div className="briefing-greeting">
              <span className="greeting-kicker">YOUR WORLD, IN FOCUS</span>
              <h2>Good morning,<br />let&apos;s catch you up.</h2>
            </div>
            <div className="briefing-topic-row">
              <span className="topic-icon">✳</span>
              <div><strong>Artificial intelligence</strong><small>5 stories · 2 min read</small></div>
              <span className="topic-arrow">↗</span>
            </div>
            <p className="briefing-summary">
              This week&apos;s biggest AI news points to a shift from experimental
              tools to practical assistants built into the way we work.
            </p>
            <div className="briefing-divider" />
            <div className="briefing-insight">
              <span className="insight-mark">“</span>
              <p>One clear takeaway, instead of twenty open tabs.</p>
            </div>
            <div className="briefing-footer">
              <span>✦ SOURCED FROM TRUSTED NEWS</span>
              <span className="read-time">2 MIN READ</span>
            </div>
          </div>
          <div className="floating-note"><span className="note-spark">✳</span><span><strong>Just the signal.</strong><small>Skip the scroll.</small></span></div>
        </div>
      </section>

      <section className="ticker-strip" aria-label="Coverage topics">
        <span>STAY CURIOUS ABOUT</span>
        <span>Technology</span><i />
        <span>Business</span><i />
        <span>Science</span><i />
        <span>World</span><i />
        <span>Whatever matters to you</span>
      </section>

      <section id="how-it-works" className="section stories-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">A BETTER WAY TO STAY IN THE LOOP</span>
            <h2>More understanding.<br /><span>Less overwhelm.</span></h2>
          </div>
          <p>Pick a topic, choose your depth, and get a balanced briefing built from live reporting.</p>
        </div>
        <div className="story-grid">
          {sampleHeadlines.map((story, index) => (
            <article className={`story-card story-${story.color}`} key={story.category}>
              <div className="story-visual">
                <span className="story-number">0{index + 1}</span>
                <span className="story-shape" aria-hidden="true">{index === 0 ? "✳" : index === 1 ? "◌" : "↗"}</span>
              </div>
              <div className="story-content">
                <span className="story-category">{story.category}</span>
                <h3>{story.title}</h3>
                <p>{story.source}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="what-you-get" className="closing-cta">
        <div className="cta-star" aria-hidden="true">✳</div>
        <span className="section-kicker">A CLEARER HEADLINE STARTS HERE</span>
        <h2>Your next good<br />conversation starts <em>informed.</em></h2>
        <p>Make a little room for the news that matters to you.</p>
        <Link className="button button-light" href="/signup">Start your daily catchup <span aria-hidden="true">↗</span></Link>
      </section>

      <footer className="site-footer">
        <Link className="brand" href="/" aria-label="Daily CatchUp home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>daily<span className="brand-light">catchup</span></span>
        </Link>
        <p>A little more informed, every day.</p>
        <span>© Daily CatchUp</span>
      </footer>
    </main>
  );
}
