import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    const disposable = vscode.commands.registerCommand('amiga-javaformat.use', (folderUri: vscode.Uri) => {
      configure(folderUri);
    }); 
    context.subscriptions.push(disposable);
}

export function deactivate() { 

}

async function configure(uri: vscode.Uri ) {
 
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
    vscode.window.showInformationMessage('No funciona en workspaces multi-root', { modal: true });
		return ;
	}

  const target = vscode.ConfigurationTarget.Workspace;
  let configPath: vscode.Uri | undefined = undefined;
  if (uri) {
    let folder = vscode.workspace.getWorkspaceFolder(uri);
    if (folder) {
      configPath = vscode.Uri.joinPath(folder.uri, "src/main/config");
      if (!(await confDirIsPresent(configPath))) {
        configPath = vscode.Uri.joinPath(folder.uri, "code/src/main/config");
        if (!(await confDirIsPresent(configPath))) {
          vscode.window.showInformationMessage('Se necesitan ficheros de configuración (src/main/config)', { modal: true });
          return;
        }
      }
    }


    let configuration: vscode.WorkspaceConfiguration | undefined;

    // Configure java
    configuration = vscode.workspace.getConfiguration('java');
    const formatterConfigPath = vscode.Uri.joinPath(configPath!, 'eclipse-java-google-style.xml').fsPath;
    await configuration.update('format.settings.url', formatterConfigPath, target);
    await configuration.update("cleanup.actionsOnSave", [
      "qualifyMembers",
      "addFinalModifier"
    ], target);
    await configuration.update("saveActions.organizeImports", true, target);
    await configuration.update("completion.importOrder", [
      "#java",
      "#com.inditex",
      "#*",
      "java",
      "com.inditex",
      "*"
    ], target);

    // Configure editor
    configuration = vscode.workspace.getConfiguration('editor');
    await configuration.update("defaultFormatter", "redhat.java", target);
    await configuration.update("formatOnSave", true, target);
    await configuration.update("formatOnSaveMode", "file", target);
    await configuration.update("codeActionsOnSave", { "source.organizeImports": true }, target);

    // Configure checkstyle
    // TODO: de momento no funciona
    // configuration = vscode.workspace.getConfiguration('java.checkstyle');
    // const checkstyleConfigPath = vscode.Uri.joinPath(configPath!, 'checkstyle-java-google-style.xml').fsPath;
    // const checkstyleSuppressionsPath = vscode.Uri.joinPath(configPath!, 'checkstyle-suppressions.xml').fsPath;
    // await configuration.update("configuration", checkstyleConfigPath, target);
    // await configuration.update("properties", {
    //   "SuppressionFilter": {
    //     "file": checkstyleSuppressionsPath
    //   }
    // }, target);

  }
}

async function confDirIsPresent(uri: vscode.Uri): Promise<boolean> {
  
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    return stat.type === vscode.FileType.Directory;
  } catch (error) {
    return false;
  }
}
