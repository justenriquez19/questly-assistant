import * as http from "http";

export class BrowserAiAssisant {
  constructor() { }

  public async fetchBrowserAI(): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = require('request');

      const options = {
        method: 'GET',
        url: 'https://api.browse.ai/v2/robots/${1ec816f9-73d2-40b0-9ebf-7cc4bb1c84aa}/tasks',
        qs: { page: '1' },
        headers: { Authorization: '634186f5-182f-4d10-b8e0-fb93085c9fbe:74d8ef62-c14e-473b-badc-f17979900041' }
      };

      request(options, function (error: string | undefined, response: any, body: any) {
        if (error) throw new Error(error);

        console.log(body);
      });
    });
  }
}
