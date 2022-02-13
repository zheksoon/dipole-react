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

ReactDOM.render(
  <Counter model={counterModel} />,
  document.getElementById("root")
);
```

Example with `useObserver`:

```jsx
import { useObserver } from "dipole-react";

function Counter({ model }) {
  return useObserver(() => {
    return (
      <div>
        Counter is: {count}
        <button onClick={model.inc}>+</button>
        <button onClick={model.dec}>-</button>
        <button onClick={model.reset}>Reset</button>
      </div>
    );
  });
}
```

# API

## observer(component)

Creates a reactive version of React component that subscribes to observable/computed values accessed in the component and re-renders on their changes.

From `dipole-react` version 2.0.0 the function works only with functional components. For class components see [observerClass](#observerClass)

**Usage**:

```tsx
// With anonimous component
const Component = observer((props) => <SomeJSX />);

// With named function component (better for React DevTools):
const Component = observer(function Component(props) {
  return <SomeJSX />;
});

// Or, just add `displayName` to it:
Component.displayName = "Component";

// For `React.forwardRef` components it must be applied to render function first:
const RefForwardingComponent = React.forwardRef(
  observer((props, ref) => {
    return <SomeJSX ref={ref} />;
  })
);

// The same goes for `React.memo` components:
const MemoComponent = React.memo(
  observer((props) => {
    return <SomeJSX />;
  })
);
```

## useObserver(observerFn)

Hook-style version of `observer`.
Executes `observerFn`, tracks all accesses to observable/computed values inside of it and returns its result.

Usual React hooks (`useCallback`, `useMemo`, etc) can be used both inside and outside of `observerFn`, but if you use ESLint, you might want to write them outside in order to make it happy.

**Usage**:

```tsx
// Can be used to wrap whole render function
function Component({ model }) {
  return useObserver(() => {
    return <SomeJSX value={model.value} />;
  });
}

// Or wrap only necessarily observable access
function Component({ model }) {
  const value = useObserver(() => model.value);

  return <SomeJSX value={value} />;
}

// Can be used inside `React.memo` and `React.forwardRef` components as well
const MemoComponent = React.memo((props) => {
  return useObserver(() => {
    return <SomeJSX />;
  });
});

const RefForwardingComponent = React.forwardRef((props, ref) => {
  return useObserver(() => {
    return <SomeJSX ref={ref} />;
  });
});
```

## observerClass(classComponent)

Creates a reactive version of `classComponent`. The argument must be of `React.Component` or `React.PureComponent` type.

**Usage**:

```tsx
const Component = obseverClass(
  class Component extends React.Component {
    render() {
      const { model } = this.props;

      return <SomeJSX value={model.value} />;
    }
  }
);
```

# License

MIT

# Author

Eugene Daragan
