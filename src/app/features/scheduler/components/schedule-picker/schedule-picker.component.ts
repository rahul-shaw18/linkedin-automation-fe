import { Component, DestroyRef, computed, inject, model, signal } from '@angular/core';
import { CalendarDate, DateValue, getLocalTimeZone, today } from '@internationalized/date';
import {
  RdxCalendarCellDirective,
  RdxCalendarCellTriggerDirective,
  RdxCalendarGridBodyDirective,
  RdxCalendarGridDirective,
  RdxCalendarGridHeadDirective,
  RdxCalendarGridRowDirective,
  RdxCalendarHeadCellDirective,
  RdxCalendarHeaderDirective,
  RdxCalendarHeadingDirective,
  RdxCalendarNextDirective,
  RdxCalendarPrevDirective,
  RdxCalendarRootDirective,
} from '@radix-ng/primitives/calendar';
import {
  RdxPopoverClose,
  RdxPopoverDescription,
  RdxPopoverPopup,
  RdxPopoverPortal,
  RdxPopoverPositioner,
  RdxPopoverRoot,
  RdxPopoverTitle,
  RdxPopoverTrigger,
} from '@radix-ng/primitives/popover';
import {
  RdxSelectItem,
  RdxSelectItemIndicator,
  RdxSelectList,
  RdxSelectItemText,
  RdxSelectPopup,
  RdxSelectPortal,
  RdxSelectPositioner,
  RdxSelectRoot,
  RdxSelectTrigger,
  RdxSelectValue,
} from '@radix-ng/primitives/select';
import { RdxToggle } from '@radix-ng/primitives/toggle';
import { RdxToggleGroup } from '@radix-ng/primitives/toggle-group';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { IconComponent } from '../../../../shared/components/ui/icon/icon.component';

export type SchedulePreset = 'now' | '15min' | 'tonight' | 'tomorrow' | 'custom';

