import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private changeListeners: any;
    private cache: { [key: string]: any };
    private currentKey: number;

    constructor() {
        this.changeListeners = [];
        this.cache = {};
        this.currentKey = 0;
    }

    set(key: string, value: any, trigger?: boolean) {
        this.cache[key] = value;
        localStorage.setItem(key, JSON.stringify(value));

        if (trigger !== undefined && !trigger)
            return;

        for (let i = 0; i < this.changeListeners.length; ++i) {
            this.changeListeners[i].cb(key);
        }
    }

    get(key: string, def?: any) {
        if (key in this.cache) {
            return this.cache[key];
        }

        let r: any;
        const v = localStorage.getItem(key);
        if (v !== null) {
            try {
                r = JSON.parse(v);
                this.cache[key] = r;
            } catch (e) {
                r = def;
                if (def !== undefined) {
                    this.set(key, def, false);
                }
            }
        } else {
            r = def;
            if (def !== undefined) {
                this.set(key, def, false);
            }
        }

        return r;
    }

    onChange(on: { (key: string): void; }) {
        this.changeListeners.push({ key: ++this.currentKey, cb: on });
        return this.currentKey;
    }

    remove(key: number) {
        for (var k = 0; k < this.changeListeners.length; ++k) {
            if (this.changeListeners[k].key == key) {
                this.changeListeners.splice(k, 1);
                return true;
            }
        }
        return false;
    }
}
