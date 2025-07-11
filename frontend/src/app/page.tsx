export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Welcome to Fabularius.art
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A minimalist gallery for showcasing your art and photography
          collections. Create albums, upload media, and share your creative work
          with the world.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Create Albums</h3>
          </div>
          <div className="card-content">
            <p className="text-muted-foreground">
              Organize your artwork into beautiful albums with custom titles and
              descriptions.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Upload Media</h3>
          </div>
          <div className="card-content">
            <p className="text-muted-foreground">
              Upload high-quality images with automatic optimization and
              thumbnail generation.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Share & Showcase</h3>
          </div>
          <div className="card-content">
            <p className="text-muted-foreground">
              Share your albums publicly or keep them private. Perfect for
              portfolios and exhibitions.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button className="btn-primary text-lg px-8 py-3">Get Started</button>
      </div>
    </div>
  );
}
