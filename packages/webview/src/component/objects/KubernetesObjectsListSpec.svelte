<script lang="ts">
import KubernetesObjectsList from './KubernetesObjectsList.svelte';
import { TableColumn, TableRow } from '@podman-desktop/ui-svelte';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import type { KubernetesObjectUI } from './KubernetesObjectUI';
import PodIcon from '../icons/PodIcon.svelte';

interface ObjectUI {
  kind: string;
  name: string;
  status: string;
}

const nameColumn = new TableColumn<ObjectUI>('Name', {
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

const columns = [nameColumn];

const row = new TableRow<ObjectUI>({});
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'seals',
      transformer: (obj): KubernetesObjectUI => ({ name: obj.metadata?.name }) as KubernetesObjectUI,
    },
  ]}
  singular="seal"
  plural="Seals"
  icon={PodIcon}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}No Seals{/snippet}
</KubernetesObjectsList>
