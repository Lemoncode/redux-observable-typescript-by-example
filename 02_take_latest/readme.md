# 02 Take Latest

# Summary

In some cases when a given user fires several requests near at the same time, you just only want the latest one
to be processed and rest to be cancelled, how can we do that? _switchMap_ will just cancel all the pending 
to be resolved observables and only return the latest being processed.


# Steps

- We will take as starting point *01_hello_observable* let's copy the content of that project 
and execute from bash / cmd the following command:

```bash
npm install
```

- Let's jump into the _epics_ folde, open the _index_ file and replace the _mergeMap_ with a _switchMap_ call.

```diff
import { Observable, from } from 'rxjs';
import { combineEpics, Epic } from 'redux-observable';
import * as actions from '../actions'
import { ActionType, isOfType, getType } from 'typesafe-actions';
import { State } from '../reducers';
- import { filter, map, mergeMap } from 'rxjs/operators';
+ import { filter, map, switchMap } from 'rxjs/operators';
import { generateNewNumber } from '../services';

type Action = ActionType<typeof actions>;

const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
  return action$.pipe(
    filter(isOfType(getType(actions.numberRequestStartAction))),
-        mergeMap(action =>
+        switchMap(action =>
        from(generateNewNumber()).pipe(
          map(actions.numberRequestCompletedAction),
          //  catchError(error => of(actions.numberRequestErrorAction(error)))
        )
      )
    )
}

export const rootEpic = combineEpics(getNumberEpic);
```


That's all, if we run the app and click several times on the click button we can check that only the latest 
request that was being processed is passed to the reducer (other pending promises are discarded).

- To give a try:

```bash
npm start
```

And just click quite quick several times on the _generate number_ button.