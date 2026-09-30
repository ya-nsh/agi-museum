import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="nf shell">
      <p className="mono">ERROR 404 · UNCATALOGUED</p>
      <h1 className="serif">This room is <em>empty.</em></h1>
      <p>The exhibit you were looking for is not in the collection, or has not happened yet.</p>
      <Link className="btn btn-primary" href="/"><span>Return to the museum</span></Link>
    </main>
  );
}
