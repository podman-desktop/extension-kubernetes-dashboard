<script lang="ts">
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

        <Route path="/resources-count">
          <ResourcesCount />
        </Route>
      </div>
    </div>
  </main>
</Route>
