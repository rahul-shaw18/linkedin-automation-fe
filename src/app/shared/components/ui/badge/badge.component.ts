import { Component, computed, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'primary';

@Component({
  selector: 'span[appBadge]',
  template: `
    @if (dot()) {
      <span class="w-1.5 h-1.5 rounded-full" [class]="dotClasses()"></span>
    }
    <ng-content />
  `,
  host: {
    '[class]': 'classes()',
  },
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('secondary');
  readonly pulse = input<boolean>(false);
  readonly dot = input<boolean>(false);

  readonly classes = computed(() => {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border';

    const variants: Record<BadgeVariant, string> = {
      primary: 'bg-primary-50 text-primary-700 border-primary-200',
      success: 'bg-success-50 text-success-700 border-success-200',
      warning: 'bg-warning-50 text-warning-700 border-warning-200',
      error: 'bg-error-50 text-error-700 border-error-200',
      info: 'bg-info-50 text-info-700 border-info-200',
      secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200',
    };

    return `${base} ${variants[this.variant()]}`;
  });

  readonly dotClasses = computed(() => {
    const dotColors: Record<BadgeVariant, string> = {
      primary: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      info: 'bg-info-500',
      secondary: 'bg-secondary-500',
    };

    const pulseClass = this.pulse() ? 'animate-pulse' : '';
    return `${dotColors[this.variant()]} ${pulseClass}`;
  });
}
