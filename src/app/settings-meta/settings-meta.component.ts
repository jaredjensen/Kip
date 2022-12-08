import { Subscription } from 'rxjs';
import { MetaService, IMetaRegistration } from './../meta.service';
import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormControl, Validators, FormBuilder, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPathMetadata, IPathZoneDef } from '../app.interfaces';
import { SignalKService } from '../signalk.service';
import { ISignalKMetadata } from '../signalk-interfaces';


@Component({
  selector: 'app-settings-meta',
  templateUrl: './settings-meta.component.html',
  styleUrls: ['./settings-meta.component.scss']
})
export class SettingsMetaComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  tableData = new MatTableDataSource<IMetaRegistration>([]);
  displayedColumns: string[] = ['path', 'meta.type', 'meta.units', 'actions'];

  metaSub: Subscription;

  constructor(
    private meta: MetaService,
    public dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // Add custom sorting to support sub propertites
    this.tableData.sortingDataAccessor = (item, property) => {
      switch(property) {
        case 'meta.type':
          return item.meta.type;

        case 'meta.units':
          // Units as lowercase for sorting and replace null or undefined property with '' to prevent string lowercase exceptions
          return item.meta.units?.toLowerCase() || '';

        default:
          return item[property];
      }
    };
    this.tableData.sort = this.sort;

    this.metaSub = this.meta.getMetasObservable().subscribe((metas: Array<IMetaRegistration>) => {
      //TODO: Watchout for references! To validate...
      this.tableData.data = metas;
    });
  }

  public trackByPath(index: number, item: any): string {
    return `${item.path}`;
  }

  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.tableData.filter = filterValue.trim().toLowerCase();

    if (this.tableData.paginator) {
      this.tableData.paginator.firstPage();
    }
  }

  ngAfterViewInit() {
    this.tableData.paginator = this.paginator;
    this.tableData.sort = this.sort;
    // this.tableData.filter = "";
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.metaSub.unsubscribe();
  }

  public openMetaDialog() {

  }

  public openZonesDialog(metaMode: IMetaRegistration) {
    let dialogRef = this.dialog.open(DialogEditZones, {
      data: metaMode
    });

    dialogRef.afterClosed().subscribe((zone: IPathZoneDef) => {
      if (zone === undefined || !zone) {
        return; //clicked Cancel, clicked outside the dialog, or navigated await from page using url bar.
      } else {
        // this.addZones(zone);
      }
    });
  }
}


export const rangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const upper: number = control.get('upper').value;
  const lower: number = control.get('lower').value;

  if (( lower !== undefined && lower !== null) && ( upper !== undefined && upper !== null)) {
    if (lower >= upper) {
      return {needUpperLower: true};
    }
  }
  return null;
};

export const formValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const upper: number = control.get('range.upper').value;
  const lower: number = control.get('range.lower').value;
  const method: string[] = control.get('method').value;

  if (( lower === undefined || lower === null) && ( upper === undefined || upper === null)) {
      return null;
  } else if (method.length) {
    return null;
  } else {
    return {noMethod: true};
  }
};


// edit zone compoment
@Component({
  selector: 'dialog-edit-zones',
  templateUrl: './settings-meta-edit-zones.modal.html',
  styleUrls: ['./settings-meta.component.scss']
})
export class DialogEditZones implements OnInit {

  public zoneForm = this.fb.group({
    path: [''],
    units: ['--'],
    alert: this.fb.group({
      range: this.fb.group({
        lower: [null],
        upper: [null],
      }, {validators: rangeValidator}),
      message: [''],
      method: [[]]
    }, {validators: formValidator}),
    warn: this.fb.group({
      range: this.fb.group({
        lower: [null],
        upper: [null],
      }, {validators: rangeValidator}),
      message: [''],
      method: [[]]
    }, {validators: formValidator}),
    alarm: this.fb.group({
      range: this.fb.group({
        lower: [null],
        upper: [null],
      }, {validators: rangeValidator}),
      message: [''],
      method: [[]]
    }, {validators: formValidator}),
    emergency: this.fb.group({
      range: this.fb.group({
        lower: [null],
        upper: [null],
      }, {validators: rangeValidator}),
      message: [''],
      method: [[]]
    }, {validators: formValidator}),
  });

  public availablePaths: any[] = [];
  public titleDialog: string = null;

  constructor(
    private signalk: SignalKService,
    public dialogRef: MatDialogRef<DialogEditZones>,
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: IMetaRegistration) {
    }

  ngOnInit(): void {
      this.titleDialog = "Edit Zones";
      this.zoneForm.get('path').patchValue(this.data.path);
      this.zoneForm.get('path').disable();
      this.zoneForm.get('units').patchValue(this.data.meta?.units  || '--');
      this.zoneForm.get('units').disable();

      this.zoneForm.get('alert.method').patchValue(this.data.meta?.alertMethod || []);
      this.zoneForm.get('warn.method').patchValue(this.data.meta?.warnMethod || []);
      this.zoneForm.get('alarm.method').patchValue(this.data.meta?.alarmMethod || []);
      this.zoneForm.get('alarm.method').patchValue(this.data.meta?.emergencyMethod || []);

      if (this.data.meta.zones !== undefined) {
        this.zoneForm.get('alert.range.lower').patchValue(this.data.meta.zones[1]?.lower);
        this.zoneForm.get('alert.range.upper').patchValue(this.data.meta.zones[1]?.upper);
        this.zoneForm.get('alert.message').patchValue(this.data.meta.zones[1]?.message);

        this.zoneForm.get('warn.range.lower').patchValue(this.data.meta.zones[2]?.lower,);
        this.zoneForm.get('warn.range.upper').patchValue(this.data.meta.zones[2]?.upper);
        this.zoneForm.get('warn.message').patchValue(this.data.meta.zones[2]?.message);

        this.zoneForm.get('alarm.range.lower').patchValue(this.data.meta.zones[3]?.lower);
        this.zoneForm.get('alarm.range.upper').patchValue(this.data.meta.zones[3]?.upper);
        this.zoneForm.get('alarm.message').patchValue(this.data.meta.zones[3]?.message);

        this.zoneForm.get('emergency.range.lower').patchValue(this.data.meta.zones[4]?.lower);
        this.zoneForm.get('emergency.range.upper').patchValue(this.data.meta.zones[4]?.upper);
        this.zoneForm.get('emergency.message').patchValue(this.data.meta.zones[4]?.message);
      }
  }

  closeForm() {
    let zones: IPathMetadata = {
      path: this.data.path,
      meta: {
        alertMethod: this.zoneForm.value.alert.method,
        warnMethod: this.zoneForm.value.warn.method,
        alarmMethod: this.zoneForm.value.alarm.method,
        emergencyMethod: this.zoneForm.value.emergency.method,
        zones: [
          {
            state: 'aasas',
            lower: this.zoneForm.value.alert.range.lower,
            upper: this.zoneForm.value.alert.range.upper,
            message: this.zoneForm.value.alert.message
          },
          {
            state: '',
            lower: this.zoneForm.value.warn.range.lower,
            upper: this.zoneForm.value.warn.range.upper,
            message: this.zoneForm.value.warn.message
          },
          {
            state: '',
            lower: this.zoneForm.value.alarm.range.lower,
            upper: this.zoneForm.value.alarm.range.upper,
            message: this.zoneForm.value.alarm.message
          },
          {
            state: '',
            lower: this.zoneForm.value.emergency.range.lower,
            upper: this.zoneForm.value.emergency.range.upper,
            message: this.zoneForm.value.emergency.message
          }
        ]
      }
    };

    this.dialogRef.close(zones);
  }
}
