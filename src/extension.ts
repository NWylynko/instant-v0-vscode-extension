// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs/promises';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "instant-v0" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('instant-v0.v0', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Opening new v0');

		const currentOpenDirectory = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

		if (currentOpenDirectory === undefined) {
			vscode.window.showErrorMessage('Need to have a directory open to run this command');
			return;
		}

		vscode.window.showInformationMessage(`Current open directory is ${currentOpenDirectory}`);

		const playwright = await import('playwright');

		const stateContextPath = '/Users/nick/dev/nwylynko/instant-v0/state.json';
		const stateContextExists = await fileExists(stateContextPath);

		const browser = await playwright.chromium.launch({ "headless": false });

		// create a new context, if the user has already logged in, use the saved state
		const context = await browser.newContext({
			storageState: stateContextExists ? JSON.parse(await fs.readFile(stateContextPath, 'utf-8')) : null,
			viewport: null
		});
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);

		const page = await context.newPage();

		if (stateContextExists) {

			await page.goto('https://v0.dev/');

			const button = await page.waitForSelector('a[href="https://v0.dev/api/auth/login?next=%2Fchat"]');

			await button.click();

		} else {

			// send the user to login if they haven't already
			await page.goto('https://vercel.com/login/v0');

			await page.waitForSelector('text=Projects');

			// save the context to a file
			await context.storageState({ path: stateContextPath });

			await page.goto('https://v0.dev/');
		}

		// don't do anything until we are on a chat page
		await page.waitForURL('https://v0.dev/chat/**');

		const addCommandButton = await page.waitForSelector('text=npx shadcn add');

		// grab the command from the clipboard
		await addCommandButton.click();
		const addCommandText = await page.evaluate("navigator.clipboard.readText()") as string;

		// vscode.window.showInformationMessage(addCommandText);

		// close the browser
		await page.close();
		await context.close();
		await browser.close();

		const terminal = vscode.window.createTerminal();

		terminal.sendText(addCommandText)

	});

	context.subscriptions.push(disposable);
}

const fileExists = async (path: string) => {
	try {
		await fs.access(path);
		return true;
	} catch (error) {
		return false;
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
