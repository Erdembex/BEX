/** Alt sekme çubuğu tam ekran alt sayfalarda içeriği kapatmasın diye gizlenir. */
export function shouldHideUserTabBar(pathname: string | null | undefined): boolean {
  const path = (pathname ?? '').replace(/\?.*$/, '');
  if (!path) return false;
  if (path === '/messages' || path.endsWith('/messages')) return false;
  return /\/messages\/[^/]+/.test(path);
}
