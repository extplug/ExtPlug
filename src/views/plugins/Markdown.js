import MarkdownIt from 'markdown-it';
import gh from 'github-url-to-object';

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

    const rules = this.renderer.rules;
    this.renderer.rules = {
      ...rules,
      // Rewrite relative URLs.
      image(tokens, idx, ...args) {
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

        return rules.image(tokens, idx, ...args);
      },
    };
  }
}
