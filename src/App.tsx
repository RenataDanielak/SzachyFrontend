import React, { Fragment, useEffect } from 'react';
import logo from './logo.svg';
import { Field, Form } from 'react-final-form'
import { OnChange } from 'react-final-form-listeners'
import './App.css';
import store,{ AppState, dostepneRuchySelector, IRuchRequest, mozliweRuchy, planszaSelector, pobierzPlansze, przelaczPrzeciwnika, ruch, sprawdzanyPionekSelector, useTypedSelector, wirtualnyPrzeciwnikSelector, wykonywanyRuchSelector, zacznijOdPoczatku, zerujMozliweRuchy } from './redux.config'
import { FormApi } from 'final-form';
import { useSelector, useStore } from 'react-redux';
import { PionekDtoFiguraEnum } from './model/api';

function App() {

  const wirtualnyPrzeciwnikWlaczony = useTypedSelector(wirtualnyPrzeciwnikSelector)

const submit = (values: IRuchRequest) => {
  store.dispatch(ruch({
    startX: values.startX,
    startY: values.startY,
    endX: values.endX,
    endY: values.endY
  }))
} 

const pokazMozliweRuchy = (x: number | undefined, y: number | undefined) : void => {
  if (x !== undefined && y !== undefined) {
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

    
      <Form onSubmit={submit} render={({ handleSubmit, form }) => (
        <form onSubmit={handleSubmit}>

          <DostepneRuchyComp form={form}/>

          <br/>
          <div style={{display: 'none' }}>
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
          </div>
          <br/>

          <button type="button" onClick={() => store.dispatch(przelaczPrzeciwnika())}>
            {wirtualnyPrzeciwnikWlaczony ?  'wylacz wirtualnego przeciwnika' : 'wlacz wirtualnego przeciwnika'}
          </button>

          <br/>

          <button type="button" onClick={() => store.dispatch(zacznijOdPoczatku())}>
            Zacznij gre od poczatku
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

const DostepneRuchyComp: React.FC<{form: FormApi<any>}> = ({form}) => {
  //const test2 = useSelector<AppState>(dostepneRuchySelector);

  const dostepneRuchy = useTypedSelector(dostepneRuchySelector); 
  const sprawdzanyPionek = useTypedSelector(sprawdzanyPionekSelector); 
  const ostatniRuch = useTypedSelector(wykonywanyRuchSelector); 
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

        if(ostatniRuch && ostatniRuch.startX) {
          if (ostatniRuch.startX !== undefined && ostatniRuch.startY !== undefined) {
            ctx.beginPath();
            const x1=ostatniRuch.startX;
            const y1=ostatniRuch.startY;
            ctx.strokeStyle = 'yellow';
            ctx.rect(x1*50, 350-y1*50, 50, 50);
            ctx.stroke();
          }

          if (ostatniRuch.endX !== undefined && ostatniRuch.endY !== undefined) {
            ctx.beginPath();
            const x2=ostatniRuch.endX ;
            const y2=ostatniRuch.endY;
            ctx.strokeStyle = 'yellow';
            ctx.rect(x2*50, 350-y2*50, 50, 50);
            ctx.stroke();
          }

        }
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

  const clickHandler = (event: React.MouseEvent) => {

    let canvas = document.getElementById("myCanvas") as HTMLCanvasElement

    const rect = canvas.getBoundingClientRect();

    const positionX = Math.floor((event.clientX - rect.left) / 50)
    const positionY = 7 - Math.floor((event.clientY - rect.top ) /50);


    const currentStartX = form.getFieldState('startX')?.value;
    const currentStartY = form.getFieldState('startY')?.value;

    if (currentStartX === undefined && currentStartY === undefined) {
      form.change('startX', positionX);
      form.change('startY', positionY);
    } else if(currentStartX === positionX && currentStartY === positionY) {
      store.dispatch(zerujMozliweRuchy())
      form.change('startX', undefined);
      form.change('startY', undefined);
    } else {
      form.change('endX', positionX);
      form.change('endY', positionY);
      form.submit()
      form.change('startX', undefined);
      form.change('startY', undefined);
      form.change('endX', undefined);
      form.change('endY', undefined);
    }

  }
  
  return ( 
  <Fragment>
    <canvas id="myCanvas" onClick={clickHandler} width="400" height="400"></canvas>
  </Fragment>
  )
  //return <h1>Dostepne Ruchy </h1>
} 