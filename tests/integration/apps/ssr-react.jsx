import React from 'react';
import { renderToString } from 'react-dom/server';
import Article from './.generated/ReactArticle.jsx';
export const render = () => renderToString(<Article />);
