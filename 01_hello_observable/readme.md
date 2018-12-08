# 01 Hello Observable

# Summary

In this sample we are going to: 

- Install redux-observable library.
- Add all the setup code needed.
- Create a simple service that will return numbers after a given delay (simulating asynchronous calls).
- Setup redux saga.
- Create actions to request for a new number, and a second action that will be fired 
once the the number has been served.
- Create an observable that will: 
  - Intercept the request_number_start.
  - Execute the getNewNumber service wait for it's reponse.
  - Fire the request_number_completed task.
- Setup the global saga and update middleware setup to add redux-observable.
- Update the de numberCollection reducer to listen for this task.
- Create a number setter component + container.

# Steps

- We will take as starting point _00_boilerplate_ let's copy the content of that project 
and execute from bash / cmd the following command:

```bash
npm install
```

- Let's define two actions, the first on to start a new number request, and the second one
to collect the number request once has been completed.

- First we will create the actions Id's, and we will add a helper to get base actions typed::

_./src/common/index.ts_

```typescript
export const GET_NUMBER_REQUEST_START   = '[0] Request a new number to the NumberGenerator async service.';
export const GET_NUMBER_REQUEST_COMPLETED = '[1] NumberGenerator async service returned a new number.';
```

- Before starting creating actions let's install _typesafe-actions_ (Flexible functional API that's specifically designed to reduce types verbosity), more info: https://github.com/piotrwitek/typesafe-actions

```
npm install typesafe-actions --save
```

- Let's define the action creators:

_./src/actions/index.ts_

```typescript
import {GET_NUMBER_REQUEST_START,
        GET_NUMBER_REQUEST_COMPLETED
       } from '../common';
import { createAction } from "typesafe-actions";

export const numberRequestStartAction = createAction(
                                            GET_NUMBER_REQUEST_START, 
                                            resolve => () => resolve(null));

export const numberRequestCompletedAction = createAction(
                                              GET_NUMBER_REQUEST_COMPLETED, 
                                              resolve => (numberGenerated : number) => resolve(numberGenerated));
```

> Typesafe _createAction_ will automatically return the right action fields: TYPE and PAYLOAD

- Let's handle _GET_NUMBER_REQUEST_COMPLETED_ on the _my-number_ reducer.

_./src/reducers/my-number.reducer.ts_

```diff
+ import { ActionType, getType } from 'typesafe-actions';
+ import * as actions from '../actions'

+ type Action = ActionType<typeof actions>;

export type MyNumberCollectionState = number[];

- export const myNumberCollectionReducer = (state : MyNumberCollectionState = [0], action) => {
+ export const myNumberCollectionReducer = (state: MyNumberCollectionState = [0], action: Action) => {
+  switch (action.type) {
+    case getType(actions.numberRequestCompletedAction):
+      return handleGetNumberRequestCompleted(state, action.payload);
+    break;
+  }

  return state;
}

+ const handleGetNumberRequestCompleted = (state : MyNumberCollectionState, newNumber : number) : MyNumberCollectionState => 
+  [...state, newNumber];
```

- Time to create some UI to interact with our brand new redux observables, in this case 
we will create a component that we will call _my-number-setter-container_ and
_my-number-setter-component_, the presentational component will just hold
a button, when we click on this button a new request async number action will
be fired.

_./src/components/my-number/setter/my-number-setter.component.tsx_

```typescript
import * as React from 'react';

interface Props {
  onRequestNewNumber: () => void;
}

export const MyNumberSetterComponent = (props : Props) =>
  <button onClick={props.onRequestNewNumber}>Request new number</button>
```

- Now let's wire up the container with the redux / actions needed.

_./src/components/my-number/setter/my-number-setter.container.tsx_

```typescript
import {connect} from 'react-redux';
import {State} from '../../../reducers';
import {MyNumberSetterComponent} from './my-number-setter.component';
import {numberRequestStartAction} from '../../../actions';

const mapStateToProps = (state : State) => ({
})

const mapDispatchToProps = (dispatch) => ({
  onRequestNewNumber: () => dispatch(numberRequestStartAction())
})

export const MyNumberSetterContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(MyNumberSetterComponent);
```

- Let's add this component to the components barrel.

_./src/components/index.ts_

```diff
export {MyNumberBrowserContainer} from './my-number/browser/my-number-container';
+ export {MyNumberSetterContainer} from './my-number/setter/my-number-setter.container';
```

- We can instantiate now our component in the main page:

_./src/main.tsx_

```diff
import * as React from 'react';
import * as ReactDOM from 'react-dom';
- import { MyNumberBrowserContainer } from './components';
+ import { MyNumberBrowserContainer, MyNumberSetterContainer } from './components';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import {reducers} from './reducers';

// (...)

ReactDOM.render(
  <Provider store={store}>
    <>
+      <MyNumberSetterContainer />
      <MyNumberBrowserContainer />    
    </>
  </Provider>,
  document.getElementById('root'));
```


- Time to install rxjs and redux observable:

