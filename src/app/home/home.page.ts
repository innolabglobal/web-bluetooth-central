import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BleService } from '../services/ble.service';

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
  result: any;

  constructor(public service: BleService) {
    const randomDigit = Math.floor(1000 + Math.random() * 9000);

    this.username = 'Test Name ' + randomDigit;
    this.email = `test${randomDigit}@demo.com`;
  }

  onFileUploaded(event, files) {
    console.log('onFileUploaded', event, files);

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
      // const service = 0x1234;
      // const characteristic = 0x3234;
      //
      // this.service
      //   .write(service, characteristic, this.image)
      //   .subscribe(res => console.log(res), err => console.log(err));
    }, false);
    if (file) {
      reader.readAsDataURL(file);
    }

  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter');
    this.service.disconnectDevice();
  }

  submit() {
    console.log(this.username, this.email);
    this.date = this.pipe.transform(new Date(), 'shortDate');
    this.time = this.pipe.transform(new Date(), 'shortTime');

    const service = 0x1234;
    const characteristic = 0x4234;
    const data = {
      name: this.username,
      email: this.email,
      image: this.image,
    };
    this.service
      .write(service, characteristic, data)
      .subscribe(res => console.log(res), err => console.log(err));
  }

}
