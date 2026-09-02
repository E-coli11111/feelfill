

export type ExtensionRequest = 
  | { type: 'set', setting: object } // set particular data in setting
  | { type: 'locate', html: string} // locate input element in the page
  | { type: 'fill' } // fill input element in the page TODO

export type ExtensionResponse = 
  | { type: 'set', success: boolean, error?: string } // set particular data in setting
  | { type: 'locate', success: boolean, error?: string, input?: string } // locate input element in the page
  | { type: 'fill', success: boolean, error?: string } // fill input element in the page TODO