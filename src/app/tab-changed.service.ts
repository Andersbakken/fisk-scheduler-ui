import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class TabChangedService {
    private _index: number = undefined;
    private _name: string = undefined;
    private _changeListeners: any = [];
    private _currentKey: number = 0;

    constructor() { }

    get index(): number { return this._index; }
    get name(): string { return this._name; }

    notify(index: number, name: string) {
        this._index = index;
        this._name = name;

        console.log("really happen");
        for (let i = 0; i < this._changeListeners.length; ++i) {
            this._changeListeners[i].cb(index, name);
        }
    }

    remove(key: number) {
        for (let k = 0; k < this._changeListeners.length; ++k) {
            if (this._changeListeners[k].key == key) {
                this._changeListeners.splice(k, 1);
                return true;
            }
        }
        return false;
    }

    onChanged(on: { (index: number, name: string): void; }) {
        this._changeListeners.push({ key: ++this._currentKey, cb: on });

        setTimeout(() => {
            console.log("hello", this._index, this._name);
            on(this._index, this._name);
        }, 0);

        return this._currentKey;
    }
}
