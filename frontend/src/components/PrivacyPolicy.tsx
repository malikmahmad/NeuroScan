export default function PrivacyPolicy() {
  return (
    <section id="privacy" className="privacy">
      <div className="privacy__header">
        <span className="section-eyebrow">Privacy Policy</span>
        <h2>Short, because there isn't much to hide</h2>
      </div>
      <div className="privacy__card">
        <p className="privacy__intro">
          This describes what the NeuroScan backend actually does with an uploaded image — not a
          generic legal template. You can verify every line directly in the source code.
        </p>
        <div className="privacy__row">
          <h3>What happens to an uploaded scan</h3>
          <p>The image is read into memory for the duration of a single prediction request, used to
          run inference, and discarded when the response is sent. It is never written to disk,
          logged, added to a database, or used to retrain any model.</p>
        </div>
        <div className="privacy__row">
          <h3>Accounts, cookies, tracking</h3>
          <p>There are none. NeuroScan has no login system, no cookies, no analytics, and no
          third-party trackers. There is nothing tied to your identity for it to leak.</p>
        </div>
        <div className="privacy__row">
          <h3>Where your data goes</h3>
          <p>NeuroScan is open-source and self-hosted — predictions run on whichever server is
          running this code, which the deployer controls entirely. Nothing is sent to a
          third-party API for inference.</p>
        </div>
        <div className="privacy__row">
          <h3>One more time, clearly</h3>
          <p>Do not upload real patient data expecting clinical-grade confidentiality guarantees.
          This is a research tool, not a HIPAA-compliant medical system.</p>
        </div>
      </div>
      <style>{`
        .privacy { max-width: 760px; margin: 0 auto; padding: var(--space-8) var(--space-5) var(--space-9); }
        .privacy__header { text-align: center; margin-bottom: var(--space-6); }
        .privacy__header h2 { font-size: 24px; margin-top: var(--space-3); color: var(--text-primary); }
        .privacy__card { background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-6); }
        .privacy__intro { font-size: 13.5px; color: var(--text-tertiary); margin: 0 0 var(--space-5); padding-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
        .privacy__row { padding: var(--space-3) 0; }
        .privacy__row h3 { font-size: 14.5px; color: var(--accent-teal); margin-bottom: var(--space-2); }
        .privacy__row p { font-size: 13.5px; line-height: 1.6; color: var(--text-secondary); margin: 0; }
      `}</style>
    </section>
  );
}
