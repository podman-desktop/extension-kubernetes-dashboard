<script lang="ts">
import NamespaceDropdown from '../objects/NamespaceDropdown.svelte';
import DashboardResourceCard from './DashboardResourceCard.svelte';
</script>

<div class="grid grid-cols-4 gap-4 h-fit w-full">
  <DashboardResourceCard type="Nodes" resources={['nodes']} kind="Node" />
  <DashboardResourceCard type="Namespaces" resources={['namespaces']} kind="Namespace" />
</div>
<div class="flex flex-row justify-end">
  <NamespaceDropdown />
</div>
<div class="grid grid-cols-4 gap-4 h-fit w-full">
  <DashboardResourceCard type="Deployments" resources={['deployments']} kind="Deployment" />
  <DashboardResourceCard type="Pods" resources={['pods']} kind="Pod" />
  <DashboardResourceCard type="Services" resources={['services']} kind="Service" />
  <DashboardResourceCard type="Ingresses & Routes" resources={['ingresses', 'routes']} kind="Ingress" />
  <DashboardResourceCard
    type="Persistent Volume Claims"
    resources={['persistentvolumeclaims']}
    kind="PersistentVolumeClaim" />
  <DashboardResourceCard type="ConfigMaps & Secrets" resources={['configmaps', 'secrets']} kind="ConfigMap" />
  <DashboardResourceCard type="Jobs" resources={['jobs']} kind="Job" />
  <DashboardResourceCard type="CronJobs" resources={['cronjobs']} kind="CronJob" />
</div>
