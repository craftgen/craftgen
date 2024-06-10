export function createMessage(
  format: (...strArgs: any[]) => string,
  ...args: any[]
) {
  return format(...args);
}

export const customJSLibraryMessages = {
  ADD_JS_LIBRARY: () => "Add JS libraries",
  REC_LIBRARY: () => "Recommended libraries",
  INSTALLATION_SUCCESSFUL: (accessor: string) =>
    `Installation Successful. You can access the library via ${accessor}`,
  INSTALLATION_FAILED: () => "Installation failed",
  INSTALLED_ALREADY: (accessor: string) =>
    `This library is already installed. You could access it via ${accessor}.`,
  UNINSTALL_FAILED: (name: string) =>
    `Couldn't uninstall ${name}. Please try again after sometime.`,
  UNINSTALL_SUCCESS: (accessor: string) =>
    `${accessor} is uninstalled successfully.`,
  LEARN_MORE_DESC: () => "Learn more about Custom JS libraries",
  UNSUPPORTED_LIB: () => `Library is unsupported`,
  UNSUPPORTED_LIB_DESC: () =>
    `This library cannot be supported due to platform limitations.`,
  LEARN_MORE: () => `Learn more`,
  REPORT_ISSUE: () => `Report issue`,
  AUTOCOMPLETE_FAILED: (name: string) =>
    `Code completion for ${name} will not work.`,
  CLIENT_LOAD_FAILED: (url: string) => `Failed to load the script at ${url}.`,
  LIB_OVERRIDE_ERROR: (
    name: string,
  ) => `The library ${name} is already installed.
    If you are trying to install a different version, uninstall the library first.`,
  DEFS_FAILED_ERROR: (name: string) =>
    `Failed to generate autocomplete definitions for ${name}.`,
  IMPORT_URL_ERROR: (url: string) =>
    `The script at ${url} cannot be installed.`,
  NAME_COLLISION_ERROR: (accessors: string) =>
    `Name collision detected: ${accessors}`,
};
