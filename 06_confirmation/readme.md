# 06 Confirmation

# Summary

In this sample, we are going to add a confirmation modal, so that when the user requests the generation of a new number, a modal is displayed asking for further confirmation. If the user confirms the request, it is sent. Otherwise, no new number is generated at all. While we might expect to perform this kind of logic on the UI components straight-away, wee are going to implement this functionality entirely within our Epic code, treating the emission of confirmations/rejections as a new data stream.

# Steps

- Let's take sample *01_hello_observable* as our starting point. As usual, our first step is to install the dependencies needed from the command shell
```bash
npm install
```

- We need a new type of action to represent the emission of a new confirmation (or rejection). Thus, let us modify our set of actions to account for this. First of all, we will create a suitable action ID.

_./src/common/index.ts_

```diff
export const actionIds = {
  GET_NUMBER_REQUEST_START: '[0] Request a new number to the NumberGenerator async service.',
  GET_NUMBER_REQUEST_COMPLETED: '[1] NumberGenerator async service returned a new number.',
+ GET_NUMBER_REQUEST_USER_CONFIRMATION: '[2] User has to confirm or cancel the number request before it gets fired',  
}

export interface BaseAction {
  type : string;
  payload: any;
}
```

- And then we will add a new action creator to represent a confirmation/rejection. In this case, we want to resolve our payload as a boolean that indicates whether we can go ahead with our request or not.

_./src/actions/index.ts_

```typescript

export const numberRequestUserConfirmationAction = createAction(
                                                    actionIds.GET_NUMBER_REQUEST_USER_CONFIRMATION,
                                                    resolve => (goahead: boolean) => resolve(goahead));
```

- Now let's move onto our setter component, _my-number-setter.component_. We are going to change it from a functional component into a class one, so that we can define an inner flag in its state to control whether the confirmation modal is visible or not. Similarly, we will add a new prop callback to bubble-up whenever the user confirmes/denies a request.

_./src/components/my-number/setter/my-number-setter-component.tsx_

```diff
import * as React from 'react';

interface Props {
  onRequestNewNumber: () => void;
+  onUserConfirmNewNumberRequest : (result : boolean) => void;
}

+ interface State {
+   showingModalConfirmation : boolean;
+ }

- export const MyNumberSetterComponent = (props : Props) =>
-   <button onClick={props.onRequestNewNumber}>Request new number</button>

+ export class MyNumberSetterComponent extends React.PureComponent<Props, State> {
+ 
+   state : State = {showingModalConfirmation: false}  
+ 
+   render() {
+     const {onRequestNewNumber} = this.props;
+
+     return (
+       <button onClick={onRequestNewNumber}>Request new number</button>
+     )     
+   }
+ }
```

- Let's also refactor the code of our component as below: now, instead of simply making a request whenever clicking on _Request new number_ button, doing so will also toggle on a confirmation modal for the user to select whether the last generation request issued should be processed or not. As soon as the user confirms or deny the item, said modal is hidden once more, and the resulting confirmation/rejection is bubbled-up as a boolean variable by calling the new callback prop defined.


```diff
export class MyNumberSetterComponent extends React.PureComponent<Props, State> {
+  onConfirmationOptionClicked = (result :boolean) => (e) => {
+    this.props.onUserConfirmNewNumberRequest(result);
+    this.setState({showingModalConfirmation: false});
+  }
+
+   onRequestNewNumberWithConfirmation = () => {
+     this.setState({showingModalConfirmation: true})
+     this.props.onRequestNewNumber();
+   }

  render() {
-     const {onRequestNewNumber} = this.props;
+     const {onRequestNewNumber, onUserConfirmNewNumberRequest} = this.props;

+    const setModalDialogStyle = () : React.CSSProperties => ({
+      background: '#ADD8E6',
+      display: (this.state.showingModalConfirmation) ? 'inline' : 'none'
+    });


    return (
+     <>
-       <button onClick={onRequestNewNumber}>Request new number</button>
+       <button onClick={this.onRequestNewNumberWithConfirmation}>Request new number</button>
+      <div style={setModalDialogStyle()}>
+        <span>Are you sure you want to get a new number?</span>
+        <button onClick={this.onConfirmationOptionClicked(true)}>Yes</button>
+        <button onClick={this.onConfirmationOptionClicked(false)}>No</button>
+      </div>
+     </>
    )
  }
}
```


