import { Component, computed, input } from '@angular/core';
import {
  RdxProgressRootDirective,
  RdxProgressTrackDirective,
  RdxProgressIndicatorDirective,
} from '@radix-ng/primitives/progress';

export type ProgressVariant = 'primary' | 'warning' | 'error' | 'success';

@Component({
  selector: 'app-progress',
  imports: [
    RdxProgressRootDirective,
    RdxProgressTrackDirective,
    RdxProgressIndicatorDirective,
  ],
  templateUrl: './progress.component.html',
})
export class ProgressComponent {
  readonly value = input.required<number>();
  readonly max = input<number>(100);
  readonly label = input<string>('');
  readonly showValueText = input<boolean>(true);
  readonly variant = input<ProgressVariant | 'auto'>('auto');

  readonly percentage = computed(() => {
    const maxVal = this.max() || 1;
    return Math.min(100, Math.max(0, (this.value() / maxVal) * 100));
  });

  readonly valueText = computed(() => `${this.value()} / ${this.max()}`);

  readonly indicatorClass = computed(() => {
    const v = this.variant();
    if (v !== 'auto') {
      const variantClasses: Record<ProgressVariant, string> = {
        primary: 'bg-primary-500',
        warning: 'bg-warning-500',
        error: 'bg-error-500',
        success: 'bg-success-500',
      };
      return variantClasses[v];
    }
    const pct = this.percentage();
    if (pct > 93) return 'bg-error-500';
    if (pct > 66) return 'bg-warning-500';
    return 'bg-primary-500';
  });

  readonly textClass = computed(() => {
    const pct = this.percentage();
    if (pct > 93) return 'text-error-600 font-bold';
    return 'text-secondary-600';
  });
}
