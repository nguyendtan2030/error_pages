import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The fixed page background: a tiny pre-blurred image and two drifting gradient orbs. */
@Component({
  selector: 'app-backdrop',
  templateUrl: './backdrop.html',
  styleUrl: './backdrop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class Backdrop {}