- After updating our setter component, we need to update its corresponding container to wire up the connections to our store and dispatcher.

_./src/components/my-number-setter.container_

```diff
import {connect} from 'react-redux';
import {State} from '../../../reducers';
import {MyNumberSetterComponent} from './my-number-setter.component';
- import {numberRequestStartAction} from '../../../actions';
+ import {numberRequestStartAction, numberRequestUserConfirmationAction} from '../../../actions';

const mapStateToProps = (state : State) => ({
})

const mapDispatchToProps = (dispatch) => ({
  onRequestNewNumber: () => dispatch(numberRequestStartAction()),
+ onUserConfirmNewNumberRequest: (result : boolean) => dispatch(numberRequestUserConfirmationAction(result)),
})

export const MyNumberSetterContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(MyNumberSetterComponent);
```



- At this point, we have finished doing all the plumbing needed to send user confirmations/rejections in the form of a new observable stream. The next step would be moving onto our epics section and refactor the code to account for the new desired behaviour. As per the changes below, let's import a new RxJs operator, _withLatestFrom_, and define separate action observables for both new numbers request and confirmations.

```diff
import { Observable, from } from 'rxjs';
import { combineEpics, Epic } from 'redux-observable';
import * as actions from '../actions'
import { ActionType, isOfType, getType } from 'typesafe-actions';
import { State } from '../reducers';
- import { filter, map, mergeMap, withLatestFrom } from 'rxjs/operators';
+ import { filter, map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { generateNewNumber } from '../services';

type Action = ActionType<typeof actions>;

const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
+  const numberRequestStartAction$ = action$.pipe(filter(isOfType(getType(actions.numberRequestStartAction))));
+  const numberRequestUserConfirmationAction$ = action$.pipe(filter(isOfType(getType(actions.numberRequestUserConfirmationAction))));

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

- Finally, let's refactor our epic to implement the behaviour we want. Basically, we have two data streams represented by the Observables _numberRequestStarAction$_ and _numberRequestUserConfirmationAction$_. The former concerns the requests issued by the user to generate a new number, while the latter covers the confirmations (or rejections) sent. We need to combine both streams in a way that we only generate a new number if the following two conditions are met:
  * User sends a positive confirmation (_goahead_ value of _true_ as payload in a given _numberRequestUserConfirmationAction_)
  * The user has asked for a new number previously to receiving this confirmation

- The operator that enables us to implement this behaviour is _withLatestFrom_. This operator takes an Observable and projection function as input, and waits for the latest value emitted by that Observable, so that when the source Observable emits, the projection function is called with both the source value and the latest emitted value of the input Observable, defining the final value that will be emitted on the resulting output Observable. Thus, since we only want to emit a new number whenever getting a positive confirmation, it stands to reason to take the _numberRequestUserConfirmationAction$_ Observable as our source. Then, if we take the _numberRequestStartAction$_ observable as input to the applied operator called on such source, we ensure that everytime we get a confirmation/rejection from the user, the resulting output Observable emits a new value that depends on both said confirmation/rejection and the latest _click_ made on _Generate new number_. This is exactly what we need, the only step needed after this is to filter out those events for which the confirmation was not positive. The changes below enable this behaviour.

```diff
const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
  const numberRequestStartAction$ = action$.pipe(filter(isOfType(getType(actions.numberRequestStartAction))));
  const numberRequestUserConfirmationAction$ = action$.pipe(filter(isOfType(getType(actions.numberRequestUserConfirmationAction))));

-  return action$.pipe(
-    filter(isOfType(getType(actions.numberRequestStartAction))),
+  return numberRequestUserConfirmationAction$.pipe(
+    withLatestFrom(numberRequestStartAction$, (
+      confirmationAction: ActionType<typeof actions.numberRequestUserConfirmationAction>,
+      numberRequestAction: ActionType<typeof actions.numberRequestStartAction>) => ({ confirmationAction, numberRequestAction })),
+    filter(({ confirmationAction }) => confirmationAction.payload),
    mergeMap(action =>
      from(generateNewNumber()).pipe(
        map(actions.numberRequestCompletedAction),
        //  catchError(error => of(actions.numberRequestErrorAction(error)))
      )
    )
  );
}
```
