// Escape untrusted text before inserting it into HTML.
const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

// Treat regex metacharacters in a search keyword as literal characters.
const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  escapeHtml,
  escapeRegex,
};
