'use strict';
(() => {
  // Build text nodes rather than interpreting examples as HTML.
  function highlight(code) {
    const source = code.textContent;
    const tokens = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b(?:true|false|null|undefined)\b|\b(?:import|from|export|default|const|let|return|new|class|constructor|if|function)\b|\b\d+\b|[A-Za-z_$][\w$]*(?=\s*[:(])|\bGuard\b/g;
    const fragment = document.createDocumentFragment();
    let end = 0;
    for (const match of source.matchAll(tokens)) {
      fragment.append(document.createTextNode(source.slice(end, match.index)));
      const value = match[0], span = document.createElement('span');
      const kind = value.startsWith('//') || value.startsWith('/*') ? 'comment'
        : /^['"`]/.test(value) ? 'string'
        : /^(true|false|null|undefined|\d+)$/.test(value) ? 'literal'
        : /^(import|from|export|default|const|let|return|new|class|constructor|if|function)$/.test(value) ? 'keyword'
        : /^\s*:/.test(source.slice(match.index + value.length)) ? 'property' : 'function';
      span.className = 'syntax-' + kind; span.textContent = value; fragment.append(span);
      end = match.index + value.length;
    }
    fragment.append(document.createTextNode(source.slice(end)));
    code.replaceChildren(fragment);
  }
  window.GuardCodeHighlight = highlight;
  document.querySelectorAll('pre code').forEach(highlight);
})();
