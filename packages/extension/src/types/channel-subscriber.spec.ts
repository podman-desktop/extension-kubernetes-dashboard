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
import { ChannelSubscriber } from './channel-subscriber';

const originalConsoleDebug = console.debug;

beforeEach(() => {
  console.warn = vi.fn();
  vi.resetAllMocks();
});

afterEach(() => {
  console.warn = originalConsoleDebug;
});

test('happy path', async () => {
  const channel = 'channel1';
  const uid = 1;
  const subscriber = new ChannelSubscriber();
  await subscriber.resetChannelSubscribers(channel);
  expect(subscriber.hasSubscribers(channel)).toBeFalsy();
  await subscriber.subscribeToChannel(channel, uid);
  expect(subscriber.hasSubscribers(channel)).toBeTruthy();
  await subscriber.unsubscribeFromChannel(channel, uid);
  expect(subscriber.hasSubscribers(channel)).toBeFalsy();
  expect(console.warn).not.toHaveBeenCalled();
});

test('subscribe makes onSubscribe emit an event', async () => {
  const channel = 'channel1';
  const uid = 1;
  const subscriber = new ChannelSubscriber();
  const listener = vi.fn();
  subscriber.onSubscribe(listener);
  await subscriber.resetChannelSubscribers(channel);
  await subscriber.subscribeToChannel(channel, uid);
  expect(listener).toHaveBeenCalledWith(channel);
});

describe('unexpected paths are safe', () => {
  test('reset is not called', async () => {
    const channel = 'channel1';
    const uid = 1;
    const subscriber = new ChannelSubscriber();
    expect(subscriber.hasSubscribers(channel)).toBeFalsy();
    await subscriber.subscribeToChannel(channel, uid);
    expect(subscriber.hasSubscribers(channel)).toBeTruthy();
    await subscriber.unsubscribeFromChannel(channel, uid);
    expect(subscriber.hasSubscribers(channel)).toBeFalsy();
  });

  test('reset and subscribe are not called', async () => {
    const channel = 'channel1';
    const uid = 1;
    const subscriber = new ChannelSubscriber();
    await subscriber.unsubscribeFromChannel(channel, uid);
    expect(subscriber.hasSubscribers(channel)).toBeFalsy();
  });
});

describe('assertions', () => {
  test('subscribing to the same channel with the same UID', async () => {
    const channel = 'channel1';
    const uid = 1;
    const subscriber = new ChannelSubscriber();
    await subscriber.subscribeToChannel(channel, uid);
    await subscriber.subscribeToChannel(channel, uid);
    expect(console.warn).toHaveBeenCalled();
  });

  test('subscribing to different channels with the same UID', async () => {
    const channel1 = 'channel1';
    const channel2 = 'channel2';
    const uid = 1;
    const subscriber = new ChannelSubscriber();
    await subscriber.subscribeToChannel(channel1, uid);
    await subscriber.subscribeToChannel(channel2, uid);
    expect(console.warn).not.toHaveBeenCalled();
  });

  test('unsubscribing from a non-subscribed subscription', async () => {
    const channel = 'channel1';
    const uid1 = 1;
    const uid2 = 2;
    const subscriber = new ChannelSubscriber();
    await subscriber.subscribeToChannel(channel, uid1);
    await subscriber.unsubscribeFromChannel(channel, uid2);
    expect(console.warn).toHaveBeenCalled();
  });
});
