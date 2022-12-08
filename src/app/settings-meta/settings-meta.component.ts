import { IZone } from './../signalk-interfaces';
import { Subscription } from 'rxjs';
import { MetaService, IMetaRegistration } from './../meta.service';
import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, FormArray, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPathZoneDef } from '../app.interfaces';


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
    this.tableData.filter = "";
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

    dialogRef.afterClosed().subscribe((zones: IPathZoneDef) => {
      if (zones === undefined || !zones) {
        return; //clicked Cancel, clicked outside the dialog, or navigated await from page using url bar.
      } else {
        this.meta.addZones(zones);
      }
    });
  }
}




// *********** edit zone compoment

// zone form validator function
export function rangeValidator(): ValidatorFn {
  return (form: FormGroup) : ValidationErrors | null => {
    const upper: number = form.get('upper').value;
    const lower: number = form.get('lower').value;

    if (( lower !== undefined && lower !== null) && ( upper !== undefined && upper !== null)) {
      if (lower >= upper) {
        return {lowIsUp: true};
      }
    }
    return null;
  }
};

@Component({
  selector: 'dialog-edit-zones',
  templateUrl: './settings-meta-edit-zones.modal.html',
  styleUrls: ['./settings-meta.component.scss']
})
export class DialogEditZones implements OnInit {

  public zoneForm: FormGroup;
  public zonesArray: FormArray;
  public path: string = null;
  public units: string = null;

  // public zoneForm = this.fb.group({
  //   path: [''],
  //   units: ['--'],
  //   alert: this.fb.group({
  //     range: this.fb.group({
  //       lower: [null],
  //       upper: [null],
  //     }, {validators: rangeValidator}),
  //     message: [''],
  //     method: [[]]
  //   }, {validators: formValidator}),
  //   warn: this.fb.group({
  //     range: this.fb.group({
  //       lower: [null],
  //       upper: [null],
  //     }, {validators: rangeValidator}),
  //     message: [''],
  //     method: [[]]
  //   }, {validators: formValidator}),
  //   alarm: this.fb.group({
  //     range: this.fb.group({
  //       lower: [null],
  //       upper: [null],
  //     }, {validators: rangeValidator}),
  //     message: [''],
  //     method: [[]]
  //   }, {validators: formValidator}),
  //   emergency: this.fb.group({
  //     range: this.fb.group({
  //       lower: [null],
  //       upper: [null],
  //     }, {validators: rangeValidator}),
  //     message: [''],
  //     method: [[]]
  //   }, {validators: formValidator}),
  // });

  public availablePaths: any[] = [];
  public titleDialog: string = null;

  constructor(
    public dialogRef: MatDialogRef<DialogEditZones>,
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: IMetaRegistration) {
    }

  ngOnInit(): void {
    this.path = this.data.path;
    this.units = this.data.meta?.units  || '--';

    // init from controls with Array of zones formGroup
    this.zoneForm = this.fb.group({
      zones: this.fb.array([])
    });

    if (this.data.meta.zones !== undefined) {
      this.data.meta.zones.forEach(zone => this.loadZones(zone));
    }
  }

  private loadZones(zone: IZone) {
    this.zones.push(this.fb.group({
      state: [zone.state],
      lower: [zone?.lower],
      upper: [zone?.upper],
      message: [zone?.message],
      }, {
        validators: [rangeValidator()]
      }
    ));

  }

  public addZone(severity: string) {
    this.zones.push(this.fb.group({
      state: [severity],
      lower: [null],
      upper: [null],
      message: [''],
      }, {
        validators: [rangeValidator()]
      }
    ));
  }

  public deleteZone(zoneId: number) {
    this.zones.removeAt(zoneId);
  }

  // getter to form zones array
  get zones() {
    return this.zoneForm.get('zones') as FormArray;
  }

  closeForm() {
    let zones: IPathZoneDef = {path:'', zonesDef: []};

    zones.path = this.data.path;
    this.zoneForm.value.zones.forEach((zone: IZone) => {
      zones.zonesDef.push(zone);
    });

    this.dialogRef.close(zones);
  }
}
