import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, Inject } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { ISkMetadata, ISkZone } from '../../core/interfaces/signalk-interfaces';
import { IMetaServicePathMeta, IPathMetaData } from '../../core/interfaces/app-interfaces';
import { Subscription } from 'rxjs';
import { ISkBaseUnit, UnitsService } from '../../core/services/units.service';
import { AuthenticationService } from '../../core/services/authentication.service';
import { cloneDeep } from 'lodash-es';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ReactiveFormsModule, FormGroup, FormBuilder, FormsModule, FormArray, ValidatorFn, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'metadata-editor',
  standalone: true,
  imports: [ FormsModule, ReactiveFormsModule, MatFormFieldModule, MatTableModule, MatPaginatorModule, MatCardModule, MatDividerModule],
  templateUrl: './metadata-editor.component.html',
  styleUrl: './metadata-editor.component.scss'
})
export class MetadataEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  public tableData = new MatTableDataSource<any>([]);
  public displayedColumns: string[] = ['path', 'meta.type', 'meta.units', 'actions'];

  private metaSub: Subscription;
  private tokenSub: Subscription;
  public hasToken: boolean = false;

  constructor(
    private data: DataService,
    private auth: AuthenticationService,
    public dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // Add custom sorting to support sub properties
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

    // data service Meta observer for full tree
    this.metaSub = this.data.startSkMetaFullTree().subscribe((metaArray: IMetaServicePathMeta[]) => {
      this.tableData.data = metaArray
        .filter(item => item.meta && item.meta.zones && item.meta.zones.length > 0)
        .map(item => ({
          path: item.path,

          zones: item.meta.zones
        }));
    });

    // logged in observer
    this.tokenSub = this.auth.authToken$.subscribe(authToken => {
      if (authToken && authToken.token) {
        this.hasToken = true;
      } else {
        this.hasToken = false;
      }
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

  public openMetaDialog(metaNode: IMetaServicePathMeta) {
    let dialogRef = this.dialog.open(DialogEditMetaProperties, {
      data: metaNode
    });

    dialogRef.afterClosed().subscribe((updatedMeta: IMetaServicePathMeta) => {
      if (updatedMeta === undefined || !updatedMeta) {
        return; //clicked Cancel, clicked outside the dialog, or navigated await from page using url bar.
      } else {
        // this.meta.setMeta(updatedMeta);
      }
    });
  }

  public openZonesDialog(metaNode: IMetaServicePathMeta) {
    let dialogRef = this.dialog.open(DialogEditZones, {
      data: metaNode
    });

    dialogRef.afterClosed().subscribe((zones: ISkZone) => {
      if (zones === undefined || !zones) {
        return; //clicked Cancel, clicked outside the dialog, or navigated await from page using url bar.
      } else {
        // this.meta.addZones(zones);
      }
    });
  }

  ngOnDestroy(): void {
    this.metaSub?.unsubscribe();
    this.tokenSub?.unsubscribe();
    this.data.stopSkMetaFullTree();
  }
}




// ***********
// *********** edit properties component
// ***********

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
  templateUrl: './edit-properties.modal.html',
  styleUrls: ['./metadata-editor.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatOptionModule, MatButtonModule, MatButtonToggleModule, MatDividerModule, MatDialogModule, MatTooltipModule]
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
      lower: [0, Validators.required],
      upper: [0, Validators.required],
      type: [''],
      power: [0, Validators.required]
    }, {
      validators: [displayScaleValidator()]
    }),
    alertMethod: [],
    warnMethod: [],
    alarmMethod: [],
    emergencyMethod: []
  }) ;
  public data: IPathMetaData;
  private selectSub: Subscription;

  public skValueUnits: ISkBaseUnit[];


  constructor(
    public dialogRef: MatDialogRef<DialogEditMetaProperties>,
    public fb: FormBuilder,
    public units: UnitsService,
    @Inject(MAT_DIALOG_DATA) public metaData: IMetaServicePathMeta) {
    }

  ngOnInit(): void {
    // Deep copy to loose obj references
    this.data = cloneDeep(this.metaData);
    // Delete unwanted obj keys (zones, type) to prevent downstream processing mistakes
    delete this.data.meta.zones;

    this.skValueUnits = this.units.getDefaultSkUnits();

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
    let meta: IPathMetaData;
    // Put back original value we don't want to change but must be included so we don't overwrite sk with blank value
    meta = this.data;
    // Push form values


    // meta.meta.description = this.propertiesForm.value.description;
    if (this.propertiesForm.value.displayName === '') {
      meta.meta.displayName = "DELETE";
    } else {
      meta.meta.displayName = this.propertiesForm.value.displayName;
    }
    // meta.meta.shortName = this.propertiesForm.value.shortName;
    // meta.meta.longName = this.propertiesForm.value.longName;
    // meta.meta.units = this.propertiesForm.value.units;

    // TODO: temp remove
    // meta.meta.units = undefined;
    // meta.meta.description = undefined;


    if (this.propertiesForm.value.timeout == null) {
      meta.meta.timeout = undefined;
    } else {
      meta.meta.timeout = this.propertiesForm.value.timeout;
    }
    // if (this.propertiesForm.value.displayScale.type !== '') {
    //   meta.meta.displayScale = {
    //     type: this.propertiesForm.value.displayScale.type,
    //     lower: this.propertiesForm.value.displayScale.lower,
    //     upper: this.propertiesForm.value.displayScale.upper,
    //     power: this.propertiesForm.value.displayScale.power,
    //   }
    // } else {
    //   meta.meta.displayScale = undefined;
    // }
    // meta.meta.alertMethod = this.propertiesForm.value.alertMethod;
    // meta.meta.warnMethod = this.propertiesForm.value.warnMethod;
    // meta.meta.alarmMethod = this.propertiesForm.value.alarmMethod;
    // meta.meta.emergencyMethod = this.propertiesForm.value.emergencyMethod;

    this.dialogRef.close(meta);
  }

  ngOnDestroy(): void {
    this.selectSub.unsubscribe();
  }
}



// ***********
// *********** edit zone component
// ***********

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
  templateUrl: './edit-zones.modal.html',
  styleUrls: ['./metadata-editor.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatOptionModule, MatButtonModule, MatButtonToggleModule, MatDividerModule, MatDialogModule, MatTooltipModule, MatMenuModule]
})
export class DialogEditZones implements OnInit {

  public zoneForm: FormGroup;
  public zonesArray: FormArray;
  public data: IPathMetaData;
  public path: string = null;
  public units: string = null;
  public availablePaths: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DialogEditZones>,
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public zoneData: IMetaServicePathMeta) {
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

  private loadZones(zone: ISkZone) {
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
    let zones = {path:'', zonesDef: []};

    zones.path = this.data.path;
    this.zoneForm.value.zones.forEach((zone: ISkZone) => {
      zones.zonesDef.push(zone);
    });

    this.dialogRef.close(zones);
  }
}
