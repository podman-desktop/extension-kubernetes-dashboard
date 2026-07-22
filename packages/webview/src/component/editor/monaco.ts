import type * as Monaco from 'monaco-editor';

export class MonacoManager {
  protected static monaco: typeof Monaco | undefined;

  static async getMonaco(): Promise<typeof Monaco> {
    if (MonacoManager.monaco) return MonacoManager.monaco;

    // import monaco editor dynamically (languages are bundled in the main entry)
    MonacoManager.monaco = await import('monaco-editor');
    MonacoManager.registerTheme();

    // return the full monaco
    return MonacoManager.monaco;
  }

  public static getThemeName(): string {
    return 'podmanDesktopTheme';
  }

  protected static registerTheme(): void {
    if (!MonacoManager.monaco) throw new Error('cannot register theme if monaco is not imported');

    const terminalBg = MonacoManager.getTerminalBg();
    const isDarkTheme: boolean = terminalBg === '#000000';

    // define custom theme
    MonacoManager.monaco.editor.defineTheme(MonacoManager.getThemeName(), {
      base: isDarkTheme ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [{ token: 'custom-color', background: terminalBg }],
      colors: {
        'editor.background': terminalBg,
        // make the --vscode-focusBorder transparent
        focusBorder: '#00000000',
      },
    });
  }

  protected static getTerminalBg(): string {
    const app = document.getElementById('app');
    if (!app) throw new Error('cannot found app element');
    const style = window.getComputedStyle(app);

    let color = style.getPropertyValue('--pd-terminal-background').trim();

    // convert to 6 char RGB value since some things don't support 3 char format
    if (color?.length < 6) {
      color = color
        .split('')
        .map(c => {
          return c === '#' ? c : c + c;
        })
        .join('');
    }
    return color;
  }
}
