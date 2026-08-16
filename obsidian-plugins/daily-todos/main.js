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
    archiveFolder: 'todos/archive',
    archiveKeepCount: 30,
};

const DATE_NOTE_RE = /^(\d{4})-(\d{2})-(\d{2})\.md$/;

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

// ── Archive modal ────────────────────────────────────────────────────────────

class ArchiveModal extends obsidian.Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h3', { text: 'Archive old todos' });
        contentEl.createEl('p', {
            text: `Keep the N most recent daily notes and move the rest into "${this.plugin.settings.archiveFolder}".`,
        });

        const input = contentEl.createEl('input', {
            type: 'number',
            value: String(this.plugin.settings.archiveKeepCount),
        });
        input.min = '0';
        input.style.cssText = 'width:100%;padding:6px;font-size:1rem;margin-bottom:12px;box-sizing:border-box;';

        const statusEl = contentEl.createDiv();
        statusEl.style.cssText = 'margin-bottom:12px;opacity:0.8;font-size:0.9em;';

        const archiveBtn = contentEl.createEl('button', { text: 'Archive' });
        archiveBtn.style.cssText = 'width:100%;padding:8px;font-size:1rem;cursor:pointer;';
        archiveBtn.addEventListener('click', async () => {
            const n = parseInt(input.value, 10);
            if (isNaN(n) || n < 0) {
                new obsidian.Notice('Please enter a valid number of notes to keep.');
                return;
            }
            archiveBtn.disabled = true;
            statusEl.setText('Archiving…');
            const count = await this.plugin.archiveOldTodos(n);
            this.plugin.settings.archiveKeepCount = n;
            await this.plugin.saveSettings();
            new obsidian.Notice(count > 0 ? `Archived ${count} todo note(s).` : 'Nothing to archive.');
            this.close();
        });

        setTimeout(() => input.focus(), 50);
    }

    onClose() {
        this.contentEl.empty();
    }
}

// ── Calendar view ────────────────────────────────────────────────────────────

const VIEW_TYPE_CALENDAR = 'daily-todos-calendar-view';

