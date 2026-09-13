import type { ParsedInputFieldResult } from '@/src/services/llm/types';

export type BackgroundRequest = 
  | { type: 'SET', setting: object } // set particular data in setting
  | { type: 'LOCATE', html: string } // locate input element in the page 
  | { type: 'FILL', field: ParsedInputFieldResult, files: File[] } // fill input element in the page TODO

export type BackgroundResponse = 
  | { type: 'SET', success: boolean, error?: string, data?: object } // set particular data in setting
  | { type: 'LOCATE', success: boolean, error?: string, data?: string } // locate input element in the page TODO
  | { type: 'FILL', success: boolean, error?: string, data?: object } // fill input element in the page TODO

export type ContentRequest =
  | { type: 'FILL_PAGE' } // get the HTML content of the current page

export type ContentResponse =
  | { type: 'FILL_PAGE', success: boolean, error?: string } // return if the fill operation was successful or not

