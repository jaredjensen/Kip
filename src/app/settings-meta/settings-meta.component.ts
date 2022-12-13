import { IZone, Type } from './../signalk-interfaces';
import { Subscription } from 'rxjs';
import { MetaService, IMetaRegistration } from './../meta.service';
import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormBuilder, FormArray, ValidatorFn, ValidationErrors, FormControl, Validators } from '@angular/forms';
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
      this.tableData.data = [...metas];
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

  public openMetaDialog(metaNode: IMetaRegistration) {
    let dialogRef = this.dialog.open(DialogEditMetaProperties, {
      data: metaNode
    });

    dialogRef.afterClosed().subscribe((updatedMeta: IMetaRegistration) => {
      if (updatedMeta === undefined || !updatedMeta) {
        return; //clicked Cancel, clicked outside the dialog, or navigated await from page using url bar.
      } else {
        this.meta.setMeta(updatedMeta);
      }
    });
  }

  public openZonesDialog(metaNode: IMetaRegistration) {
    let dialogRef = this.dialog.open(DialogEditZones, {
      data: metaNode
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



// *********** edit properties compoment

// zone form validator function
export function displayScaleValidator(): ValidatorFn {
  return (form: FormGroup) : ValidationErrors | null => {
    const type: string = form.get('type').value;
    const upper: number = form.get('upper').value;
    const lower: number = form.get('lower').value;

    if (type === 'logarithmic') {
      if (upper === 0 || lower === 0) {
        return {cantBeZero: true};
      }
    }
    return null;
  }
};


@Component({
  selector: 'dialog-edit-meta-properties',
  templateUrl: './settings-meta-edit-properties.modal.html',
  styleUrls: ['./settings-meta.component.scss']
})
export class DialogEditMetaProperties implements OnInit, OnDestroy {

  public path: string = null;
  public propertiesForm = this.fb.group({
    displayName: [''],
    shortName: [''],
    longName: [''],
    description: [''],
    units: [''],
    timeout: [null],
    displayScale: this.fb.group({
      lower: [null, Validators.required],
      upper: [null, Validators.required],
      type: [''],
      power: [null, Validators.required]
    }, {
      validators: [displayScaleValidator()]
    }),
    alertMethod: [[]],
    warnMethod: [[]],
    alarmMethod: [[]],
    emergencyMethod: [[]]
  }) ;
  public data: IMetaRegistration;
  private selectSub: Subscription;


  constructor(
    public dialogRef: MatDialogRef<DialogEditMetaProperties>,
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public metaData: IMetaRegistration) {
    }

  ngOnInit(): void {
    // Deep copy to loose obj references
    this.data = JSON.parse(JSON.stringify(this.metaData));
    //  flush zones. Easier to track for downstream processing
    this.data.meta.zones = undefined;

    this.selectSub = this.propertiesForm.get('displayScale.type').valueChanges.subscribe(value => {
      this.setDisplayScaleControls(value);
    })

    this.path = this.data.path;
    this.propertiesForm.patchValue({displayName: this.data.meta?.displayName});
    this.propertiesForm.patchValue({shortName: this.data.meta?.shortName});
    this.propertiesForm.patchValue({longName: this.data.meta?.longName});
    this.propertiesForm.patchValue({description: this.data.meta?.description});
    this.propertiesForm.patchValue({units: this.data.meta?.units});
    this.propertiesForm.patchValue({timeout: this.data.meta?.timeout});

    this.propertiesForm.controls.displayScale.patchValue({lower: this.data.meta?.displayScale?.lower});
    this.propertiesForm.controls.displayScale.patchValue({upper: this.data.meta?.displayScale?.upper});
    this.propertiesForm.controls.displayScale.patchValue({type: this.data.meta?.displayScale?.type || ''});
    this.propertiesForm.controls.displayScale.patchValue({power: this.data.meta?.displayScale?.power});

    this.propertiesForm.patchValue({alertMethod: this.data.meta?.alertMethod});
    this.propertiesForm.patchValue({warnMethod: this.data.meta?.warnMethod});
    this.propertiesForm.patchValue({alarmMethod: this.data.meta?.alarmMethod});
    this.propertiesForm.patchValue({emergencyMethod: this.data.meta?.emergencyMethod});
  }

  public setDisplayScaleControls(value: string) {
    let lower = this.propertiesForm.get('displayScale.lower');
    let upper = this.propertiesForm.get('displayScale.upper');
    let power = this.propertiesForm.get('displayScale.power');

    switch (value) {
      case '':
        lower.disable();
        upper.disable();
        power.disable();
        break;

      case 'power':
        lower.enable();
        upper.enable();
        power.enable();
        break;

      default:
        lower.enable();
        upper.enable();
        power.disable();
        break;
    }
  }

  closeForm() {
    let meta: IMetaRegistration;
    // Put back original value we don't want to change but must be included so we don't overwrite sk with blank value
    meta = this.data;
    // Push form
    meta.meta.description = this.propertiesForm.value.description;
    meta.meta.displayName = this.propertiesForm.value.displayName;
    meta.meta.shortName = this.propertiesForm.value.shortName;
    meta.meta.longName = this.propertiesForm.value.longName;
    if (this.propertiesForm.value.displayScale.type !== '') {
      meta.meta.displayScale = {
        type: this.propertiesForm.value.displayScale.type,
        lower: this.propertiesForm.value.displayScale.lower,
        upper: this.propertiesForm.value.displayScale.upper,
        power: this.propertiesForm.value.displayScale.power,
      }
    }
    meta.meta.alertMethod = this.propertiesForm.value.alertMethod;
    meta.meta.warnMethod = this.propertiesForm.value.warnMethod;
    meta.meta.alarmMethod = this.propertiesForm.value.alarmMethod;
    meta.meta.emergencyMethod = this.propertiesForm.value.emergencyMethod;

    this.dialogRef.close(meta);
  }

  ngOnDestroy(): void {
    this.selectSub.unsubscribe();
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
  public data: IMetaRegistration;
  public path: string = null;
  public units: string = null;
  public availablePaths: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DialogEditZones>,
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public zoneData: IMetaRegistration) {
    }

  ngOnInit(): void {
    // Loose obj reference
    this.data = {...this.zoneData};

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
