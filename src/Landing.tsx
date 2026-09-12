import type { ReactNode } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, GitBranch, LockKeyhole, SlidersHorizontal } from 'lucide-react'
import './Landing.css'

export function Landing({ signIn }: { signIn: ReactNode }) {
  return <div className="landing">
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-story">
        <div className="landing-kicker"><span /> Built for student life</div>
        <h1 id="landing-title">Stress isn’t random.<br /><em>It adds up.</em></h1>
        <p className="landing-lead">Check in on sleep, workload, deadlines, and recovery. Get back a stress estimate that shows its work - every pressure behind the score, next to your own report of how the day felt.</p>
        <div className="landing-auth" id="get-started">{signIn}</div>
        <p className="landing-micro"><LockKeyhole size={14} aria-hidden="true" /> Private history. Saved only when you choose.</p>
        <a className="landing-tour-link" href="#inside-the-product">Take a look inside <ArrowDown size={15} aria-hidden="true" /></a>
      </div>
      <div className="landing-preview" aria-label="Illustrative product preview, not personal assessment data">
        <div className="preview-top"><span className="preview-wordmark">Your stress snapshot</span></div>
        <div className="preview-tabs" aria-hidden="true"><span>Check-in</span><span className="selected">Your result</span><span>Patterns</span></div>
        <div className="preview-result-heading"><span>ESTIMATED STRESS · ROUTINE-BASED</span><GitBranch size={19} aria-hidden="true" /></div>
        <div className="preview-score"><strong>50.0<small> / 100</small></strong><span>Moderate estimate</span></div>
        <div className="preview-spectrum" aria-hidden="true"><span /></div>
        <p className="preview-caption">An illustrative stress estimate, with each component’s contribution shown below.</p>
        <div className="preview-components">
          <div><span><i className="academic-dot" />Academic pressure</span><strong>22.5 <small>pts</small></strong></div>
          <div><span><i className="recovery-dot" />Recovery deficit</span><strong>20.0 <small>pts</small></strong></div>
          <div><span><i className="context-dot" />Contextual pressure</span><strong>7.5 <small>pts</small></strong></div>
        </div>
        <div className="preview-explanation"><GitBranch size={18} aria-hidden="true" /><p>See what contributes to the estimate.<br /><strong>Academic demands, recovery, and other pressures.</strong></p></div>
      </div>
    </section>

    <section className="landing-method" aria-label="From check-in to insight">
      <div className="method-step"><span>01</span><p><strong>Check in</strong>Record the parts of your day that can shape your stress - sleep, workload, deadlines, screen time, commitments, and recovery.</p></div>
      <ArrowRight className="method-arrow" size={18} aria-hidden="true" />
      <div className="method-step"><span>02</span><p><strong>See what's driving it</strong>Get a stress estimate with a clear explanation of the pressures behind it, not just a number.</p></div>
      <ArrowRight className="method-arrow" size={18} aria-hidden="true" />
      <div className="method-step"><span>03</span><p><strong>Learn your pattern</strong>Track your stress over time and see how it changes with your routine.</p></div>
    </section>

    <section id="inside-the-product" className="landing-features" aria-labelledby="features-title">
      <div className="landing-section-heading"><div><span className="landing-kicker">Beyond a single day</span><h2 id="features-title">Your stress isn’t fixed.<br />Neither is your routine.</h2></div><p>One check-in explains a day.<br />A month of them explains a lot more.</p></div>
      <div className="landing-feature-grid">
        <article className="landing-history"><div className="feature-icon"><CalendarDays size={23} aria-hidden="true" /></div><h3>Notice what’s been building.</h3><p>Look back across your check-ins to see when your stress climbed, when it eased, and what your routine looked like at the time.</p><div className="history-illustration" aria-hidden="true"><span>CHECK IN</span><div><i /><i /><i /><i /><i /><i /><i /></div><span>LOOK BACK</span></div><span className="feature-note">Your week, your month, your whole term</span></article>
        <article><div className="feature-icon"><SlidersHorizontal size={23} aria-hidden="true" /></div><h3>See what might ease it.</h3><p>Nudge your sleep, workload, or recovery and watch the estimate move - a way to think a change through before you make it.</p><div className="scenario-illustration" aria-hidden="true"><span>Sleep duration</span><div><i /></div><small>More sleep, lower estimate</small></div><span className="feature-note">A what-if - your real days stay untouched</span></article>
      </div>
    </section>

    <section className="landing-principles" aria-labelledby="principles-title"><div><LockKeyhole size={22} aria-hidden="true" /><h2 id="principles-title">An estimate. Your experience.</h2></div><p>Your stress estimate comes from the routines and pressures you record, while your own strain report captures how the day actually felt. Explore the factors behind your estimate, track how your stress changes over time, and stay in control of your life.</p><a href="#get-started">Start with your first check-in <ArrowUpRight size={18} aria-hidden="true" /></a></section>
  </div>
}
