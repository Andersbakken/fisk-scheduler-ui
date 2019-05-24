import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { WebSocketService } from './websocket.service';
import { BackoffService } from './backoff.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class FiskService {
    private pendingConnect: Array<any> = [];
    private dataListeners: any = [];
    private openListeners: any = [];
    private schedulerListeners: any = [];
    private _host: string;
    private _port: number;
    private _currentKey: number = 0;

    get host(): string
    {
        return this._host;
    }
    get port(): number
    {
        return this._port;
    }

    constructor(private ws: WebSocketService, private backoff: BackoffService, private config: ConfigService, private httpClient: HttpClient) {
        const path = window.location.pathname.replace(/[^/]*$/, 'package.json');

        this.httpClient.get(`${window.location.protocol}//${window.location.host}/${path}`, { responseType: "json" }).subscribe(res => {
            if (res)
                this.emit(this.dataListeners, { type: "uiInfo", package: res });
        });
        this._host = this.config.get("scheduler", location.hostname);
        this._port = this.config.get("port", location.port || 8097);
        if (this._host !== undefined) {
            this.open(this._host, this._port);
        }

        this.config.onChange((key: string) => {
            switch (key) {
            case "scheduler":
            case "port":
                this.close();
                this._host = this.config.get("scheduler", location.hostname);
                this._port = this.config.get("port", location.port || 8097);
                if (this._host !== undefined) {
                    this.open(this._host, this._port);
                }
                this.emit(this.schedulerListeners, key);
                break;
            }
        });
    }

    get isOpen(): boolean {
        return this.ws.isOpen;
    }

    open(host: string, port: number) {
        console.log("reoping");
        this.ws.on("message", (data: any) => {
            this.emit(this.dataListeners, data);
        });
        this.ws.on("close", () => {
            // let's retry with an exponential backoff
            this.reconnect(host, port);
        });
        this.ws.on("error", () => {
            this.reconnect(host, port);
        });
        this.ws.on("open", () => {
            this.emit(this.openListeners);

            this.resolvePending(true);
            console.log("ok");
        });
        this.ws.open(host, port);
    }

    close(code?: number, reason?: string) {
        this.backoff.stop("fisk");
        this.ws.close(code, reason);
    }

    on(name: string, on: { (data?: any): void; }) {
        switch (name) {
        case "data":
            this.dataListeners.push({ key: ++this._currentKey, cb: on });
            break;
        case "open":
            this.openListeners.push({ key: ++this._currentKey, cb: on });
            break;
        case "scheduler":
            this.schedulerListeners.push({ key: ++this._currentKey, cb: on });
            break;
        default:
            return -1;
        }
        return this._currentKey;
    }

    remove(name: string, key: number) {
        const removeKey = (items: Array<any>, key: number) => {
            for (let k = 0; k < items.length; ++k) {
                if (items[k].key == key) {
                    items.splice(k, 1);
                    return true;
                }
            }
            return false;
        };

        switch (name) {
        case "data":
            return removeKey(this.dataListeners, key);
        case "open":
            return removeKey(this.openListeners, key);
        case "scheduler":
            return removeKey(this.schedulerListeners, key);
        }
        return false;
    }

    send(message: any) {
        this.ws.send(message);
    }

    private reconnect(host: string, port: number) {
        if (this.backoff.running("fisk")) {
            this.resolvePending(false);
            return;
        }
        const when = (next: number): number => {
            if (!next)
                return 1000;
            return Math.min(30000, next * 2);
        };
        this.backoff.backoff("fisk", when, (): Promise<any> => {
            return new Promise<any>((resolve, reject) => {
                this.pendingConnect.push({ resolve: resolve, reject: reject });
                this.open(host, port);
            });
        });
    }

    private resolvePending(ok: boolean) {
        if (this.pendingConnect.length > 0) {
            const pending = this.pendingConnect.shift();
            pending.resolve(ok);
        }
    }

    private emit(listeners: any, data?: any) {
        for (let i = 0; i < listeners.length; ++i) {
            listeners[i].cb(data);
        }
    }
}
