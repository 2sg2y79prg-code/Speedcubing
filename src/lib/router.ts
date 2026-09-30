import { useEffect, useState } from 'react';

export interface Route {
  parts: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  return { parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs ?? '') };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function navigate(path: string) {
  window.location.hash = '#/' + path.replace(/^[#/]+/, '');
}
