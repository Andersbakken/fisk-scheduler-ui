import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { FiskService } from '../fisk.service';
import { ConfigService } from '../config.service';
import { MessageService } from '../message.service';
import { TabChangedService } from '../tab-changed.service';
import { BuilderInfoComponent } from '../builder-info/builder-info.component';
import * as seedrandom from 'seedrandom';

declare let window: any;

@Component({
    selector: 'app-pie-chart',
    templateUrl: './pie-chart.component.html',
    styleUrls: ['./pie-chart.component.css']
})

export class PieChartComponent implements OnDestroy {
    view: any = { width: 0, height: 0 };
    ctx: any;
    clientColor: any;
    stats: any;
    maxJobs: number = 0;
    maxJobsData: any = {};
    jobs = new Map();
    clientJobs = [];
    minTime = 5000;
    pieBuilding: boolean;
    noAnimate: boolean;
    inited: boolean = false;
    destroyed: boolean = false;
    onTabChange: number = undefined;
    onConfig: number = undefined;
    fiskData: number = undefined;
    fiskOpen: number = undefined;
    fiskScheduler: number = undefined;
    onResize: any;

    constructor(private fisk: FiskService, private config: ConfigService,
                private tabChanged: TabChangedService, private message: MessageService,
                private changeRef: ChangeDetectorRef, private dialog: MatDialog) {
        this.onResize = this._onResize.bind(this);
        window.jobs = this.jobs;

        this.fiskData = this.fisk.on("data", (data: any) => {
            switch (data.type) {
            case "builderAdded":
                this._builderAdded(data);
                break;
            case "builderRemoved":
                this._builderRemoved(data);
                break;
            case "jobStarted":
                this._jobStarted(data);
                break;
            case "jobFinished":
                this._updateStats(data);
                // fall through
            case "jobAborted":
                this._jobFinished(data);
                break;
            case "cacheHit":
                this._cacheHit(data);
            case "stats":
                this._updateStats(data);
                break;
            case "schedulerInfo":
                console.log("got scheduler info", data);
                break;
            case "uiInfo":
                console.log("got ui version", data.package.version);
                break;
            default:
                console.error(`unexpected fisk message type ${data.type}`);
                break;
            }
        });
        if (this.fisk.isOpen) {
            this.fisk.send({ type: "sendInfo" });
        }
        this.fiskOpen = this.fisk.on("open", () => {
            this._reset();
            this.message.showMessage("connected to " + this.fisk.host + ":" + this.fisk.port);
            this.fisk.send({ type: "sendInfo" });
        });
        this.fiskScheduler = this.fisk.on("scheduler", () => {
            this._reset();
        });

        window.addEventListener("resize", this.onResize);

        this.onConfig = this.config.onChange((key: string) => {
            if (key == "client" || key == "fgcolor" || key == "bgcolor") {
                this.clientColor = { name: this.config.get("client"), fgcolor: this.config.get("fgcolor"), bgcolor: this.config.get("bgcolor") };

                this.clientJobs.forEach(c => {
                    delete c.color;
                });
            } else if (key == "pieBuilding"
                       || key == "noAnimate") {
                this[key] = this.config.get(key);
            }
        });

        this.onTabChange = this.tabChanged.onChanged((index, name) => {
            if (name != "Pie Chart" || this.inited)
                return;

            const canvas = <HTMLCanvasElement> document.getElementById("canvas-chart");
            if (!canvas)
                return;

            const contains = (x, y, rect) => {
                if (x >= rect.x && x <= rect.x + rect.width) {
                    if (y >= rect.y && y <= rect.y + rect.height)
                        return true;
                }
                return false;
            };

            canvas.addEventListener("click", event => {
                const ncanvas = <HTMLCanvasElement> document.getElementById("canvas-chart");
                const br = ncanvas.getBoundingClientRect() as DOMRect;
                const x = event.pageX - br.x
                const y = event.pageY - br.y

                this.clientJobs.forEach(c => {
                    if (contains(x, y, c.client.rect)) {
                        // clicked
                        //console.log("clicked", c.client.url);
                        if (c.client.url)
                            window.open(c.client.url, "_blank");
                    }
                });
            });
            canvas.addEventListener("contextmenu", event => {
                const ncanvas = <HTMLCanvasElement> document.getElementById("canvas-chart");
                const br = ncanvas.getBoundingClientRect() as DOMRect;
                const x = event.pageX - br.x
                const y = event.pageY - br.y

                let ret = true;
                this.clientJobs.forEach(c => {
                    if (contains(x, y, c.client.rect)) {
                        event.preventDefault();
                        ret = false;

                        this.dialog.open(BuilderInfoComponent, { data: { client: c.client, jobs: this.jobs} });
                    }
                });
                return ret;
            }, false);

            this.inited = true;

            const rect: any = canvas.getBoundingClientRect();

            this.view.width = window.innerWidth - (rect.x * 2);
            this.view.height = window.innerHeight - rect.y - 50;
            //console.log("hey", this.view.width, this.view.height);

            this.changeRef.detectChanges();

            this.ctx = canvas.getContext("2d", { alpha: false });

            const Step = 0.25;

            const animateItem = (item, prop, animatedProp, steps) => {
                const d = item[prop];
                if (this.noAnimate || !(animatedProp in item)) {
                    item[animatedProp] = d;
                    return;
                }
                let a = item[animatedProp];
                if (a == d)
                    return;
                if (a < d) {
                    a = Math.min(a + (Step * steps), d);
                } else {
                    a = Math.max(a - (Step * steps), d);
                }
                item[animatedProp] = a;
            };

            this.clientColor = { name: this.config.get("client"), fgcolor: this.config.get("fgcolor"), bgcolor: this.config.get("bgcolor") };
            this.pieBuilding = this.config.get("pieBuilding");
            this.noAnimate = this.config.get("noAnimate");

            const frameMs = (1 / 60) * 1000;
            let last = 0;
            const animate = ts => {
                if (this.destroyed)
                    return;

                const legendSpace = this.config.get("chart-legend-space", 400);
                const legendX = this.view.width - legendSpace + 10;
                const statsHeight = 30;

                const pieMax = Math.min(this.view.width - legendSpace, this.view.height - statsHeight - 10) - 20;

                const steps = (ts - last) / frameMs;
                last = ts;

                const rad = deg => deg / (180 / Math.PI);

                const ctx = this.ctx;

                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.rect(0, 0, this.view.width, this.view.height);
                ctx.fill();

                const paddingSpace = 10;
                const xy = pieMax/2 + paddingSpace;
                const radius = pieMax/2 - (paddingSpace*2);

                ctx.fillStyle = "#ddd";
                ctx.beginPath();
                ctx.moveTo(xy, xy);
                ctx.arc(xy, xy, radius, 0, Math.PI * 2, false);
                ctx.fill();

                if (!this.maxJobs) {
                    this.clientJobs.forEach(c => {
                        c.start = c.animatedStart = rad(270);
                        c.jobs = c.animatedJobs = 0;
                    });
                    window.requestAnimationFrame(animate);
                    return;
                }

                ctx.font = "16px sans-serif";
                let cur = rad(270);
                let legendY = 40;

                legendY += 40;

                ctx.fillStyle = "black";
                ctx.fillText(this.maxJobsData.text, 10, 31);

                const maxJobs = this.pieBuilding ? this.jobs.size : this.maxJobs;
                if (!maxJobs) {
                    window.requestAnimationFrame(animate);
                    return;
                }

                const allCache = {
                    hits: 0, misses: 0
                };

                const now = (new Date()).valueOf();
                for (let clientIdx = 0; clientIdx < this.clientJobs.length; ++clientIdx) {
                    let c = this.clientJobs[clientIdx];
                    if (c.expired) {
                        if (!c.jobs && !c.cacheJobs && now - c.ts >= this.minTime) {
                            this.clientJobs.splice(clientIdx, 1);
                            --clientIdx;
                            continue;
                        }
                        if (c.jobs || c.cacheJobs) {
                            c.expired = false;
                        }
                    }

                    //console.log("puck", this.maxJobs, c);
                    c.start = cur;

                    animateItem(c, "start", "animatedStart", steps);
                    animateItem(c, "jobs", "animatedJobs", steps);

                    if (!c.color) {
                        if (this.clientColor.name && this.clientColor.fgcolor && this.clientColor.bgcolor) {
                            //console.log("determining", c.client);
                            if (this.clientColor.name == c.client.ip ||
                                this.clientColor.name == c.client.name ||
                                this.clientColor.name == c.client.hostname) {
                                c.color = this.clientColor.bgcolor;
                                c.fg = this.clientColor.fgcolor;
                            }
                        }
                        if (!c.color) {
                            c.color = this._color(c.client.ip, false);

                            const rgb = parseInt(c.color.substring(1), 16);   // convert rrggbb to decimal
                            const r = (rgb >> 16) & 0xff;  // extract red
                            const g = (rgb >>  8) & 0xff;  // extract green
                            const b = (rgb >>  0) & 0xff;  // extract blue

                            var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                            if (luma < 128) {
                                c.fg = "white";
                            } else {
                                c.fg = "black";
                            }
                        }
                    }

                    // pie arc
                    ctx.fillStyle = c.color;
                    ctx.beginPath();
                    ctx.moveTo(xy, xy);
                    ctx.arc(xy, xy, radius, c.animatedStart, c.animatedStart + (Math.PI * 2 * (c.animatedJobs / maxJobs)), false);
                    ctx.lineTo(xy, xy);
                    ctx.fill();

                    // legend name background
                    ctx.beginPath();
                    ctx.rect(legendX, legendY - 20, legendSpace, 30);
                    ctx.fill();

                    if (!("rect" in c.client)) {
                        c.client.rect = { x: legendX, y: legendY - 20, width: legendSpace, height: 30 };
                    } else {
                        c.client.rect.x = legendX;
                        c.client.rect.y = legendY - 20;
                    }

                    // legend name text
                    ctx.fillStyle = c.fg;
                    ctx.fillText(c.client.modifiedName, legendX + 2, legendY);

                    allCache.hits += c.cacheJobs;
                    allCache.misses += c.jobs;

                    let add = 0;
                    // cache hits for client
                    let cw = legendSpace * ((c.totalCacheJobs || 0) / ((c.totalCacheJobs || 0) + c.totalJobs));
                    let jw = legendSpace * (c.totalJobs / ((c.totalCacheJobs || 0) + c.totalJobs));
                    ctx.fillStyle = "#3d3";
                    ctx.beginPath();
                    ctx.rect(legendX, legendY - 20 + 31, cw, 4);
                    ctx.fill();
                    ctx.fillStyle = "#33d";
                    ctx.beginPath();
                    ctx.rect(legendX + cw, legendY - 20 + 31, jw, 4);
                    ctx.fill();
                    add = 8;

                    // legend usage
                    const usage = (c.cacheJobs || 0) + " / " + c.jobs + " (" + Math.round(c.jobs / maxJobs * 1000) / 10 + "%)";
                    const usageMetrics = ctx.measureText(usage);

                    const pad = (num, size) => {
                        return ("000000000" + num).substr(-size);
                    };

                    const delta = now - c.ts;
                    const ts = "(" + pad(Math.floor(delta / 1000 / 60), 2) + ":" + pad(Math.floor(delta / 1000) % 60, 2) + ")";
                    const tsMetrics = ctx.measureText(ts);

                    const metricsWidth = usageMetrics.width + tsMetrics.width + 10;

                    // legend usage background
                    ctx.fillStyle = c.color;
                    ctx.beginPath();
                    ctx.rect(legendX + legendSpace - metricsWidth - 15, legendY - 20, metricsWidth + 15, 30);
                    ctx.fill();

                    // legend usage text
                    ctx.fillStyle = c.fg;
                    ctx.fillText(usage, legendX + legendSpace - metricsWidth - 10, legendY);
                    ctx.fillText(ts, legendX + legendSpace - tsMetrics.width - 10, legendY);

                    cur += Math.PI * 2 * (c.animatedJobs / maxJobs);
                    legendY += 30 + add;
                }

                if (allCache.hits > 0 || allCache.misses > 0) {
                    legendY = 0; // top of page

                    let cw = legendSpace * (allCache.hits / (allCache.hits + allCache.misses));
                    let jw = legendSpace * (allCache.misses / (allCache.hits + allCache.misses));

                    ctx.fillStyle = "#3d3";
                    ctx.beginPath();
                    ctx.rect(legendX, legendY - 20 + 31, cw, 30);
                    ctx.fill();
                    ctx.fillStyle = "#33d";
                    ctx.beginPath();
                    ctx.rect(legendX + cw, legendY - 20 + 31, jw, 30);
                    ctx.fill();

                    const allstr = `${allCache.hits} / ${allCache.misses}`;
                    const allm = ctx.measureText(allstr);

                    ctx.fillStyle = "#fff";
                    ctx.fillText('Cache usage', legendX + 2, legendY + 31);
                    ctx.fillText(allstr, legendX + legendSpace - allm.width - 15, legendY + 31);
                }

                ctx.fillStyle = "#fff";
                ctx.fillRect(0, this.view.height - statsHeight - 10, this.view.width, statsHeight + 10);
                let statsTotal = 0;
                if (this.stats) {
                    statsTotal = this.stats.cacheHits + this.stats.jobsFailed + this.stats.jobsStarted;
                }

                if (statsTotal > 0) {
                    let pos = 5;
                    let tpos = 5;
                    ctx.fillStyle = "#3d3";
                    ctx.fillRect(pos, this.view.height - statsHeight - 5, (this.view.width - 10) * (this.stats.cacheHits / statsTotal), statsHeight);
                    pos += (this.view.width - 10) * (this.stats.cacheHits / statsTotal);
                    let str = "Hits " + Number(this.stats.cacheHits).toLocaleString() + " " + ((this.stats.cacheHits / statsTotal) * 100).toFixed(1) + "%";
                    ctx.fillText(str, tpos, this.view.height - statsHeight - 10);
                    tpos += ctx.measureText(str).width + 30;
                    ctx.fillStyle = "#33d";
                    ctx.fillRect(pos, this.view.height - statsHeight - 5, (this.view.width - 10) * (this.stats.jobsStarted / statsTotal), statsHeight);
                    pos += (this.view.width - 10) * (this.stats.jobsStarted / statsTotal);
                    str = "Compiles " + Number(this.stats.jobsStarted).toLocaleString() + " " + ((this.stats.jobsStarted / statsTotal) * 100).toFixed(1) + "%";
                    ctx.fillText(str, tpos, this.view.height - statsHeight - 10);
                    if (this.stats.jobsFailed > 0) {
                        tpos += ctx.measureText(str).width + 30;
                        ctx.fillStyle = "#d33";
                        ctx.fillRect(pos, this.view.height - statsHeight - 5, (this.view.width - 10) * (this.stats.jobsFailed / statsTotal), statsHeight);
                        str = "Failures " + Number(this.stats.jobsFailed).toLocaleString() + " " + ((this.stats.jobsFailed / statsTotal) * 100).toFixed(1) + "%";
                        ctx.fillText(str, tpos, this.view.height - statsHeight - 10);
                    }
                }

                window.requestAnimationFrame(animate);
            };
            window.requestAnimationFrame(animate);
        });
    }

