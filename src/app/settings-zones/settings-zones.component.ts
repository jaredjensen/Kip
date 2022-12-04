import { SignalKService } from './../signalk.service';
import { Component, OnInit, Inject, ViewChild, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, RequiredValidator }    from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { ZonesService, IPathZone } from "../zones.service";
import { IZone, IZoneState, IPathZoneDef } from "../app.interfaces";

interface ITreeData {
  path?: string;
  dataState?: IZoneState;
  upper?: number;
  lower?: number;
  message?: string;
  state?: IZoneState;
  children?: ITreeData[];
}

@Component({
  selector: 'app-settings-zones',
  templateUrl: './settings-zones.component.html',
  styleUrls: ['./settings-zones.component.scss']
})
export class SettingsZonesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  public dataSource = new MatTreeNestedDataSource<ITreeData>();
  public treeControl = new NestedTreeControl<ITreeData>(node => node.children);
  private zonesSub: Subscription;

  constructor(
    private zones: ZonesService,
    public dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    ) { }

  ngOnInit() {
    this.zonesSub = this.zones.getZonesObservable().subscribe(zoneItems => {
      // transform service data structure to tree control data srtucture
      let zoneData: ITreeData[] = [];
      zoneItems.forEach(item => {
        let dataItem: ITreeData = {children: []};
        dataItem.path = item.path;
        dataItem.dataState = item.dataState;

        if (item.zonesDef) {
          item.zonesDef.forEach( zoneDef => {
            let zone: ITreeData = {};
            zone.state = zoneDef.state;
            zone.lower = zoneDef.lower;
            zone.upper = zoneDef.upper;
            zone.message = zoneDef.message;

            dataItem.children.push(zone);
          });
        }
        zoneData.push(dataItem);
      })

    this.dataSource.data = zoneData;
    });
  }

  ngAfterViewInit() {
    // this.dataSource.paginator = this.paginator;
    // this.dataSource.sort = this.sort;
    // this.dataSource.filter = "";
    this.cdRef.detectChanges();
  }

  public hasChild(index: number, node: ITreeData) {
    return node?.children?.length > 0;
  }

  public trackByPath(index: number, item: IPathZoneDef): string {
    return `${item.path}`;
  }

  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.data.filter(item => item.path = filterValue.trim().toLowerCase() ) ;

    // if (this.dataSource.paginator) {
    //   this.dataSource.paginator.firstPage();
    // }
  }

  public openZoneDialog(node?: ITreeData): void {
    let dialogRef;

    if (node) {
      dialogRef = this.dialog.open(DialogZones, {
        data: {
          item: node,
          dataSource: this.dataSource
        }
      });
    } else {
      dialogRef = this.dialog.open(DialogZones, {
        data: {
          dataSource: this.dataSource
        }
      });
    }

    dialogRef.afterClosed().subscribe((zone: IPathZoneDef) => {
      if (zone === undefined || !zone) {
        return; //clicked Cancel, clicked outside the dialog, or navigated await from page using url bar.
      } else {
        this.addZones(zone);
      }
    });
  }

  public addZones(zone: IPathZone) {
    this.zones.addZones(zone);
  }

  public deleteZones(node: any) {
    if (!this.zones.deleteZones(node.path)) {
      //TODO: Send error notification as UI confirmation
    }
  }

  ngOnDestroy(): void {
    this.zonesSub.unsubscribe();
  }
}


// Add zone compoment
@Component({
  selector: 'dialog-zones',
  templateUrl: './settings-zones.modal.html',
  styleUrls: ['./settings-zones.modal.css']
})
export class DialogZones implements OnInit {

  public zoneForm: FormGroup = new FormGroup({
    zonesPath: new FormControl(null),
    filterSelfPaths: new FormControl(true),
    zoneNormal: new FormGroup({
      lower: new FormControl(null),
      upper: new FormControl(null)
    }, this.rangeValidationFunction),
    zoneAlert: new FormGroup({
      lower: new FormControl(null),
      upper: new FormControl(null)
    }, this.rangeValidationFunction),
    zoneWarn: new FormGroup({
      lower: new FormControl(null),
      upper: new FormControl(null)
    }, this.rangeValidationFunction),
    zoneAlarm: new FormGroup({
      lower: new FormControl(null),
      upper: new FormControl(null)
    }, this.rangeValidationFunction),
    zoneEmergency: new FormGroup({
      lower: new FormControl(null),
      upper: new FormControl(null)
    }, this.rangeValidationFunction)
  }, this.zonesValidationFunction);

