const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
  nav.classList.toggle('is-open', !isOpen);
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
  });
});

async function loadLastWork() {
  const gallery = document.querySelector('#lastWorkGallery');
  if (!gallery) return;

  try {
    const response = await fetch('last_work/description.txt', { cache: 'no-store' });
    if (!response.ok) throw new Error('Не удалось загрузить описание работ');

    const content = (await response.text()).replace(/^\uFEFF/, '');
    const descriptionLines = [];
    const entries = new Map();

    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const parts = trimmed.split('|');
      const key = parts.shift().trim().toUpperCase();
      if (key === 'DESCRIPTION') {
        descriptionLines.push(parts.join('|').trim());
        return;
      }

      // Allow ordinary prose lines between DESCRIPTION and the photo entries.
      if (!/^\d+$/.test(key)) {
        descriptionLines.push(trimmed);
        return;
      }

      const number = Number(key);
      const filename = parts.shift()?.trim();
      const caption = parts.join('|').trim();
      if (number >= 1 && number <= 6 && filename && /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(jpg|jpeg|png|webp)$/i.test(filename)) {
        entries.set(number, { filename, caption });
      }
    });

    if (descriptionLines.length) {
      document.querySelector('#projectDescription').textContent = descriptionLines.join(' ');
    }

    let version = 0;
    for (const character of content) version = (version * 31 + character.charCodeAt(0)) >>> 0;

    gallery.querySelectorAll('.project-card').forEach((card, index) => {
      const number = index + 1;
      const entry = entries.get(number);
      if (!entry) return;

      const image = card.querySelector('img');
      if (image) {
        image.src = `last_work/${encodeURIComponent(entry.filename)}?v=${version}`;
        if (entry.caption) image.alt = entry.caption;
      }

      const caption = card.querySelector('.project-card__caption');
      if (caption && entry.caption) caption.textContent = entry.caption;
    });
  } catch {
    // Keep the fallback copy and images in the HTML when opened directly as a local file.
  }
}

loadLastWork();

document.querySelector('#contactForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const subject = encodeURIComponent(`Заявка с сайта — ${data.get('name')}`);
  const body = encodeURIComponent(
    `Имя: ${data.get('name')}\nЭлектронная почта: ${data.get('email')}\nТелефон: ${data.get('phone') || 'не указан'}\n\nЗадача: ${data.get('message') || 'не указана'}`
  );
  document.querySelector('#formSuccess').classList.add('is-visible');
  document.querySelector('#formSuccess').textContent = 'Черновик адресован mikan979@gmail.com. Проверьте его и нажмите «Отправить» в почтовом приложении.';
  window.location.href = `mailto:mikan979@gmail.com?subject=${subject}&body=${body}`;
});
