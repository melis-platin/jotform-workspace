import { useEffect, useState } from 'react';

type TokenPreviewKind = 'color' | 'shadow' | 'radius' | 'spacing' | 'type' | 'text';

type TokenDefinition = {
  name: string;
  value: string;
  darkValue?: string;
  group: string;
  previewKind: TokenPreviewKind;
};

type TokenGroup = {
  label: string;
  matches: (name: string) => boolean;
};

const TOKEN_GROUPS: TokenGroup[] = [
  { label: 'Core', matches: (name) => name.startsWith('--core-') },
  { label: 'Blue', matches: (name) => name.startsWith('--blue-') },
  { label: 'Green', matches: (name) => name.startsWith('--green-') },
  { label: 'Yellow', matches: (name) => name.startsWith('--yellow-') },
  { label: 'Orange', matches: (name) => name.startsWith('--orange-') },
  { label: 'Red', matches: (name) => name.startsWith('--red-') },
  { label: 'Purple', matches: (name) => name.startsWith('--purple-') },
  { label: 'Navy', matches: (name) => name.startsWith('--navy-') },
  { label: 'Gray', matches: (name) => name.startsWith('--gray-') },
  { label: 'Brand', matches: (name) => name.startsWith('--brand-') },
  { label: 'Text', matches: (name) => name.startsWith('--text-') },
  { label: 'Background', matches: (name) => name.startsWith('--background-') },
  { label: 'Border', matches: (name) => name.startsWith('--border-') },
  { label: 'Accent', matches: (name) => name.startsWith('--accent-') },
  { label: 'Success', matches: (name) => name.startsWith('--success-') },
  { label: 'Error', matches: (name) => name.startsWith('--error-') },
  { label: 'Secondary Text', matches: (name) => name.startsWith('--secondary-text-') },
  { label: 'Secondary Background', matches: (name) => name.startsWith('--secondary-background-') },
  { label: 'Secondary Border', matches: (name) => name.startsWith('--secondary-border-') },
  { label: 'Product', matches: (name) => name.startsWith('--product-') },
  { label: 'Shadow', matches: (name) => name.startsWith('--shadow-') },
  { label: 'Radius', matches: (name) => name.startsWith('--radius-') },
  { label: 'Spacing', matches: (name) => name.startsWith('--spacing-') },
  { label: 'Font Family', matches: (name) => name.startsWith('--font-family-') },
  { label: 'Font Weight', matches: (name) => name.startsWith('--font-weight-') },
  { label: 'Font Size', matches: (name) => name.startsWith('--font-size-') },
  { label: 'Line Height', matches: (name) => name.startsWith('--line-height-') },
  { label: 'Letter Spacing', matches: (name) => name.startsWith('--letter-spacing-') },
  { label: 'Typography', matches: (name) => /^--(h\d|body|caption|label)/.test(name) },
];

function getGroup(name: string) {
  return TOKEN_GROUPS.find((group) => group.matches(name))?.label;
}

function getGroupOrder(group: string) {
  const index = TOKEN_GROUPS.findIndex((item) => item.label === group);
  return index === -1 ? TOKEN_GROUPS.length : index;
}

function getPreviewKind(name: string): TokenPreviewKind {
  if (
    name.startsWith('--core-') ||
    name.startsWith('--blue-') ||
    name.startsWith('--green-') ||
    name.startsWith('--yellow-') ||
    name.startsWith('--orange-') ||
    name.startsWith('--red-') ||
    name.startsWith('--purple-') ||
    name.startsWith('--navy-') ||
    name.startsWith('--gray-') ||
    name.startsWith('--brand-') ||
    name.startsWith('--text-') ||
    name.startsWith('--background-') ||
    name.startsWith('--border-') ||
    name.startsWith('--accent-') ||
    name.startsWith('--success-') ||
    name.startsWith('--error-') ||
    name.startsWith('--secondary-') ||
    name.startsWith('--product-')
  ) {
    return 'color';
  }

  if (name.startsWith('--shadow-')) return 'shadow';
  if (name.startsWith('--radius-')) return 'radius';
  if (name.startsWith('--spacing-')) return 'spacing';
  if (
    name.startsWith('--font-') ||
    name.startsWith('--line-height-') ||
    name.startsWith('--letter-spacing-') ||
    /^--(h\d|body|caption|label)/.test(name)
  ) {
    return 'type';
  }

  return 'text';
}

function isStyleRule(rule: CSSRule): rule is CSSStyleRule {
  return 'selectorText' in rule && 'style' in rule;
}

function collectCustomProperties(style: CSSStyleDeclaration, target: Map<string, string>) {
  for (let index = 0; index < style.length; index += 1) {
    const property = style.item(index);
    if (property.startsWith('--')) {
      target.set(property, style.getPropertyValue(property).trim());
    }
  }
}

