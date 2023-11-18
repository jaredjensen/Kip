import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ISailPlan } from '../widgets-interface';

@Component({
  selector: 'app-sailplan-modal-widget-config',
  templateUrl: './sailplan-modal-widget-config.component.html',
  styleUrls: ['./sailplan-modal-widget-config.component.css']
})
export class SailplanModalWidgetConfigComponent implements OnInit {
  @Input() formGroup: UntypedFormGroup;
  sailPlan: ISailPlan[];
  columnsToDisplay = ['label', 'maxWind', 'sailToReduce'];

  constructor() { }

  ngOnInit(): void {
    this.sailPlan = this.formGroup.controls['sailPlan'].value;
  }

}
