/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { RpcChannel } from '@kubernetes-dashboard/rpc';
import { AbsDispatcherObjectImpl, type DispatcherObject } from '/@/dispatcher/util/dispatcher-object';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { StateSubscriber } from '/@/subscriber/state-subscriber';

class TestInfo {
  value: number;
}

class TestDispatcher extends AbsDispatcherObjectImpl<void, TestInfo> implements DispatcherObject<void> {
  private value: number = 0;

  constructor() {
    super(new RpcChannel<TestInfo>('test-channel'));
  }

  getData(): TestInfo {
    return {
      value: this.value,
    };
  }

  setValue(value: number): void {
    this.value = value;
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('channel data and getData', async () => {
  const dispatcher = new TestDispatcher();
  expect(dispatcher.channelName).toBe('test-channel');
  expect(dispatcher.getData()).toEqual({ value: 0 });
});

test('dispatch is called after debounce timeout', async () => {
  const dispatcher = new TestDispatcher();
  const subscriber = {
    dispatch: vi.fn(),
  } as unknown as StateSubscriber;
  vi.mocked(subscriber.dispatch).mockResolvedValue();
  dispatcher.setValue(1);
  await dispatcher.dispatch(subscriber);

  vi.advanceTimersByTime(90);
  // still before debounce timer
  expect(subscriber.dispatch).not.toHaveBeenCalled();

  // after debounce timer
  vi.advanceTimersByTime(20);
  expect(subscriber.dispatch).toHaveBeenCalledOnce();
  expect(subscriber.dispatch).toHaveBeenCalledWith(expect.anything(), { value: 1 });
});

test('dispatch is not called several times during throttle timeout', async () => {
  const dispatcher = new TestDispatcher();
  const subscriber = {
    dispatch: vi.fn(),
  } as unknown as StateSubscriber;
  vi.mocked(subscriber.dispatch).mockResolvedValue();

  // call several times
  dispatcher.setValue(1);
  await dispatcher.dispatch(subscriber);
  dispatcher.setValue(2);
  await dispatcher.dispatch(subscriber);
  dispatcher.setValue(3);
  await dispatcher.dispatch(subscriber);

  // wait debounce timer
  vi.advanceTimersByTime(110);
  // only one call from the first burst is done, with the latest value
  expect(subscriber.dispatch).toHaveBeenCalledOnce();
  expect(subscriber.dispatch).toHaveBeenCalledWith(expect.anything(), { value: 3 });

  vi.advanceTimersByTime(100);
  // throttle timer is now over, send another burst of dispatch calls
  dispatcher.setValue(4);
  await dispatcher.dispatch(subscriber);
  dispatcher.setValue(5);
  await dispatcher.dispatch(subscriber);
  dispatcher.setValue(6);
  await dispatcher.dispatch(subscriber);

  vi.advanceTimersByTime(110);
  // only othe latest call from the second burst is done
  expect(subscriber.dispatch).toHaveBeenCalledTimes(2);
  expect(subscriber.dispatch).toHaveBeenCalledWith(expect.anything(), { value: 3 });
  expect(subscriber.dispatch).toHaveBeenCalledWith(expect.anything(), { value: 6 });
});

test('dispatch with several subscribers have different debounce timers', async () => {
  const dispatcher = new TestDispatcher();
  const subscriber1 = {
    dispatch: vi.fn(),
  } as unknown as StateSubscriber;
  vi.mocked(subscriber1.dispatch).mockResolvedValue();
  const subscriber2 = {
    dispatch: vi.fn(),
  } as unknown as StateSubscriber;
  vi.mocked(subscriber2.dispatch).mockResolvedValue();
  await dispatcher.dispatch(subscriber1);
  await dispatcher.dispatch(subscriber2);

  // wait debounce timers
  vi.advanceTimersByTime(110);
  // both subscribers have been called
  expect(subscriber1.dispatch).toHaveBeenCalledOnce();
  expect(subscriber1.dispatch).toHaveBeenCalledWith(expect.anything(), { value: 0 });
  expect(subscriber2.dispatch).toHaveBeenCalledOnce();
  expect(subscriber2.dispatch).toHaveBeenCalledWith(expect.anything(), { value: 0 });
});

test('cleanupSubscriber when no timers are set', () => {
  const dispatcher = new TestDispatcher();
  const subscriber = {} as unknown as StateSubscriber;
  expect(vi.getTimerCount()).toBe(0);
  dispatcher.cleanupSubscriber(subscriber);
  expect(vi.getTimerCount()).toBe(0);
});

test('cleanupSubscriber when timers are set for one subscriber', async () => {
  const dispatcher = new TestDispatcher();
  const subscriber = {
    dispatch: vi.fn(),
  } as unknown as StateSubscriber;
  vi.mocked(subscriber.dispatch).mockResolvedValue();
  await dispatcher.dispatch(subscriber);
  expect(vi.getTimerCount()).toBe(2);
  dispatcher.cleanupSubscriber(subscriber);
  expect(vi.getTimerCount()).toBe(0);
});

test('cleanupSubscriber when timers are set for several subscribers', async () => {
  const dispatcher = new TestDispatcher();
  const subscriber1 = {
    dispatch: vi.fn(),
  } as unknown as StateSubscriber;
  vi.mocked(subscriber1.dispatch).mockResolvedValue();
  const subscriber2 = {
    dispatch: vi.fn(),
  } as unknown as StateSubscriber;
  vi.mocked(subscriber2.dispatch).mockResolvedValue();

  await dispatcher.dispatch(subscriber1);
  await dispatcher.dispatch(subscriber2);
  expect(vi.getTimerCount()).toBe(4);
  dispatcher.cleanupSubscriber(subscriber1);
  expect(vi.getTimerCount()).toBe(2);
  dispatcher.cleanupSubscriber(subscriber2);
  expect(vi.getTimerCount()).toBe(0);
});
