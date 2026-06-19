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
  aria-label="DaemonSet"
  viewBox="0 0 20 20"
  fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <path
    d="M13.943 18.269a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5v-.22a.5.5 0 0 1 .5-.5h12.943a.5.5 0 0 1 .5.5zM13.413 6.795c.288 0 .522.233.522.521v9.034a.52.52 0 0 1-.522.521H.553c-.305 0-.553-.234-.553-.521V7.316c0-.287.248-.52.553-.521zM16.968 13.568a.52.52 0 0 1-.522.522H14.41v-1.043h1.516v-1.741h1.043zM20 10.786a.52.52 0 0 1-.521.522h-2.13v-1.043h1.608V8.52H20zM16.446 4.013c.288 0 .522.233.522.521v2.263h-1.043V5.056h-1.608V4.013zM5.715 5.056H4.107v1.258H3.064v-1.78c0-.288.234-.521.522-.521h2.129zM11.145 5.056H8.887V4.013h2.258zM8.748 2.274H7.14v1.752H6.097V1.753c0-.288.233-.521.521-.522h2.13zM19.479 1.231c.288 0 .521.234.521.522v2.273h-1.043V2.274H17.35V1.231zM14.178 2.274H11.92V1.231h2.258z"
    style="fill: currentColor;"></path>
</svg>
