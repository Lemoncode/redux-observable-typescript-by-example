import { Observable, from } from 'rxjs';
import { combineEpics, Epic } from 'redux-observable';
import * as actions from '../actions'
import { ActionType, isOfType, getType } from 'typesafe-actions';
import { State } from '../reducers';
import { filter, map, switchMap } from 'rxjs/operators';
import { generateNewNumber } from '../services';

type Action = ActionType<typeof actions>;

const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
  return action$.pipe(
    filter(isOfType(getType(actions.numberRequestStartAction))),
    switchMap(action =>
        from(generateNewNumber()).pipe(
          map(actions.numberRequestCompletedAction),
          //  catchError(error => of(actions.numberRequestErrorAction(error)))
        )
      )
    )
}

export const rootEpic = combineEpics(getNumberEpic);
