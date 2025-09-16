import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

export class MonacoManager {
  protected static monaco: typeof Monaco | undefined;

  protected static async importLanguages(): Promise<Awaited<unknown>[]> {
    return Promise.all([import('monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution')]);
  }

  static async getMonaco(): Promise<typeof Monaco> {
    if (MonacoManager.monaco) return MonacoManager.monaco;

    // import languages dynamically
    await this.importLanguages();

    // import monaco editor dynamically
    this.monaco = await import('monaco-editor');
    this.registerTheme();

    // return the full monaco
    return this.monaco;
  }

  public static getThemeName(): string {
    return 'podmanDesktopTheme';
  }

  protected static registerTheme(): void {
    if (!MonacoManager.monaco) throw new Error('cannot register theme if monaco is not imported');

    const terminalBg = this.getTerminalBg();
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
