import { render as renderServer } from 'svelte/server';
import Article from './.generated/SvelteArticle.svelte';
export const render = async () => (await renderServer(Article)).body;
