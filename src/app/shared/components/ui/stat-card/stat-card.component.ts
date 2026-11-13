import { Component, computed, input } from '@angular/core';

export type StatVariant = 'primary' | 'warning' | 'success' | 'error';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<number | string>();
  readonly variant = input<StatVariant>('primary');
  readonly loading = input<boolean>(false);

  readonly hoverBorderClass = computed(() => {
    const borders: Record<StatVariant, string> = {
      primary: 'hover:border-primary-300',
      warning: 'hover:border-warning-300',
      success: 'hover:border-success-300',
      error: 'hover:border-error-300',
    };
    return borders[this.variant()];
  });

  readonly labelColorClass = computed(() => {
    const colors: Record<StatVariant, string> = {
      primary: 'text-secondary-500',
      warning: 'text-warning-600',
      success: 'text-success-600',
      error: 'text-error-600',
    };
    return colors[this.variant()];
  });

  readonly valueColorClass = computed(() => {
    const colors: Record<StatVariant, string> = {
      primary: 'text-secondary-900',
      warning: 'text-warning-700',
      success: 'text-success-700',
      error: 'text-error-700',
    };
    return colors[this.variant()];
  });
}
