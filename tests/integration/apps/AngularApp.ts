import { Component, signal } from '@angular/core';
import { GuardedArticle } from './AngularArticle';
@Component({
  selector: 'integration-root', standalone: true, imports: [GuardedArticle],
  template: '@if (visible()) { <app-guarded-article /> }'
})
export class AngularApp { visible = signal(true); }
