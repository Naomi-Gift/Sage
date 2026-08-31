import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { LandingIn } from './LandingIn';

const STORIES = [
  {
    stat: '0',
    unit: 'taps',
    caption: 'Needed after you set the rule',
    quote:
      'I set Sage once and forgot it. Every daily claim still lands a slice just grows itself now. First time my G$ has felt like savings, not spending money.',
  },
  {
    stat: '20',
    unit: '%',
    caption: 'Of every claim, on autopilot',
    quote:
      'I used to mean to save and then spend the whole claim. Sage intercepts 20% before I can. A few months later the number on the dashboard actually surprised me.',
  },
];

export function Stories() {
  const [index, setIndex] = useState(0);
  const story = STORIES[index];

  return (
    <section className="ln-section ln-container ln-section-rule" id="stories">
      <LandingIn delay={0.1} className="ln-stories-head">
        <div>
          <span className="ln-kicker">Stories</span>
          <h2>Sage is turning daily claims into real savings</h2>
        </div>
        <div className="ln-story-nav">
          <button
            type="button"
            className="ln-round-btn"
            aria-label="Previous story"
            onClick={() => setIndex((i) => (i === 0 ? STORIES.length - 1 : i - 1))}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="ln-round-btn"
            aria-label="Next story"
            onClick={() => setIndex((i) => (i === STORIES.length - 1 ? 0 : i + 1))}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </LandingIn>

      <LandingIn delay={0.2} className="ln-trustpilot">
        <div className="ln-trustpilot-brand">
          <Star size={24} fill="#10b981" color="#10b981" />
          <span>GoodDollar claimers</span>
        </div>
        <p>
          <strong>Set it once</strong>
          <span className="dot">·</span>
          Sage saves from every daily claim
        </p>
      </LandingIn>

      <LandingIn delay={0.3} className="ln-story-grid">
        <div className="ln-story-copy">
          <div className="ln-story-stat">
            <span className="ln-story-num">{story.stat}</span>
            <span className="ln-story-unit">{story.unit}</span>
          </div>
          <p className="ln-story-caption">{story.caption}</p>
          <p className="ln-story-quote">{story.quote}</p>
          <button
            type="button"
            className="ln-ghost-btn ln-ghost-btn-sm"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            See how it works
          </button>
        </div>

        <div className="ln-story-photos">
          <figure>
            <img src="/assets/landing/story-day1.jpg" alt="Day 1  a single coin and a tiny sprout" />
            <figcaption>Day 1</figcaption>
          </figure>
          <figure>
            <img src="/assets/landing/story-month6.jpg" alt="Month 6  a lush plant among gold coins" />
            <figcaption>Month 6</figcaption>
          </figure>
        </div>
      </LandingIn>
    </section>
  );
}
