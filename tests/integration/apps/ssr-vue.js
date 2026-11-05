import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import Article from './.generated/VueArticle.vue';
export const render = () => renderToString(createSSRApp(Article));
