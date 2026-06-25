<script lang="ts">
interface Props {
  size?: string;
  class?: string;
  style?: string;
}

let { size = '40', class: className, style }: Props = $props();
</script>

<svg
  width={size}
  height={size}
  class={className}
  style={style}
  aria-label="ReplicaSet"
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path
    d="M13.413 7.744c.288 0 .522.233.522.521v9.033a.52.52 0 0 1-.522.522H.553c-.305 0-.553-.234-.553-.522V8.265c0-.288.248-.521.553-.521zM16.968 14.517a.52.52 0 0 1-.522.522H14.41v-1.043h1.516v-1.741h1.043zM20 11.735a.52.52 0 0 1-.521.521h-2.13v-1.043h1.608V9.47H20zM16.446 4.961c.288 0 .522.234.522.522v2.263h-1.043V6.004h-1.608V4.961zM5.715 6.004H4.107v1.26H3.064V5.482c0-.288.234-.522.522-.522h2.129zM11.145 6.004H8.887V4.961h2.258zM8.748 3.223H7.14v1.752H6.097V2.702c0-.288.233-.522.521-.522h2.13zM19.479 2.18c.288 0 .521.234.521.522v2.273h-1.043V3.223H17.35V2.18zM14.178 3.223H11.92V2.18h2.258z"
    style="fill: currentColor;"></path>
</svg>
