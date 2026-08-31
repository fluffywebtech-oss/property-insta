import { useEffect, useState } from 'react';

const NOTICE =
  'Copyright Notice\n\n' +
  'You are using other data.\n\n' +
  'Some of the content displayed originates from third-party sources. ' +
  'Unauthorized use or reproduction of copyrighted material violates the ' +
  'rights of its owners. Access to this site has been restricted.';

/**
 * CopyrightGlitch
 * -----------------
 * After a delay (default 10s) a native browser dialog (window.alert) is shown
 * with a copyright warning. Because the dialog is re-fired every time it is
 * dismissed, the site stays locked and cannot be accessed.
 */
export default function CopyrightGlitch({ delay = 10000 }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!shown) return;

    let active = true;

    // Lock scrolling behind the dialog
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Fire the native browser dialog, and re-fire it whenever it is dismissed
    // so the underlying site remains inaccessible.
    const fire = () => {
      if (!active) return;
      window.alert(NOTICE);
      // Re-open on the next tick so the browser can repaint between dialogs.
      if (active) setTimeout(fire, 0);
    };
    fire();

    return () => {
      active = false;
      document.body.style.overflow = prevOverflow;
    };
  }, [shown]);

  if (!shown) return null;

  // A dark, blocking backdrop sits behind the native dialog so the site
  // underneath is hidden and unclickable.
  return <div className="cg-overlay cg-overlay--shown" aria-hidden="true" />;
}
