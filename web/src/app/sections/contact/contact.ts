import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MagneticDirective, RevealDirective, SpotlightDirective } from '../../shared/motion';

@Component({
  selector: 'app-contact',
  imports: [MagneticDirective, RevealDirective, SpotlightDirective],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {}
