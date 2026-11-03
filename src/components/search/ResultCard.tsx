type Props = { documentUrl: string; fileType: "pdf" | "image"; fileName: string };

export function ResultCard({ documentUrl, fileType, fileName }: Props) {
  return (
    <section className="result-card" aria-live="polite">
      <div className="result-heading">
        <span className="success-icon" aria-hidden="true">✓</span>
        <div><h2>Matching record found</h2><p>Your document is ready to view.</p></div>
      </div>
      {fileType === "pdf" ? (
        <iframe className="document-frame" src={documentUrl} title="Student result document" />
      ) : (
        // The private URL is short-lived and is returned only after a successful match.
        <img className="document-image" src={documentUrl} alt="Student result document" />
      )}
      <a className="button button-primary download-link" href={documentUrl} target="_blank" rel="noopener noreferrer">
        Open document securely ↗
      </a>
      <p className="fine-print">This secure document link expires automatically.</p>
      <span className="sr-only">{fileName}</span>
    </section>
  );
}
