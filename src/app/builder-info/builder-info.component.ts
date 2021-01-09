import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-builder-info',
    templateUrl: './builder-info.component.html',
    styleUrls: ['./builder-info.component.css']
})
export class BuilderInfoComponent {
    client: any;
    jobs: Array<any> = [];

    constructor(public dialogRef: MatDialogRef<BuilderInfoComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.client = data.client;
        data.jobs.forEach(job => {
            if (job.client.name == this.client.name) {
                this.jobs.push(job);
            }
        });
    }

    onCloseClick() {
        this.dialogRef.close();
    }
}
