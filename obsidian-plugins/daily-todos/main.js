/*
 * Daily Todos — Obsidian Plugin
 * Opens or creates a dated todo note in a configurable folder.
 */

'use strict';

var obsidian = require('obsidian');

const DEFAULT_SETTINGS = {
    todosFolder: 'todos',
    dateFormat: 'YYYY-MM-DD',
    template: '- [ ] ',
};

// ── Date-picker modal ────────────────────────────────────────────────────────

class DatePickerModal extends obsidian.Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h3', { text: 'Open todo for date' });

        const today = obsidian.moment().format('YYYY-MM-DD');

        // Native date input — works on desktop and mobile
        const input = contentEl.createEl('input', { type: 'date', value: today });
        input.style.cssText = 'width:100%;padding:6px;font-size:1rem;margin-bottom:12px;box-sizing:border-box;';

        // Shortcut buttons row
        const row = contentEl.createDiv({ cls: 'daily-todos-btn-row' });
        row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;';

        const offsets = [
            { label: 'Yesterday', days: -1 },
            { label: 'Today',     days:  0 },
            { label: 'Tomorrow',  days:  1 },
            { label: '+2 days',   days:  2 },
            { label: '+7 days',   days:  7 },
        ];

        for (const { label, days } of offsets) {
            const btn = row.createEl('button', { text: label });
            btn.style.cssText = 'padding:4px 10px;cursor:pointer;';
            btn.addEventListener('click', () => {
                input.value = obsidian.moment().add(days, 'days').format('YYYY-MM-DD');
            });
        }

        // Open button
        const openBtn = contentEl.createEl('button', { text: 'Open' });
        openBtn.style.cssText = 'width:100%;padding:8px;font-size:1rem;cursor:pointer;';
        openBtn.addEventListener('click', () => {
            if (!input.value) {
                new obsidian.Notice('Please select a date.');
                return;
            }
            this.plugin.openTodoForDate(input.value);
            this.close();
        });

        // Also open on Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') openBtn.click();
        });

        // Focus the date input
        setTimeout(() => input.focus(), 50);
    }

    onClose() {
        this.contentEl.empty();
    }
}

// ── Settings tab ─────────────────────────────────────────────────────────────

class DailyTodosSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Daily Todos settings' });

        new obsidian.Setting(containerEl)
            .setName('Todos folder')
            .setDesc('Vault path where dated todo notes are stored.')
            .addText(text => text
                .setPlaceholder('todos')
                .setValue(this.plugin.settings.todosFolder)
                .onChange(async (value) => {
                    this.plugin.settings.todosFolder = value.trim() || 'todos';
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('New note template')
            .setDesc('Content added when a todo file is created for the first time.')
            .addTextArea(text => {
                text.setPlaceholder('- [ ] ')
                    .setValue(this.plugin.settings.template)
                    .onChange(async (value) => {
                        this.plugin.settings.template = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 6;
                text.inputEl.style.width = '100%';
            });
    }
}

// ── Main plugin ───────────────────────────────────────────────────────────────

class DailyTodosPlugin extends obsidian.Plugin {
    async onload() {
        await this.loadSettings();

        // Ribbon icon — open today's todo
        this.addRibbonIcon('check-square', "Open today's todo", () => {
            this.openTodoForDate(obsidian.moment().format('YYYY-MM-DD'));
        });

        // Command: today
        this.addCommand({
            id: 'open-today-todo',
            name: "Open today's todo",
            callback: () => {
                this.openTodoForDate(obsidian.moment().format('YYYY-MM-DD'));
            },
        });

        // Command: pick a date
        this.addCommand({
            id: 'open-date-todo',
            name: 'Open todo for date…',
            callback: () => {
                new DatePickerModal(this.app, this).open();
            },
        });

        // Command: yesterday
        this.addCommand({
            id: 'open-yesterday-todo',
            name: "Open yesterday's todo",
            callback: () => {
                this.openTodoForDate(obsidian.moment().subtract(1, 'days').format('YYYY-MM-DD'));
            },
        });

        // Command: tomorrow
        this.addCommand({
            id: 'open-tomorrow-todo',
            name: "Open tomorrow's todo",
            callback: () => {
                this.openTodoForDate(obsidian.moment().add(1, 'days').format('YYYY-MM-DD'));
            },
        });

        this.addSettingTab(new DailyTodosSettingTab(this.app, this));
    }

    async openTodoForDate(dateStr) {
        const folder = this.settings.todosFolder;
        const filePath = `${folder}/${dateStr}.md`;

        let file = this.app.vault.getAbstractFileByPath(filePath);

        if (!file) {
            // Create folder if it doesn't exist
            if (!this.app.vault.getAbstractFileByPath(folder)) {
                await this.app.vault.createFolder(folder);
            }
            file = await this.app.vault.create(filePath, this.settings.template);
            new obsidian.Notice(`Created todo for ${dateStr}`);
        }

        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

module.exports = DailyTodosPlugin;
