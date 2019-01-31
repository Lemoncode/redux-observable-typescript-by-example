import { Observable, from } from 'rxjs';
import { combineEpics, Epic } from 'redux-observable';
import * as actions from '../actions'
import { ActionType, isOfType, getType } from 'typesafe-actions';
import { State } from '../reducers';
import { filter, map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { generateNewNumber } from '../services';

type Action = ActionType<typeof actions>;

const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
  const numberRequestStartAction$ = action$.pipe(filter(isOfType(getType(actions.numberRequestStartAction))));
  const numberRequestUserConfirmationAction$ = action$.pipe(filter(isOfType(getType(actions.numberRequestUserConfirmationAction))));

  return numberRequestUserConfirmationAction$.pipe(
    withLatestFrom(numberRequestStartAction$, (
      confirmationAction: ActionType<typeof actions.numberRequestUserConfirmationAction>,
      numberRequestAction: ActionType<typeof actions.numberRequestStartAction>) => ({ confirmationAction, numberRequestAction })),
    filter(({ confirmationAction }) => confirmationAction.payload),
    mergeMap(action =>
      from(generateNewNumber()).pipe(
        map(actions.numberRequestCompletedAction),
        //  catchError(error => of(actions.numberRequestErrorAction(error)))
      )
    )
  )
}

export const rootEpic = combineEpics(getNumberEpic);
