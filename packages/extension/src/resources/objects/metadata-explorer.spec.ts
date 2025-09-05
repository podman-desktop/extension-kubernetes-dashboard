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

import { expect, test } from 'vitest';

import { MetadataExplorer } from './metadata-explorer.js';
import type { V1ObjectMeta } from '@kubernetes/client-node';

test('MetadataExplorer should return the first controller of the object', () => {
  const metadata: V1ObjectMeta = {
    ownerReferences: [
      { controller: true, name: 'controller', apiVersion: 'v1', kind: 'ReplicaSet', uid: '123' },
      { controller: true, name: 'controller2', apiVersion: 'v1', kind: 'ReplicaSet', uid: '1234' },
      { controller: false, name: 'other', apiVersion: 'v1', kind: 'ReplicaSet', uid: '456' },
    ],
  };
  const metadataExplorer = new MetadataExplorer(metadata);
  const controller = metadataExplorer.getController();
  expect(controller).toEqual({
    controller: true,
    name: 'controller',
    apiVersion: 'v1',
    kind: 'ReplicaSet',
    uid: '123',
  });
});

test('MetadataExplorer should return undefined if no controller', () => {
  const metadata: V1ObjectMeta = {
    ownerReferences: [{ controller: false, name: 'other', apiVersion: 'v1', kind: 'ReplicaSet', uid: '456' }],
  };
  const metadataExplorer = new MetadataExplorer(metadata);
  const controller = metadataExplorer.getController();
  expect(controller).toBeUndefined();
});

test('MetadataExplorer should return undefined if no ownerReference', () => {
  const metadata: V1ObjectMeta = {};
  const metadataExplorer = new MetadataExplorer(metadata);
  const controller = metadataExplorer.getController();
  expect(controller).toBeUndefined();
});

test('getUserOnlyMetadata should return the metadata of the object without data populated by the system', () => {
  const metadata: V1ObjectMeta = {
    name: 'test',
    namespace: 'test',
    labels: { test: 'test' },
    annotations: { test: 'test' },
    creationTimestamp: new Date(),
    ownerReferences: [
      { controller: true, name: 'controller', apiVersion: 'v1', kind: 'ReplicaSet', uid: '123' },
      { controller: true, name: 'controller2', apiVersion: 'v1', kind: 'ReplicaSet', uid: '1234' },
      { controller: false, name: 'other', apiVersion: 'v1', kind: 'ReplicaSet', uid: '456' },
    ],
  };
  const metadataExplorer = new MetadataExplorer(metadata);
  const userOnlyMetadata = metadataExplorer.getUserOnlyMetadata();
  expect(userOnlyMetadata).toEqual({
    name: 'test',
    namespace: 'test',
    labels: { test: 'test' },
    annotations: { test: 'test' },
  });
});

test('getUserOnlyMetadata should return the metadata of the object without data populated by the system, with generateName', () => {
  const metadata: V1ObjectMeta = {
    generateName: 'test-',
    namespace: 'test',
    labels: { test: 'test' },
    annotations: { test: 'test' },
    creationTimestamp: new Date(),
    ownerReferences: [
      { controller: true, name: 'controller', apiVersion: 'v1', kind: 'ReplicaSet', uid: '123' },
      { controller: true, name: 'controller2', apiVersion: 'v1', kind: 'ReplicaSet', uid: '1234' },
      { controller: false, name: 'other', apiVersion: 'v1', kind: 'ReplicaSet', uid: '456' },
    ],
  };
  const metadataExplorer = new MetadataExplorer(metadata);
  const userOnlyMetadata = metadataExplorer.getUserOnlyMetadata();
  expect(userOnlyMetadata).toEqual({
    generateName: 'test-',
    namespace: 'test',
    labels: { test: 'test' },
    annotations: { test: 'test' },
  });
});

test('getUserOnlyMetadata should return the metadata of the object without data populated by the system, with only name as user data', () => {
  const metadata: V1ObjectMeta = {
    name: 'test',
    creationTimestamp: new Date(),
    ownerReferences: [
      { controller: true, name: 'controller', apiVersion: 'v1', kind: 'ReplicaSet', uid: '123' },
      { controller: true, name: 'controller2', apiVersion: 'v1', kind: 'ReplicaSet', uid: '1234' },
      { controller: false, name: 'other', apiVersion: 'v1', kind: 'ReplicaSet', uid: '456' },
    ],
  };
  const metadataExplorer = new MetadataExplorer(metadata);
  const userOnlyMetadata = metadataExplorer.getUserOnlyMetadata();
  expect(userOnlyMetadata).toEqual({ name: 'test' });
});
