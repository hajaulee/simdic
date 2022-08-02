import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {httpGetAsync} from "./http-utils";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {

  public defaultHeaders = new HttpHeaders();

  constructor(protected httpClient: HttpClient) {
  }


  getSuggest(searchKey: string): Observable<any> {
    return this.httpClient.post("https://vi.mazii.net/api/suggest",
      {
        dict: "javi",
        keyword: searchKey
      }
    );
  }

  search(searchKey: string): Observable<any> {
    // return this.httpClient.post("https://api.mazii.net/api/search",
    //   {
    //     dict: "javi",
    //     limit: 2,
    //     page: 1,
    //     query: searchKey,
    //     type: "word"
    //   }
    // );

    return httpGetAsync(
      `https://vi.mazii.net/api/search?dict=javi&limit=2&page=1&query=${searchKey}&type=word`,
      true,
      true,
      {
        minLength: 100,
        useCache: false,
        cacheTime: 1500,
        method: "POST"
      }
    ).pipe(
      map((data) => JSON.parse(data))
    )
  }

  getComments(wordId: number, token: string): Observable<any> {
    return this.httpClient.post("https://api.mazii.net/api/get-mean",
      {
        dict: "javi",
        token: token,
        type: "word",
        wordId: wordId
      }
    );
  }


}
