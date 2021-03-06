import {BaseAction, actionIds} from '../common';
import { createAction } from "typesafe-actions";

export const numberRequestStartAction = createAction(
                                            actionIds.GET_NUMBER_REQUEST_START, 
                                            resolve => () => resolve(null));

export const numberRequestCompletedAction = createAction(
                                              actionIds.GET_NUMBER_REQUEST_COMPLETED, 
                                              resolve => (numberGenerated : number) => resolve(numberGenerated));

