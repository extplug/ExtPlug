import MarkdownIt from 'markdown-it';
import gh from 'github-url-to-object';
import { before } from 'meld';

function toAbsolute(baseUrl, src) {
  try {
    return new URL(src, baseUrl).toString();
  } catch (e) {
    return src;
  }
}

const GH_CDN = 'https://raw.githubusercontent.com';

export default class extends MarkdownIt {
  constructor(opts) {
    super(opts);

    // Rewrite relative image URLs.
    before(this.renderer.rules, 'image', (tokens, idx) => {
      const token = tokens[idx];

      // Rewrite repository-relative urls to the github CDN.
      const repository = opts.package.repository;
      if (repository && repository.type === 'git') {
        const github = gh(repository.url);
        if (github) {
          token.attrSet('src', toAbsolute(
            `${GH_CDN}/${github.user}/${github.repo}/${github.branch}/`,
            token.attrGet('src')));
        }
      }
    });
  }
}
