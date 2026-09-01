import { GoIcon, NodeIcon, PhpIcon, PythonIcon, RubyIcon } from './LanguageIcons';
import type { LanguageIconProps } from './LanguageIcons';
import type { SDKId } from '@/lib/types';

export { SendLayerLogo } from './SendLayerLogo';
export * from './LanguageIcons';

const ICONS: Record<SDKId, (props: LanguageIconProps) => React.ReactElement> = {
  python: PythonIcon,
  nodejs: NodeIcon,
  php: PhpIcon,
  ruby: RubyIcon,
  go: GoIcon,
};

export function LanguageIcon({ id, ...props }: { id: SDKId } & LanguageIconProps) {
  const Icon = ICONS[id];
  return <Icon {...props} />;
}
