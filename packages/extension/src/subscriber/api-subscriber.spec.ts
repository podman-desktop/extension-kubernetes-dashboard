/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
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

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiSubscriber } from '/@/subscriber/api-subscriber';
import { RpcChannel } from '@kubernetes-dashboard/rpc';

const originalConsoleDebug = console.debug;

beforeEach(() => {
  console.warn = vi.fn();
  vi.resetAllMocks();
});

afterEach(() => {
  console.warn = originalConsoleDebug;
});

test('happy path', async () => {
  const channel = new RpcChannel('channel1');
  const subscriber = new ApiSubscriber();
  await subscriber.resetApiSubscribers(channel.name);
  expect(subscriber.hasSubscribers(channel.name)).toBeFalsy();
  const disposable = subscriber.subscribe(channel, {}, () => {});
  expect(subscriber.hasSubscribers(channel.name)).toBeTruthy();
  disposable.dispose();
  expect(subscriber.hasSubscribers(channel.name)).toBeFalsy();
  expect(console.warn).not.toHaveBeenCalled();
});

test('subscribe makes onSubscribe emit an event', async () => {
  const channel = new RpcChannel('channel1');
  const subscriber = new ApiSubscriber();
  const listener = vi.fn();
  subscriber.onSubscribe(listener);
  await subscriber.resetApiSubscribers(channel.name);
  subscriber.subscribe(channel, {}, () => {});
  expect(listener).toHaveBeenCalledWith(channel.name);
});

describe('unexpected paths are safe', () => {
  test('reset is not called', async () => {
    const channel = new RpcChannel('channel1');
    const subscriber = new ApiSubscriber();
    expect(subscriber.hasSubscribers(channel.name)).toBeFalsy();
    const disposable = subscriber.subscribe(channel, {}, () => {});
    expect(subscriber.hasSubscribers(channel.name)).toBeTruthy();
    disposable.dispose();
    expect(subscriber.hasSubscribers(channel.name)).toBeFalsy();
  });
});

test('subscriptions', () => {
  const channel1 = new RpcChannel('channel1');
  const channel2 = new RpcChannel('channel2');
  const subscriber = new ApiSubscriber();

  expect(subscriber.getSubscriptions(channel1.name)).toEqual([]);
  expect(subscriber.getSubscriptions(channel2.name)).toEqual([]);

  subscriber.subscribe(
    channel1,
    {
      option1: 'option1a',
    },
    () => {},
  );
  subscriber.subscribe(
    channel1,
    {
      option1: 'option1b',
    },
    () => {},
  );
  subscriber.subscribe(
    channel1,
    {
      option1: 'option1b',
    },
    () => {},
  );
  subscriber.subscribe(
    channel2,
    {
      option2: 'option2',
    },
    () => {},
  );
  expect(subscriber.getSubscriptions(channel1.name)).toEqual([
    {
      option1: 'option1a',
    },
    {
      option1: 'option1b',
    },
  ]);
  expect(subscriber.getSubscriptions(channel2.name)).toEqual([
    {
      option2: 'option2',
    },
  ]);
});

test('dispatch', async () => {
  const channel1 = new RpcChannel('channel1');
  const channel2 = new RpcChannel('channel2');
  const subscriber = new ApiSubscriber();

  expect(subscriber.getSubscriptions(channel1.name)).toEqual([]);
  expect(subscriber.getSubscriptions(channel2.name)).toEqual([]);

  const listener1a: (data: unknown) => void = vi.fn();
  const listener1b: (data: unknown) => void = vi.fn();
  const listener1c: (data: unknown) => void = vi.fn();
  const listener2: (data: unknown) => void = vi.fn();
  subscriber.subscribe(
    channel1,
    {
      option1: 'option1a',
    },
    listener1a,
  );
  subscriber.subscribe(
    channel1,
    {
      option1: 'option1b',
    },
    listener1b,
  );
  subscriber.subscribe(
    channel1,
    {
      option1: 'option1b',
    },
    listener1c,
  );
  subscriber.subscribe(
    channel2,
    {
      option2: 'option2',
    },
    listener2,
  );
  await subscriber.dispatch(channel1, { data: 'data' });
  expect(listener1a).toHaveBeenCalledWith({ data: 'data' });
  expect(listener1b).toHaveBeenCalledWith({ data: 'data' });
  expect(listener1c).toHaveBeenCalledWith({ data: 'data' });
  expect(listener2).not.toHaveBeenCalled();

  vi.clearAllMocks();
  await subscriber.dispatch(channel2, { data: 'data' });
  expect(listener2).toHaveBeenCalledWith({ data: 'data' });
  expect(listener1a).not.toHaveBeenCalled();
  expect(listener1b).not.toHaveBeenCalled();
  expect(listener1c).not.toHaveBeenCalled();
});
