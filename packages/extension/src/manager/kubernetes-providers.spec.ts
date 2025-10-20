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
import { KubernetesProvidersManager } from '/@/manager/kubernetes-providers';
import type { ConnectionFactory, ConnectionFactoryDetails } from '@podman-desktop/api';
import { provider } from '@podman-desktop/api';
import { Disposable } from '@kubernetes-dashboard/channels';

let manager: KubernetesProvidersManager;
let onDidSetDisposable: Disposable;
let onDidUnsetDisposable: Disposable;
let onDidSetDispose: () => void;
let onDidUnsetDispose: () => void;

beforeEach(() => {
  vi.resetAllMocks();
  onDidSetDispose = vi.fn();
  onDidUnsetDispose = vi.fn();
  onDidSetDisposable = Disposable.create(onDidSetDispose);
  onDidUnsetDisposable = Disposable.create(onDidUnsetDispose);
  vi.mocked(provider.onDidSetConnectionFactory).mockReturnValue(onDidSetDisposable);
  vi.mocked(provider.onDidUnsetConnectionFactory).mockReturnValue(onDidUnsetDisposable);

  manager = new KubernetesProvidersManager();
});

afterEach(() => {
  manager.dispose();
});

describe('init', () => {
  let changeEvent: (e: void) => unknown;

  beforeEach(() => {
    changeEvent = vi.fn();
    manager.onKubernetesProvidersChange(changeEvent);
    manager.init();
  });

  afterEach(() => {
    manager.dispose();
  });

  test('should call onDidSetConnectionFactory and onDidUnsetConnectionFactory', () => {
    expect(provider.onDidSetConnectionFactory).toHaveBeenCalled();
    expect(provider.onDidUnsetConnectionFactory).toHaveBeenCalled();
  });

  test('event should be fired when a kubernetes connection is set', () => {
    const cbSet = vi.mocked(provider.onDidSetConnectionFactory).mock.calls[0][0];
    expect(cbSet).toBeDefined();
    cbSet!({ type: 'kubernetes', providerId: 'k8s-provider' } as ConnectionFactoryDetails);
    expect(changeEvent).toHaveBeenCalled();
  });

  test('event should not be fired when a non-kubernetes connection is set', () => {
    const cbSet = vi.mocked(provider.onDidSetConnectionFactory).mock.calls[0][0];
    expect(cbSet).toBeDefined();
    cbSet!({ type: 'container', providerId: 'provider-id' } as ConnectionFactoryDetails);
    expect(changeEvent).not.toHaveBeenCalled();
  });

  test('event should be fired when a kubernetes connection is unset', () => {
    const cbUnset = vi.mocked(provider.onDidUnsetConnectionFactory).mock.calls[0][0];
    expect(cbUnset).toBeDefined();
    cbUnset!({ type: 'kubernetes', providerId: 'k8s-provider' } as ConnectionFactory);
    expect(changeEvent).toHaveBeenCalled();
  });

  test('event should not be fired when a non-kubernetes connection is unset', () => {
    const cbUnset = vi.mocked(provider.onDidUnsetConnectionFactory).mock.calls[0][0];
    expect(cbUnset).toBeDefined();
    cbUnset!({ type: 'container', providerId: 'provider-id' } as ConnectionFactory);
    expect(changeEvent).not.toHaveBeenCalled();
  });
});

describe('getKubernetesProviders', () => {
  beforeEach(() => {
    manager.init();
  });

  test('should return the kubernetes providers', () => {
    vi.mocked(provider.getConnectionFactories).mockReturnValue([
      {
        type: 'kubernetes',
        providerId: 'k8s-provider',
        creationDisplayName: 'Kubernetes Provider',
        creationButtonTitle: 'Create Kubernetes Provider',
        emptyConnectionMarkdownDescription: 'Create a new Kubernetes Provider',
        images: {
          icon: {
            light: 'light.png',
            dark: 'dark.png',
          },
        },
      },
    ]);
    const providers = manager.getKubernetesProviders();
    expect(providers).toEqual([
      {
        id: 'k8s-provider',
        creationDisplayName: 'Kubernetes Provider',
        creationButtonTitle: 'Create Kubernetes Provider',
        emptyConnectionMarkdownDescription: 'Create a new Kubernetes Provider',
        images: {
          icon: {
            light: 'light.png',
            dark: 'dark.png',
          },
        },
      },
    ]);
  });
});

describe('dispose', () => {
  beforeEach(() => {
    manager.init();
  });

  test('should dispose the listeners', () => {
    manager.dispose();
    expect(onDidSetDispose).toHaveBeenCalled();
    expect(onDidUnsetDispose).toHaveBeenCalled();
  });
});
