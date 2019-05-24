import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatCardModule, MatTabsModule, MatListModule,
         MatInputModule, MatSnackBarModule, MatCheckboxModule,
         MatDialogModule, MatButtonModule } from '@angular/material';

import { ColorPickerModule } from 'ngx-color-picker';

import { AppComponent } from './app.component';
import { WebSocketService } from './websocket.service';
import { BackoffService } from './backoff.service';
import { FiskService } from './fisk.service';
import { ConfigService } from './config.service';
import { MessageService } from './message.service';
import { TabChangedService } from './tab-changed.service';
import { ConfigComponent } from './config/config.component';
import { LogsComponent } from './logs/logs.component';
import { LogComponent } from './log/log.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { CompilersComponent, CompilersComponentDialog } from './compilers/compilers.component';
import { SlaveInfoComponent } from './slave-info/slave-info.component';
import { HttpClientModule } from '@angular/common/http';

const appRoutes: Routes = [
    { path: 'config', component: ConfigComponent },
    { path: 'pie-chart', component: PieChartComponent },
    { path: 'logs', component: LogsComponent },
    { path: 'compilers', component: CompilersComponent },
    { path: '', redirectTo: '/pie-chart', pathMatch: 'full' }
];

@NgModule({
    entryComponents: [
        CompilersComponentDialog,
        SlaveInfoComponent
    ],
    declarations: [
        AppComponent,
        ConfigComponent,
        LogsComponent,
        LogComponent,
        PieChartComponent,
        CompilersComponent,
        CompilersComponentDialog,
        SlaveInfoComponent
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        ColorPickerModule,
        FormsModule,
        HttpClientModule,
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatDialogModule,
        MatInputModule,
        MatListModule,
        MatSnackBarModule,
        MatTabsModule,
        RouterModule.forRoot(appRoutes)
    ],
    providers: [
        WebSocketService,
        BackoffService,
        FiskService,
        ConfigService,
        MessageService,
        TabChangedService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
