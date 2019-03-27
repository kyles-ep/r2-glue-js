import { Service, Callback, CallSource } from '@readium/glue-rpc';

import { EventHandlingMessage, IAddEventListenerOptions } from './interface';
import { marshalEvent } from '@readium/glue-rpc/lib/marshaling';
import { resolveEventTargetSelector } from '@readium/glue-rpc/lib/util';

let lastUsedID = 0;

export class EventHandler extends Service {
  constructor(source: CallSource) {
    super(source);
    source.bind(EventHandlingMessage.AddEventListener, this._addEventListener);
    source.bind(EventHandlingMessage.RemoveEventListener, this._removeEventListener);
  }

  private registeredEventListenerRemovers: { [id: number]: Function[] } = {};

  private async _addEventListener(
    callback: Callback,
    target: string,
    type: string,
    properties: string[],
    options: IAddEventListenerOptions,
  ): Promise<number> {
    const targets = resolveEventTargetSelector(target);

    const listenerRemovers = targets.map((resolvedTarget: EventTarget) => {
      const listener: EventListener = (event) => {
        if (options.preventDefault) {
          event.preventDefault();
        }
        if (options.stopPropagation) {
          event.stopPropagation();
        }
        if (options.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        }

        callback(marshalEvent(event, properties));
      };
      resolvedTarget.addEventListener(type, listener);
      return () => {
        resolvedTarget.removeEventListener(type, listener);
      };
    });

    lastUsedID = lastUsedID + 1;
    this.registeredEventListenerRemovers[lastUsedID] = listenerRemovers;
    return lastUsedID;
  }

  private async _removeEventListener({  }: Callback, listenerID: number): Promise<void> {
    (this.registeredEventListenerRemovers[listenerID] || []).forEach((remove) => remove());
  }
}
