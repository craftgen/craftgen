import {
  BaseDirectory,
  exists,
  readDir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";

export class NodeManager {
  static async writeFile(path: string, data: string) {
    return writeTextFile(path, data, { baseDir: BaseDirectory.AppData });
  }

  static async readDir(
    path: string,
    dir: BaseDirectory = BaseDirectory.AppData,
  ) {
    return readDir(path, {
      baseDir: dir,
    });
  }

  static async readTextFile(
    path: string,
    dir: BaseDirectory = BaseDirectory.AppData,
  ) {
    return readTextFile(path, {
      baseDir: dir,
    });
  }

  static async exists(
    path: string,
    dir: BaseDirectory = BaseDirectory.Download,
  ) {
    return exists(path, {
      baseDir: dir,
    });
  }
}