function readRuleList(
  rules: CSSRuleList,
  rootTokens: Map<string, string>,
  darkTokens: Map<string, string>
) {
  Array.from(rules).forEach((rule) => {
    if (isStyleRule(rule)) {
      const selector = rule.selectorText;

      if (selector.split(',').some((item) => item.trim() === ':root')) {
        collectCustomProperties(rule.style, rootTokens);
      }

      if (
        selector.includes("[data-theme='dark']") ||
        selector.includes('[data-theme="dark"]') ||
        selector.includes('[data-theme=dark]')
      ) {
        collectCustomProperties(rule.style, darkTokens);
      }
    }

    if ('cssRules' in rule) {
      readRuleList((rule as CSSGroupingRule).cssRules, rootTokens, darkTokens);
    }
  });
}

function collectTokens() {
  const rootTokens = new Map<string, string>();
  const darkTokens = new Map<string, string>();

  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      readRuleList(sheet.cssRules, rootTokens, darkTokens);
    } catch {
      // Some browser-managed stylesheets can be blocked from CSSOM access.
    }
  });

  return Array.from(rootTokens.entries())
    .flatMap(([name, value]) => {
      const group = getGroup(name);
      if (!group) return [];

      const darkValue = darkTokens.get(name);

      return [{
        name,
        value,
        darkValue,
        group,
        previewKind: getPreviewKind(name),
      }];
    })
    .sort((a, b) => {
      const groupDiff = getGroupOrder(a.group) - getGroupOrder(b.group);
      if (groupDiff !== 0) return groupDiff;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
}

function TokenPreview({ token }: { token: TokenDefinition }) {
  if (token.previewKind === 'color') {
    return (
      <span
        className="dl-tokens__preview dl-tokens__preview--color"
        style={{ background: `var(${token.name})` }}
      />
    );
  }

  if (token.previewKind === 'shadow') {
    return (
      <span
        className="dl-tokens__preview dl-tokens__preview--shadow"
        style={{ boxShadow: `var(${token.name})` }}
      />
    );
  }

  if (token.previewKind === 'radius') {
    return (
      <span
        className="dl-tokens__preview dl-tokens__preview--radius"
        style={{ borderRadius: `var(${token.name})` }}
      />
    );
  }

  if (token.previewKind === 'spacing') {
    return (
      <span
        className="dl-tokens__preview dl-tokens__preview--spacing"
        style={{ width: `var(${token.name})` }}
      />
    );
  }

  if (token.previewKind === 'type') {
    return <span className="dl-tokens__preview dl-tokens__preview--type">Aa</span>;
  }

  return <span className="dl-tokens__preview dl-tokens__preview--text" />;
}

function TokenTable({
  tokens,
  hasDarkValues,
}: {
  tokens: TokenDefinition[];
  hasDarkValues: boolean;
}) {
  return (
    <div className="dl-tokens__table-wrap">
      <table className="dl-tokens__table">
        <thead>
          <tr>
            <th>Preview</th>
            <th>Token</th>
            <th>Value</th>
            {hasDarkValues && <th>Dark override</th>}
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.name}>
              <td>
                <TokenPreview token={token} />
              </td>
              <td>
                <code>{token.name}</code>
              </td>
              <td>
                <code>{token.value}</code>
              </td>
              {hasDarkValues && (
                <td>
                  {token.darkValue ? <code>{token.darkValue}</code> : <span className="dl-tokens__empty">-</span>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TokensSection() {
  const [tokens, setTokens] = useState<TokenDefinition[]>([]);

  useEffect(() => {
    setTokens(collectTokens());
  }, []);

  const groupedTokens = TOKEN_GROUPS.map((group) => ({
    label: group.label,
    tokens: tokens.filter((token) => token.group === group.label),
  })).filter((group) => group.tokens.length > 0);

  return (
    <div>
      <h1 className="dl-section__title">Tokens</h1>
      <p className="dl-section__description">
        All design tokens currently defined on the design system root styles.
      </p>

      <div className="dl-tokens__summary">
        <span>{tokens.length} tokens</span>
      </div>

      <div className="dl-tokens__groups">
        {groupedTokens.map((group) => (
          <section key={group.label} className="dl-tokens__group">
            <div className="dl-tokens__group-header">
              <h2 className="dl-tokens__group-title">{group.label}</h2>
              <span className="dl-tokens__group-count">
                {group.tokens.length} {group.tokens.length === 1 ? 'token' : 'tokens'}
              </span>
            </div>
            <TokenTable
              tokens={group.tokens}
              hasDarkValues={group.tokens.some((token) => token.darkValue)}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