    ngOnDestroy() {
        console.log("destroyed");
        this.tabChanged.remove(this.onTabChange);
        this.config.remove(this.onConfig);
        this.fisk.remove("open", this.fiskOpen);
        this.fisk.remove("data", this.fiskData);
        this.fisk.remove("scheduler", this.fiskScheduler);
        window.removeEventListener("resize", this.onResize);

        this.destroyed = true;
    }

    _onResize() {
        //console.log(window.innerWidth, window.innerHeight);
        const canvas = document.getElementById("canvas-chart");

        if (canvas) {
            const rect: any = canvas.getBoundingClientRect();
            this.view.width = window.innerWidth - (rect.x * 2);
            this.view.height = window.innerHeight - rect.y - 50;
        }
    }

    _reset() {
        this.maxJobs = 0;
        this.maxJobsData = {};
        this.jobs = new Map();
        this.clientJobs = [];
    }

    _color(key, invert) {
        function rand(min, max, r) {
            return min + (r() * (max - min));
        }

        function tohex(d) {
            return ("0"+(Number(d).toString(16))).slice(-2);
        }

        const random = seedrandom(key);
        var h = rand(1, 360, random);
        var s = rand(0, 100, random);
        var l = rand(45, 100, random);

        if (invert) {
            s = 100 - s;
        }

        h /= 360;
        s /= 100;
        l /= 100;

        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return "#" + tohex(r * 255) + tohex(g * 255) + tohex(b * 255);
    }

