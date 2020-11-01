import { Injectable } from '@angular/core';
import { expand, map, mergeMap } from 'rxjs/operators';
import { BluetoothCore } from '@manekinekko/angular-web-bluetooth';
import { empty, of } from 'rxjs';

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

  write(service, characteristic, input) {
    return this.ble
      .discover$({
        acceptAllDevices: true,
        optionalServices: [service]
      })
      .pipe(
        mergeMap((gatt: BluetoothRemoteGATTServer) => {
          console.log('gatt ===> ', gatt);
          this.ble.connectDevice$(gatt.device).subscribe(res => console.log(res), err => console.log(err));
          return this.ble.getPrimaryService$(gatt, service);
        }),
        mergeMap((primaryService: BluetoothRemoteGATTService) => {
          console.log('primaryService ===> ', primaryService);
          return this.ble.getCharacteristic$(primaryService, characteristic);
        }),
        mergeMap((returncharacteristic: BluetoothRemoteGATTCharacteristic) => {
          console.log('returncharacteristic ===> ', returncharacteristic);

          const size = 512;
          const str = JSON.stringify(input);
          let data = JSON.stringify(input);

          let value: string;
          let valueBytes = null;
          let count = 0;

          console.log('str ===> ', str);
          console.log('data ===> ', data);

          const apiArr = [];

          while (data.length > 0) {
            console.log('count ===> ', count);

            value = data.substr(0, size);
            data = data.substr(size);
            valueBytes = this.stringToBytes(value);
            apiArr.push(valueBytes);

            count++;
          }

          console.log('count ===> ', count, apiArr.length + 1, JSON.stringify(apiArr.length + 1));

          apiArr.unshift(this.stringToBytes(JSON.stringify(count + 1)));
          apiArr.push(this.stringToBytes(JSON.stringify(count + 1 + 1)));

          console.log('apiArr ===> ', apiArr);
          console.log('length...', apiArr.length);

          let index = 0;

          const simplyTest = of(apiArr).pipe(
            expand(obj => {
              console.log('expanding...', index);
              if (apiArr.length === index) {
                console.log('empty...', index);
                return empty();
              }
              console.log('writing...', index);

              return this.ble.writeValue$(returncharacteristic, apiArr[index++]);
            })
          );

          return simplyTest;
        }),
      );
  }

  writeValue(returncharacteristic, str) {
    return this.ble.writeValue$(returncharacteristic, this.stringToBytes(str));
  }

  connect(device) {
    return this.ble.connectDevice$(device);
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
