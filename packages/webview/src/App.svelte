<script lang="ts">
import ActiveResourcesCount from './component/ActiveResourcesCount.svelte';
import CurrentContext from './component/CurrentContext.svelte';
import Dashboard from './component/Dashboard.svelte';
import ResourcesCount from './component/ResourcesCount.svelte';
import Navigation from './Navigation.svelte';
import Route from './Route.svelte';

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

        <Route path="/current-context">
          <CurrentContext />
        </Route>

        <Route path="/resources-count">
          <ResourcesCount />
        </Route>

        <Route path="/active-resources-count">
          <ActiveResourcesCount />
        </Route>
      </div>
    </div>
  </main>
</Route>
