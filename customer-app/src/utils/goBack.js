// Back that always goes somewhere. router.back() does nothing when the page has
// no in-app history (app just opened, a deep link, after a sign-in redirect),
// which left Back buttons dead in the iOS app.
export function goBack(router, fallback = '/') {
  if (window.history.state && window.history.state.back) router.back();
  else router.replace(fallback);
}
