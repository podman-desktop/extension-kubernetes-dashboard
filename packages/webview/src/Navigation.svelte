<script lang="ts">
import type { TinroRouteMeta } from 'tinro';
import { SettingsNavItem } from '@podman-desktop/ui-svelte';
import {
  faCubes,
  faDatabase,
  faGear,
  faHouse,
  faLayerGroup,
  faNetworkWired,
  faServer,
} from '@fortawesome/free-solid-svg-icons';
import { getContext } from 'svelte';
import { Navigator } from '/@/navigation/navigator';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import kubernetesIcon from '/@/kubernetes-icon.png';

interface Props {
  meta: TinroRouteMeta;
}

const { meta }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const navigator = dependencyAccessor.get<Navigator>(Navigator);

const url = $derived(meta.url);

function isUnderSection(sectionUrls: string[]): boolean {
  return sectionUrls.some(u => url === u || url.startsWith(u + '/'));
}

const workloadUrls = [
  navigator.kubernetesResourcesURL('Deployment'),
  navigator.kubernetesResourcesURL('Pod'),
  navigator.kubernetesResourcesURL('Job'),
  navigator.kubernetesResourcesURL('CronJob'),
];

const configUrls = [navigator.kubernetesResourcesURL('ConfigMap')];

const networkUrls = [
  navigator.kubernetesResourcesURL('Service'),
  navigator.kubernetesResourcesURL('Ingress'),
  '/portForward',
];

const storageUrls = [navigator.kubernetesResourcesURL('PersistentVolumeClaim')];

const STORAGE_KEY = 'nav-sections-expanded';

function loadExpanded(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function initExpanded(key: string, sectionUrls: string[]): boolean {
  const saved = loadExpanded();
  if (key in saved) return saved[key];
  return isUnderSection(sectionUrls);
}

function saveExpanded(key: string, value: boolean): void {
  const current = loadExpanded();
  current[key] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

let workloadsExpanded = $state(initExpanded('compute', workloadUrls));
let configExpanded = $state(initExpanded('config', configUrls));
let networkExpanded = $state(initExpanded('network', networkUrls));
let storageExpanded = $state(initExpanded('storage', storageUrls));

$effect(() => {
  if (isUnderSection(workloadUrls)) workloadsExpanded = true;
  if (isUnderSection(configUrls)) configExpanded = true;
  if (isUnderSection(networkUrls)) networkExpanded = true;
  if (isUnderSection(storageUrls)) storageExpanded = true;
});

$effect(() => {
  saveExpanded('compute', workloadsExpanded);
});
$effect(() => {
  saveExpanded('config', configExpanded);
});
$effect(() => {
  saveExpanded('network', networkExpanded);
});
$effect(() => {
  saveExpanded('storage', storageExpanded);
});
</script>

<nav
  class="z-1 w-leftsidebar min-w-leftsidebar shadow-xs flex-col justify-between flex transition-all duration-500 ease-in-out bg-(--pd-secondary-nav-bg) border-(--pd-global-nav-bg-border) border-r-[1px]"
  aria-label="Kubernetes resources">
  <div class="flex items-center">
    <a href="/" title="Navigate to dashboard" class="pt-4 px-3 mb-5 flex items-center gap-3">
      <img src={kubernetesIcon} alt="Kubernetes Dashboard" class="w-7 h-7" />
      <p class="text-xl font-semibold text-(--pd-secondary-nav-header-text) pl-1">Kubernetes</p>
    </a>
  </div>
  <div
    class="h-full overflow-hidden hover:overflow-y-auto [&_svg]:w-[1.25em] [&_div.pl-\[34px\]]:!pl-[36px]"
    style="margin-bottom:auto">
    <SettingsNavItem title="Dashboard" icon={faHouse} selected={url === '/'} href="/" />

    <SettingsNavItem
      title="Nodes"
      icon={faServer}
      selected={url === navigator.kubernetesResourcesURL('Node')}
      href={navigator.kubernetesResourcesURL('Node')} />

    <!-- Compute section -->
    <SettingsNavItem
      title="Compute"
      icon={faCubes}
      section={true}
      bind:expanded={workloadsExpanded}
      selected={false}
      href="" />
    {#if workloadsExpanded}
      <SettingsNavItem
        title="Deployments"
        child={true}
        selected={url === navigator.kubernetesResourcesURL('Deployment')}
        href={navigator.kubernetesResourcesURL('Deployment')} />
      <SettingsNavItem
        title="Pods"
        child={true}
        selected={url === navigator.kubernetesResourcesURL('Pod')}
        href={navigator.kubernetesResourcesURL('Pod')} />
      <SettingsNavItem
        title="Jobs"
        child={true}
        selected={url === navigator.kubernetesResourcesURL('Job')}
        href={navigator.kubernetesResourcesURL('Job')} />
      <SettingsNavItem
        title="CronJobs"
        child={true}
        selected={url === navigator.kubernetesResourcesURL('CronJob')}
        href={navigator.kubernetesResourcesURL('CronJob')} />
    {/if}

    <!-- Config section -->
    <SettingsNavItem
      title="Config"
      icon={faGear}
      section={true}
      bind:expanded={configExpanded}
      selected={false}
      href="" />
    {#if configExpanded}
      <SettingsNavItem
        title="ConfigMaps &amp; Secrets"
        child={true}
        selected={url === navigator.kubernetesResourcesURL('ConfigMap')}
        href={navigator.kubernetesResourcesURL('ConfigMap')} />
    {/if}

    <!-- Network section -->
    <SettingsNavItem
      title="Network"
      icon={faNetworkWired}
      section={true}
      bind:expanded={networkExpanded}
      selected={false}
      href="" />
    {#if networkExpanded}
      <SettingsNavItem
        title="Services"
        child={true}
        selected={url === navigator.kubernetesResourcesURL('Service')}
        href={navigator.kubernetesResourcesURL('Service')} />
      <SettingsNavItem
        title="Ingresses, Routes &amp; HTTPRoutes"
        child={true}
        selected={url === navigator.kubernetesResourcesURL('Ingress')}
        href={navigator.kubernetesResourcesURL('Ingress')} />
      <SettingsNavItem title="Port Forwarding" child={true} selected={url === '/portForward'} href="/portForward" />
    {/if}

    <!-- Storage section -->
    <SettingsNavItem
      title="Storage"
      icon={faDatabase}
      section={true}
      bind:expanded={storageExpanded}
      selected={false}
      href="" />
    {#if storageExpanded}
      <SettingsNavItem
        title="Persistent Volume Claims"
        child={true}
        selected={url === navigator.kubernetesResourcesURL('PersistentVolumeClaim')}
        href={navigator.kubernetesResourcesURL('PersistentVolumeClaim')} />
    {/if}

    <SettingsNavItem
      title="Namespaces"
      icon={faLayerGroup}
      selected={url === navigator.kubernetesResourcesURL('Namespace')}
      href={navigator.kubernetesResourcesURL('Namespace')} />
  </div>
</nav>
