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

import { randomBytes } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = join(packageRoot, '..', '..');
const runnerFolder = join(
  repositoryRoot,
  'tests',
  'playwright',
  'tests',
  'playwright',
  'output',
  'kubernetes-dashboard-tests',
);
const targetFolder = join(runnerFolder, 'plugins', 'kubernetes-dashboard-api-e2e');
const handshakeFile = join(runnerFolder, 'api-e2e-bridge.json');

await rm(targetFolder, { force: true, recursive: true });
await rm(handshakeFile, { force: true });
await mkdir(targetFolder, { recursive: true });
await cp(join(packageRoot, 'dist'), join(targetFolder, 'dist'), { recursive: true });

const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
delete packageJson.devDependencies;
delete packageJson.scripts;
await writeFile(join(targetFolder, 'package.json'), `${JSON.stringify(packageJson, undefined, 2)}\n`, 'utf8');
await writeFile(
  join(targetFolder, 'bridge-config.json'),
  `${JSON.stringify({ handshakeFile, token: randomBytes(32).toString('hex') }, undefined, 2)}\n`,
  'utf8',
);

console.log(`Installed Kubernetes Dashboard API E2E extension in ${targetFolder}`);