@Component({
  selector: 'app-schedule-picker',
  imports: [
    RdxToggleGroup,
    RdxToggle,
    RdxPopoverRoot,
    RdxPopoverTrigger,
    RdxPopoverPortal,
    RdxPopoverPositioner,
    RdxPopoverPopup,
    RdxPopoverClose,
    RdxPopoverTitle,
    RdxPopoverDescription,
    RdxSelectRoot,
    RdxSelectTrigger,
    RdxSelectValue,
    RdxSelectPortal,
    RdxSelectPositioner,
    RdxSelectPopup,
    RdxSelectList,
    RdxSelectItem,
    RdxSelectItemText,
    RdxSelectItemIndicator,
    RdxCalendarRootDirective,
    RdxCalendarHeaderDirective,
    RdxCalendarHeadingDirective,
    RdxCalendarPrevDirective,
    RdxCalendarNextDirective,
    RdxCalendarGridDirective,
    RdxCalendarGridHeadDirective,
    RdxCalendarGridRowDirective,
    RdxCalendarHeadCellDirective,
    RdxCalendarGridBodyDirective,
    RdxCalendarCellDirective,
    RdxCalendarCellTriggerDirective,
    ButtonComponent,
    IconComponent,
  ],
  templateUrl: './schedule-picker.component.html',
})
export class SchedulePickerComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly targetTime = model<Date>(new Date(Date.now() - 10 * 1000));

  readonly selectedPreset = signal<SchedulePreset>('now');
  readonly currentTime = signal<Date>(new Date());
  readonly displayTime = signal<Date>(new Date());

  readonly hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  readonly minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  readonly isDateDisabled = (date: DateValue): boolean => {
    const t = today(getLocalTimeZone());
    return date.compare(t) < 0;
  };

  private readonly initialTime = this.computeInitialTime();
  readonly calendarDate = signal<DateValue>(today(getLocalTimeZone()));
  readonly selectedHour = signal<string>(this.initialTime.hour);
  readonly selectedMinute = signal<string>(this.initialTime.minute);
  readonly selectedPeriod = signal<'AM' | 'PM'>(this.initialTime.period);

  readonly isHourOpen = signal<boolean>(false);
  readonly isMinuteOpen = signal<boolean>(false);

  readonly formattedScheduledTime = computed(() => {
    return this.displayTime().toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  });

  constructor() {
    const timer = setInterval(() => {
      const now = new Date();
      this.currentTime.set(now);
      const preset = this.selectedPreset();
      if (preset === 'now') {
        this.displayTime.set(now);
        this.targetTime.set(new Date(now.getTime() - 10 * 1000));
      } else if (preset === '15min') {
        const target = new Date(now.getTime() + 15 * 60 * 1000);
        this.displayTime.set(target);
        this.targetTime.set(target);
      }
    }, 1000);

    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
    });
  }

  reset(): void {
    this.setPreset('now');
  }

  setPreset(preset: 'now' | '15min' | 'tonight' | 'tomorrow'): void {
    this.selectedPreset.set(preset);
    const now = new Date();

    if (preset === 'now') {
      const immediate = new Date(now.getTime() - 10 * 1000);
      this.targetTime.set(immediate);
      this.displayTime.set(now);
      this.syncPickersFromDate(now);
    } else if (preset === '15min') {
      const target = new Date(now.getTime() + 15 * 60 * 1000);
      this.targetTime.set(target);
      this.displayTime.set(target);
      this.syncPickersFromDate(target);
    } else if (preset === 'tonight') {
      const tonight = new Date();
      tonight.setHours(20, 0, 0, 0);
      if (tonight.getTime() <= now.getTime()) {
        tonight.setDate(tonight.getDate() + 1);
      }
      this.targetTime.set(tonight);
      this.displayTime.set(tonight);
      this.syncPickersFromDate(tonight);
    } else if (preset === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      this.targetTime.set(tomorrow);
      this.displayTime.set(tomorrow);
      this.syncPickersFromDate(tomorrow);
    }
  }

  onPresetToggle(values: string[]): void {
    const chosen = values[values.length - 1] ?? values[0];
    if (chosen === 'now' || chosen === '15min' || chosen === 'tonight' || chosen === 'tomorrow') {
      this.setPreset(chosen);
    }
  }

  onCalendarDateChange(newDate: DateValue | DateValue[] | undefined): void {
    if (!newDate) return;
    const single = Array.isArray(newDate) ? newDate[0] : newDate;
    if (single) {
      this.calendarDate.set(single);
      this.closeTimePickers();
      this.selectedPreset.set('custom');
      this.syncTargetTimeFromPickers();
    }
  }

  onHourOpenChange(open: boolean): void {
    this.isHourOpen.set(open);
    if (open) {
      this.isMinuteOpen.set(false);
    }
  }

  onMinuteOpenChange(open: boolean): void {
    this.isMinuteOpen.set(open);
    if (open) {
      this.isHourOpen.set(false);
    }
  }

  closeTimePickers(): void {
    this.isHourOpen.set(false);
    this.isMinuteOpen.set(false);
  }

  onHourSelect(hour: unknown): void {
    if (!hour || typeof hour !== 'string') return;
    this.selectedHour.set(hour);
    this.isHourOpen.set(false);
    this.selectedPreset.set('custom');
    this.syncTargetTimeFromPickers();
  }

  onMinuteSelect(minute: unknown): void {
    if (!minute || typeof minute !== 'string') return;
    this.selectedMinute.set(minute);
    this.isMinuteOpen.set(false);
    this.selectedPreset.set('custom');
    this.syncTargetTimeFromPickers();
  }

  onPeriodToggle(values: string[]): void {
    const chosen = values[values.length - 1] ?? values[0];
    if (chosen === 'AM' || chosen === 'PM') {
      this.selectedPeriod.set(chosen);
      this.closeTimePickers();
      this.selectedPreset.set('custom');
      this.syncTargetTimeFromPickers();
    }
  }

  setQuickOffset(hours: number): void {
    const target = new Date(Date.now() + hours * 3600 * 1000);
    this.targetTime.set(target);
    this.displayTime.set(target);
    this.closeTimePickers();
    this.syncPickersFromDate(target);
    this.selectedPreset.set('custom');
  }

  setPresetDate(type: 'tomorrow-morning' | 'tomorrow-evening'): void {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    if (type === 'tomorrow-morning') {
      target.setHours(9, 0, 0, 0);
    } else {
      target.setHours(18, 0, 0, 0);
    }
    this.targetTime.set(target);
    this.displayTime.set(target);
    this.closeTimePickers();
    this.syncPickersFromDate(target);
    this.selectedPreset.set('custom');
  }

  private syncPickersFromDate(d: Date): void {
    this.calendarDate.set(new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate()));
    let h = d.getHours();
    const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    this.selectedHour.set(h.toString().padStart(2, '0'));
    const mins = d.getMinutes();
    const nearestFive = Math.round(mins / 5) * 5;
    const mStr = (nearestFive >= 60 ? 55 : nearestFive).toString().padStart(2, '0');
    this.selectedMinute.set(mStr);
    this.selectedPeriod.set(p);
  }

  private syncTargetTimeFromPickers(): void {
    const cal = this.calendarDate();
    let h = parseInt(this.selectedHour(), 10);
    if (isNaN(h)) h = 12;
    if (this.selectedPeriod() === 'PM' && h < 12) {
      h += 12;
    } else if (this.selectedPeriod() === 'AM' && h === 12) {
      h = 0;
    }
    const m = parseInt(this.selectedMinute(), 10) || 0;
    const date = new Date(cal.year, cal.month - 1, cal.day, h, m, 0);
    this.targetTime.set(date);
    this.displayTime.set(date);
  }

  private computeInitialTime(): { hour: string; minute: string; period: 'AM' | 'PM' } {
    const d = new Date(Date.now() + 3600 * 1000);
    let h = d.getHours();
    const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const mins = d.getMinutes();
    const nearestFive = Math.round(mins / 5) * 5;
    const mStr = (nearestFive >= 60 ? 55 : nearestFive).toString().padStart(2, '0');
    return { hour: h.toString().padStart(2, '0'), minute: mStr, period: p };
  }
}

