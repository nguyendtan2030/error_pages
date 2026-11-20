import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MagneticDirective } from '../../shared/motion';

@Component({
  selector: 'app-navbar',
  imports: [MagneticDirective],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {}
