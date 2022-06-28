import { of, merge, BehaviorSubject, Observable, from } from 'rxjs';
import { mergeAll, switchMap, tap } from 'rxjs/operators';

declare type RequestCategory = 'cats' | 'meats';

const CATS_URL = 'https://placekitten.com/g/{w}/{h}';

function mapCats(response): Observable<any> {
  return from(
    new Promise((resolve, reject) => {
      var blob = new Blob([response], { type: 'image/png' });
      let reader = new FileReader();
      reader.onload = (data: any) => {
        resolve(data.target.result);
      };
      reader.readAsDataURL(blob);
    })
  );
}

const MEATS_URL = 'https://baconipsum.com/api/?type=meat-and-filler';

function mapMeats(response): Observable<string> {
  const parsedData = response;
  return of(parsedData ? (parsedData as Array<string>)[0] : '');
}

let requestCategory: RequestCategory = 'cats';

function requestData(
  url: string,
  mapFunc: (any) => Observable<string>
): Observable<string> {
  console.log(url);
  const xhr = new XMLHttpRequest();
  return from(
    new Promise<string>((resolve, reject) => {
      // This is generating a random size for a placekitten image
      //   so that we get new cats each request.
      const w = Math.round(Math.random() * 400);
      const h = Math.round(Math.random() * 400);
      const targetUrl = url
        .replace('{w}', w.toString())
        .replace('{h}', h.toString());

      xhr.addEventListener('load', () => {
        resolve(xhr.response);
      });
      xhr.open('GET', targetUrl);
      if (requestCategory === 'cats') {
        // Our cats urls return binary payloads
        //  so we need to respond as such.
        xhr.responseType = 'arraybuffer';
      }
      xhr.send();
    })
  ).pipe(
    switchMap((data) => mapFunc(xhr.response)),
    tap((data) => console.log('Request result: ', data))
  );
}

const cats: Observable<any> = requestData(CATS_URL, mapCats);
const meats: Observable<any> = requestData(MEATS_URL, mapMeats);

const observables = [];
observables.push(of(1));
observables.push(of(2));
observables.push(of(3));
observables.push(cats);
observables.push(meats);

const s = new BehaviorSubject(observables);

s.asObservable()
  .pipe(switchMap((array) => merge(...array)))
  .subscribe((x) => console.log('first : ', x));

// s.next([...s.getValue(), of(4)]);
