/**
 * The no-flash theme bootstrap. Rendered once in <head> (before the body) so
 * the correct theme is applied before first paint and the page never flashes
 * the wrong ground. It mirrors ThemeToggle's contract exactly: the `theme`
 * localStorage key with values `"light"`/`"dark"`, `data-theme="dark"` on the
 * root for dark, and no attribute for the default light theme. On a first
 * visit it honours the OS `prefers-color-scheme`.
 */
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.removeAttribute('data-theme');}}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />;
}
