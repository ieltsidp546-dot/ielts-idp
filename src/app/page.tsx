import { SearchForm } from "@/components/search/SearchForm";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-content">
          <div className="hero-label"><span /> CANDIDATE DOCUMENT SERVICES</div>
          <h1>Your results.<br /><em>Securely accessible.</em></h1>
          <p>Use your registered candidate details to locate and view your result document.</p>
        </div>
      </section>
      <section className="shell content-section">
        <div className="intro-row">
          <div><div className="section-eyebrow">RESULTS LOOKUP</div><h2>Access your document</h2></div>
          <p className="muted intro-copy">For your protection, all four details must match the record on file.</p>
        </div>
        <SearchForm />
        <div className="security-strip">
          <span className="security-symbol">♢</span>
          <div><strong>Secure candidate verification</strong><p>Never share your identification details or document link with anyone you do not trust.</p></div>
        </div>
      </section>
    </>
  );
}
