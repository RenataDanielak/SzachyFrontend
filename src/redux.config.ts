import { configureStore, createAction, createReducer, Selector } from '@reduxjs/toolkit';
import axios from 'axios';
import React from 'react';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { combineEpics, createEpicMiddleware, Epic, ofType } from 'redux-observable';
import { catchError, from, of, pluck, switchMap } from 'rxjs';
import { ParametryPolaDto, ParametryRuchuDto, PionekDto, SzachyControllerApi } from './model/api';

export interface IChessState {
    sprawdzanyPionek?: {
        startX: number;
        startY: number;
    }
    wykonywanyRuch?: {    //PO DODANIU EPICKU DO USUNIECIA
        startX?: number;
        startY?: number;
        endX?: number;
        endY?: number;
    }
    dostepneRuchy?: ParametryPolaDto[];
    plansza?: PionekDto[];
    wirtualnyPrzeciwnik: boolean;
  }

export interface IMozliweRuchyRequest {
  startX: number;
  startY: number;
}

export interface IRuchRequest {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export const pobierzPlansze = createAction<undefined>('chess:pobierzPlansze')

export const pobierzPlanszeSuccess = createAction<PionekDto[]>('chess:pobierzPlanszeSuccess')

export const mozliweRuchy = createAction<IMozliweRuchyRequest>('chess:mozliweRuchy')

export const mozliweRuchySuccess = createAction<ParametryPolaDto[]>('chess:mozliweRuchySuccess')

export const zerujMozliweRuchy = createAction<undefined>('chess:zerujMozliweRuchy')

export const ruchPrzeciwnika = createAction<undefined>('chess:ruchPrzeciwnika')

export const ruchPrzeciwnikaSuccess = createAction<ParametryRuchuDto | undefined>('chess:ruchPrzeciwnikaSuccess')

export const zacznijOdPoczatku = createAction<undefined>('chess:zacznijOdPoczatku')

export const ruch = createAction<IRuchRequest>('chess:wykonajRuch')

export const przelaczPrzeciwnika = createAction<undefined>('chess:przelaczPrzeciwnika')

function chessReducerOld(state = { valueX: 0, valueY: 0 }, action: { type: any }) {
    switch (action.type) {
      case 'wykonajRuch':
        return { ...state, valueX: state.valueX + 1 }
      default:
        return state
    }
  }

const initCheseState: IChessState = {
  wirtualnyPrzeciwnik: true
}

const chessReducer = createReducer(initCheseState, (builder) => {
    builder
      .addCase(ruch, (state, action) => { 
        state.wykonywanyRuch = {
          startX: action.payload.startX,
          startY: action.payload.startY,
          endX: action.payload.endX,
          endY: action.payload.endY
        }
      })
      .addCase(mozliweRuchy, (state, action) => {
        state.sprawdzanyPionek = {startX: action.payload.startX, startY: action.payload.startY}
      })
      .addCase(mozliweRuchySuccess, (state, action) => {
      state.dostepneRuchy = action.payload
      })
      .addCase(zerujMozliweRuchy, (state, action) => {
        state.sprawdzanyPionek = undefined
        state.dostepneRuchy = []
        })
      .addCase(pobierzPlanszeSuccess, (state, action) => {
          state.plansza = action.payload
          state.sprawdzanyPionek = undefined
          state.dostepneRuchy = []
          })
      .addCase(ruchPrzeciwnikaSuccess, (state, action) => { 
        state.wykonywanyRuch = {
          startX: action.payload?.start?.pozycjaX,
          startY: action.payload?.start?.pozycjaY,
          endX: action.payload?.koniec?.pozycjaX,
          endY: action.payload?.koniec?.pozycjaY,
        }
      })
      .addCase(przelaczPrzeciwnika, (state) => { 
        state.wirtualnyPrzeciwnik = !state.wirtualnyPrzeciwnik;
      })
  })


 
  export const dostepneRuchySelector: Selector<AppState, 
  ParametryPolaDto[] | undefined> = (state) => state.dostepneRuchy;

  export const sprawdzanyPionekSelector: Selector<AppState, 
  { startX: number; startY: number; } | undefined> = (state) => state.sprawdzanyPionek;

  export const planszaSelector: Selector<AppState, 
  PionekDto[] | undefined> = (state) => state.plansza;

  export const wykonywanyRuchSelector: Selector<AppState, 
  { startX?: number; startY?: number; endX?: number; endY?: number; } | undefined> = (state) => state.wykonywanyRuch;

