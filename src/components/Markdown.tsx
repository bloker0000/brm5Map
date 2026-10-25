import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const plugins = [remarkGfm];

// a link in a description should not navigate away from the map, its headings are
// the game's section header bars and its lists get the square bullets
const components: Components = {
  a: ({ href, title, children }) => (
    <a href={href} title={title} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  h1: ({ children }) => <h1 className="brm-section-title">{children}</h1>,
  h2: ({ children }) => <h2 className="brm-section-title">{children}</h2>,
  h3: ({ children }) => <h3 className="brm-section-title">{children}</h3>,
  ul: ({ children }) => <ul className="brm-bullets">{children}</ul>,
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={plugins} components={components}>
      {children}
    </ReactMarkdown>
  );
}
