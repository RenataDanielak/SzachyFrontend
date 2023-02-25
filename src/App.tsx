import React, { Fragment, useEffect } from 'react';
import logo from './logo.svg';
import { Field, Form } from 'react-final-form'
import { OnChange } from 'react-final-form-listeners'
import './App.css';
import store,{ AppState, dostepneRuchySelector, IRuchRequest, mozliweRuchy, planszaSelector, pobierzPlansze, ruch, sprawdzanyPionekSelector, useTypedSelector } from './redux.config'
import { FormApi } from 'final-form';
import { useSelector, useStore } from 'react-redux';
import { PionekDtoFiguraEnum } from './model/api';

function App() {

const submit = (values: IRuchRequest) => {
  store.dispatch(ruch({
    startX: values.startX,
    startY: values.startY,
    endX: values.endX,
    endY: values.endY
  }))
} 

const pokazMozliweRuchy = (x: number | undefined, y: number | undefined) : void => {
  if (x && y) {
    store.dispatch(mozliweRuchy({startX: x, startY: y}))
  }

}


  return (
    <div className="App">
      <header className="App-header">
        <p>
          Szachy
        </p>


      {/* <Welcome name={store.getState() && store.getState().dostepneRuchy != undefined 
          ? store.getState().dostepneRuchy!.map(ruch =>ruch.pozycjaX) 
          : 'Brak dostepnych ruchow'} />; */}

      <DostepneRuchyComp/>

      <Form onSubmit={submit} render={({ handleSubmit, form }) => (
        <form onSubmit={handleSubmit}>
          <Field 
            name='startX'
            component="input"
            type="text">
          </Field>
          <OnChange name='startX'>
            {(value) : void => {
              const y = form.getFieldState('startY')?.value;
              pokazMozliweRuchy(value, y);

            }}
          </OnChange>
          <Field 
            name='startY'
            component="input"
            type="text">
          </Field>
          <OnChange name='startY'>
            {(value) : void => {
              const x = form.getFieldState('startX')?.value;
              pokazMozliweRuchy(x, value);

            }}
          </OnChange>
          <br/>
          <Field 
            name='endX'
            component="input"
            type="text">
          </Field>
          <Field 
            name='endY'
            component="input"
            type="text">
          </Field>
          <br/>
          <button type="submit">
              Wykonaj ruch
            </button>

        </form>
      )}
      />
      
      </header>

    </div>
  );
}

export default App;

// function Welcome(props: any) {  
//   //const test = useSelector<AppState>((state) => state.dostepneRuchy.pozycjaX);
//   //const store = useStore();
//   {store.getState().dostepneRuchy}
//   return <h1>Cześć, {props.name}</h1> ;
//   //return <h1>Cześć, {props.name}, {store.getState()}</h1> ;
// }

const DostepneRuchyComp: React.FC = () => {
  //const test2 = useSelector<AppState>(dostepneRuchySelector);

  const dostepneRuchy = useTypedSelector(dostepneRuchySelector); 
  const sprawdzanyPionek = useTypedSelector(sprawdzanyPionekSelector); 
  const plansza = useTypedSelector(planszaSelector); 

  useEffect(() => {
    store.dispatch(pobierzPlansze())
  }, []);

  useEffect(() => {
    let c = document.getElementById("myCanvas") as HTMLCanvasElement;;
    if (!!c) {
      let ctx = c.getContext("2d");
      if (!!ctx) {
        ctx.fillStyle = "white"
        ctx.fillRect(0,0,400,400)
        for (let i = 0; i < 8; i++) {
          const przesuniecie = i%2;
          for (let j = 0; j < 4; j++) {
            ctx.fillStyle = "black"
            ctx.fillRect(j*100 + 50 * przesuniecie, i*50 ,50,50)
          }
        }
        console.log("PLANSZA:" + plansza);
        
        plansza?.map(pionek => {
          if(!!ctx) {
            ctx.beginPath();
          const x=pionek.pozycjaX;
          const y=pionek.pozyjcjaY;
          if (x !== undefined && y !== undefined) {
          
            var img = new Image();

            switch(pionek.figura) {
              case PionekDtoFiguraEnum.Pionek: 
                img.src = pionek.kolor === 'BIALY' ? "images/pion_b.png" : "images/pion_c.png";
                break;
              case PionekDtoFiguraEnum.Wieza: 
                img.src = pionek.kolor === 'BIALY' ? "images/wieza_b.png" : "images/wieza_c.png";
                break;
              case PionekDtoFiguraEnum.Kon: 
                img.src = pionek.kolor === 'BIALY' ? "images/kon_b.png" : "images/kon_c.png";
                break;
              case PionekDtoFiguraEnum.Laufer: 
                img.src = pionek.kolor === 'BIALY' ? "images/laufer_b.png" : "images/laufer_c.png";
                break;
              case PionekDtoFiguraEnum.Krol: 
                img.src = pionek.kolor === 'BIALY' ? "images/krol_b.png" : "images/krol_c.png";
                break;
              case PionekDtoFiguraEnum.Krolowa: 
                img.src = pionek.kolor === 'BIALY' ? "images/krolowa_b.png" : "images/krolowa_c.png";
                break;
            }
            

            img.onload = function() { if(ctx) ctx.drawImage(img, x*50 ,350-y*50, 50, 50); }

            // ctx.arc(x*50+25, 400-y*50-25, 20, 0, 2 * Math.PI); 
            // ctx.fillStyle = pionek.kolor === 'BIALY' ? "white" : "black"
            // ctx.fill();
            // ctx.strokeStyle = 'blue';
            // ctx.lineWidth = 3;
            // ctx.stroke(); 

          }
          

          }
        })

        
        ctx.lineWidth = 3;
        if(sprawdzanyPionek) {
          ctx.beginPath();
          const x1=sprawdzanyPionek.startX;
          const y1=sprawdzanyPionek.startY;
          ctx.strokeStyle = 'red';
          ctx.rect(x1*50, 350-y1*50, 50, 50);
          ctx.stroke();
        }
        
        if(dostepneRuchy) {
          dostepneRuchy.map(ruch => {
            if (ctx) {
              ctx.beginPath();
              const x2=ruch.pozycjaX;
              const y2=ruch.pozycjaY;
              if(x2 !== undefined && y2!==undefined) {
                ctx.strokeStyle = 'red';
                ctx.moveTo(x2*50, 400-y2*50);
                ctx.lineTo(x2*50+50, 400-y2*50-50);
                ctx.moveTo(x2*50+50, 400-y2*50);
                ctx.lineTo(x2*50+0, 400-y2*50-50);
                ctx.stroke();
              }              
            }
          })
        }
        
      }
    }
  }, [dostepneRuchy,sprawdzanyPionek, plansza]);
  
  return ( 
  <Fragment>
    <canvas id="myCanvas" width="400" height="400"></canvas>
  </Fragment>
  )
  //return <h1>Dostepne Ruchy </h1>
} 