/**********************************************************************
 * Copyright (C) 2024 - 2025 Red Hat, Inc.
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

import type { Cluster, CoreV1Event, KubernetesObject, ObjectCache, V1Status } from '@kubernetes/client-node';
import { ApiException, KubeConfig } from '@kubernetes/client-node';
import type { Uri } from '@podman-desktop/api';
import { afterEach, assert, beforeEach, describe, expect, test, vi } from 'vitest';
import { kubernetes, window } from '@podman-desktop/api';

import type { ContextHealthState } from './context-health-checker.js';
import { ContextHealthChecker } from './context-health-checker.js';
import {
  ContextPermissionsChecker,
  type ContextPermissionsRequest,
  type ContextResourcePermission,
} from './context-permissions-checker.js';
import { ContextsManager } from './contexts-manager.js';
import { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from '/@/resources/resource-factory.js';
import { ResourceFactoryBase } from '/@/resources/resource-factory.js';
import type { CacheUpdatedEvent, ObjectDeletedEvent, ResourceInformer } from '/@/types/resource-informer.js';
import { vol } from 'memfs';
import { Disposable } from '@kubernetes-dashboard/channels';

const resource4DeleteObjectMock = vi.fn();
const resource4SearchBySelectorMock = vi.fn();
const resource4RestartObjectMock = vi.fn();

const resource5ReadObjectMock = vi.fn();

const createdResource1InformerMock = {
  onCacheUpdated: vi.fn(),
  onOffline: vi.fn(),
  onObjectDeleted: vi.fn(),
  start: vi.fn(),
  dispose: vi.fn(),
} as unknown as ResourceInformer<KubernetesObject>;

const createdEventInformerMock = {
  onCacheUpdated: vi.fn(),
  onOffline: vi.fn(),
  onObjectDeleted: vi.fn(),
  start: vi.fn(),
  dispose: vi.fn(),
} as unknown as ResourceInformer<CoreV1Event>;

class TestContextsManager extends ContextsManager {
  override getResourceFactories(): ResourceFactory[] {
    return [
      new ResourceFactoryBase({
        kind: 'Resource1',
        resource: 'resource1',
      })
        .setPermissions({
          isNamespaced: true,
          permissionsRequests: [
            {
              group: '*',
              resource: '*',
              verb: 'watch',
            },
          ],
        })
        .setInformer({
          createInformer: (_kubeconfig: KubeConfigSingleContext): ResourceInformer<KubernetesObject> => {
            return createdResource1InformerMock;
          },
        })
        .setIsActive((resource: KubernetesObject): boolean => {
          return 'activeField' in resource && resource.activeField === true;
        }),
      new ResourceFactoryBase({
        kind: 'Resource2',
        resource: 'resource2',
      }).setPermissions({
        isNamespaced: true,
        permissionsRequests: [
          {
            group: '*',
            resource: '*',
            verb: 'watch',
          },
        ],
      }),
      new ResourceFactoryBase({
        kind: 'Resource3',
        resource: 'resource3',
      }).setPermissions({
        isNamespaced: false,
        permissionsRequests: [
          {
            group: '*',
            resource: '*',
            verb: 'watch',
          },
        ],
      }),
      new ResourceFactoryBase({
        kind: 'NonDeletable',
        resource: 'nonDeletable',
      }).setPermissions({
        isNamespaced: true,
        permissionsRequests: [
          {
            group: '*',
            resource: '*',
            verb: 'watch',
          },
        ],
      }),
      new ResourceFactoryBase({
        kind: 'NonSearchable',
        resource: 'nonSearchable',
      }).setPermissions({
        isNamespaced: true,
        permissionsRequests: [
          {
            group: '*',
            resource: '*',
            verb: 'watch',
          },
        ],
      }),
      new ResourceFactoryBase({
        kind: 'Resource4',
        resource: 'resource4',
      })
        .setPermissions({
          isNamespaced: true,
          permissionsRequests: [
            {
              group: '*',
              resource: '*',
              verb: 'watch',
            },
          ],
        })
        .setDeleteObject(resource4DeleteObjectMock)
        .setSearchBySelector(resource4SearchBySelectorMock)
        .setRestartObject(resource4RestartObjectMock),
      new ResourceFactoryBase({
        kind: 'Resource5',
        resource: 'resource5',
      })
        .setPermissions({
          isNamespaced: true,
          permissionsRequests: [
            {
              group: '*',
              resource: '*',
              verb: 'watch',
            },
          ],
        })
        .setReadObject(resource5ReadObjectMock),
      new ResourceFactoryBase({
        kind: 'Event',
        resource: 'events',
      })
        .setPermissions({
          isNamespaced: true,
          permissionsRequests: [
            {
              group: '*',
              resource: '*',
              verb: 'watch',
            },
          ],
        })
        .setInformer({
          createInformer: (_kubeconfig: KubeConfigSingleContext): ResourceInformer<CoreV1Event> => {
            return createdEventInformerMock;
          },
        }),
    ];
  }

  public override async startMonitoring(config: KubeConfigSingleContext, contextName: string): Promise<void> {
    return super.startMonitoring(config, contextName);
  }

  public override stopMonitoring(contextName: string): void {
    return super.stopMonitoring(contextName);
  }

  public override handleStatus(status: V1Status, actionMsg: string): void {
    return super.handleStatus(status, actionMsg);
  }

  public override getTextualObjectsList(objects: { kind: string; name: string; namespace?: string }[]): string {
    return super.getTextualObjectsList(objects);
  }

  public override getPluralized(count: number, kind: string): string {
    return super.getPluralized(count, kind);
  }
}

const context1 = {
  name: 'context1',
  cluster: 'cluster1',
  user: 'user1',
  namespace: 'ns1',
};

const kcWithContext1asDefault = {
  contexts: [context1],
  clusters: [
    {
      name: 'cluster1',
    },
  ],
  users: [
    {
      name: 'user1',
    },
  ],
  currentContext: 'context1',
};

const context2 = {
  name: 'context2',
  cluster: 'cluster2',
  user: 'user2',
  namespace: 'ns2',
};
const kcWithContext2asDefault = {
  contexts: [context2],
  clusters: [
    {
      name: 'cluster2',
    },
  ],
  users: [
    {
      name: 'user2',
    },
  ],
  currentContext: 'context2',
};

const kcWithNoCurrentContext = {
  contexts: [context1],
  clusters: [
    {
      name: 'cluster1',
    },
  ],
  users: [
    {
      name: 'user1',
    },
  ],
};

vi.mock(import('node:fs/promises'));
vi.mock(import('node:fs'));
vi.mock(import('./context-health-checker.js'));
vi.mock(import('./context-permissions-checker.js'));

let kcWith2contexts: KubeConfig;

const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  vol.reset();
  vi.clearAllMocks();
  kcWith2contexts = {
    contexts: [
      {
        name: 'context1',
        cluster: 'cluster1',
        user: 'user1',
        namespace: 'ns1',
      },
      {
        name: 'context2',
        cluster: 'cluster2',
        user: 'user2',
        namespace: 'ns2',
      },
    ],
    clusters: [
      {
        name: 'cluster1',
      } as Cluster,
      {
        name: 'cluster2',
      } as Cluster,
    ],
    users: [
      {
        name: 'user1',
      },
      {
        name: 'user2',
      },
    ],
    currentContext: 'context1',
  } as unknown as KubeConfig;

  vi.mocked(ContextHealthChecker).mockClear();
  vi.mocked(ContextPermissionsChecker).mockClear();

  console.warn = vi.fn();
  console.error = vi.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('HealthChecker is built and start is called for each context the first time', async () => {
  let kc: KubeConfig;
  let manager: TestContextsManager;

  const healthCheckerMock = {
    start: vi.fn(),
    dispose: vi.fn(),
    onStateChange: vi.fn(),
    onReachable: vi.fn(),
  } as unknown as ContextHealthChecker;
  const permissionsCheckerMock = {
    start: vi.fn(),
    onPermissionResult: vi.fn(),
    isForContext: vi.fn(),
  } as unknown as ContextPermissionsChecker;

  beforeEach(async () => {
    kc = new KubeConfig();
    kc.loadFromOptions(kcWith2contexts);

    vi.mocked(ContextHealthChecker).mockReturnValue(healthCheckerMock);
    vi.mocked(ContextPermissionsChecker).mockReturnValue(permissionsCheckerMock);
    manager = new TestContextsManager();
  });

  test('when context is not reachable', async () => {
    await manager.update(kc);
    expect(ContextHealthChecker).toHaveBeenCalledTimes(1); // current context only
    const kc1 = new KubeConfig();
    kc1.loadFromOptions(kcWithContext1asDefault);
    expect(ContextHealthChecker).toHaveBeenCalledWith(new KubeConfigSingleContext(kc1, context1));
    const kc2 = new KubeConfig();
    kc2.loadFromOptions(kcWithContext2asDefault);
    expect(ContextHealthChecker).toHaveBeenCalledWith(new KubeConfigSingleContext(kc2, context2));
    expect(healthCheckerMock.start).toHaveBeenCalledTimes(1);

    expect(healthCheckerMock.dispose).not.toHaveBeenCalled();

    expect(ContextPermissionsChecker).not.toHaveBeenCalled();
  });

  test('when context is reachable, persmissions checkers are created and started', async () => {
    const kcSingle1 = new KubeConfigSingleContext(kc, context1);
    const kcSingle2 = new KubeConfigSingleContext(kc, context2);
    let call = 0;
    vi.mocked(healthCheckerMock.onReachable).mockImplementation(f => {
      call++;
      f({
        kubeConfig: call === 1 ? kcSingle1 : kcSingle2,
        contextName: call === 1 ? 'context1' : 'context2',
        checking: false,
        reachable: true,
      });
      return Disposable.create(() => {});
    });
    await manager.update(kc);

    // Once for namespaced resources, once for non-namespaced resources (on current context only)
    expect(ContextPermissionsChecker).toHaveBeenCalledTimes(2);
    expect(ContextPermissionsChecker).toHaveBeenCalledWith(kcSingle1, 'context1', expect.anything());

    expect(permissionsCheckerMock.start).toHaveBeenCalledTimes(2);
  });

  test('getContextsNames returns the correct contexts names', async () => {
    await manager.update(kc);
    const contextsNames = manager.getContextsNames();
    expect(contextsNames).toEqual(['context1', 'context2']);
  });
});

describe('HealthChecker pass and PermissionsChecker resturns a value', async () => {
  let kc: KubeConfig;
  let manager: TestContextsManager;

  const healthCheckerMock = {
    start: vi.fn(),
    dispose: vi.fn(),
    onStateChange: vi.fn(),
    onReachable: vi.fn(),
  } as unknown as ContextHealthChecker;
  const permissionsCheckerMock = {
    start: vi.fn(),
    onPermissionResult: vi.fn(),
    getPermissions: vi.fn(),
    isForContext: vi.fn(),
  } as unknown as ContextPermissionsChecker;

  beforeEach(async () => {
    kc = new KubeConfig();
    kc.loadFromOptions(kcWith2contexts);

    vi.mocked(ContextHealthChecker).mockReturnValue(healthCheckerMock);
    vi.mocked(ContextPermissionsChecker).mockReturnValue(permissionsCheckerMock);
    manager = new TestContextsManager();
  });

  afterEach(() => {
    vi.spyOn(ContextsManager.prototype, 'currentContext', 'get').mockRestore();
  });

  test('permissions are correctly dispatched', async () => {
    const kcSingle1 = new KubeConfigSingleContext(kc, context1);
    let permissionCall = 0;
    vi.mocked(healthCheckerMock.onReachable).mockImplementation(f => {
      f({
        kubeConfig: kcSingle1,
        contextName: 'context1',
        checking: false,
        reachable: true,
      });
      return Disposable.create(() => {});
    });
    vi.mocked(permissionsCheckerMock.onPermissionResult).mockImplementation(f => {
      permissionCall++;
      switch (permissionCall) {
        case 1:
        case 2:
          f({
            kubeConfig: kcSingle1,
            resources: ['resource1', 'resource2'],
            permitted: true,
            attrs: {},
          });
          break;
        case 3:
        case 4:
          f({
            kubeConfig: kcSingle1,
            resources: ['resource3'],
            permitted: true,
            attrs: {},
          });
          break;
      }
      return Disposable.create(() => {});
    });
    const permissions1: ContextResourcePermission[] = [
      {
        contextName: 'context1',
        resourceName: 'resource1',
        attrs: {},
        permitted: true,
      },
      {
        contextName: 'context1',
        resourceName: 'resource2',
        attrs: {},
        permitted: true,
      },
    ];
    const permissions2: ContextResourcePermission[] = [
      {
        contextName: 'context1',
        resourceName: 'resource3',
        attrs: {},
        permitted: true,
      },
    ];
    let getPermissionsCall = 0;
    vi.mocked(permissionsCheckerMock.getPermissions).mockImplementation(() => {
      getPermissionsCall++;
      switch (getPermissionsCall) {
        case 1:
          return permissions1;
        case 2:
          return permissions2;
      }
      return [];
    });
    await manager.update(kc);
    const permissions = manager.getPermissions();
    expect(permissions).toEqual([...permissions1, ...permissions2]);
  });

  test('informer is started for each resource', async () => {
    const kcSingle1 = new KubeConfigSingleContext(kc, context1);
    const kcSingle2 = new KubeConfigSingleContext(kc, context2);
    let call = 0;
    let permissionCall = 0;
    vi.mocked(healthCheckerMock.onReachable).mockImplementation(f => {
      call++;
      f({
        kubeConfig: call === 1 ? kcSingle1 : kcSingle2,
        contextName: call === 1 ? 'context1' : 'context2',
        checking: false,
        reachable: true,
      });
      return Disposable.create(() => {});
    });
    vi.mocked(permissionsCheckerMock.onPermissionResult).mockImplementation(f => {
      permissionCall++;
      switch (permissionCall) {
        case 1:
        case 2:
          f({
            kubeConfig: kcSingle1,
            resources: ['resource1', 'resource2'],
            permitted: true,
            attrs: {},
          });
          break;
        case 3:
        case 4:
          f({
            kubeConfig: kcSingle2,
            resources: ['resource1', 'resource2'],
            permitted: true,
            attrs: {},
          });
          break;
        case 5:
        case 6:
          f({
            kubeConfig: kcSingle1,
            resources: ['resource3'],
            permitted: true,
            attrs: {},
          });
          break;
        case 7:
        case 8:
          f({
            kubeConfig: kcSingle2,
            resources: ['resource3'],
            permitted: true,
            attrs: {},
          });
          break;
      }
      return Disposable.create(() => {});
    });
    await manager.update(kc);
    expect(createdResource1InformerMock.start).toHaveBeenCalledTimes(2); // on resource1 for each context (resource2 and resource3 do not have informer declared)
  });

  test('informer is started for permitted resources only', async () => {
    const kcSingle1 = new KubeConfigSingleContext(kc, context1);
    const kcSingle2 = new KubeConfigSingleContext(kc, context2);
    let call = 0;
    let permissionCall = 0;
    vi.mocked(healthCheckerMock.onReachable).mockImplementation(f => {
      call++;
      f({
        kubeConfig: call === 1 ? kcSingle1 : kcSingle2,
        contextName: call === 1 ? 'context1' : 'context2',
        checking: false,
        reachable: true,
      });
      return Disposable.create(() => {});
    });
    vi.mocked(permissionsCheckerMock.onPermissionResult).mockImplementation(f => {
      permissionCall++;
      switch (permissionCall) {
        case 1:
        case 2:
          f({
            kubeConfig: kcSingle1,
            resources: ['resource1', 'resource2'],
            permitted: true,
            attrs: {},
          });
          break;
        case 3:
        case 4:
          f({
            kubeConfig: kcSingle2,
            resources: ['resource1', 'resource2'],
            permitted: false,
            attrs: {},
          });
          break;
        case 5:
        case 6:
          f({
            kubeConfig: kcSingle1,
            resources: ['resource3'],
            permitted: true,
            attrs: {},
          });
          break;
        case 7:
        case 8:
          f({
            kubeConfig: kcSingle2,
            resources: ['resource3'],
            permitted: true,
            attrs: {},
          });
          break;
      }
      return Disposable.create(() => {});
    });
    await manager.update(kc);
    expect(createdResource1InformerMock.start).toHaveBeenCalledTimes(1); // on resource1 for context1 only (resource2 and resource3 do not have informer declared;, and resource1 is not permitted in context2)
  });

  describe('informer is started', async () => {
    let kcSingle1: KubeConfigSingleContext;
    let kcSingle2: KubeConfigSingleContext;
    beforeEach(async () => {
      kcSingle1 = new KubeConfigSingleContext(kc, context1);
      kcSingle2 = new KubeConfigSingleContext(kc, context2);
      let call = 0;
      let permissionCall = 0;
      vi.mocked(healthCheckerMock.onReachable).mockImplementation(f => {
        call++;
        f({
          kubeConfig: call === 1 ? kcSingle1 : kcSingle2,
          contextName: call === 1 ? 'context1' : 'context2',
          checking: false,
          reachable: call === 1,
        });
        return Disposable.create(() => {});
      });
      vi.mocked(permissionsCheckerMock.onPermissionResult).mockImplementation(f => {
        permissionCall++;
        switch (permissionCall) {
          case 1:
          case 2:
            f({
              kubeConfig: kcSingle1,
              resources: ['resource1', 'resource2', 'events'],
              permitted: true,
              attrs: {},
            });
            break;
          case 3:
          case 4:
            f({
              kubeConfig: kcSingle2,
              resources: ['resource1', 'resource2'],
              permitted: true,
              attrs: {},
            });
            break;
          case 5:
          case 6:
            f({
              kubeConfig: kcSingle1,
              resources: ['resource3'],
              permitted: true,
              attrs: {},
            });
            break;
          case 7:
          case 8:
            f({
              kubeConfig: kcSingle2,
              resources: ['resource3'],
              permitted: true,
              attrs: {},
            });
            break;
        }
        return Disposable.create(() => {});
      });
    });

    test('cache updated with a change on resource count', async () => {
      vi.mocked(createdResource1InformerMock.onCacheUpdated).mockImplementation(f => {
        f({
          kubeconfig: kcSingle1,
          resourceName: 'resource1',
          countChanged: true,
        } as CacheUpdatedEvent);
        return {
          dispose: (): void => {},
        };
      });
      const onResourceUpdatedCB = vi.fn();
      const onResourceCountUpdatedCB = vi.fn();
      manager.onResourceUpdated(onResourceUpdatedCB);
      manager.onResourceCountUpdated(onResourceCountUpdatedCB);
      await manager.update(kc);
      // called twice: on resource1 for each context
      expect(createdResource1InformerMock.start).toHaveBeenCalledTimes(2);
      expect(onResourceUpdatedCB).toHaveBeenCalledTimes(2);
      expect(onResourceCountUpdatedCB).toHaveBeenCalledTimes(2);
    });

    test('cache updated without a change on resource count', async () => {
      vi.mocked(createdResource1InformerMock.onCacheUpdated).mockImplementation(f => {
        f({
          kubeconfig: kcSingle1,
          resourceName: 'resource1',
          countChanged: false,
        } as CacheUpdatedEvent);
        return {
          dispose: (): void => {},
        };
      });
      const onResourceUpdatedCB = vi.fn();
      const onResourceCountUpdatedCB = vi.fn();
      manager.onResourceUpdated(onResourceUpdatedCB);
      manager.onResourceCountUpdated(onResourceCountUpdatedCB);
      await manager.update(kc);
      // called twice: on resource1 for each context
      expect(createdResource1InformerMock.start).toHaveBeenCalledTimes(2);
      expect(onResourceUpdatedCB).toHaveBeenCalledTimes(2);
      expect(onResourceCountUpdatedCB).not.toHaveBeenCalled();
    });

    test('getResourcesCount', async () => {
      const listMock = vi.fn();
      vi.mocked(createdResource1InformerMock.start).mockReturnValue({
        list: listMock,
        get: vi.fn(),
      } as ObjectCache<KubernetesObject>);
      const listEventMock = vi.fn().mockReturnValue([{}]);
      vi.mocked(createdEventInformerMock.start).mockReturnValue({
        list: listEventMock,
        get: vi.fn(),
      } as ObjectCache<CoreV1Event>);
      listMock.mockReturnValue([{}, {}]);
      await manager.update(kc);
      const counts = manager.getResourcesCount();
      expect(counts).toEqual([
        {
          contextName: 'context1',
          resourceName: 'resource1',
          count: 2,
        },
        {
          contextName: 'context1',
          resourceName: 'events',
          count: 1,
        },
        {
          contextName: 'context2',
          resourceName: 'resource1',
          count: 2,
        },
      ]);
    });

    test('getActiveResourcesCount', async () => {
      const listMock = vi.fn();
      vi.mocked(createdResource1InformerMock.start).mockReturnValue({
        list: listMock,
        get: vi.fn(),
      } as ObjectCache<KubernetesObject>);
      listMock.mockReturnValue([
        {
          activeField: true,
        },
        {
          activeField: false,
        },
      ]);
      await manager.update(kc);
      const counts = manager.getActiveResourcesCount();
      expect(counts).toEqual([
        {
          contextName: 'context1',
          resourceName: 'resource1',
          count: 1,
        },
        {
          contextName: 'context2',
          resourceName: 'resource1',
          count: 1,
        },
      ]);
    });

    test('getResources with explicit context name', async () => {
      const listMock = vi.fn();
      vi.mocked(createdResource1InformerMock.start).mockReturnValue({
        list: listMock,
        get: vi.fn(),
      } as ObjectCache<KubernetesObject>);
      listMock.mockReturnValueOnce([{ metadata: { name: 'obj1' } }]);
      listMock.mockReturnValueOnce([{ metadata: { name: 'obj2' } }, { metadata: { name: 'obj3' } }]);
      await manager.update(kc);
      const resources1 = manager.getResources('resource1', 'context1');
      expect(resources1).toEqual([{ metadata: { name: 'obj1' } }]);
      const resources2 = manager.getResources('resource1', 'context2');
      expect(resources2).toEqual([{ metadata: { name: 'obj2' } }, { metadata: { name: 'obj3' } }]);
    });

    test('getResources without context names', async () => {
      const listMock = vi.fn();
      vi.mocked(createdResource1InformerMock.start).mockReturnValue({
        list: listMock,
        get: vi.fn(),
      } as ObjectCache<KubernetesObject>);
      listMock.mockReturnValueOnce([{ metadata: { name: 'obj1' } }]);
      listMock.mockReturnValueOnce([{ metadata: { name: 'obj2' } }, { metadata: { name: 'obj3' } }]);
      vi.spyOn(ContextsManager.prototype, 'currentContext', 'get').mockReturnValue(kcSingle1);
      await manager.update(kc);
      const resources = manager.getResources('resource1');
      expect(resources).toEqual([{ metadata: { name: 'obj1' } }]);
    });

    test('one offline informer clears all caches', async () => {
      const listMock = vi.fn();
      vi.mocked(createdResource1InformerMock.start).mockReturnValue({
        list: listMock,
        get: vi.fn(),
      } as ObjectCache<KubernetesObject>);
      listMock.mockReturnValueOnce([{ metadata: { name: 'obj1' } }]);
      listMock.mockReturnValueOnce([{ metadata: { name: 'obj2' } }, { metadata: { name: 'obj3' } }]);
      await manager.update(kc);
      const resources = manager.getResources('resource1', 'context1');
      // At this point, resources are in caches for both contexts
      expect(resources).toEqual([{ metadata: { name: 'obj1' } }]);

      expect(createdResource1InformerMock.onOffline).toHaveBeenCalledTimes(2);
      const onOfflineCB = vi.mocked(createdResource1InformerMock.onOffline).mock.calls[0]?.[0];
      assert(onOfflineCB);

      // Let's declare informer for resource1 in context1 offline
      onOfflineCB({
        kubeconfig: kcSingle1,
        resourceName: 'resource1',
        offline: true,
        reason: 'because',
      });

      listMock.mockReturnValueOnce([{ metadata: { name: 'obj2' } }, { metadata: { name: 'obj3' } }]);
      const resourcesAfter = manager.getResources('resource1', 'context1');

      // Caches for context1 are removed
      expect(resourcesAfter).toEqual([]);

      // Let's declare informer for resource1 in context2 offline
      onOfflineCB({
        kubeconfig: kcSingle2,
        resourceName: 'resource1',
        offline: true,
        reason: 'because',
      });

      const resourcesAfter2 = manager.getResources('resource1', 'context1');

      // Caches for context1 are removed
      expect(resourcesAfter2).toEqual([]);
    });

    test('getResourceDetails with existing resource', async () => {
      const listMock = vi.fn();
      const getMock = vi.fn();
      vi.mocked(createdResource1InformerMock.start).mockReturnValue({
        list: listMock,
        get: getMock,
      } as ObjectCache<KubernetesObject>);
      listMock.mockReturnValue([{ kind: 'Resource1', metadata: { name: 'obj1', namespace: 'ns1' } }]);
      getMock.mockReturnValue({ kind: 'Resource1', metadata: { name: 'obj1', namespace: 'ns1' } });
      await manager.update(kc);

      const result = manager.getResourceDetails('context1', 'resource1', 'obj1', 'ns1');
      expect(result).toEqual({ kind: 'Resource1', metadata: { name: 'obj1', namespace: 'ns1' } });
    });

    test('getResourceDetails with non-existing resource', async () => {
      const listMock = vi.fn();
      const getMock = vi.fn();
      vi.mocked(createdResource1InformerMock.start).mockReturnValue({
        list: listMock,
        get: getMock,
      } as ObjectCache<KubernetesObject>);
      listMock.mockReturnValue([{ kind: 'Resource1', metadata: { name: 'obj1', namespace: 'ns1' } }]);
      getMock.mockReturnValue(undefined);
      await manager.update(kc);

      const result = manager.getResourceDetails('context1', 'resource1', 'obj1', 'ns1');
      expect(result).toEqual(undefined);
    });

    test('getResourceEvents', async () => {
      const cacheMock = {
        list: vi.fn(),
        get: vi.fn(),
      } as ObjectCache<CoreV1Event>;
      vi.mocked(createdEventInformerMock.start).mockReturnValue(cacheMock);
      const event1: CoreV1Event = { metadata: {}, involvedObject: { uid: 'uid1' } };
      vi.mocked(cacheMock.list).mockReturnValue([event1]);
      vi.mocked(cacheMock.get).mockReturnValue(event1);

      await manager.update(kc);

      const result = manager.getResourceEvents('context1', 'uid1');
      expect(result).toEqual([event1]);
    });

    test('object deleted', async () => {
      vi.mocked(createdResource1InformerMock.onObjectDeleted).mockImplementation(f => {
        f({
          kubeconfig: kcSingle1,
          resourceName: 'resource1',
          name: 'obj1',
          namespace: 'ns1',
        } as ObjectDeletedEvent);
        return {
          dispose: (): void => {},
        };
      });
      const onObjectDeletedCB = vi.fn();
      manager.onObjectDeleted(onObjectDeletedCB);
      await manager.update(kc);
      // called twice: on resource1 for each context
      expect(createdResource1InformerMock.start).toHaveBeenCalledTimes(2);
      expect(onObjectDeletedCB).toHaveBeenCalledTimes(2);
    });
  });
});

test('nothing is done when called again and kubeconfig does not change', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();

  const startMock = vi.fn();
  const disposeMock = vi.fn();
  const onStateChangeMock = vi.fn();

  vi.mocked(ContextHealthChecker).mockImplementation(
    () =>
      ({
        start: startMock,
        dispose: disposeMock,
        onStateChange: onStateChangeMock,
        onReachable: vi.fn(),
      }) as unknown as ContextHealthChecker,
  );

  await manager.update(kc);

  vi.mocked(ContextHealthChecker).mockClear();
  vi.mocked(startMock).mockClear();

  // check it is not called again if kubeconfig does not change
  await manager.update(kc);
  expect(ContextHealthChecker).not.toHaveBeenCalled();
  expect(startMock).not.toHaveBeenCalled();
  expect(disposeMock).not.toHaveBeenCalled();
});

test('HealthChecker is built and start is called for each context being changed', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();

  const startMock = vi.fn();
  const disposeMock = vi.fn();
  const onStateChangeMock = vi.fn();

  vi.mocked(ContextHealthChecker).mockImplementation(
    () =>
      ({
        start: startMock,
        dispose: disposeMock,
        onStateChange: onStateChangeMock,
        onReachable: vi.fn(),
      }) as unknown as ContextHealthChecker,
  );

  await manager.update(kc);

  // check it is called again if kubeconfig changes
  vi.mocked(ContextHealthChecker).mockClear();
  vi.mocked(startMock).mockClear();

  kcWith2contexts.users[0]!.certFile = 'file';
  kc.loadFromOptions(kcWith2contexts);
  await manager.update(kc);
  expect(disposeMock).toHaveBeenCalledTimes(1);
  expect(ContextHealthChecker).toHaveBeenCalledTimes(1);
  expect(startMock).toHaveBeenCalledTimes(1);
});

test('HealthChecker, PermissionsChecker and informers are disposed for each context being removed', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();

  const healthCheckerMock = {
    start: vi.fn(),
    dispose: vi.fn(),
    onStateChange: vi.fn(),
    onReachable: vi.fn(),
  } as unknown as ContextHealthChecker;

  vi.mocked(ContextHealthChecker).mockImplementation((kubeConfig: KubeConfigSingleContext) => {
    const contextName = kubeConfig.getKubeConfig().currentContext;
    vi.mocked(healthCheckerMock.onReachable).mockImplementation(f => {
      f({
        kubeConfig: {
          getNamespace: vi.fn().mockReturnValue(contextName),
        } as unknown as KubeConfigSingleContext,
        contextName,
        checking: false,
        reachable: true,
      });
      return Disposable.create(() => {});
    });
    return healthCheckerMock;
  });

  const permissionsCheckerMock = {
    start: vi.fn(),
    dispose: vi.fn(),
    onPermissionResult: vi.fn(),
    get contextName(): string {
      return '';
    },
  } as unknown as ContextPermissionsChecker;

  vi.mocked(ContextPermissionsChecker).mockImplementation(
    (_kubeconfig: KubeConfigSingleContext, contextName: string, _request: ContextPermissionsRequest) => {
      vi.mocked(permissionsCheckerMock.onPermissionResult).mockImplementation(f => {
        f({
          permitted: true,
          resources: ['resource1'],
          kubeConfig: new KubeConfigSingleContext(kcWith2contexts, contextName === 'context1' ? context1 : context2),
          attrs: {},
        });
        return Disposable.create(() => {});
      });
      vi.spyOn(permissionsCheckerMock, 'contextName', 'get').mockReturnValue(contextName);
      return permissionsCheckerMock;
    },
  );

  await manager.update(kc);

  // check when kubeconfig changes
  vi.mocked(ContextHealthChecker).mockClear();
  vi.mocked(healthCheckerMock.start).mockClear();
  vi.mocked(ContextPermissionsChecker).mockClear();
  vi.mocked(permissionsCheckerMock.start).mockClear();
  vi.mocked(permissionsCheckerMock.dispose).mockClear();

  // we remove context1 from kubeconfig
  const kc1 = {
    contexts: [kcWith2contexts.contexts[1]],
    clusters: [kcWith2contexts.clusters[1]],
    users: [kcWith2contexts.users[1]],
    currentContext: undefined,
  } as unknown as KubeConfig;
  kc.loadFromOptions(kc1);
  await manager.update(kc);
  expect(healthCheckerMock.dispose).toHaveBeenCalledTimes(1);
  expect(ContextHealthChecker).toHaveBeenCalledTimes(0);
  expect(healthCheckerMock.start).toHaveBeenCalledTimes(0);

  expect(permissionsCheckerMock.dispose).toHaveBeenCalledTimes(2); // one for namespaced, one for non-namespaced

  expect(createdResource1InformerMock.dispose).toHaveBeenCalledTimes(1); // for resource1 on context1
});

test('getHealthCheckersStates calls getState for each health checker', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();

  const startMock = vi.fn();
  const disposeMock = vi.fn();
  const onStateChangeMock = vi.fn();

  vi.mocked(ContextHealthChecker).mockImplementation(
    (kubeConfig: KubeConfigSingleContext) =>
      ({
        start: startMock,
        dispose: disposeMock,
        onStateChange: onStateChangeMock,
        onReachable: vi.fn(),
        getState: vi.fn().mockImplementation(() => {
          return {
            kubeConfig: new KubeConfigSingleContext(
              kcWith2contexts,
              kubeConfig.getKubeConfig().currentContext === 'context1' ? context1 : context2,
            ),
            contextName: kubeConfig.getKubeConfig().currentContext,
            checking: kubeConfig.getKubeConfig().currentContext === 'context1' ? true : false,
            reachable: false,
          };
        }),
      }) as unknown as ContextHealthChecker,
  );

  await manager.update(kc);

  const result = manager.getHealthCheckersStates();
  const expectedMap = new Map<string, ContextHealthState>();
  expectedMap.set('context1', {
    kubeConfig: new KubeConfigSingleContext(kcWith2contexts, context1),
    contextName: 'context1',
    checking: true,
    reachable: false,
  });
  expect(result).toEqual(expectedMap);
});

test('getPermissions calls getPermissions for each permissions checker', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();

  const checkerMock = {
    start: vi.fn(),
    dispose: vi.fn(),
    onStateChange: vi.fn(),
    onReachable: vi.fn(),
    getState: vi.fn(),
  } as unknown as ContextHealthChecker;

  vi.mocked(ContextHealthChecker).mockReturnValue(checkerMock);

  const kcSingle1 = new KubeConfigSingleContext(kc, context1);
  const kcSingle2 = new KubeConfigSingleContext(kc, context2);
  let call = 0;
  vi.mocked(checkerMock.onReachable).mockImplementation(f => {
    call++;
    f({
      kubeConfig: call === 1 ? kcSingle1 : kcSingle2,
      contextName: call === 1 ? 'context1' : 'context2',
      checking: false,
      reachable: true,
    });
    return Disposable.create(() => {});
  });

  const getPermissionsMock = vi.fn();
  vi.mocked(ContextPermissionsChecker).mockImplementation(
    () =>
      ({
        start: vi.fn(),
        getPermissions: getPermissionsMock,
        onPermissionResult: vi.fn(),
        isForContext: vi.fn(),
      }) as unknown as ContextPermissionsChecker,
  );

  await manager.update(kc);

  manager.getPermissions();
  expect(getPermissionsMock).toHaveBeenCalledTimes(2);
});

test('dispose calls dispose for each health checker', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();

  const startMock = vi.fn();
  const disposeMock = vi.fn();
  const onStateChangeMock = vi.fn();

  vi.mocked(ContextHealthChecker).mockImplementation(
    () =>
      ({
        start: startMock,
        dispose: disposeMock,
        onStateChange: onStateChangeMock,
        onReachable: vi.fn(),
      }) as unknown as ContextHealthChecker,
  );

  await manager.update(kc);

  manager.dispose();
  expect(disposeMock).toHaveBeenCalledTimes(1);
});

test('dispose calls dispose for each permissions checker', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();

  const healthCheckerMock = {
    start: vi.fn(),
    dispose: vi.fn(),
    onStateChange: vi.fn(),
    onReachable: vi.fn(),
  } as unknown as ContextHealthChecker;
  vi.mocked(ContextHealthChecker).mockReturnValue(healthCheckerMock);

  const kcSingle1 = new KubeConfigSingleContext(kc, context1);
  const kcSingle2 = new KubeConfigSingleContext(kc, context2);
  let call = 0;
  vi.mocked(healthCheckerMock.onReachable).mockImplementation(f => {
    call++;
    f({
      kubeConfig: call === 1 ? kcSingle1 : kcSingle2,
      contextName: call === 1 ? 'context1' : 'context2',
      checking: false,
      reachable: true,
    } as ContextHealthState);
    return Disposable.create(() => {});
  });

  const getPermissionsMock = vi.fn();
  const permissionsDisposeMock = vi.fn();

  vi.mocked(ContextPermissionsChecker).mockImplementation(
    () =>
      ({
        start: vi.fn(),
        getPermissions: getPermissionsMock,
        onPermissionResult: vi.fn(),
        dispose: permissionsDisposeMock,
        isForContext: vi.fn(),
      }) as unknown as ContextPermissionsChecker,
  );

  await manager.update(kc);

  manager.dispose();
  expect(permissionsDisposeMock).toHaveBeenCalledTimes(2);
});

test('only current context is monitored', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring');
  vi.spyOn(manager, 'stopMonitoring');
  await manager.update(kc);
  expect(manager.startMonitoring).toHaveBeenCalledWith(expect.anything(), 'context1');

  // change current context from context1 to context2
  vi.mocked(manager.startMonitoring).mockClear();
  vi.mocked(manager.stopMonitoring).mockClear();
  const kcWith2contextsChangeCurrent = {
    ...kcWith2contexts,
    currentContext: 'context2',
  };
  kc.loadFromOptions(kcWith2contextsChangeCurrent);
  await manager.update(kc);
  expect(manager.stopMonitoring).toHaveBeenCalledWith('context1');
  expect(manager.startMonitoring).toHaveBeenCalledWith(expect.anything(), 'context2');

  // no more current context
  vi.mocked(manager.startMonitoring).mockClear();
  vi.mocked(manager.stopMonitoring).mockClear();
  const kcWith2contextsNoCurrent = {
    ...kcWith2contexts,
    currentContext: undefined,
  };
  kc.loadFromOptions(kcWith2contextsNoCurrent);
  await manager.update(kc);
  expect(manager.stopMonitoring).toHaveBeenCalledWith('context2');
  expect(manager.startMonitoring).not.toHaveBeenCalled();
});

test('get currentContext', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  const currentContext = manager.currentContext;
  expect(currentContext?.getKubeConfig().currentContext).toEqual('context1');
});

test('setCurrentContext sets the current context', async () => {
  vol.fromJSON({
    '/path/to/config': JSON.stringify(kcWith2contexts),
  });
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  const currentContext = manager.currentContext;
  expect(currentContext?.getKubeConfig().currentContext).toEqual('context1');

  vi.mocked(kubernetes.getKubeconfig).mockReturnValue({
    path: '/path/to/config',
  } as Uri);

  await manager.setCurrentContext('context2');
  const content = vol.readFileSync('/path/to/config', 'utf-8');
  expect(content).toContain('current-context: context2');
});

test('onCurrentContextChange is fired', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  const listener = vi.fn();
  manager.onCurrentContextChange(listener);
  await manager.update(kc);
  expect(listener).toHaveBeenCalledOnce();
});

test('onCurrentContextChange is fired only when current context changes', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWith2contexts);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  const listener = vi.fn();
  manager.onCurrentContextChange(listener);
  await manager.update(kc);
  expect(listener).toHaveBeenCalledOnce();

  // context2 is removed, but context1 is still current one
  listener.mockClear();
  kc.loadFromOptions(kcWithContext1asDefault);
  await manager.update(kc);
  expect(listener).not.toHaveBeenCalled();

  // change current context
  listener.mockClear();
  kc.loadFromOptions(kcWithContext2asDefault);
  await manager.update(kc);
  expect(listener).toHaveBeenCalledOnce();
});

test('deleteObject when no current context', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithNoCurrentContext);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  vi.mocked(window.showInformationMessage).mockImplementation(async (): Promise<string> => 'Yes');
  await manager.deleteObject('Resource4', 'resource-name', 'ns1');
  expect(console.warn).toHaveBeenCalledWith('delete object: no current context');
});

test('deleteObject with unhandled resource', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  vi.mocked(window.showInformationMessage).mockImplementation(async (): Promise<string> => 'Yes');
  await manager.deleteObject('Unknown', 'resource-name', 'ns1');
  expect(console.error).toHaveBeenCalledWith('delete object: no handler for kind Unknown');
});

test('deleteObject with non deletable resource', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  vi.mocked(window.showInformationMessage).mockImplementation(async (): Promise<string> => 'Yes');
  await manager.deleteObject('NonDeletable', 'resource-name', 'ns1');
  expect(console.error).toHaveBeenCalledWith('delete object: no handler for kind NonDeletable');
});

test('deleteObject on context namespace', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  vi.mocked(window.showInformationMessage).mockImplementation(async (): Promise<string> => 'Yes');
  await manager.deleteObject('Resource4', 'resource-name');
  expect(window.showInformationMessage).toHaveBeenCalled();
  expect(resource4DeleteObjectMock).toHaveBeenCalledWith(expect.anything(), 'resource-name', 'ns1');
});

test('deleteObject on other namespace', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  vi.mocked(window.showInformationMessage).mockImplementation(async (): Promise<string> => 'Yes');
  await manager.deleteObject('Resource4', 'resource-name', 'other-ns');
  expect(window.showInformationMessage).toHaveBeenCalled();
  expect(resource4DeleteObjectMock).toHaveBeenCalledWith(expect.anything(), 'resource-name', 'other-ns');
});

test('deleteObject handler returns KubernetesObject', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  vi.spyOn(manager, 'handleStatus');
  await manager.update(kc);
  vi.mocked(window.showInformationMessage).mockImplementation(async (): Promise<string> => 'Yes');
  resource4DeleteObjectMock.mockImplementation((): KubernetesObject => {
    return {
      apiVersion: 'v1',
      kind: 'Resource4',
      metadata: { name: 'resource-name' },
    };
  });
  await manager.deleteObject('Resource4', 'resource-name', 'other-ns');
  expect(window.showInformationMessage).toHaveBeenCalled();
  expect(resource4DeleteObjectMock).toHaveBeenCalledWith(expect.anything(), 'resource-name', 'other-ns');
  expect(manager.handleStatus).not.toHaveBeenCalled();
});

test('deleteObject handler returns Status', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  vi.spyOn(manager, 'handleStatus');
  await manager.update(kc);
  vi.mocked(window.showInformationMessage).mockImplementation(async (): Promise<string> => 'Yes');
  const status = {
    kind: 'Status',
  };
  resource4DeleteObjectMock.mockReturnValue(status);
  await manager.deleteObject('Resource4', 'resource-name', 'other-ns');
  expect(window.showInformationMessage).toHaveBeenCalled();
  expect(resource4DeleteObjectMock).toHaveBeenCalledWith(expect.anything(), 'resource-name', 'other-ns');
  expect(manager.handleStatus).toHaveBeenCalledWith(status, 'deletion of Resource4 resource-name');
});

test('deleteObject handler throws status embedded in ApiException', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  vi.spyOn(manager, 'handleStatus');
  await manager.update(kc);
  vi.mocked(window.showInformationMessage).mockImplementation(async (): Promise<string> => 'Yes');
  const status = {
    kind: 'Status',
  };
  resource4DeleteObjectMock.mockRejectedValue(new ApiException(400, 'Bad Request', JSON.stringify(status), {}));
  await manager.deleteObject('Resource4', 'resource-name', 'other-ns');
  expect(window.showInformationMessage).toHaveBeenCalled();
  expect(resource4DeleteObjectMock).toHaveBeenCalledWith(expect.anything(), 'resource-name', 'other-ns');
  expect(manager.handleStatus).toHaveBeenCalledWith(status, 'deletion of Resource4 resource-name');
});

test('deleteObject handler throws a non-Status in ApiException', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  vi.spyOn(manager, 'handleStatus');
  await manager.update(kc);
  vi.mocked(window.showInformationMessage).mockImplementation(async (): Promise<string> => 'Yes');
  resource4DeleteObjectMock.mockRejectedValue(
    new ApiException(
      400,
      'Bad Request',
      JSON.stringify({
        kind: 'NotStatus',
      }),
      {},
    ),
  );
  await expect(() => manager.deleteObject('Resource4', 'resource-name', 'other-ns')).rejects.toThrow(
    /Message: Bad Request/,
  );
  expect(window.showInformationMessage).toHaveBeenCalled();
  expect(resource4DeleteObjectMock).toHaveBeenCalledWith(expect.anything(), 'resource-name', 'other-ns');
  expect(manager.handleStatus).not.toHaveBeenCalled();
});

test('deleteObject handler throws a non-ApiException', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  vi.spyOn(manager, 'handleStatus');
  await manager.update(kc);
  vi.mocked(window.showInformationMessage).mockImplementation(async (): Promise<string> => 'Yes');
  const error = new Error('an error');
  resource4DeleteObjectMock.mockRejectedValue(error);
  await expect(() => manager.deleteObject('Resource4', 'resource-name', 'other-ns')).rejects.toThrow(error);
  expect(window.showInformationMessage).toHaveBeenCalled();
  expect(resource4DeleteObjectMock).toHaveBeenCalledWith(expect.anything(), 'resource-name', 'other-ns');
  expect(manager.handleStatus).not.toHaveBeenCalled();
});

test('searchBySelector when no current context', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithNoCurrentContext);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.searchBySelector('Resource4', {}, 'ns1');
  expect(console.warn).toHaveBeenCalledWith('search by selector: no current context');
});

test('searchBySelector with unhandled resource', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.searchBySelector('Unknown', {}, 'ns1');
  expect(console.error).toHaveBeenCalledWith('search by selector: no handler for kind Unknown');
});

test('searchBySelector with non searchable resource', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.searchBySelector('NonSearchable', {}, 'ns1');
  expect(console.error).toHaveBeenCalledWith('search by selector: no handler for kind NonSearchable');
});

test('searchBySelector on context namespace', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.searchBySelector(
    'Resource4',
    { labelSelector: 'name=test', fieldSelector: 'status.phase=Active' },
    'ns1',
  );
  expect(resource4SearchBySelectorMock).toHaveBeenCalledWith(
    expect.anything(),
    { labelSelector: 'name=test', fieldSelector: 'status.phase=Active' },
    'ns1',
  );
});

test('searchBySelector on other namespace', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.searchBySelector(
    'Resource4',
    { labelSelector: 'name=test', fieldSelector: 'status.phase=Active' },
    'other-ns',
  );
  expect(resource4SearchBySelectorMock).toHaveBeenCalledWith(
    expect.anything(),
    { labelSelector: 'name=test', fieldSelector: 'status.phase=Active' },
    'other-ns',
  );
});

test('searchBySelector handler returns KubernetesObject', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  vi.spyOn(manager, 'handleStatus');
  await manager.update(kc);
  const resource = {
    apiVersion: 'v1',
    kind: 'Resource4',
    metadata: { name: 'resource-name' },
  };
  resource4SearchBySelectorMock.mockImplementation((): KubernetesObject[] => {
    return [resource];
  });
  const result = await manager.searchBySelector('Resource4', {}, 'other-ns');
  expect(resource4SearchBySelectorMock).toHaveBeenCalledWith(expect.anything(), {}, 'other-ns');
  expect(result).toEqual([resource]);
});

test('restartObject when no current context', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithNoCurrentContext);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.restartObject('Resource4', 'resource-name', 'ns1');
  expect(console.warn).toHaveBeenCalledWith('restart object: no current context');
});

test('restartObject with unhandled resource', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.restartObject('Unknown', 'resource-name', 'ns1');
  expect(console.error).toHaveBeenCalledWith('restart object: no handler for kind Unknown');
});

test('restartObject with non restartable resource', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.restartObject('NonRestartable', 'resource-name', 'ns1');
  expect(console.error).toHaveBeenCalledWith('restart object: no handler for kind NonRestartable');
});

test('restartObject on context namespace', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.restartObject('Resource4', 'resource-name', 'ns1');
  expect(resource4RestartObjectMock).toHaveBeenCalledWith(expect.anything(), 'resource-name', 'ns1');
});

test('restartObject on other namespace', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.restartObject('Resource4', 'resource-name', 'other-ns');
  expect(resource4RestartObjectMock).toHaveBeenCalledWith(expect.anything(), 'resource-name', 'other-ns');
});

test('waitForObjectDeletion when no current context', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithNoCurrentContext);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.waitForObjectDeletion('Resource5', 'resource-name', 'ns1');
  expect(console.warn).toHaveBeenCalledWith('wait deletion: no current context');
});

test('waitForObjectDeletion with unhandled resource', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.waitForObjectDeletion('unknown', 'resource-name', 'ns1');
  expect(console.error).toHaveBeenCalledWith('wait deletion: no handler for resource unknown');
});

test('waitForObjectDeletion with non readable resource', async () => {
  const kc = new KubeConfig();
  kc.loadFromOptions(kcWithContext1asDefault);
  const manager = new TestContextsManager();
  vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
  vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
  await manager.update(kc);
  await manager.waitForObjectDeletion('Resource4', 'resource-name', 'ns1');
  expect(console.error).toHaveBeenCalledWith('wait deletion: no handler for resource Resource4');
});

describe('with fake timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('waitForObjectDeletion on context namespace should return false after timeout', async () => {
    const kc = new KubeConfig();
    kc.loadFromOptions(kcWithContext1asDefault);
    const manager = new TestContextsManager();
    vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
    vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
    await manager.update(kc);
    resource5ReadObjectMock.mockResolvedValue({} as KubernetesObject);
    const promise = manager.waitForObjectDeletion('resource5', 'resource-name', 'ns1', 100);
    vi.advanceTimersByTime(110);
    const result = await promise;
    expect(result).toBe(false);
  });

  test('waitForObjectDeletion on context namespace should return true if object is already non preseent', async () => {
    const kc = new KubeConfig();
    kc.loadFromOptions(kcWithContext1asDefault);
    const manager = new TestContextsManager();
    vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
    vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
    await manager.update(kc);
    resource5ReadObjectMock.mockRejectedValue(new ApiException(404, 'Not Found', 'Not Found', {}));
    const result = await manager.waitForObjectDeletion('resource5', 'resource-name', 'ns1', 100);
    expect(result).toBe(true);
  });

  test('waitForObjectDeletion on context namespace should return true when object is deleted', async () => {
    const kc = new KubeConfig();
    kc.loadFromOptions(kcWithContext1asDefault);
    const manager = new TestContextsManager();
    vi.spyOn(manager, 'startMonitoring').mockImplementation(async (): Promise<void> => {});
    vi.spyOn(manager, 'stopMonitoring').mockImplementation((): void => {});
    const onObjectDeletedSpy = vi.spyOn(manager, 'onObjectDeleted');
    await manager.update(kc);
    resource5ReadObjectMock.mockResolvedValue({} as KubernetesObject);
    const promise = manager.waitForObjectDeletion('resource5', 'resource-name', 'ns1', 100);
    vi.advanceTimersByTime(10);
    expect(onObjectDeletedSpy).toHaveBeenCalledWith(expect.anything());
    const callback = onObjectDeletedSpy.mock.calls[0][0];
    callback({ contextName: 'ctx1', resourceName: 'resource5', name: 'resource-name', namespace: 'ns1' });
    const result = await promise;
    expect(result).toBe(true);
  });
});

describe.each([
  {
    objects: [
      { kind: 'Shark', name: 'jaws', namespace: 'ns1' },
      { kind: 'Shark', name: 'megalodon', namespace: 'ns1' },
    ],
    message: '2 Sharks',
  },
  {
    objects: [
      { kind: 'Shark', name: 'jaws', namespace: 'ns1' },
      { kind: 'Shark', name: 'megalodon', namespace: 'ns1' },
      { kind: 'Whale', name: 'moby-dick', namespace: 'ns1' },
    ],
    message: '2 Sharks, 1 Whale',
  },
])('getTextualObjectsList', ({ objects, message }) => {
  test(message, () => {
    const manager = new TestContextsManager();
    const result = manager.getTextualObjectsList(objects);
    expect(result).toEqual(message);
  });
});

describe.each([
  {
    count: 1,
    kind: 'Shark',
    message: 'Shark',
  },
  {
    count: 2,
    kind: 'Shark',
    message: 'Sharks',
  },
  {
    count: 2,
    kind: 'Ingress',
    message: 'Ingresses',
  },
  {
    count: 1,
    kind: 'Ingress',
    message: 'Ingress',
  },
])('getPluralized', ({ count, kind, message }) => {
  test(message, () => {
    const manager = new TestContextsManager();
    const result = manager.getPluralized(count, kind);
    expect(result).toEqual(message);
  });
});
