import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="IELTS Results Portal home">
          <span className="brand-mark">I</span>
          <span><strong>IELTS</strong><small>RESULTS PORTAL</small></span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/">Candidate results</Link>
          <a href="#help">Help &amp; support</a>
        </nav>
      </div>
    </header>
  );
}
