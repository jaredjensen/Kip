import { Component, OnInit } from '@angular/core';
import { BaseWidgetComponent } from '../../base-widget/base-widget.component';

@Component({
  selector: 'app-widget-blank',
  templateUrl: './widget-blank.component.html',
  styleUrls: ['./widget-blank.component.css']
})
export class WidgetBlankComponent extends BaseWidgetComponent implements OnInit {

  constructor() {
    super();

    this.defaultConfig = {
      displayName: ''
    };
  }

  ngOnInit(): void {
    this.validateConfig();
  }
}