    _clientJobIndex(client) {
        for (let i = 0; i < this.clientJobs.length; ++i) {
            if (this.clientJobs[i].client.ip === client.ip
                && this.clientJobs[i].client.name === client.name)
                return i;
        }
        return -1;
    }

    _adjustClients(client, inc, cacheinc) {
        let idx = this._clientJobIndex(client);
        if (idx == -1) {
            if (inc < 0 || cacheinc < 0) {
                console.error("no client job for job client", client);
                return false;
            }
            if (client.name === client.hostname) {
                client.modifiedName = "dev:" + (client.user || "nobody") + "@" + client.hostname;
            } else if (client.name.length > 0 && client.name[0] === '-') {
                client.modifiedName = "dev:" + (client.user || "nobody") + client.name;
            } else {
                // try to json parse
                try {
                    const o = JSON.parse(client.name);
                    if (typeof o === "object" && "name" in o) {
                        client.modifiedName = o.name;
                        client.url = o.href;
                    }
                } catch (e) {
                }
                if (!client.modifiedName)
                    client.modifiedName = client.name;
            }
            this.clientJobs.push({ client: client, jobs: inc, cacheJobs: cacheinc, totalJobs: inc, totalCacheJobs: cacheinc, ts: (new Date()).valueOf(), expired: false });

            this.clientJobs.sort((a, b) => {
                return a.client.modifiedName.localeCompare(b.client.modifiedName);
            });
        } else {
            const c = this.clientJobs[idx];
            c.jobs += inc;
            if (inc > 0)
                c.totalJobs += inc;
            c.cacheJobs += cacheinc;
            if (cacheinc > 0)
                c.totalCacheJobs += cacheinc;
            if (!c.jobs && !c.cacheJobs) {
                if ((new Date()).valueOf() - c.ts < this.minTime) {
                    c.expired = true;
                } else {
                    this.clientJobs.splice(idx, 1);
                }
            }
        }
        return true;
    }