  export const wirtualnyPrzeciwnikSelector: Selector<AppState, 
  boolean> = (state) => state.wirtualnyPrzeciwnik;

  export interface IEpicDepenencies {
    chessApi: SzachyControllerApi
  }

  export const ruchEpic: Epic<any, any, IChessState, IEpicDepenencies> = (action, _state, { chessApi }) =>
    action.pipe(
      ofType(ruch.type),
      pluck('payload'),
      switchMap((payload: IRuchRequest)=> 
        from(chessApi.ruchUsingPOST( 
          { start : { 
            pozycjaX: payload.startX, 
            pozycjaY:payload.startY
          }, 
          koniec: {
            pozycjaX: payload.endX,
            pozycjaY: payload.endY
          }
        } )).pipe(
          switchMap((response) => {
            let nastepnyRuch = _state.value.wirtualnyPrzeciwnik;
            if (response.data === 'SZACH' && !nastepnyRuch){
               alert("Szach")
            }
            if(response.data === 'SZACHMAT') {
              nastepnyRuch = false;
              alert("Szachmat - gra skończona")
            } else if(response.data === 'PAT') {
              nastepnyRuch = false;
              alert("Pat - gra skończona")
            }
            return of(
            pobierzPlansze(),
            nastepnyRuch ? ruchPrzeciwnika() : undefined 
            );}),
          catchError(()=> of(
            zerujMozliweRuchy(),
            alert("ruch niedozwolony")))  
        )
      )
    );

    export const pobierzPlaszeEpic: Epic<any, any, any, IEpicDepenencies> = (action, _, { chessApi }) =>
    action.pipe( ofType(pobierzPlansze.type),
    pluck('payload'),
    switchMap((payload: IMozliweRuchyRequest)=> 
      from(chessApi.planszaUsingGET()).pipe(
        switchMap((response) => of(
          pobierzPlanszeSuccess(response.data) 
          ))
      )
    )
  );

  export const ruchPrzeciwnikaEpic: Epic<any, any, any, IEpicDepenencies> = (action, _, { chessApi }) =>
  action.pipe( ofType(ruchPrzeciwnika.type),
  pluck('payload'),
  switchMap(()=> 
    from(chessApi.wykonajRuchPrzezWirtualnegoPrzeciwnikaUsingPOST()).pipe(
      switchMap((response) => {
        if (response.data.typRuchu === 'SZACHMAT') {
          alert("Szachmat - gra skończona")
        } else if(response.data.typRuchu === 'PAT') {
          alert("Pat - gra skończona")
        } else if(response.data.typRuchu === 'SZACH') {
          alert("SZACH")
        }
        return of(
        ruchPrzeciwnikaSuccess(response.data.parametryRuchuDto),
        pobierzPlansze()
        );}
        )
    )
  )
);


export const zacznijOdPoczatkuEpic: Epic<any, any, any, IEpicDepenencies> = (action, _, { chessApi }) =>
action.pipe( ofType(zacznijOdPoczatku.type),
pluck('payload'),
switchMap(()=> 
  from(chessApi.rozpocznijGreOdNowaUsingPOST()).pipe(
    switchMap((response) => of(
      pobierzPlansze()
      ))
  )
)
);

    export const mozliwyRuchEpic: Epic<any, any, any, IEpicDepenencies> = (action, _, { chessApi }) =>
    action.pipe(
      ofType(mozliweRuchy.type),
      pluck('payload'),
      switchMap((payload: IMozliweRuchyRequest)=> 
        from(chessApi.dostepneRuchyUsingGET(payload.startX, payload.startY)).pipe(
          switchMap((response) => of(
            mozliweRuchySuccess(response.data) 
            ))
        )
      )
    );

  export const chessEpics = combineEpics(ruchEpic, mozliwyRuchEpic, pobierzPlaszeEpic, ruchPrzeciwnikaEpic, zacznijOdPoczatkuEpic)
  ;

  const axiosInstance = axios.create();

  const epicMiddleware = createEpicMiddleware({
    dependencies: {
      chessApi: new SzachyControllerApi(undefined, 'http:///localhost:8080', axiosInstance)
    }
  })




const store = configureStore({
  reducer: chessReducer,
  middleware: [epicMiddleware]
});

epicMiddleware.run(chessEpics as any);

export const useTypedSelector: TypedUseSelectorHook<AppState> = useSelector;

export type AppState = ReturnType<typeof store.getState >
export default store;



