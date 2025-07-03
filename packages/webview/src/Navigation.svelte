<script lang="ts">
import type { TinroRouteMeta } from 'tinro';
import { SettingsNavItem } from '@podman-desktop/ui-svelte';

interface Props {
  meta: TinroRouteMeta;
}

const { meta }: Props = $props();
</script>

<nav
  class="z-1 w-leftsidebar min-w-leftsidebar shadow-xs flex-col justify-between flex transition-all duration-500 ease-in-out bg-[var(--pd-secondary-nav-bg)] border-[var(--pd-global-nav-bg-border)] border-r-[1px]"
  aria-label="PreferencesNavigation">
  <div class="flex items-center">
    <div class="pt-4 pl-3 px-5 mb-10 flex items-center ml-[4px]">
      <p class="text-xl first-letter:uppercase text-[color:var(--pd-secondary-nav-header-text)]">Kubernetes</p>
    </div>
  </div>
  <div class="h-full overflow-hidden hover:overflow-y-auto" style="margin-bottom:auto">
    <SettingsNavItem title="Dashboard" selected={meta.url === '/'} href="/" />

    <div class="pl-3 mt-2 ml-[4px]">
      <span class="text-[color:var(--pd-secondary-nav-header-text)]">STATES</span>
    </div>

    <SettingsNavItem title="Resources count" selected={meta.url === '/resources-count'} href="/resources-count" />
    <SettingsNavItem
      title="Active resources count"
      selected={meta.url === '/active-resources-count'}
      href="/active-resources-count" />
  </div>
</nav>
