import type {
  FilledInputFieldResult,
  ParsedInputFieldResult,
} from '@/src/services/llm/types';

export interface Base64File {
  content: string,
  type: string,
  name: string,
}

export type BackgroundRequest = 
  | { type: 'SET', setting: object } // set particular data in setting
  | { type: 'LOCATE', html: string } // locate input element in the page 
  | { type: 'FILL', field: ParsedInputFieldResult, files: Base64File[] } // file should be base64 encoded

export type BackgroundResponse = 
  | { type: 'SET', success: boolean, error?: string, data?: object } // set particular data in setting
  | { type: 'LOCATE', success: boolean, error?: string, data?: ParsedInputFieldResult }
  | { type: 'FILL', success: boolean, error?: string, data?: FilledInputFieldResult }

export type ContentRequest =
  | { type: 'FILL_PAGE', files: Base64File[] } // get the HTML content of the current page

export type ContentResponse =
  | { type: 'FILL_PAGE', success: boolean, error?: string, data?: string } // return if the fill operation was successful or not

