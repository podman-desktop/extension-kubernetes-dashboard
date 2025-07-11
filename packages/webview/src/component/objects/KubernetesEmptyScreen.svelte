<script lang="ts">
import { EmptyScreen } from '@podman-desktop/ui-svelte';
import { getContext, onDestroy, onMount, type ComponentProps } from 'svelte';
import CheckConnection from '/@/component/connection/CheckConnection.svelte';
import { States } from '/@/state/states';
import type { Unsubscriber } from 'svelte/store';

interface Props extends ComponentProps<EmptyScreen> {
  resources: string[];
}

let { resources, ...restProps }: Props = $props();

const states = getContext<States>(States);
const currentContext = states.stateCurrentContextInfoUI;
const contextsHealths = states.stateContextsHealthsInfoUI;
const contextsPermissions = states.stateContextsPermissionsInfoUI;

let unsubscribers: Unsubscriber[] = [];

onMount(() => {
  subscribeToStates();
});

onDestroy(() => {
  unsubscribeFromStates();
});

function subscribeToStates(): void {
  unsubscribers.push(currentContext.subscribe());
  unsubscribers.push(contextsHealths.subscribe());
  unsubscribers.push(contextsPermissions.subscribe());
}

function unsubscribeFromStates(): void {
  unsubscribers.forEach(unsubscriber => unsubscriber());
}

interface Info {
  title: string;
  text: string;
  tryToConnect: boolean;
}

const info: Info = $derived.by(() => {
  if (!currentContext.data?.contextName) {
    return {
      title: 'No current context',
      text: 'There is no current context selected',
      tryToConnect: false,
    };
  }

  const currentContextName = currentContext.data?.contextName;

  const health = contextsHealths.data?.healths.find(health => health.contextName === currentContextName);
  if (!health?.reachable || health.offline) {
    return {
      title: 'Context not reachable',
      text: 'The current context is not reachable',
      tryToConnect: true,
    };
  }

  const atLeastOnePermitted =
    resources.filter(resource =>
      contextsPermissions.data?.permissions.some(
        permission =>
          permission.contextName == currentContextName && permission.resourceName === resource && permission.permitted,
      ),
    ).length > 0;

  if (!atLeastOnePermitted) {
    return {
      title: 'Not accessible',
      text: `You don't have permission to access the ${resources.join(' and ')} on this context`,
      tryToConnect: false,
    };
  }

  return {
    title: `No ${resources.join(' or ')}`,
    text: `No ${resources.join(' or ')} found`,
    tryToConnect: false,
  };
});
</script>

<EmptyScreen title={info.title} message={info.text} {...restProps}>
  {#if info.tryToConnect}
    <CheckConnection />
  {/if}
</EmptyScreen>
