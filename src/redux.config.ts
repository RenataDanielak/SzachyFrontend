import { configureStore, createAction, createReducer, Selector } from '@reduxjs/toolkit';
import axios from 'axios';
import React from 'react';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { combineEpics, createEpicMiddleware, Epic, ofType } from 'redux-observable';
import { from, of, pluck, switchMap } from 'rxjs';
import { ParametryPolaDto, PionekDto, SzachyControllerApi } from './model/api';

export interface IChessState {
    sprawdzanyPionek?: {
        startX: number;
        startY: number;
    }
    wykonywanyRuch: {    //PO DODANIU EPICKU DO USUNIECIA
        startX: number;
        startY: number;
        endX: number;
        endY: number;
    }
    dostepneRuchy?: ParametryPolaDto[];
    plansza?: PionekDto[];
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

export const ruch = createAction<IRuchRequest>('chess:wykonajRuch')

function chessReducerOld(state = { valueX: 0, valueY: 0 }, action: { type: any }) {
    switch (action.type) {
      case 'wykonajRuch':
        return { ...state, valueX: state.valueX + 1 }
      default:
        return state
    }
  }

const initCheseState: IChessState = {
    wykonywanyRuch: { startX: 0, startY: 0, endX:0, endY:0 }
}

const chessReducer = createReducer(initCheseState, (builder) => {
    builder
      .addCase(ruch, (state, action) => { 
        state.wykonywanyRuch.startX = action.payload.startX
        state.wykonywanyRuch.startY = action.payload.startY
        state.wykonywanyRuch.endX = action.payload.endX
        state.wykonywanyRuch.endY = action.payload.endY
      })
      .addCase(mozliweRuchy, (state, action) => {
        state.sprawdzanyPionek = {startX: action.payload.startX, startY: action.payload.startY}
      })
      .addCase(mozliweRuchySuccess, (state, action) => {
      state.dostepneRuchy = action.payload
      })
      .addCase(pobierzPlanszeSuccess, (state, action) => {
          state.plansza = action.payload
          state.sprawdzanyPionek = undefined
          state.dostepneRuchy = []
          })

  })


 
  export const dostepneRuchySelector: Selector<AppState, 
  ParametryPolaDto[] | undefined> = (state) => state.dostepneRuchy;

  export const sprawdzanyPionekSelector: Selector<AppState, 
  { startX: number; startY: number; } | undefined> = (state) => state.sprawdzanyPionek;

  export const planszaSelector: Selector<AppState, 
  PionekDto[] | undefined> = (state) => state.plansza;



  export interface IEpicDepenencies {
    chessApi: SzachyControllerApi
  }

  export const ruchEpic: Epic<any, any, any, IEpicDepenencies> = (action, _, { chessApi }) =>
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
          switchMap((response) => of(
            response.data 
            ? pobierzPlansze()
            : alert("ruch niedozwolony")
            ))
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

  export const chessEpics = combineEpics(ruchEpic, mozliwyRuchEpic, pobierzPlaszeEpic);

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

epicMiddleware.run(chessEpics);

export const useTypedSelector: TypedUseSelectorHook<AppState> = useSelector;

export type AppState = ReturnType<typeof store.getState >
export default store;



