import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MyNumberBrowserContainer, MyNumberSetterContainer } from './components';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import { createEpicMiddleware } from 'redux-observable';
import { rootEpic } from './epics';
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

epicMiddleware.run(rootEpic);

ReactDOM.render(
  <Provider store={store}>
    <>
      <MyNumberSetterContainer />
      <MyNumberBrowserContainer />
    </>
  </Provider>,
  document.getElementById('root'));
