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

import { execSync } from 'node:child_process';
import * as http from 'node:http';

import test from '@playwright/test';

const FAKE_KUBELET_MANAGEMENT_URL = 'http://127.0.0.1:10260';

export async function patchPodStatus(podName: string, namespace: string = 'default'): Promise<void> {
  return test.step(`Patch pod ${podName} status with running containerStatuses`, async () => {
    const patch = JSON.stringify({
      status: {
        phase: 'Running',
        containerStatuses: [
          {
            name: podName,
            image: 'httpd',
            imageID: 'docker.io/library/httpd@sha256:fake',
            containerID: `cri-o://fake-${podName}`,
            ready: true,
            started: true,
            state: { running: { startedAt: new Date().toISOString() } },
            restartCount: 0,
          },
        ],
      },
    });

    try {
      // eslint-disable-next-line sonarjs/os-command
      execSync(`kubectl patch pod ${podName} -n ${namespace} --subresource=status --type=merge -p '${patch}'`);
      console.log(`Pod ${podName} status patched successfully`);
    } catch (error) {
      throw new Error(`Failed to patch pod ${podName} status: ${error}`, { cause: error });
    }
  });
}

function postLog(namespace: string, pod: string, container: string, line: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = http.request(`${FAKE_KUBELET_MANAGEMENT_URL}/inject/${namespace}/${pod}/${container}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
    });
    req.on('response', (res: http.IncomingMessage) => {
      res.resume();
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.end(line);
  });
}

export async function injectFakeLogs(
  namespace: string,
  pod: string,
  container: string,
  lines: string[],
): Promise<void> {
  return test.step(`Inject ${lines.length} fake log lines into ${pod}/${container}`, async () => {
    for (const line of lines) {
      await postLog(namespace, pod, container, line);
    }
    console.log(`Injected ${lines.length} log lines into ${namespace}/${pod}/${container}`);
  });
}
