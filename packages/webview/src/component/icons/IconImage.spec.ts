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

import { render } from '@testing-library/svelte';
import { expect, test } from 'vitest';

import IconImage from './IconImage.svelte';

test('Expect valid source and alt text with dark mode', async () => {
  const image = render(IconImage, { image: { light: 'light.png', dark: 'dark.png' }, alt: 'this is alt text' });

  const imageElement = image.getByRole('img');

  expect(imageElement).toHaveAttribute('src', 'dark.png');
  expect(imageElement).toHaveAttribute('alt', 'this is alt text');

  await image.rerender({ image: { light: 'light2.png', dark: 'dark2.png' }, alt: 'this is another alt text' });
  expect(imageElement).toHaveAttribute('src', 'dark2.png');
});

test('Expect no alt attribute if missing and default image', async () => {
  const image = render(IconImage, { image: 'image.png' });

  const imageElement = image.getByRole('img');
  expect(imageElement).toHaveAttribute('src', 'image.png');
  expect(imageElement).not.toHaveAttribute('alt');
});

test('Expect string as image', async () => {
  const image = render(IconImage, { image: 'image1', alt: 'this is alt text' });

  const imageElement = image.getByRole('img');

  expect(imageElement).toHaveAttribute('src', 'image1');
  expect(imageElement).toHaveAttribute('alt', 'this is alt text');

  await image.rerender({ image: 'image2', alt: 'this is another alt text' });
  expect(imageElement).toHaveAttribute('src', 'image2');
});
