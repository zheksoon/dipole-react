import { useState, useMemo, useEffect } from "react";
import { reaction } from "dipole";

function shouldConstruct(Component: Function) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

const EMPTY_ARR = [] as const;

function observerFunction<P>(component: React.FC<P>) {
  const wrapped = function (props: P, context?: any) {
    const [, triggerUpdate] = useState<any>(null);

    const r = useMemo(() => {
      return reaction(component, null, () => triggerUpdate({}));
    }, EMPTY_ARR);

    useEffect(() => {
      return () => r.destroy();
    }, EMPTY_ARR);

    return r.run(props, context);
  };
  wrapped.displayName = component.displayName || component.name;
  return wrapped;
}

function observerClass<P, S>(Component: React.ComponentClass<P, S>) {
  const wrapped: React.ComponentClass<P, S> = class extends Component {
    _reaction = reaction(super.render, this, () => this.forceUpdate());

    componentWillUnmount() {
      if (super.componentWillUnmount) {
        super.componentWillUnmount();
      }
      this._reaction.destroy();
    }

    render() {
      return this._reaction.run();
    }
  };
  wrapped.displayName = Component.displayName || Component.name;
  return wrapped;
}

export function observer<T extends Function>(
  component: T
): T extends React.FC<infer P>
  ? React.FC<P>
  : T extends React.ComponentClass<infer P, infer S>
  ? React.ComponentClass<P, S>
  : never {
  if (shouldConstruct(component)) {
    return observerClass(component as any) as any;
  } else {
    return observerFunction(component as any) as any;
  }
}

export function useObservable<T>(getter: () => T): T {
  const [, triggerUpdate] = useState(null);

  const r = useMemo(() => {
    return reaction(getter, null, () => triggerUpdate({}));
  }, EMPTY_ARR);

  useEffect(() => {
    return () => r.destroy();
  }, EMPTY_ARR);

  return r.run();
}
