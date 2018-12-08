import { Observable, from, forkJoin, of } from 'rxjs';
import { combineEpics, Epic } from 'redux-observable';
import * as actions from '../actions'
import { ActionType, isOfType, getType } from 'typesafe-actions';
import { State } from '../reducers';
import { filter, map, mergeMap, take, tap, ignoreElements, switchMap, merge, flatMap, concat } from 'rxjs/operators';
import { generateNewNumber, generateHigherNewNumber } from '../services';

type Action = ActionType<typeof actions>;

const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
  return action$.pipe(
    filter(isOfType(getType(actions.numberRequestStartAction))),
        mergeMap(action =>
          forkJoin(
            from(generateNewNumber()),  
            from(generateHigherNewNumber()),  
          ).pipe(
            mergeMap((values) => ([actions.numberRequestCompletedAction(values[0]), actions.numberRequestCompletedAction(values[1])]))
          )
        )
      )    
}

export const rootEpic = combineEpics(getNumberEpic);
