import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-sailplan-modal-widget-config',
  templateUrl: './sailplan-modal-widget-config.component.html',
  styleUrls: ['./sailplan-modal-widget-config.component.css']
})
export class SailplanModalWidgetConfigComponent implements OnInit {
  @Input() sailPlanEnable: UntypedFormControl;
  @Input() sailPlanFormGroup: UntypedFormGroup;

  constructor() { }

  ngOnInit(): void {
    // this.sailPlanFormGroup.controls['sailPlan'].value;
  }

}
