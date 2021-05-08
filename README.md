# dipole-react

React bindings for [dipole](https://github.com/zheksoon/dipole) observable library.

The bindings require React from version 16.8.0, when hooks were introduced. Hooks binding implementation is automatically used for functional components, though class-based components are supported too.

# Usage

In oreder to make component rerender on observable/computed value change, you need to wrap it into `observer` funciton. Alternatively, you can use `useObservable` hook to achieve the same behaviour without wrapping the component.

# Example

[Open in codesandbox](https://codesandbox.io/s/dipole-react-example-counter-o4w64)

```jsx
import React from "react";
import ReactDOM from "react-dom";
import { action, observable, makeObservable } from "dipole";
import { observer } from "dipole-react";

class CounterModel {
  count = observable.prop(0);

  constructor() {
    makeObservable(this);
  }

  inc = action(() => (this.count += 1));
  dec = action(() => (this.count -= 1));
  reset = action(() => (this.count = 0));
}

const Counter = observer(({ model }) => {
  return (
    <div>
      Counter is: {model.count}
      <button onClick={model.inc}>+</button>
      <button onClick={model.dec}>-</button>
      <button onClick={model.reset}>Reset</button>
    </div>
  );
});

const counterModel = new CounterModel();

ReactDOM.render(<Counter model={counterModel} />, document.getElementById("root"));
```

Example with `useObservable`:

```jsx
const Counter = ({ model }) => {
  const count = useObservable(() => model.count);
  return (
    <div>
      Counter is: {count}
      <button onClick={model.inc}>+</button>
      <button onClick={model.dec}>-</button>
      <button onClick={model.reset}>Reset</button>
    </div>
  );
};
```

# API

## observer(component)

Creates reactive version of React component that subscribes to observable/computed values accessed in render function/method and re-renders on their changes.

For functional components hooks-based implementation is used.

For class components, class-based implementation is used.

Note: in order to see component names in React devtools, be sure to pass named component to `observer` or set `displayName` on the resulting reactive component.

## useObservable(getter)

Subscribes component to all observable/computed values accessed in `getter` function and return its execution result. Typical usage:

```js
const [a, b, c] = useObservable(() => [model.a, model.b, model.c]);
```

# License

MIT

# Author

Eugene Daragan
