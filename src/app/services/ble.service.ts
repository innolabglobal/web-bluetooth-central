import { Injectable } from '@angular/core';
import { map, mergeMap } from 'rxjs/operators';
import { BluetoothCore } from '@manekinekko/angular-web-bluetooth';

type ServiceOptions = {
  characteristic: string;
  service: string,
  decoder(value: DataView): number | { [key: string]: number }
};


@Injectable({
  providedIn: 'root'
})
export class BleService {

  private bleConfig: ServiceOptions;

  constructor(public ble: BluetoothCore) {
    this.ble.getDevice$().subscribe(res => console.log(res), err => console.log(err));
    this.ble.getGATT$().subscribe(res => console.log(res), err => console.log(err));
  }

  config(options: ServiceOptions) {
    this.bleConfig = options;
  }

  getDevice() {
    return this.ble.getDevice$();
  }

  stream() {
    return this.ble.streamValues$().pipe(
      map(this.bleConfig.decoder)
    );
  }

  value() {
    return this.ble
      .value$({
        service: this.bleConfig.service,
        characteristic: this.bleConfig.characteristic
      });
  }

  write(service, characteristic, data) {
    // const service = 0x1234;
    // const characteristic = 0x2234;

    return this.ble

      // 1) call the discover method will trigger the discovery process (by the browser)
      .discover$({
        acceptAllDevices: true,
        optionalServices: [service]
      })
      .pipe(
        // 2) get that service
        mergeMap((gatt: BluetoothRemoteGATTServer) => {
          console.log(gatt);
          return this.ble.getPrimaryService$(gatt, service);
        }),
        // 3) get a specific characteristic on that service
        mergeMap((primaryService: BluetoothRemoteGATTService) => {
          console.log(primaryService);
          return this.ble.getCharacteristic$(primaryService, characteristic);
        }),
        // 4) ask for the value of that characteristic (will return a DataView)
        mergeMap((returncharacteristic: BluetoothRemoteGATTCharacteristic) => {
          console.log(returncharacteristic, this.stringToBytes('hello'));
          const str = JSON.stringify(data);
          return this.ble.writeValue$(returncharacteristic, this.stringToBytes(str));
        }),
        // 5) on that DataView, get the right value
        // map((value: DataView) => value.getUint8(0))
      );
  }

  disconnectDevice() {
    this.ble.disconnectDevice();
  }

  ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  str2ab(str) {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  stringToBytes(str) {
    const bytes = new ArrayBuffer(str.length * 2);
    const bytesUint16 = new Uint16Array(bytes);
    for (let i = 0; i < str.length; i++) {
      bytesUint16[i] = str.charCodeAt(i);
    }
    return new Uint8Array(bytesUint16);
  }

  bytesToString(bytes) {
    return String.fromCharCode.apply(null, new Uint16Array(bytes));
  }

  bytesToHex(bytes) {
    const str = [];
    for (let i = 0; i < bytes.length; i++) {
      str.push('0x' + ('0' + (bytes[i].toString(16))).substr(-2).toUpperCase());
    }
    return str.join(' ');
  }

  encodedStringToBytes(str) {
    const data = atob(str);
    const bytes = new Uint8Array(data.length);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = data.charCodeAt(i);
    }
    return bytes;
  }

  bytesToEncodedString(bytes) {
    return btoa(String.fromCharCode.apply(null, bytes));
  }
}
