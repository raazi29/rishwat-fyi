/**
 * The "Skip to content" link — the first focusable element on the page. It is
 * visually hidden until focused (the `.skip-link` utility in globals.css) and
 * then appears at the top-left as a green pill. Its target defaults to the
 * `#main` landmark that the root layout renders.
 */
export function SkipLink({
  href = "#main",
  children = "Skip to content",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="skip-link absolute left-4 top-4 z-50 inline-flex min-h-11 items-center rounded-xl bg-official px-4 py-2 text-label font-medium text-white shadow-overlay"
    >
      {children}
    </a>
  );
}
