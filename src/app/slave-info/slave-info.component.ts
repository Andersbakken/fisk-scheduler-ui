import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-slave-info',
    templateUrl: './slave-info.component.html',
    styleUrls: ['./slave-info.component.css']
})
export class SlaveInfoComponent {
    client: any;
    jobs: Array<any> = [];

    constructor(public dialogRef: MatDialogRef<SlaveInfoComponent>,
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