  public availablePaths: string[] = [];
  public titleDialog: string = null;

  constructor(
    private signalk: SignalKService,
    public dialogRef: MatDialogRef<DialogZones>,
    @Inject(MAT_DIALOG_DATA) public data: {item: ITreeData, dataSource: MatTreeNestedDataSource<ITreeData>},) {
    }

  ngOnInit(): void {
    if (!this.data.item) {
      this.titleDialog = "Add Zones";
      // Remove paths that are already defined so we don't define twice
      let allPaths = this.signalk.getPathsByType('number').sort();
      this.data.dataSource.data.forEach( dataSourceItem => {
        let index = allPaths.findIndex(item => item == dataSourceItem.path);
        if (index >= 0) {
          allPaths.splice(index, 1);
        }
      });

      this.availablePaths = allPaths;

    } else {
      this.titleDialog = "Edit Zones";
      this.zoneForm.get('zonesPath').setValue(this.data.item.path);
      this.zoneForm.get('zonesPath').disable();
      this.zoneForm.get('zoneNormal.lower').setValue(this.data.item.children[0].lower);
      this.zoneForm.get('zoneNormal.upper').setValue(this.data.item.children[0].upper);
      this.zoneForm.get('zoneAlert.lower').setValue(this.data.item.children[1].lower);
      this.zoneForm.get('zoneAlert.upper').setValue(this.data.item.children[1].upper);
      this.zoneForm.get('zoneWarn.lower').setValue(this.data.item.children[2].lower);
      this.zoneForm.get('zoneWarn.upper').setValue(this.data.item.children[2].upper);
      this.zoneForm.get('zoneAlarm.lower').setValue(this.data.item.children[3].lower);
      this.zoneForm.get('zoneAlarm.upper').setValue(this.data.item.children[3].upper);
      this.zoneForm.get('zoneEmergency.lower').setValue(this.data.item.children[4].lower);
      this.zoneForm.get('zoneEmergency.upper').setValue(this.data.item.children[4].upper);
    }

  }

  rangeValidationFunction(formGroup: FormGroup): any {
      let upper = formGroup.get('upper').value;
      let lower = formGroup.get('lower').value;
      if(upper && lower) {
        if (lower > upper) {
          return {needUpperLower: true}
        }
      }
      return null;
   }

   zonesValidationFunction(formGroup: FormGroup): any {
    // let normalLower = formGroup.get('zoneNormal.lower');
    // let normalUpper = formGroup.get('zoneNormal.upper');
    // let alertLower = formGroup.get('zoneAlert.lower');
    // let alertUpper = formGroup.get('zoneAlert.upper');
    // let warnLower = formGroup.get('zoneWarn.lower');
    // let warnUpper = formGroup.get('zoneWarn.upper');
    // let alarmLower = formGroup.get('zoneAlarm.lower');
    // let alarmUpper = formGroup.get('zoneAlarm.upper');
    // let emergencyLower = formGroup.get('zoneEmergency.lower');
    // let emergencyUpper = formGroup.get('zoneEmergency.upper');

    // if (normalUpper && alarmLower && normalUpper.value > alertLower.value) {
    //   return {zonesInvalid: true};
    // } else {
    //   return null;
    // }
 }

  closeForm() {
    if (this.zoneForm.get('zonesPath').disabled) this.zoneForm.get('zonesPath').enable();
    let zone: IPathZoneDef = {
      path: this.zoneForm.value.zonesPath,
      zonesDef: [
        {
          state: 0,
          lower: this.zoneForm.value.zoneNormal.lower,
          upper: this.zoneForm.value.zoneNormal.upper,
          message: null
        },
        {
          state: 1,
          lower: this.zoneForm.value.zoneAlert.lower,
          upper: this.zoneForm.value.zoneAlert.upper,
          message: null
        },
        {
          state: 2,
          lower: this.zoneForm.value.zoneWarn.lower,
          upper: this.zoneForm.value.zoneWarn.upper,
          message: null
        },
        {
          state: 3,
          lower: this.zoneForm.value.zoneAlarm.lower,
          upper: this.zoneForm.value.zoneAlarm.upper,
          message: null
        },
        {
          state: 4,
          lower: this.zoneForm.value.zoneEmergency.lower,
          upper: this.zoneForm.value.zoneEmergency.upper,
          message: null
        },

      ]
    };

    this.dialogRef.close(zone);
  }
}
