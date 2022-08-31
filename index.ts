import { useState, useRef, useMemo, useEffect, ComponentClass } from "react";
import { reaction, DebounceQueue, IReaction } from "dipole";

type AnyReaction = IReaction<any, any, any>;

const EMPTY_ARR = [];

const ABANDONED_RENDERER_CHECK_INTERVAL = 10_000;

let isSSR = false;

interface IOptions {
  isSSR?: boolean;
}

export function configure(options: IOptions) {
  if (options.isSSR !== undefined) {
    isSSR = !!options.isSSR;
  }
}

class DebounceQueueCheckStrategy {
  static isAvailable(): boolean {
    return true;
  }

  private _destroyCallback = (reactions: Set<AnyReaction>) => {
    reactions.forEach((reaction) => {
      reaction.destroy();
    });
  };

  private _destroyQueue = new DebounceQueue(
    this._destroyCallback,
    ABANDONED_RENDERER_CHECK_INTERVAL
  );

  add(_referencedObject: any, reaction: AnyReaction) {
    this._destroyQueue.add(reaction);
  }

  remove(_referencedObject: any, reaction: AnyReaction) {
    this._destroyQueue.remove(reaction);
  }
}

class FinalizationRegistryCheckStrategy {
  static isAvailable(): boolean {
    return typeof FinalizationRegistry !== "undefined";
  }

  private _registry = new FinalizationRegistry((reaction: AnyReaction) => {
    reaction.destroy();
  });

  add(referencedObject: any, reaction: AnyReaction) {
    this._registry.register(referencedObject, reaction, referencedObject);
  }

  remove(referencedObject: any, _reaction: AnyReaction) {
    this._registry.unregister(referencedObject);
  }
}

const abandonedRendererCheckStrategy =
  FinalizationRegistryCheckStrategy.isAvailable()
    ? new FinalizationRegistryCheckStrategy()
    : new DebounceQueueCheckStrategy();

class RetainedObject {
  static factory() {
    return new RetainedObject();
  }
}

export function useObserver<T>(fn: () => T): T {
  if (isSSR) {
    return fn();
  }

  const [, triggerUpdate] = useState<any>(null);
  const [retainedObject] = useState(RetainedObject.factory);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  const r = useMemo(() => {
    const forceUpdate = () => triggerUpdate({});
    const reactionFn = () => fnRef.current();
    return reaction(reactionFn, null, forceUpdate);
  }, EMPTY_ARR);

  const isEffectCleanupExecuted = useRef(false);

  abandonedRendererCheckStrategy.add(retainedObject, r);

  useEffect(() => {
    abandonedRendererCheckStrategy.remove(retainedObject, r);

    if (isEffectCleanupExecuted.current) {
      r.commitSubscriptions();
    }

    return () => {
      r.unsubscribeFromSubscriptions();
      isEffectCleanupExecuted.current = true;
    };
  }, EMPTY_ARR);

  return r.run();
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
  const wrapped: T = class extends Component {
    _retainedObject = new RetainedObject();

    _reaction = reaction(super.render, this, () => this.forceUpdate());

    componentWillUnmount() {
      if (super.componentWillUnmount) {
        super.componentWillUnmount();
      }

      this._reaction.destroy();
    }

    componentDidMount() {
      abandonedRendererCheckStrategy.remove(
        this._retainedObject,
        this._reaction
      );

      if (super.componentDidMount) {
        super.componentDidMount();
      }
    }

    render() {
      if (isSSR) {
        return super.render();
      }

      abandonedRendererCheckStrategy.add(this._retainedObject, this._reaction);

      return this._reaction.run();
    }
  };

  wrapped.displayName = Component.displayName || Component.name;

  return wrapped;
}
