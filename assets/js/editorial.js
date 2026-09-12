(() => {
  const tools = document.querySelector('[data-blog-tools]');
  const select = document.querySelector('#blog-topic');
  const cards = [...document.querySelectorAll('#blog-feed .blog-card')];
  if (tools && select && cards.length) {
    tools.hidden = false;
    const count = tools.querySelector('[data-blog-count]');
    const filter = () => {
      cards.forEach(card => { card.hidden = Boolean(select.value && card.dataset.topic !== select.value); });
      const visible = cards.filter(card => !card.hidden).length;
      count.textContent = visible + (visible === 1 ? ' Beitrag' : ' Beiträge');
    };
    select.addEventListener('change', filter);
    filter();
  }
  const toc = document.querySelector('.editorial-toc');
  if (toc && window.matchMedia('(max-width: 900px)').matches) toc.open = false;
})();
