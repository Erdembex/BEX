/** Alt sekme çubuğu tam ekran alt sayfalarda içeriği kapatmasın diye gizlenir. */
export function shouldHideUserTabBar(pathname: string | null | undefined): boolean {
  const path = (pathname ?? '').replace(/\?.*$/, '');
  if (!path) return false;
  const normalized = path.replace(/^\/+\(tabs\)\/?/, '/').replace(/^\/+/, '');
  if (normalized === 'messages' || normalized.endsWith('/messages')) return false;
  if (/^messages\/[^/]+/.test(normalized)) return true;
  return /\/messages\/[^/]+/.test(path);
}
