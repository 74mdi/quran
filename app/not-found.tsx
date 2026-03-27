import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mt-8">
      <h1>Surah not found</h1>
      <p className="text-muted">The surah URL could not be matched.</p>
      <p className="mt-4">
        <Link href="/" className="underline decoration-1 underline-offset-2">
          Back to Surah list
        </Link>
      </p>
    </div>
  );
}
