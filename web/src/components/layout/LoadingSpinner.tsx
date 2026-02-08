export default function LoadingSpinner() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}
