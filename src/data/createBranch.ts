import * as vscode from 'vscode';
import { IIssue } from '../view/app/model';

/**
 * createBranch - Creates a branch that defaults to the issue's id and name,
 * but can be overwritten with a user input
 *
 * @param {string} branchName
 */
export const createBranch = async (data: IIssue) => {
	const replaceAll = (value: string, search: string, replace: string) => value.split(search).join(replace);
	const id = data.idReadable;

	let name = data.summary;

	name = replaceAll(name, ' ', '-');
	name = replaceAll(name, ',', '');
	name = replaceAll(name, ':', '');
	name = replaceAll(name, ';', '');
	name = replaceAll(name, '.', '');
	name = replaceAll(name, 'ä', 'ae');
	name = replaceAll(name, 'Ä', 'Ae');
	name = replaceAll(name, 'ö', 'oe');
	name = replaceAll(name, 'Ö', 'Oe');
	name = replaceAll(name, 'ü', 'ue');
	name = replaceAll(name, 'Ü', 'Ue');
	name = replaceAll(name, 'ß', 'ss');

	const appName = data.customFields.find(field => field.name === 'App').value.name.toLowerCase();
	const type = data.customFields.find(field => field.name === 'Type').value.name.toLowerCase();

	const branchName = `${appName}/${type}/${id}_${name}`;

	// Create a new terminal and run a git create branch and check it out.
	const terminal = vscode.window.createTerminal(`YouTrack Git`);
	terminal.sendText(`git checkout -b ${branchName}`);

	vscode.window.showWarningMessage(`Branch created: ${branchName}`);
};
