import { useEffect } from 'react';
import Guard from 'browser-guard';

export default function Article() {
  useEffect(() => {
    const guard = Guard.create();
    guard.enable({
      copy: true,
      select: true,
      rightClick: true,
      savePage: true,
      print: true,
      console: false,
      antiDebug: false,
      consoleAction: 'noop',
      onViolation: (type) => console.log('Guard:', type)
    });
    return () => guard.disable();
  }, []);

  return <article>Your content</article>;
}
