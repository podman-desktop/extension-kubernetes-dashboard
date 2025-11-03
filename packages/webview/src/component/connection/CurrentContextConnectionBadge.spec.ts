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

import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ContextsHealthsInfo, CurrentContextInfo } from '@kubernetes-dashboard/channels';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import CurrentContextConnectionBadge from './CurrentContextConnectionBadge.svelte';

const statesMocks = new StatesMocks();

let currentContextMock: FakeStateObject<CurrentContextInfo, void>;
let contextsHealthsMock: FakeStateObject<ContextsHealthsInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();

  currentContextMock = new FakeStateObject();
  contextsHealthsMock = new FakeStateObject();

  statesMocks.reset();
  statesMocks.mock<CurrentContextInfo, void>('stateCurrentContextInfoUI', currentContextMock);
  statesMocks.mock<ContextsHealthsInfo, void>('stateContextsHealthsInfoUI', contextsHealthsMock);
});

describe('no context', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: undefined,
    });
  });

  test('no badges shown', async () => {
    currentContextMock.setData({
      contextName: undefined,
    });
    render(CurrentContextConnectionBadge);

    await tick();

    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('current context is reachable', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });
    contextsHealthsMock.setData({
      healths: [
        {
          contextName: 'ctx1',
          reachable: true,
          checking: false,
          offline: false,
        },
        {
          contextName: 'ctx2',
          reachable: false,
          checking: false,
          offline: false,
        },
      ],
    });
  });

  test('badge shows that there is a reachable context', async () => {
    render(CurrentContextConnectionBadge);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Connected');
  });

  test('badge is green', async () => {
    render(CurrentContextConnectionBadge);

    const status = screen.getByRole('status');
    expect(status.firstChild).toHaveClass('bg-(--pd-status-connected)');
  });

  test('no tooltip', async () => {
    render(CurrentContextConnectionBadge);

    expect(screen.queryByLabelText('tooltip')).toBeNull();
  });
});

describe('current context is not reachable', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });
    contextsHealthsMock.setData({
      healths: [
        {
          contextName: 'ctx1',
          reachable: false,
          checking: false,
          offline: false,
        },
        {
          contextName: 'ctx2',
          reachable: true,
          checking: false,
          offline: false,
        },
      ],
    });
  });

  test('badge shows that there is a non reachable context', async () => {
    render(CurrentContextConnectionBadge);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Cluster not reachable');
  });

  test('badge is gray', async () => {
    render(CurrentContextConnectionBadge);

    const status = screen.getByRole('status');
    expect(status.firstChild).toHaveClass('bg-(--pd-status-disconnected)');
  });

  test('tooltip', async () => {
    render(CurrentContextConnectionBadge);

    expect(screen.getByLabelText('tooltip')).toBeDefined();
  });
});

describe('current context is offline', () => {
  beforeEach(() => {
    currentContextMock.setData({
      contextName: 'ctx1',
    });
    contextsHealthsMock.setData({
      healths: [
        {
          contextName: 'ctx1',
          reachable: false,
          checking: false,
          offline: true,
        },
        {
          contextName: 'ctx2',
          reachable: true,
          checking: false,
          offline: false,
        },
      ],
    });
  });

  test('badge shows that there is an offline context', async () => {
    render(CurrentContextConnectionBadge);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Connection lost');
  });

  test('expect badges to be orange when offline', async () => {
    render(CurrentContextConnectionBadge);

    const status = screen.getByRole('status');
    expect(status.firstChild).toHaveClass('bg-(--pd-status-paused)');
  });

  test('expect tooltip when offline', async () => {
    render(CurrentContextConnectionBadge);

    const tooltip = screen.getByLabelText('tooltip');
    expect(tooltip).toHaveTextContent('connection lost, you can try to reconnect');
  });
});

test('spinner should be displayed when and only when the context connectivity is being checked', async () => {
  currentContextMock.setData({
    contextName: 'ctx1',
  });
  contextsHealthsMock.setData({
    healths: [
      {
        contextName: 'ctx1',
        reachable: false,
        checking: false,
        offline: true,
      },
      {
        contextName: 'ctx2',
        reachable: true,
        checking: false,
        offline: false,
      },
    ],
  });

  render(CurrentContextConnectionBadge);
  expect(screen.queryByLabelText('Loading')).toBeNull();

  // context is being checked
  contextsHealthsMock.setData({
    healths: [
      {
        contextName: 'ctx1',
        reachable: false,
        checking: true,
        offline: true,
      },
      {
        contextName: 'ctx2',
        reachable: true,
        checking: false,
        offline: false,
      },
    ],
  });

  await tick();
  screen.getByLabelText('Loading');

  // context is not being checked anymore
  contextsHealthsMock.setData({
    healths: [
      {
        contextName: 'ctx1',
        reachable: true,
        checking: false,
        offline: true,
      },
      {
        contextName: 'ctx2',
        reachable: true,
        checking: false,
        offline: false,
      },
    ],
  });

  await tick();
  expect(screen.queryByLabelText('Loading')).toBeNull();
});
