<script lang="ts">
import Label from './Label.svelte';

interface Props {
  name?: string;
  tip?: string;
  slot?: string;
  role?: string;
  capitalize?: boolean;
}

let { name = '', tip = '', slot = '', role, capitalize = false }: Props = $props();
</script>

<Label tip={tip} role={role} name={name} capitalize={capitalize}>{slot}</Label>