```bash
npm install rxjs redux-observable --save
```
> No need to install @types, they are already included in the library.

- First we will create a simple service that will return a new number (incremental)
after a given delay (main goal is to emulate sinchronizity).

_./src/services/number-generator.service.ts_

```typescript
let initialNumber = 0;

export const generateNewNumber = () : Promise<number> => {
  const promise = new Promise<number>((resolve) => {
    setTimeout(() => {
      initialNumber += 1;
      resolve(initialNumber)
    }, 500)
  });

  return promise;
}
```
Let's create a barrel under _services_ folder:

_./src/services/index.ts_

```typescript
export * from './number-generator.service';
```

- Now we will start with redux-observable application plumbing, first we will 
setup the middleware (we will need some additional setup to make it work
seamlessly with redux dev tools).

_./src/main.tsx_

```diff
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MyNumberBrowserContainer } from './components';
- import { createStore } from 'redux';
+ import { createStore, applyMiddleware, compose } from 'redux';
+ import { createEpicMiddleware} from 'redux-observable';
+ import * as actions from './actions';
+ import { ActionType} from 'typesafe-actions';
import { Provider } from 'react-redux';
- import {reducers} from './reducers';
+ import { reducers, State } from './reducers';

+ type Action = ActionType<typeof actions>;

+ const epicMiddleware = createEpicMiddleware<Action, Action, State>(); 

-const store = createStore(reducers,
-  window['__REDUX_DEVTOOLS_EXTENSION__'] && 
-  window['__REDUX_DEVTOOLS_EXTENSION__']()
-);
+ const store = createStore(reducers,{},
+   compose(
+     applyMiddleware(epicMiddleware),
+     window['__REDUX_DEVTOOLS_EXTENSION__'] ? window['__REDUX_DEVTOOLS_EXTENSION__']() : f => f
+   )   
+ );


ReactDOM.render(
  <Provider store={store}>
    <>      
      <MyNumberBrowserContainer/>
    </>
  </Provider>,
  document.getElementById('root'));
```

> We will get an error, _rootEpic_ is undefined. 

- Let's create an _epics_ subfolder and create there our _rootEpic_
  - We will crate first a _getNumberEpic_ that will:
      - _pipe_: Current actions obserables, pipe to stream (pipes the existing obserable sequence into a Node.js stream).
      - List to the actions stream.
      - _Filter_: Only pipe the actions of type _numberRequestStartAction_ 
      - _switchMap_: Acts like a takeLatest (it will cancel any other pending request).
      We switch two observables and we cancel any old ones (https://www.youtube.com/watch?v=6lKoLwGlglE)
        and start a new obervable subscription)
      - _from_: Turns the promise into an observable.
      - _pipe_: Pipes the existing obserable sequence into a Node.js stream.

_./src/epics/index.ts_

```typescript
import { Observable, from } from 'rxjs';
import { combineEpics, Epic } from 'redux-observable';
import * as actions from '../actions'
import { ActionType, isOfType, getType } from 'typesafe-actions';
import { State } from '../reducers';
import { filter, map, catchError, mergeMap } from 'rxjs/operators';
import { generateNewNumber } from '../services';

type Action = ActionType<typeof actions>;

const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
  return action$.pipe(
    filter(isOfType(getType(actions.numberRequestStartAction))),
      mergeMap(action =>
        from(generateNewNumber()).pipe(
          map(actions.numberRequestCompletedAction),
          //  catchError(error => of(actions.numberRequestErrorAction(error)))
        )
      )
    )
}

export const rootEpic = combineEpics(getNumberEpic);
```

> About the _filter_ statement, redux observable already incorporates some sugar, it could be written like

```typescript
return action$.ofType(getType(actions.numberRequestStartAction)).pipe(  
```

> About the _mergeMap_ it will merge all pending ajax call to be resolved inot a single stream.

> About the map line of code is used as shorthand (monad), is the same call as:
_map((newNumber) => actions.numberRequestCompletedAction(newNumber))_

> An Epic is a function that takes in stream action and return stream actions.

- Let's go back and setup the _rootEpic_ on the _main.tsx_

_./src/main.tsx_

```diff
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MyNumberBrowserContainer, MyNumberSetterContainer } from './components';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import { createEpicMiddleware } from 'redux-observable';
+ import { rootEpic } from './epics';
import { reducers, State } from './reducers';
import * as actions from './actions'
import { ActionType, isOfType, getType } from 'typesafe-actions';

type Action = ActionType<typeof actions>;

const epicMiddleware = createEpicMiddleware<Action, Action, State>();

const store = createStore(reducers, {},
  compose(
    applyMiddleware(epicMiddleware),
    window['__REDUX_DEVTOOLS_EXTENSION__'] ? window['__REDUX_DEVTOOLS_EXTENSION__']() : f => f
  )
);

+ epicMiddleware.run(rootEpic);

ReactDOM.render(
  <Provider store={store}>
```

- Time to run the sample:

```
npm start
```