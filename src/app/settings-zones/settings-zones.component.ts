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
    // this.treeData.paginator = this.paginator;
    // this.treeData.sort = this.sort;
    // this.treeData.filter = "";
    // this.cdRef.detectChanges();
  }

  public hasChild(index: number, node: ITreeData) {
    return node?.children?.length > 0;
  }

  public trackByPath(index: number, item: IPathZoneDef): string {
    return `${item.path}`;
  }

  public applyFilter(event: Event) {
    // const filterValue = (event.target as HTMLInputElement).value;
    // this.treeData.filter = filterValue.trim().toLowerCase();

    // if (this.treeData.paginator) {
    //   this.treeData.paginator.firstPage();
    // }
  }

  public openZoneDialog(node?: any): void {
    console.log();
    let dialogRef;

    if (node) {
      dialogRef = this.dialog.open(DialogEditZone, {
        data: node
      });
    } else {
      dialogRef = this.dialog.open(DialogNewZone, {});
    }

    dialogRef.afterClosed().subscribe((zone: IPathZoneDef) => {
      if (zone === undefined || !zone) {
        return; //clicked Cancel, clicked outside the dialog, or navigated await from page using url bar.
      } else {
        this.addZone(zone);
      }
    });
  }

  public addZone(zone: IPathZone) {
    this.zones.addPathZones(zone);
  }

  public editZone(zone: IZone) {
    // if (zone.uuid) { // is existing zone
    //   const zones: IZone[] = this.appSettingsService.getZones();
    //   const index = zones.findIndex(zones => zones.uuid === zone.uuid );

    //   if(index >= 0) {
    //     zones.splice(index, 1, zone);
    //     this.appSettingsService.saveZones(zones);
    //   }
    // }
  }

  public deleteZone(node: any) {
    if (!this.zones.deletePathZones(node.path)) {
      //TODO: Send notification
    }
  }

  ngOnDestroy(): void {
    this.zonesSub.unsubscribe();
  }
}


// Add zone compoment
@Component({
  selector: 'dialog-new-zone',
  templateUrl: 'settings-new-zone.modal.html',
  styleUrls: ['./settings-new-zone.modal.css']
})
export class DialogNewZone implements OnInit {

  zoneForm: FormGroup = new FormGroup({
    zonesPath: new FormControl(null),
    filterSelfPaths: new FormControl(true),
    zoneNormal: new FormGroup({
      state: new FormControl({value: 'Normal', disabled: true}),
      lower: new FormControl(null),
      upper: new FormControl(null)
    }, this.rangeValidationFunction),
    zoneAlert: new FormGroup({
      state: new FormControl({value: 'Alert', disabled: true}),
      lower: new FormControl(null),
      upper: new FormControl(null)
    }, this.rangeValidationFunction),
    zoneWarn: new FormGroup({
      state: new FormControl({value: 'Warn', disabled: true}),
      lower: new FormControl(null),
      upper: new FormControl(null)
    }, this.rangeValidationFunction),
    zoneAlarm: new FormGroup({
      state: new FormControl({value: 'Alarm', disabled: true}),
      lower: new FormControl(null),
      upper: new FormControl(null)
    }, this.rangeValidationFunction),
    zoneEmergency: new FormGroup({
      state: new FormControl({value: 'Emergency', disabled: true}),
      lower: new FormControl(null),
      upper: new FormControl(null)
    }, this.rangeValidationFunction)
  });

  public selectedUnit = null;
  public availablePaths: string[] = [];

  constructor(
    private signalk: SignalKService,
    public dialogRef: MatDialogRef<DialogNewZone>) {
    }

  ngOnInit(): void {
    this.availablePaths = this.signalk.getPathsByType('number').sort();
  }

  rangeValidationFunction(formGroup: FormGroup): any {
      let upper = formGroup.get('upper').value;
      let lower = formGroup.get('lower').value;
      return ((upper === null) && (lower === null)) ? { needUpperLower: true } : null;
   }

  closeForm() {
    let zone: IPathZoneDef = {
      path: this.zoneForm.value.zonesPath,
      zonesDef: [
        {
          state: 0,
          upper: this.zoneForm.value.zoneNormal.lower,
          lower: this.zoneForm.value.zoneNormal.upper,
          message: null
        },
        {
          state: 1,
          upper: this.zoneForm.value.zoneAlert.lower,
          lower: this.zoneForm.value.zoneAlert.upper,
          message: null
        },
        {
          state: 2,
          upper: this.zoneForm.value.zoneWarn.lower,
          lower: this.zoneForm.value.zoneWarn.upper,
          message: null
        },
        {
          state: 3,
          upper: this.zoneForm.value.zoneAlarm.lower,
          lower: this.zoneForm.value.zoneAlarm.upper,
          message: null
        },
        {
          state: 4,
          upper: this.zoneForm.value.zoneEmergency.lower,
          lower: this.zoneForm.value.zoneEmergency.upper,
          message: null
        },

      ]
    };

    this.dialogRef.close(zone);
  }
}


// Edit zone compoment
@Component({
  selector: 'dialog-edit-zone',
  templateUrl: 'settings-edit-zone.modal.html',
  styleUrls: ['./settings-edit-zone.modal.css']
})
export class DialogEditZone {

  constructor(
    public dialogRef: MatDialogRef<DialogEditZone>,
    @Inject(MAT_DIALOG_DATA) public zone: IPathZone,
    ) {

    }

  closeForm() {
    this.dialogRef.close(this.zone);
  }
}
