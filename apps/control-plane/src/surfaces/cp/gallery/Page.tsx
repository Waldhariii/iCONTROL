export default function Page() {
  return (
    <div className="page-container gallery-page">
      <h1 className="gallery-title">CP • Gallery</h1>
      <p className="gallery-lead">
        Surface CP catalog-driven (unblock route #/gallery). Replace with real tooling UI when ready.
      </p>
      <div className="gallery-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="gallery-card">
            <div className="gallery-card-title">Card {i + 1}</div>
            <div className="gallery-card-body">Placeholder content</div>
          </div>
        ))}
      </div>
    </div>
  );
}
