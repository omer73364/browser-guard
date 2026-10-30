import {
  Component, DestroyRef,
  afterNextRender, inject
} from '@angular/core';
import Guard from 'browser-guard';

@Component({
  selector: 'app-guarded-article',
  standalone: true,
  template: '<article>Your content</article>'
})
export class GuardedArticle {
  constructor() {
    const cleanup = inject(DestroyRef);

    afterNextRender(() => {
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
      cleanup.onDestroy(() => guard.destroy());
    });
  }
}
