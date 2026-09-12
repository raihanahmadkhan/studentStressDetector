import type { ReactNode } from 'react'
import { ArrowDown, ArrowUpRight, CalendarDays, GitBranch, LockKeyhole, SlidersHorizontal } from 'lucide-react'
import './Landing.css'

export function Landing({ signIn }: { signIn: ReactNode }) {
  return <div className="landing">
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-story">
        <div className="landing-kicker"><span /> A little perspective on student life</div>
        <h1 id="landing-title">Your days are full.<br /><em>Make sense of them.</em></h1>
        <p className="landing-lead">Deadlines, late nights, and everything in between. Bring your routines into focus with a daily check-in—and see the reasoning behind every result.</p>
        <div className="landing-auth" id="get-started">{signIn}</div>
        <p className="landing-micro"><LockKeyhole size={14} aria-hidden="true" /> Private history. Saved only when you choose.</p>
        <a className="landing-tour-link" href="#inside-the-product">Take a look inside <ArrowDown size={15} aria-hidden="true" /></a>
      </div>
      <div className="landing-preview" aria-label="Illustrative product preview, not personal assessment data">
        <div className="preview-top"><span className="preview-wordmark">A day, in perspective</span><span className="preview-badge">Illustrative example</span></div>
        <div className="preview-tabs" aria-hidden="true"><span>Check-in</span><span className="selected">Your result</span><span>Patterns</span></div>
        <div className="preview-result-heading"><span>THE ROUTINE-BASED INDEX</span><GitBranch size={19} aria-hidden="true" /></div>
        <div className="preview-score"><strong>50.0<small> / 100</small></strong><span>Moderate band</span></div>
        <div className="preview-spectrum" aria-hidden="true"><span /></div>
        <p className="preview-caption">A starting point for reflection, with the calculation open to you.</p>
        <div className="preview-components">
          <div><span><i className="academic-dot" />Academic pressure</span><strong>22.5 <small>pts</small></strong></div>
          <div><span><i className="recovery-dot" />Recovery deficit</span><strong>20.0 <small>pts</small></strong></div>
          <div><span><i className="context-dot" />Contextual pressure</span><strong>7.5 <small>pts</small></strong></div>
        </div>
        <div className="preview-explanation"><GitBranch size={18} aria-hidden="true" /><p>Three components. One transparent calculation.<br /><strong>Inspect the inputs, weights, and activated rules.</strong></p></div>
        <div className="preview-own-report"><span>Your own strain report</span><strong>Separate from the index</strong></div>
      </div>
    </section>

    <section className="landing-method" aria-label="How your observations become insights">
      <div><span>01</span><p><strong>Notice your day</strong>Sleep, workload, deadlines, screen time, commitments, recovery, and your own strain report.</p></div>
      <div><span>02</span><p><strong>Understand the result</strong>A transparent fuzzy model connects your routine inputs to an explained index.</p></div>
      <div><span>03</span><p><strong>Build perspective</strong>Return to your history, spot personal patterns, and explore different routines.</p></div>
    </section>

    <section id="inside-the-product" className="landing-features" aria-labelledby="features-title">
      <div className="landing-section-heading"><div><span className="landing-kicker">More than a number</span><h2 id="features-title">A record that becomes<br />more useful with you.</h2></div><p>Start with one honest check-in.<br />Build a clearer picture of your recorded days.</p></div>
      <div className="landing-feature-grid">
        <article className="landing-history"><div className="feature-icon"><CalendarDays size={23} aria-hidden="true" /></div><h3>Your days, kept in context.</h3><p>Revisit your timeline and compare recent observations with your own baseline. Missing days stay missing—never turned into zeroes.</p><div className="history-illustration" aria-hidden="true"><span>CHECK IN</span><div><i /><i /><i /><i /><i /><i /><i /></div><span>LOOK BACK</span></div><span className="feature-note">Timeline · Personal patterns · Revision history</span></article>
        <article><div className="feature-icon"><SlidersHorizontal size={23} aria-hidden="true" /></div><h3>Try a different “what if”.</h3><p>Explore how changing sleep, recovery, or demand changes the routine-based calculation. Your saved observations stay exactly as they were.</p><div className="scenario-illustration" aria-hidden="true"><span>Sleep duration</span><div><i /></div><small>A scenario, never a saved day</small></div><span className="feature-note">Explore possibilities without rewriting history</span></article>
      </div>
    </section>

    <section className="landing-principles" aria-labelledby="principles-title"><div><LockKeyhole size={22} aria-hidden="true" /><h2 id="principles-title">Your experience comes first.</h2></div><p>Your own strain report stays separate from the calculated index. Edit with revision history, export your records, or delete your data. The index is an authored heuristic for reflection, not a clinical assessment.</p><a href="#get-started">Start with your first check-in <ArrowUpRight size={18} aria-hidden="true" /></a></section>
  </div>
}
