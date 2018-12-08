# 05 All

# Summary

In this sample we are going to learn how to wait for multiple observables to be resolved.

Let's imagine the following scenario:

Before letting the user filter a grid by some given criterias you need to ensure that several endpoints has returned you filtering enumerations (e.g. an end point returns you a list of countries, another end point returns you the list of available organization units...). Is there a way to wait for several async requests to be completed?



# Steps

- We will take as starting point *01_hello_observable* let's copy the content of that project 
and execute from bash / cmd the following command:

```bash
npm install
```

- We are going to create a new service called *higher_number_generator.service.ts* this asynchronous service
will generate number above 100.

_./src/services/higher-number-generator.service.ts_

```typescript
let initialNumber = 100;

export const generateHigherNewNumber = () : Promise<number> => {
  const promise = new Promise<number>((resolve) => {
    setTimeout(() => {
      initialNumber += 1;
      resolve(initialNumber)
    }, 1500)
  });

  return promise;
}
```

- Let's add this new service to the barrel.

_./src/services/index.ts_

```diff
export * from './number-generator.service';
+ export * from './higher-number-generator.service';
```

- Now in the epic we can fire both ajax request in paralell and then execute two actions.

_./src/epics/index.ts_

```diff
const getNumberEpic: Epic<Action, Action, State> = (action$, store) => {
  return action$.pipe(
    filter(isOfType(getType(actions.numberRequestStartAction))),
        mergeMap(action =>
-        from(generateNewNumber()).pipe(
-          map(actions.numberRequestCompletedAction),
-          //  catchError(error => of(actions.numberRequestErrorAction(error)))
-        )
+          forkJoin(
+            from(generateNewNumber()),  
+            from(generateHigherNewNumber()),  
+          ).pipe(
+            mergeMap((values) => ([actions.numberRequestCompletedAction(values[0]), actions.numberRequestCompletedAction(values[1])]))
+          )
      )
    )
}
```
