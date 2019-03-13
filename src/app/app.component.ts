import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TabChangedService } from './tab-changed.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    @ViewChild('fiskTabGroup') tabGroup;
    currentTab: number = undefined;
    currentName: string = undefined;
    navLinks = [
        { path: "/pie-chart", label: "Pie Chart" },
        { path: "/logs", label: "Logs" },
        { path: "/compilers", label: "Compilers" },
        { path: "/config", label: "Config" },
    ];

    constructor(private tabChanged: TabChangedService, private router: Router) {
        router.events.forEach((event) => {
            if (event instanceof NavigationEnd) {
                const url = event.urlAfterRedirects;
                for (let idx = 0; idx < this.navLinks.length; ++idx) {
                    if (this.navLinks[idx].path == url) {
                        this.currentTab = idx;
                        this.currentName = this.navLinks[idx].label;
                        this.tabChanged.notify(this.currentTab, this.currentName);
                        console.log("here?", this.currentTab, this.currentName);
                   }
                }
            }
        });
    }

    ngAfterViewInit() {
    }

    onTabChanged(event) {
        this.currentTab = event.index;
        this.currentName = event.tab.textLabel;
    }

    onAnimationDone() {
        this.tabChanged.notify(this.currentTab, this.currentName);
    }
}
