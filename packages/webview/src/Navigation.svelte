<script lang="ts">
import type { TinroRouteMeta } from 'tinro';
import {
  faCubes,
  faDatabase,
  faGear,
  faHouse,
  faLayerGroup,
  faNetworkWired,
  faServer,
} from '@fortawesome/free-solid-svg-icons';
import { getContext, setContext } from 'svelte';
import { Navigator } from '/@/navigation/navigator';
import NavItem from '/@/navigation/NavItem.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import kubernetesIcon from '/@/kubernetes-icon.png';

interface Props {
  meta: TinroRouteMeta;
}

const { meta }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const navigator = dependencyAccessor.get<Navigator>(Navigator);

const url = $derived(meta.url);

setContext('nav-url', () => url);

function isUnderSection(sectionUrls: string[]): boolean {
  return sectionUrls.some(u => url === u || url.startsWith(u + '/'));
}

const workloadUrls = [
  navigator.kubernetesResourcesURL('Deployment'),
  navigator.kubernetesResourcesURL('DaemonSet'),
  navigator.kubernetesResourcesURL('StatefulSet'),
  navigator.kubernetesResourcesURL('ReplicaSet'),
  navigator.kubernetesResourcesURL('Pod'),
  navigator.kubernetesResourcesURL('Job'),
  navigator.kubernetesResourcesURL('CronJob'),
];

const configUrls = [navigator.kubernetesResourcesURL('ConfigMap')];

const networkUrls = [
  navigator.kubernetesResourcesURL('Service'),
  navigator.kubernetesResourcesURL('EndpointSlice'),
  navigator.kubernetesResourcesURL('Endpoints'),
  navigator.kubernetesResourcesURL('Ingress'),
  navigator.kubernetesResourcesURL('IngressClass'),
  navigator.kubernetesResourcesURL('NetworkPolicy'),
  navigator.kubernetesResourcesURL('HTTPRoute'),
  navigator.kubernetesResourcesURL('Gateway'),
  navigator.kubernetesResourcesURL('GatewayClass'),
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
    <NavItem title="Dashboard" icon={faHouse} href="/" />

    <NavItem title="Nodes" icon={faServer} href={navigator.kubernetesResourcesURL('Node')} />

    <!-- Compute section -->
    <NavItem title="Compute" icon={faCubes} section={true} bind:expanded={workloadsExpanded} href="" />
    {#if workloadsExpanded}
      <NavItem title="Deployments" child={true} href={navigator.kubernetesResourcesURL('Deployment')} />
      <NavItem title="DaemonSets" child={true} href={navigator.kubernetesResourcesURL('DaemonSet')} />
      <NavItem title="StatefulSets" child={true} href={navigator.kubernetesResourcesURL('StatefulSet')} />
      <NavItem title="ReplicaSets" child={true} href={navigator.kubernetesResourcesURL('ReplicaSet')} />
      <NavItem title="Pods" child={true} href={navigator.kubernetesResourcesURL('Pod')} />
      <NavItem title="Jobs" child={true} href={navigator.kubernetesResourcesURL('Job')} />
      <NavItem title="CronJobs" child={true} href={navigator.kubernetesResourcesURL('CronJob')} />
    {/if}

    <!-- Config section -->
    <NavItem title="Config" icon={faGear} section={true} bind:expanded={configExpanded} href="" />
    {#if configExpanded}
      <NavItem title="ConfigMaps &amp; Secrets" child={true} href={navigator.kubernetesResourcesURL('ConfigMap')} />
    {/if}

    <!-- Network section -->
    <NavItem title="Network" icon={faNetworkWired} section={true} bind:expanded={networkExpanded} href="" />
    {#if networkExpanded}
      <NavItem title="Services" child={true} href={navigator.kubernetesResourcesURL('Service')} />
      <NavItem title="Endpoint Slices" child={true} href={navigator.kubernetesResourcesURL('EndpointSlice')} />
      <NavItem title="Endpoints" child={true} href={navigator.kubernetesResourcesURL('Endpoints')} />
      <NavItem title="Ingresses &amp; Routes" child={true} href={navigator.kubernetesResourcesURL('Ingress')} />
      <NavItem title="Ingress Classes" child={true} href={navigator.kubernetesResourcesURL('IngressClass')} />
      <NavItem title="Network Policies" child={true} href={navigator.kubernetesResourcesURL('NetworkPolicy')} />
      <NavItem title="HTTPRoutes" child={true} href={navigator.kubernetesResourcesURL('HTTPRoute')} />
      <NavItem title="Gateways" child={true} href={navigator.kubernetesResourcesURL('Gateway')} />
      <NavItem title="Gateway Classes" child={true} href={navigator.kubernetesResourcesURL('GatewayClass')} />
      <NavItem title="Port Forwarding" child={true} href="/portForward" />
    {/if}

    <!-- Storage section -->
    <NavItem title="Storage" icon={faDatabase} section={true} bind:expanded={storageExpanded} href="" />
    {#if storageExpanded}
      <NavItem
        title="Persistent Volume Claims"
        child={true}
        href={navigator.kubernetesResourcesURL('PersistentVolumeClaim')} />
    {/if}

    <NavItem title="Namespaces" icon={faLayerGroup} href={navigator.kubernetesResourcesURL('Namespace')} />
  </div>
</nav>
