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

import type { Page } from '@playwright/test';
import type { NavigationBar, Runner } from '@podman-desktop/tests-playwright';
import { expect as playExpect } from '@podman-desktop/tests-playwright';

export async function handleWebview(runner: Runner, page: Page, navigationBar: NavigationBar): Promise<[Page, Page]> {
  const NAVBAR_EXTENSION_LABEL: string = 'Kubernetes';
  const PAGE_BODY_LABEL: string = `Webview ${NAVBAR_EXTENSION_LABEL}`;

  let navButton = navigationBar.navigationLocator.getByRole('link', {
    name: NAVBAR_EXTENSION_LABEL,
  });
  if ((await navButton.count()) > 1) {
    navButton = navButton.nth(1);
  }
  await playExpect(navButton).toBeEnabled();
  await navButton.click();
  await page.waitForTimeout(2_000);

  const webView = page.getByRole('document', { name: PAGE_BODY_LABEL });
  await playExpect(webView).toBeVisible();
  await new Promise(resolve => setTimeout(resolve, 1_000));
  const [mainPage, webViewPage] = runner.getElectronApp().windows();
  await mainPage.evaluate(() => {
    const element = document.querySelector('webview');
    if (element) {
      (element as HTMLElement).focus();
    } else {
      console.log(`element is null`);
    }
  });

  return [mainPage, webViewPage];
}
