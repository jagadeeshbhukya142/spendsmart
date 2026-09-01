import { useEffect } from 'react';

/**
 * Sets the browser tab title for a route. This is a client-rendered app behind
 * auth, so it has no effect on search rankings - the point is that a user with
 * six SpendSmart tabs open can tell them apart, and a bookmark saves something
 * more useful than "SpendSmart" every time.
 */
export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => { document.title = previous; };
  }, [title]);
}
