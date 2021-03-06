import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { MainService } from '../../main.service';

@Component({
  selector: 'app-api-params',
  templateUrl: './api-params.component.html',
  styleUrls: ['./api-params.component.css']
})
export class ApiParamsComponent implements OnInit {

  @Input() openIDBrequest: any;
  @Input() indexedDB: any;
  @Output() newRequest = new EventEmitter();

  endpoint: string;
  selectedRequestMethod: string = "";
  readonly requestMethods?: Array<string>;

  responseData: any;
  responseError: any;

  savedRequestCount?: number;

  requestBody: any;
  requestBodyDataTypes: any;

  readonly availableDataTypes: any;
  requestHeaders: any;

  endpointError: string;
  loadingState?: boolean;


  constructor(private _mainService: MainService) {

    this.endpoint = "";
    this.selectedRequestMethod = "GET";
    this.requestMethods = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ];

    this.availableDataTypes = [
      "String",
      "Number",
      "Boolean",
    ];

    this.requestBody = [{ key: "", value: "" }];
    this.requestBodyDataTypes = [""];
    this.requestHeaders = [{ key: "Content-Type", value: "application/json" }];

    this.endpointError = "";
    this.loadingState = false;
  }

  ngOnInit(): void { }

  loadPastRequest(request: any) {

    this.selectedRequestMethod = request.method;
    this.endpoint = request.endpoint;
    this.requestHeaders = this.deconstructObject(request.headers, "Headers");
    if (request.method === "POST") {
      this.requestBody = this.deconstructObject(request.body, "Body")
    }

  }

  deconstructObject(object: any, type: string) {

    const objectArray: Array<any> = [];

    switch (type) {

      case 'Body': {
        Object.keys(object).forEach((objKey, index) => {
          this.requestBodyDataTypes[index] = 'String';
          const obj = { key: objKey, value: '' };
          objectArray.push(obj);
        });

        break;
      }

      case 'Headers': {
        Object.keys(object).forEach(objKey => {
          const obj = { key: objKey, value: object[objKey] };
          objectArray.push(obj);
        });

        break;
      }

    }

    return objectArray;
  }

  validateUrl(text: string) {
    // tslint:disable-next-line: max-line-length
    const urlRegExp = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm;
    return urlRegExp.test(text);
  }

  addItem(ctx: string) {

    let context;

    if (ctx === "Body") {
      context = this.requestBody;
    } else if (ctx === "Headers") {
      context = this.requestHeaders;
    }

    this.requestBody.push({ key: "", value: "" })

    if (ctx === "Body") {
      this.requestBodyDataTypes.push("");
    }
  }

  isAddDisabled(ctx: string) {

    let context;

    if (ctx === "Body") {
      context = this.requestBody;
    } else if (ctx === "Headers") {
      context = this.requestHeaders;
    }

    if (context.length > 0) {
      if (context[context.length - 1].key === "" ||
        context[context.length - 1].value === "") {
        return true;
      }
    }

    return false;

  }

  removeItem(index: number, ctx: string) {

    let context;

    if (ctx === "Body") {
      context = this.requestBody;
    } else if (ctx === "Headers") {
      context = this.requestHeaders;
    }

    this.requestBody.splice(index, 1);
  }

  saveRequest(requestType: string) {
    const requestObject: any = {
      endpoint: this.endpoint,
      method: this.selectedRequestMethod,
      headers: this.constructObject('Headers') || {}
    };

    if (requestType === "POST") {

      requestObject['body'] = this.constructObject("Body");

    }

    const transaction = this.indexedDB.transaction('pastRequests', 'readwrite');

    const pastRequestStore = transaction.objectStore('pastRequest');
    pastRequestStore.add(requestObject);
  }

  constructObject(ctx: string) {

    let context;

    if (ctx === "Body") {
      context = this.requestBody;
    } else if (ctx === "Headers") {
      context = this.requestHeaders;
    }

    let constructedObject = {};
    constructedObject = context.reduce(
      (object: any, item: any) => {
        object[item.key] = item.value;
        return object;
      }, {});

    return constructedObject;
  }

  // sendRequest func
  sendRequest() {

    this.endpointError = "";
    this.responseData = "";
    this.responseError = "";

    if (!this.endpoint) {
      this.endpointError = 'Endpoint is a Required value';
      return;
    }

    if (!this.validateUrl(this.endpoint)) {
      this.endpointError = 'Please enter a valid URL';
      return;
    }

    this.requestBody.forEach((item: any, index: any) => {
      if (this.requestBodyDataTypes[index] === 'Number') {
        item = Number(item);
      }
    });

    this.loadingState = true;
    switch (this.selectedRequestMethod) {

      case "GET": {
        this._mainService.sendGetRequest(
          this.endpoint,
          this.constructObject("Headers")
        ).subscribe(
          data => {
            this.loadingState = false;
            this.responseError = JSON.stringify(data, undefined, 4);
          },
          error => {
            this.loadingState = false;
            this.responseError = JSON.stringify(error, undefined, 4)
          }
        );
        break;
      }

      case "POST": {
        this._mainService.sendPostRequest(
          this.endpoint,
          this.constructObject('Body'),
          this.constructObject("Headers"),
        ).subscribe(
          data => {
            this.loadingState = false;
            this.responseData = JSON.stringify(data, undefined, 4);
          },
          error => {
            this.loadingState = false;
            this.responseData = JSON.stringify(error, undefined, 4);
          }
        );
        break;
      }

    }

    this.saveRequest(this.selectedRequestMethod);
    this.newRequest.emit();

    this.selectedRequestMethod = 'GET';
    this.endpoint = "";
    this.requestBody = [{ key: "", value: "" }];
    this.requestBodyDataTypes = [""];
    this.requestHeaders = [{ key: 'Content-Type', value: 'application/json' }];
    this.endpointError = "";

  }
}
