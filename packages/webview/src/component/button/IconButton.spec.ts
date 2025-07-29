/**********************************************************************
 * Copyright (C) 2023-2025 Red Hat, Inc.
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

import { faRocket } from '@fortawesome/free-solid-svg-icons';
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';

import IconButton from './IconButton.svelte';

test('expect button to not have inline-flex when hidden is true', async () => {
  const title = 'title';

  render(IconButton, {
    title,
    icon: faRocket,
    hidden: true,
  });

  const buttonSpan = screen.getByTitle(title);
  expect(buttonSpan).toHaveClass('hidden');
  expect(buttonSpan).not.toHaveClass('inline-flex');
});

test('expect button to have inline-flex when hidden is false', async () => {
  const title = 'title';

  render(IconButton, {
    title,
    icon: faRocket,
    hidden: false,
  });

  const buttonSpan = screen.getByTitle(title);
  expect(buttonSpan).not.toHaveClass('hidden');
  expect(buttonSpan).toHaveClass('inline-flex');
});
