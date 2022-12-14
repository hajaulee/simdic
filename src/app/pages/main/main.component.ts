import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DictionaryService} from "../../services/dictionary.service";
import {Observable, ReplaySubject} from "rxjs";
import {filter, map, publishReplay, refCount, switchMap, tap} from "rxjs/operators";


interface SuggestWord {
  word: string;
  pronoun: string;
  mean: string;
}

interface WordExample {
  content: string;
  mean: string;
}

interface WordMean {
  kind: string;
  mean: string;
  examples: WordExample[]
}

interface WordSearch {
  word: string;
  phonetic: string;
  wordId: number,
  wordMeans: WordMean[]
}

interface WordComment {
  like: number;
  dislike: number;
  comment: string;
  author: string;
}


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  @ViewChild("inputSearch") inputSearch!: ElementRef;

  // Constants
  kindMap = {
    'n': 'danh từ',
    'vs': 'danh từ hoặc giới từ làm trợ từ cho động từ suru',
    'adj-na': 'tính từ đuôi な',
    'n-t': 'danh từ chỉ thời gian',
    'ik': 'từ chứa kana bất quy tắc',
    'adj-no': 'danh từ sở hữu cách thêm の'
  } as any;

  // Source streams
  searchKeyChanged$ = new ReplaySubject<string>(1);
  searchKeySelected$ = new ReplaySubject<string>(1);

  // Presentation streams
  suggestWords$!: Observable<SuggestWord[]>;
  wordSearch$!: Observable<WordSearch>;
  wordComments$!: Observable<WordComment[]>;

  // Normal values
  searchKey: string = '';
  showMean: boolean = false;
  meanLoading: boolean = false;

  searchHistory: SuggestWord[] = [];

  constructor(
    protected dictionaryServices: DictionaryService
  ) {
  }

  ngOnInit(): void {

    this.suggestWords$ = this.searchKeyChanged$.pipe(
      switchMap((searchKey) => this.dictionaryServices.getSuggest(searchKey)),
      map((data) => {
        return data?.status === 200 ?
          data.data.map((item: string) => {
            const tokens = item.split("#");
            return {
              word: tokens[0],
              pronoun: tokens[1],
              mean: tokens[2]
            }
          }) : []
      }),
      publishReplay(1),
      refCount()
    );

    this.wordSearch$ = this.searchKeySelected$.pipe(
      switchMap((searchKey) => this.dictionaryServices.search(searchKey)),
      map((data) => {
        return data?.status === 200 ? {
            word: data.data[0].word,
            phonetic: data.data[0].phonetic,
            wordId: data.data[0].mobileId,
            wordMeans: data.data[0].means
          }
          : {} as any;
      }),
      tap(() => {
        this.meanLoading = false;
      }),
      publishReplay(1),
      refCount()
    );

    this.wordComments$ = this.wordSearch$.pipe(
      filter((wordSearch) => !!wordSearch?.wordId),
      switchMap((wordSearch) => this.dictionaryServices.getComments(
        wordSearch.wordId, "c8f03d8cd4ed474a00f2de27c1b2d49b")
      ),
      map((data) => {
        return data?.status == 200 ? data.result.map((result: any) => ({
          like: result.like,
          dislike: result.dislike,
          comment: result.mean,
          author: result.username
        })) : [];
      }),
      publishReplay(1),
      refCount()
    );


    setTimeout(() => {
      this.inputSearch.nativeElement.focus();
    });
    this.loadHistory();
  }

  onSearchValueChanged(value: string) {
    this.searchKeyChanged$.next(value);
    this.showMean = false;
  }

  onSearchValueSelected(value: string) {
    this.searchKey = value;
    this.searchKeySelected$.next(value);
    this.showMean = true;
    this.meanLoading = true;
    setTimeout(() => {
      this.inputSearch.nativeElement.blur();
    });
  }

  getKind(kind: string) {
    const kinds = kind.split(",").map(i => i.trim());
    return kinds.map(i => this.kindMap[i] ?? i).join(", ");
  }


  showAny(abc: any) {
    console.log(this.searchKey)
    console.log(abc.target.value);
    setTimeout(() => {
      console.log(this.searchKey)
    })
  }

  loadHistory() {
    this.searchHistory = JSON.parse(localStorage.getItem("searchHistory") || '[]');
  }

  saveHistory(word: SuggestWord) {
    this.searchHistory.unshift(word);
    localStorage.setItem("searchHistory", JSON.stringify(this.searchHistory));
    console.log(this.searchHistory);
  }

}
