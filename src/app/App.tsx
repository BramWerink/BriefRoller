import { useBriefRoller } from '../state/useBriefRoller';
import { getTheme } from '../themes/registry';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useMediaQuery } from './useMediaQuery';
import './global.css';

export const WIDE_QUERY = '(min-width: 800px)';

export function App() {
  const [vm, actions] = useBriefRoller();
  const isWide = useMediaQuery(WIDE_QUERY);
  useKeyboardShortcuts(vm, actions);

  const theme = getTheme(vm.themeId);
  const { Skin } = theme;

  return (
    <div className="app-root" data-theme={theme.id}>
      <main className="app-stage">
        <Skin vm={vm} actions={actions} layout={isWide ? 'wide' : 'mini'} />
      </main>
    </div>
  );
}
