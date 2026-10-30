<script>
  import { onMount } from 'svelte';
  import Guard from 'browser-guard';

  onMount(() => {
    const guard = Guard.create();
    guard.enable({
      copy: true,
      select: true,
      rightClick: true,
      savePage: true,
      print: true,
      console: false,
      antiDebug: false,
      consoleAction: 'noop',
      onViolation: (type) => console.log('Guard:', type)
    });
    return () => guard.destroy();
  });
</script>

<article>Your content</article>
