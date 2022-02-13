import { useState, useRef, useLayoutEffect, ComponentClass } from "react";
import { reaction } from "dipole";

const EMPTY_ARR = [];
const reactionOptions = { autocommitSubscriptions: false };

export function useObserver<T>(fn: () => T): T {
  const [, triggerUpdate] = useState<any>(null);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  // don't use useMemo as it might be disposed
  const reactionRef = useRef(null);
  if (reactionRef.current === null) {
    const forceUpdate = () => triggerUpdate({});
    const reactionFn = () => fnRef.current();
    reactionRef.current = reaction(
      reactionFn,
      null,
      forceUpdate,
      reactionOptions
    );
  }

  // use layout effect to get subscriptions commited as soon as possible after render
  useLayoutEffect(() => {
    const r = reactionRef.current;
    r.commitSubscriptions();
    r.setOptions({ autocommitSubscriptions: true });
    return () => r.destroy();
  }, EMPTY_ARR);

  return reactionRef.current.run();
}

// see https://github.com/mobxjs/mobx-react-lite/blob/master/src/observer.ts
const hoistBlackList: any = {
  $$typeof: true,
  render: true,
  compare: true,
  type: true,
};

function copyStaticProperties(base: any, target: any) {
  Object.keys(base).forEach((key) => {
    if (!hoistBlackList[key]) {
      const descriptor = Object.getOwnPropertyDescriptor(base, key)!;
      Object.defineProperty(target, key, descriptor);
    }
  });
}

interface RenderFn extends Record<any, any> {
  (...args: any[]): JSX.Element | JSX.Element[];
  displayName?: string;
}

export function observer<T extends RenderFn>(component: T): T {
  const wrapped = function (props, contextOrRef) {
    return useObserver(() => component(props, contextOrRef));
  };

  copyStaticProperties(component, wrapped);

  wrapped.displayName = component.displayName || component.name;

  return wrapped as any;
}

function shouldConstruct(Component: Function) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

export function observerClass<T extends ComponentClass<any, any>>(
  Component: T
): T {
  if (!shouldConstruct(Component)) {
    throw new Error("observerClass must receive only class component");
  }

  // @ts-ignore
  const wrapped = class extends Component {
    _reaction = reaction(
      super.render,
      this,
      () => this.forceUpdate(),
      reactionOptions
    );

    componentWillUnmount() {
      if (super.componentWillUnmount) {
        super.componentWillUnmount();
      }
      this._reaction.destroy();
    }

    componentDidMount() {
      this._reaction.commitSubscriptions();
      this._reaction.setOptions({ autocommitSubscriptions: true });

      if (super.componentDidMount) {
        super.componentDidMount();
      }
    }

    render() {
      return this._reaction.run();
    }
  };

  wrapped.displayName = Component.displayName || Component.name;

  return wrapped;
}
