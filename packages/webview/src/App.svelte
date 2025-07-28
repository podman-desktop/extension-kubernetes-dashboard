<script lang="ts">
import NamespacesList from './component/namespaces/NamespacesList.svelte';
import ConfigMapSecretList from './component/configmaps-secrets/ConfigMapSecretList.svelte';
import ActiveResourcesCount from '/@/component/ActiveResourcesCount.svelte';
import ConfigsList from '/@/component/ConfigsList.svelte';
import CurrentContext from '/@/component/CurrentContext.svelte';
import Dashboard from '/@/component/dashboard/Dashboard.svelte';
import NodesList from '/@/component/nodes/NodesList.svelte';
import PodsList from '/@/component/PodsList.svelte';
import ResourcesCount from '/@/component/ResourcesCount.svelte';
import Navigation from '/@/Navigation.svelte';
import Route from '/@/Route.svelte';

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
          Node details for {meta.params.name}
        </Route>

        <Route path="/namespaces">
          <NamespacesList />
        </Route>

        <Route path="/configmapsSecrets">
          <ConfigMapSecretList />
        </Route>

        <Route path="/current-context">
          <CurrentContext />
        </Route>

        <Route path="/resources-count">
          <ResourcesCount />
        </Route>

        <Route path="/active-resources-count">
          <ActiveResourcesCount />
        </Route>

        <Route path="/lists">
          <div class="flex flex-row">
            <PodsList />
            <ConfigsList />
          </div>
        </Route>
      </div>
    </div>
  </main>
</Route>
