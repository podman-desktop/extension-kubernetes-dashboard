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

export interface ProxyWatchMetrics {
  active_by_path: Record<string, number>;
  opened_by_path: Record<string, number>;
}

export async function getProxyWatchMetrics(proxyUrl: string): Promise<ProxyWatchMetrics> {
  const response = await fetch(new URL('/__e2e_watch_metrics', proxyUrl), { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) {
    throw new Error(`Unable to read proxy watch metrics: HTTP ${response.status}`);
  }
  return (await response.json()) as ProxyWatchMetrics;
}
