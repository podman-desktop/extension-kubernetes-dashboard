<script lang="ts">
import type { PodUI } from '/@/component/pods/PodUI';
import Dots from '/@/component/pods/dots/Dots.svelte';

interface Props {
  object: PodUI;
}
let { object }: Props = $props();
</script>

<Dots containers={object.containers} />
