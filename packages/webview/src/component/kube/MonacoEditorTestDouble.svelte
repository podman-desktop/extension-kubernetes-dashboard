<script lang="ts">
  interface Props {
    onChange?: (content: string) => void;
  }

  let { onChange }: Props = $props();
</script>

<button aria-label="fireContentChange" onclick={(): boolean => onChange?.('apiVersion: v1\nkind: Pod') ?? true}></button>
