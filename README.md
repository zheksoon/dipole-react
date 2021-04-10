# dipole-react

React bindings for [dipole](https://github.com/zheksoon/dipole) observable library.

The bindings require React from version 16.8.0, when hooks were introduced. Hooks binding implementation is automatically used for functional components, though class-based components are supported too.

# Example

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

ReactDOM.render(<Counter model={model} />, document.getElementById("root"));
```

# API

## observer(component)

Creates reactive version of React component that subscribes to observable/computed values accessed in render function/method and re-renders on their changes.

For functional components hooks-based implementation is used.

For class components, class-based implementation is used.

Note: in order to see component names in React devtools, be sure to pass named component to `observer` or set `displayName` on the resulting reactive component.

# License

MIT

# Author

Eugene Daragan
