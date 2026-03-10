import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
                const fullPath = job.sourcePath || job.sourceFile || '';
                const lastSlash = fullPath.lastIndexOf('/');
                job.sourceBasename = lastSlash !== -1 ? fullPath.substring(lastSlash + 1) : fullPath;
                this.jobs.push(job);
            }
        });
    }

    onCloseClick() {
        this.dialogRef.close();
    }
}
