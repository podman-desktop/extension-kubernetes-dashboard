<script lang="ts">
import type { TinroRouteMeta } from 'tinro';
import { SettingsNavItem } from '@podman-desktop/ui-svelte';
import { getContext } from 'svelte';
import { Navigator } from '/@/navigation/navigator';
import { DependencyAccessor } from '/@/inject/dependency-accessor';

interface Props {
  meta: TinroRouteMeta;
}

const { meta }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const navigator = dependencyAccessor.get<Navigator>(Navigator);
</script>

<nav
  class="z-1 w-leftsidebar min-w-leftsidebar shadow-xs flex-col justify-between flex transition-all duration-500 ease-in-out bg-(--pd-secondary-nav-bg) border-(--pd-global-nav-bg-border) border-r-[1px]"
  aria-label="PreferencesNavigation">
  <div class="flex items-center">
    <div class="pt-4 pl-3 px-5 mb-10 flex items-center ml-[4px]">
      <p class="text-xl first-letter:uppercase text-(--pd-secondary-nav-header-text)">Kubernetes</p>
    </div>
  </div>
  <div class="h-full overflow-hidden hover:overflow-y-auto" style="margin-bottom:auto">
    <SettingsNavItem title="Dashboard" selected={meta.url === '/'} href="/" />

    <SettingsNavItem
      title="Nodes"
      selected={meta.url === navigator.kubernetesResourcesURL('Node')}
      href={navigator.kubernetesResourcesURL('Node')} />

    <SettingsNavItem
      title="Namespaces"
      selected={meta.url === navigator.kubernetesResourcesURL('Namespace')}
      href={navigator.kubernetesResourcesURL('Namespace')} />

    <SettingsNavItem
      title="Deployments"
      selected={meta.url === navigator.kubernetesResourcesURL('Deployment')}
      href={navigator.kubernetesResourcesURL('Deployment')} />

    <SettingsNavItem
      title="Pods"
      selected={meta.url === navigator.kubernetesResourcesURL('Pod')}
      href={navigator.kubernetesResourcesURL('Pod')} />

    <SettingsNavItem
      title="Services"
      selected={meta.url === navigator.kubernetesResourcesURL('Service')}
      href={navigator.kubernetesResourcesURL('Service')} />

    <SettingsNavItem
      title="Ingresses &amp; Routes"
      selected={meta.url === navigator.kubernetesResourcesURL('Ingress')}
      href={navigator.kubernetesResourcesURL('Ingress')} />

    <SettingsNavItem
      title="Persistent Volume Claims"
      selected={meta.url === navigator.kubernetesResourcesURL('PersistentVolumeClaim')}
      href={navigator.kubernetesResourcesURL('PersistentVolumeClaim')} />

    <SettingsNavItem
      title="ConfigMaps &amp; Secrets"
      selected={meta.url === navigator.kubernetesResourcesURL('ConfigMap')}
      href={navigator.kubernetesResourcesURL('ConfigMap')} />

    <SettingsNavItem
      title="Jobs"
      selected={meta.url === navigator.kubernetesResourcesURL('Job')}
      href={navigator.kubernetesResourcesURL('Job')} />

    <SettingsNavItem
      title="CronJobs"
      selected={meta.url === navigator.kubernetesResourcesURL('CronJob')}
      href={navigator.kubernetesResourcesURL('CronJob')} />

    <SettingsNavItem title="Port Forwarding" selected={meta.url === '/portForward'} href="/portForward" />
  </div>
</nav>
