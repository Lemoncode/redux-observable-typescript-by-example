# 04 Cancel asynchronous tasks

# Summary

In some scenarios we want the user to be able to cancel some lengthy asynchronous requests.

For instance: A given user makes a lengthy request (e.g. takes 5 secs) in the mean time he wants
to cancel the request (or navigate away) and we want the request no to be served.

How can we achieve a behavior like this? _takeUntil_ is your friend.


# Steps

- We will take as starting point *03_throttle* let's copy the content of that project 
and execute from bash / cmd the following command:

```bash
npm install
```

- This time we will create a new action called CANCEL_ONGOING_NUMBER_REQUEST:

_./src/common/index.ts_

```diff
export const actionIds = {
  GET_NUMBER_REQUEST_START: '[0] Request a new number to the NumberGenerator async service.',
  GET_NUMBER_REQUEST_COMPLETED: '[1] NumberGenerator async service returned a new number.',
+ CANCEL_ONGOING_NUMBER_REQUEST: '[2] Cancelling and on going number request',  
}

export interface BaseAction {
  type : string;
  payload: any;
}
```

- Now let's create the action creator that will generate the cancel action (append to the body of the
action index file):

_./src/actions/index.ts_

```typescript
export const cancelOnGoingNumberRequestAction = createAction(
                                              actionIds.CANCEL_ONGOING_NUMBER_REQUEST, 
                                              resolve => () => resolve());
```

- Let's create add a new button in the _my-number-setter_ component that will allow us
cancelling the number_request, and create the callback prop to fire the action.

_./src/components/setter/my-number-setter.component.ts_

```diff
import * as React from 'react';

interface Props {
  onRequestNewNumber: () => void;
+  onCancelRequest: () => void;
}

export const MyNumberSetterComponent = (props : Props) =>
+ <>
  <button onClick={props.onRequestNewNumber}>Request new number</button>
+ <button onClick={props.onCancelRequest}>Cancel number request</button> 
+ </>  
```

- Let's configure the container.

_./src/components/setter/my-number-setter.container.ts_

```diff
- import {numberRequestStartAction} from '../../../actions';
+ import {numberRequestStartAction, cancelOnGoingNumberRequestAction} from '../../../actions';

const mapStateToProps = (state : State) => ({
})

const mapDispatchToProps = (dispatch) => ({
  onRequestNewNumber: () => dispatch(numberRequestStartAction()),
+  onCancelRequest: () => dispatch(cancelOnGoingNumberRequestAction()),
})
```

- Let's remove the _debounce_ command on the _getNumberEpic_ saga.

_./src/epics/index.ts_

```diff
const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
  return action$.pipe(
    filter(isOfType(getType(actions.numberRequestStartAction))),
-    debounceTime(1000),    
    switchMap(action =>
        from(generateNewNumber()).pipe(
          map(actions.numberRequestCompletedAction),
          //  catchError(error => of(actions.numberRequestErrorAction(error)))
        )
      )
    )
}
```

- Let's add some extra sleep timeout to the number request service.

_./src/services/number-generator.service.ts_

```diff
export const generateNewNumber = () : Promise<number> => {
  const promise = new Promise<number>((resolve) => {
    setTimeout(() => {
      initialNumber += 1;
      resolve(initialNumber)
-    }, 500)
+    }, 3000)
  });
```

- Now in the _generateNewNumber_ epic we can setup a race between the *GET_NUMBER_REQUEST_START* and the
*CANCEL_ONGOING_NUMBER_REQUEST*, if cancel wins it won't propagate the new number request
result.

_./src/services/number-generator.service.ts_

```diff
- import { filter, map, switchMap, } from 'rxjs/operators';
+ import { filter, map, switchMap, takeUntil, } from 'rxjs/operators';

// (...)

const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
  return action$.pipe(
    filter(isOfType(getType(actions.numberRequestStartAction))),
    switchMap(action =>
        from(generateNewNumber()).pipe(
          map(actions.numberRequestCompletedAction),
+          takeUntil(action$.ofType(getType(actions.cancelOnGoingNumberRequestAction))),          
          //  catchError(error => of(actions.numberRequestErrorAction(error)))
        )
      )
    )
}
```



