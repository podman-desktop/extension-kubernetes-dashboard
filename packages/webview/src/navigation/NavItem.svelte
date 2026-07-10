<!--********************************************************************
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
 **********************************************************************-->
<script lang="ts">
import type { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import type { Component } from 'svelte';
import { getContext } from 'svelte';
import { SettingsNavItem } from '@podman-desktop/ui-svelte';

interface Props {
  title: string;
  href: string;
  section?: boolean;
  expanded?: boolean;
  child?: boolean;
  icon?: IconDefinition | Component | string;
  iconRight?: IconDefinition | Component | string;
  iconRightAlign?: 'inline' | 'end';
  onClick?: () => void;
}

let { href, expanded = $bindable(), ...rest }: Props = $props();

const getUrl = getContext<() => string>('nav-url');
const selected = $derived(href ? getUrl() === href || getUrl().startsWith(href + '/') : false);
</script>

<SettingsNavItem href={href} selected={selected} bind:expanded={expanded} {...rest} />
