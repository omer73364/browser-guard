<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import Guard from 'browser-guard';

let guard;

onMounted(() => {
  guard = Guard.create();
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
});
onBeforeUnmount(() => guard?.destroy());
</script>

<template>
  <article>Your content</article>
</template>
