import { Component, computed, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'button[appButton]',
  imports: [IconComponent],
  template: `
    @if (loading()) {
      <app-icon name="loader" class="animate-spin text-sm" />
    }
    <ng-content />
  `,
  host: {
    '[type]': 'type()',
    '[disabled]': 'disabled() || loading()',
    '[class]': 'classes()',
    '[attr.aria-busy]': 'loading()',
    '[attr.data-disabled]': 'disabled() || loading() ? "" : undefined',
  },
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<ButtonType>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly classes = computed(() => {
    const base =
      'group inline-flex items-center justify-center gap-2 font-medium transition-all select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed cursor-pointer';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-primary-600 hover:bg-primary-700 text-white shadow-xs focus:ring-primary-500 border border-transparent',
      secondary:
        'bg-secondary-100 hover:bg-secondary-200 text-secondary-800 focus:ring-secondary-400 border border-transparent',
      outline:
        'bg-white hover:bg-secondary-50 text-secondary-700 border border-secondary-300 focus:ring-primary-500 shadow-xs',
      destructive:
        'bg-error-600 hover:bg-error-700 text-white shadow-xs focus:ring-error-500 border border-transparent',
      ghost:
        'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 border border-transparent',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-8 text-xs px-2.5 rounded-lg',
      md: 'text-xs px-4 py-2 rounded-xl font-semibold',
      lg: 'text-sm px-6 py-2.5 rounded-xl font-semibold',
      icon: 'size-8 rounded-lg text-xs',
    };

    return `${base} ${variants[this.variant()]} ${sizes[this.size()]}`;
  });
}
