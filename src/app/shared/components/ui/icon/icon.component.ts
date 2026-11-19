import { Component, input } from '@angular/core';

export type AppIconName =
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'check'
  | 'clock'
  | 'loader'
  | 'alert'
  | 'x'
  | 'rotate-ccw'
  | 'rocket'
  | 'moon'
  | 'sun'
  | 'send'
  | 'inbox'
  | 'circle-play'
  | 'circle-check'
  | 'circle-alert'
  | 'info'
  | 'ellipsis'
  | 'copy'
  | 'trash'
  | 'edit'
  | 'building'
  | 'user'
  | 'linkedin';

@Component({
  selector: 'app-icon, [appIcon]',
  templateUrl: './icon.component.html',
  host: {
    'class': 'inline-block align-middle shrink-0 size-[1em]',
    'aria-hidden': 'true',
  },
})
export class IconComponent {
  readonly name = input.required<AppIconName>();
}