class CalendarView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.cursor = obsidian.moment().startOf('month');
    }

    getViewType() {
        return VIEW_TYPE_CALENDAR;
    }

    getDisplayText() {
        return 'Todo calendar';
    }

    getIcon() {
        return 'calendar-days';
    }

    async onOpen() {
        this.render();
    }

    render() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('daily-todos-calendar-view');

        const wrap = containerEl.createDiv();
        wrap.style.cssText = 'padding:8px;';

        // Header: prev / month label / next
        const header = wrap.createDiv();
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';

        const prevBtn = header.createEl('button', { text: '‹' });
        const label = header.createEl('div', { text: this.cursor.format('MMMM YYYY') });
        label.style.cssText = 'font-weight:600;';
        const nextBtn = header.createEl('button', { text: '›' });

        prevBtn.addEventListener('click', () => {
            this.cursor = this.cursor.clone().subtract(1, 'month');
            this.render();
        });
        nextBtn.addEventListener('click', () => {
            this.cursor = this.cursor.clone().add(1, 'month');
            this.render();
        });

        // Weekday headings
        const grid = wrap.createDiv();
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;';

        for (const day of ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']) {
            const cell = grid.createEl('div', { text: day });
            cell.style.cssText = 'font-size:0.75em;opacity:0.6;padding:2px 0;';
        }

        const today = obsidian.moment().format('YYYY-MM-DD');
        const startOfMonth = this.cursor.clone().startOf('month');
        const leadingBlanks = startOfMonth.day();
        const daysInMonth = this.cursor.daysInMonth();
        const folder = this.plugin.settings.todosFolder;

        for (let i = 0; i < leadingBlanks; i++) {
            grid.createDiv();
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = startOfMonth.clone().date(day).format('YYYY-MM-DD');
            const hasFile = !!this.plugin.app.vault.getAbstractFileByPath(`${folder}/${dateStr}.md`);
            const isToday = dateStr === today;

            const btn = grid.createEl('button', { text: String(day) });
            btn.style.cssText = [
                'padding:6px 0',
                'cursor:pointer',
                'border-radius:4px',
                isToday ? 'border:1px solid var(--interactive-accent);' : 'border:1px solid transparent;',
                hasFile ? 'font-weight:700;' : 'font-weight:400;',
            ].join(';');

            btn.addEventListener('click', async () => {
                await this.plugin.openTodoForDate(dateStr);
                this.render();
            });
        }
    }

    async onClose() {
        this.containerEl.empty();
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

        new obsidian.Setting(containerEl)
            .setName('Archive folder')
            .setDesc('Vault path where archived todo notes are moved. Notes are grouped into YYYY/MM subfolders.')
            .addText(text => text
                .setPlaceholder('todos/archive')
                .setValue(this.plugin.settings.archiveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.archiveFolder = value.trim() || 'todos/archive';
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Notes to keep')
            .setDesc('Default number of most-recent daily notes to keep when archiving.')
            .addText(text => text
                .setPlaceholder('30')
                .setValue(String(this.plugin.settings.archiveKeepCount))
                .onChange(async (value) => {
                    const n = parseInt(value, 10);
                    this.plugin.settings.archiveKeepCount = isNaN(n) || n < 0 ? 30 : n;
                    await this.plugin.saveSettings();
                }));
    }
}

// ── Main plugin ───────────────────────────────────────────────────────────────

class DailyTodosPlugin extends obsidian.Plugin {
    async onload() {
        await this.loadSettings();

        // Calendar view
        this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf, this));

        // Ribbon icon — open today's todo
        this.addRibbonIcon('check-square', "Open today's todo", () => {
            this.openTodoForDate(obsidian.moment().format('YYYY-MM-DD'));
        });

        // Ribbon icon — open calendar view
        this.addRibbonIcon('calendar-days', 'Open todo calendar', () => {
            this.activateCalendarView();
        });

        // Command: open calendar view
        this.addCommand({
            id: 'open-todo-calendar',
            name: 'Open todo calendar',
            callback: () => {
                this.activateCalendarView();
            },
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

        // Command: archive old todos
        this.addCommand({
            id: 'archive-old-todos',
            name: 'Archive old todos…',
            callback: () => {
                new ArchiveModal(this.app, this).open();
            },
        });

        this.addSettingTab(new DailyTodosSettingTab(this.app, this));
    }

    onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
    }

    async activateCalendarView() {
        const { workspace } = this.app;

        const existing = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
        if (existing.length > 0) {
            workspace.revealLeaf(existing[0]);
            return;
        }

        const leaf = workspace.getRightLeaf(false);
        await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
        workspace.revealLeaf(leaf);
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

    async ensureFolder(path) {
        const parts = path.split('/').filter(Boolean);
        let current = '';
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            if (!this.app.vault.getAbstractFileByPath(current)) {
                await this.app.vault.createFolder(current);
            }
        }
    }

    // Keeps the `keepCount` most recent daily notes in the todos folder and
    // moves the rest into archiveFolder/YYYY/MM/. Returns the number archived.
    async archiveOldTodos(keepCount) {
        const folder = this.app.vault.getAbstractFileByPath(this.settings.todosFolder);
        if (!(folder instanceof obsidian.TFolder)) return 0;

        const dated = folder.children
            .filter(f => f instanceof obsidian.TFile && DATE_NOTE_RE.test(f.name))
            .sort((a, b) => (a.name < b.name ? 1 : -1)); // newest first

        const toArchive = dated.slice(keepCount);
        let archivedCount = 0;

        for (const file of toArchive) {
            const match = file.name.match(DATE_NOTE_RE);
            const [, year, month] = match;
            const destFolder = `${this.settings.archiveFolder}/${year}/${month}`;
            await this.ensureFolder(destFolder);

            const destPath = `${destFolder}/${file.name}`;
            if (this.app.vault.getAbstractFileByPath(destPath)) continue;

            await this.app.fileManager.renameFile(file, destPath);
            archivedCount++;
        }

        return archivedCount;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

module.exports = DailyTodosPlugin;