    _builderId(builder) {
        return builder.ip + ":" + builder.port;
    }

    _builderAdded(builder) {
        this.maxJobs += builder.slots;
        this._updateMaxJobsData();
    }

    _builderRemoved(builder) {
        this.maxJobs -= builder.slots;
        this._updateMaxJobsData();
        if (this.maxJobs < 0) {
            throw new Error("Negative jobs reached!");
        }

        // clear out the jobs for this builder
        // console.log("foff", this.jobs);
        const builderid = this._builderId(builder);
        this.jobs.forEach((job, id) => {
            if (builderid == this._builderId(job.builder)) {
                this.jobs.delete(id);
                this._adjustClients(job.client, -1, 0);
            }
        });
        this._updateMaxJobsData();
    }

    _updateMaxJobsData() {
        this.maxJobsData.text = `Slots ${this.jobs.size} / ${this.maxJobs} (${((this.jobs.size / this.maxJobs) * 100).toFixed(1)}%)`;
        this.maxJobsData.width = this.ctx.measureText(this.maxJobsData.text).width;
    }

    _jobStarted(job) {
        //console.log("job start", job.client.ip);
        const stripTz = ts => {
            let p = ts.indexOf("(");
            if (p !== -1) {
                return ts.substr(0, p);
            }
            return ts;
        };

        job.date = stripTz((new Date()).toTimeString()).trim();
        this.jobs.set(job.id, job);
        this._adjustClients(job.client, 1, 0);

        this._updateMaxJobsData();
    }

    _jobFinished(job) {
        if (!this.jobs.has(job.id)) {
            console.error("No such job ", job);
            console.error(JSON.stringify(Array.from(this.jobs.keys())));
            return;
        }

        const realjob = this.jobs.get(job.id);
        this.jobs.delete(job.id);
        this._adjustClients(realjob.client, -1, 0);
        this._updateMaxJobsData();
    }

    _updateStats(stats) {
        this.stats = stats;
    }

    _cacheHit(hit) {
        this._adjustClients(hit.client, 0, 1);
        setTimeout(() => this._adjustClients(hit.client, 0, -1), 5000);
    }
}
