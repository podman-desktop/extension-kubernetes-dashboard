<script lang="ts">
import NodeIcon from '/@/component/icons/NodeIcon.svelte';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
</script>

<KubernetesEmptyScreen icon={NodeIcon} resources={['nodes']} />
