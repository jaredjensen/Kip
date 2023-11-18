import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SailplanModalWidgetConfigComponent } from './sailplan-modal-widget-config.component';

describe('SailplanModalWidgetConfigComponent', () => {
  let component: SailplanModalWidgetConfigComponent;
  let fixture: ComponentFixture<SailplanModalWidgetConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SailplanModalWidgetConfigComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SailplanModalWidgetConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
