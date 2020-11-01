import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BleService } from '../services/ble.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  title = 'DEVICE DATA INPUT';
  username = 'Test Name';
  email = 'test@demo.com';
  image = '/assets/icon/add_icon.png';
  date;
  time;
  pipe = new DatePipe('en-US');
  valuesSubscription: Subscription;
  result: any;

  constructor(public service: BleService) {
    service.config({
      decoder: (value: DataView) => value.getInt8(0),
      service: 'battery_service',
      characteristic: 'battery_level'
    });
    const randomDigit = Math.floor(1000 + Math.random() * 9000);

    this.username = 'Test Name ' + randomDigit;
    this.email = `test${randomDigit}@demo.com`;
  }

  onFileUploaded(event, files) {
    console.log('onFileUploaded', event, files);
    const base64 = this.getBase64(files[0]);
    console.log('onFileUploaded image base 64 ===> ', base64);
  }

  onChange(event) {
    console.log('onChange', event);
    // let base64 = this.getBase64(files[0])
    if (files.length > 0) {
      console.log('getBase64 ');
      this.getBase64(files[0]);
    }
  }

  getBase64(file) {
    const reader = new FileReader();
    reader.addEventListener('load', event => {
      console.log('load', event);
      this.result = event.target.result;
      this.image = this.result;
    }, false);
    if (file) {
      reader.readAsDataURL(file);
    }

  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter');
    this.service.disconnectDevice();
    this.service.getDevice().subscribe(res => console.log(res), err => console.log(err));
  }

  submit() {
    console.log(this.username, this.email);
    this.date = this.pipe.transform(new Date(), 'shortDate');
    this.time = this.pipe.transform(new Date(), 'shortTime');

    const service = 0x1234;
    const characteristic = 0x2234;
    const data = {
      name: this.username,
      email: this.email
    };
    this.service
      .write(service, characteristic, data)
      .subscribe(res => console.log(res), err => console.log(err));
  }

}
