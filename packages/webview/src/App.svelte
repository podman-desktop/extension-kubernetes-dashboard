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

let isMounted = false;
</script>

<Route path="/*" isAppMounted={isMounted} let:meta>
  <main class="flex flex-col w-screen h-screen overflow-hidden bg-[var(--pd-content-bg)] text-base">
    <div class="flex flex-row w-full h-full overflow-hidden">
      <Navigation meta={meta} />

      <div class="flex flex-col w-full h-full">
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

        <Route path="/services">
          <ServicesList />
        </Route>

        <Route path="/ingressesRoutes">
          <IngressesRoutesList />
        </Route>

        <Route path="/persistentvolumeclaims">
          <PVCsList />
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
      </div>
    </div>
  </main>
</Route>
