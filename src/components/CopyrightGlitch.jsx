import { useEffect, useState } from 'react';

const NOTICE =
  '⚠ COPYRIGHT VIOLATION NOTICE\n\n' +
  'This site is displaying copyrighted content owned by M3M and Adani ' +
  'Realty without authorization. This material must be removed immediately.\n\n' +
  'Property content, renders, floor plans and specifications belonging to ' +
  'M3M and Adani are protected works and may not be reproduced or ' +
  'redistributed. Continued use is a violation of copyright.\n\n' +
  'To resolve this and request removal, contact the rights owners:\n' +
  '  • M3M: sales@m3mindia.com\n' +
  '  • Adani Realty: partner@adanirealty.com\n\n' +
  'Access to this site has been restricted until the infringing content ' +
  'is removed.';

/**
 * CopyrightGlitch
 * -----------------
 * After a delay (default 10s) a native browser dialog (window.alert) shows a
 * strict copyright violation notice naming M3M and Adani. The dialog re-fires
 * on dismissal so the site stays locked and inaccessible.
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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const fire = () => {
      if (!active) return;
      window.alert(NOTICE);
      if (active) setTimeout(fire, 0);
    };
    fire();

    return () => {
      active = false;
      document.body.style.overflow = prevOverflow;
    };
  }, [shown]);

  if (!shown) return null;

  return <div className="cg-overlay cg-overlay--shown" aria-hidden="true" />;
}
