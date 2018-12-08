# 03 Throttle

# Summary

In this sample we are going to continue exploring redux saga helper effects.

Now it's time to evaluate _debounce_, let's imagine the following scenario:

A given user is typing on a typeahead, we don't want to fire a request on
every key stroke, we want to add some delay between each keystroke to ensure
the user has typed some meaninful text.

By using debounce it will wait the time we setup then, execute only the
latest call.


# Steps

- We will take as starting point *01_hello_observable* let's copy the content of that project 
and execute from bash / cmd the following command:

```bash
npm install
```

- Let's jump into the _epics_ folder, open the _index_ file and replace the _switchMap_ with a _throttle_ call.

```diff
import { Observable, from } from 'rxjs';
import { combineEpics, Epic } from 'redux-observable';
import * as actions from '../actions'
import { ActionType, isOfType, getType } from 'typesafe-actions';
import { State } from '../reducers';
- import { filter, map, mergeMap } from 'rxjs/operators';
+ import { filter, map, switchMap, debounceTime } from 'rxjs/operators';
import { generateNewNumber } from '../services';

type Action = ActionType<typeof actions>;

const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
  return action$.pipe(
    filter(isOfType(getType(actions.numberRequestStartAction))),
+        debounceTime(1000),
        switchMap(action =>
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