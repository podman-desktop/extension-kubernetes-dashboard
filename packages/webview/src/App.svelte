<script lang="ts">
import NamespacesList from './component/namespaces/NamespacesList.svelte';
import ConfigMapSecretList from './component/configmaps-secrets/ConfigMapSecretList.svelte';
import Dashboard from '/@/component/dashboard/Dashboard.svelte';
import NodesList from '/@/component/nodes/NodesList.svelte';
import Navigation from '/@/Navigation.svelte';
import Route from '/@/Route.svelte';
import NodeDetails from '/@/component/nodes/NodeDetails.svelte';
import NamespaceDetails from './component/namespaces/NamespaceDetails.svelte';
import ConfigMapDetails from './component/configmaps-secrets/ConfigMapDetails.svelte';
import SecretDetails from './component/configmaps-secrets/SecretDetails.svelte';
import DeploymentList from './component/deployments/DeploymentList.svelte';
import ServicesList from './component/services/ServicesList.svelte';
import IngressesRoutesList from './component/ingresses-routes/IngressesRoutesList.svelte';
import PVCsList from './component/pvcs/PVCsList.svelte';
import JobsList from './component/jobs/JobsList.svelte';
import CronJobsList from './component/cronjobs/CronJobsList.svelte';
import PodsList from './component/pods/PodsList.svelte';
import DeploymentDetails from './component/deployments/DeploymentDetails.svelte';
import ServiceDetails from './component/services/ServiceDetails.svelte';
import IngressDetails from './component/ingresses-routes/IngressDetails.svelte';
import RouteDetails from './component/ingresses-routes/RouteDetails.svelte';
import PVCDetails from './component/pvcs/PVCDetails.svelte';
import JobDetails from './component/jobs/JobDetails.svelte';
import CronJobDetails from './component/cronjobs/CronJobDetails.svelte';
import PodDetails from './component/pods/PodDetails.svelte';
import PortForwardingList from './component/port-forward/PortForwardingList.svelte';
// import globally the monaco environment
import './monaco-environment';

let isMounted = false;
</script>

<Route path="/*" isAppMounted={isMounted} let:meta>
  <main class="flex flex-col w-screen h-screen overflow-hidden bg-[var(--pd-content-bg)] text-base">
    <div class="flex flex-row w-full h-full overflow-hidden">
      <Navigation meta={meta} />

      <div class="flex flex-col w-full h-full overflow-hidden">
        <Route path="/">
          <Dashboard />
        </Route>

        <Route path="/nodes">
          <NodesList />
        </Route>

        <Route path="/nodes/:name/*" let:meta>
          <NodeDetails name={decodeURI(meta.params.name)} />
        </Route>

        <Route path="/namespaces">
          <NamespacesList />
        </Route>

        <Route path="/namespaces/:name/*" let:meta>
          <NamespaceDetails name={decodeURI(meta.params.name)} />
        </Route>

        <Route path="/deployments">
          <DeploymentList />
        </Route>

        <Route path="/deployments/:name/:namespace/*" let:meta>
          <DeploymentDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
        </Route>

        <Route path="/pods">
          <PodsList />
        </Route>

        <Route path="/pods/:name/:namespace/*" let:meta>
          <PodDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
        </Route>

        <Route path="/services">
          <ServicesList />
        </Route>

        <Route path="/services/:name/:namespace/*" let:meta>
          <ServiceDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
        </Route>

        <Route path="/ingressesRoutes">
          <IngressesRoutesList />
        </Route>

        <Route path="/ingressesRoutes/ingress/:name/:namespace/*" let:meta>
          <IngressDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
        </Route>

        <Route path="/ingressesRoutes/route/:name/:namespace/*" let:meta>
          <RouteDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
        </Route>

        <Route path="/persistentvolumeclaims">
          <PVCsList />
        </Route>

        <Route path="/persistentvolumeclaims/:name/:namespace/*" let:meta>
          <PVCDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
        </Route>

        <Route path="/configmapsSecrets">
          <ConfigMapSecretList />
        </Route>

        <Route path="/configmapsSecrets/configmap/:name/:namespace/*" let:meta>
          <ConfigMapDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
        </Route>

        <Route path="/configmapsSecrets/secret/:name/:namespace/*" let:meta>
          <SecretDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
        </Route>

        <Route path="/jobs">
          <JobsList />
        </Route>

        <Route path="/jobs/:name/:namespace/*" let:meta>
          <JobDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
        </Route>

        <Route path="/cronjobs">
          <CronJobsList />
        </Route>

        <Route path="/cronjobs/:name/:namespace/*" let:meta>
          <CronJobDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
        </Route>

        <Route path="/portForward">
          <PortForwardingList />
        </Route>
      </div>
    </div>
  </main>
</Route>
