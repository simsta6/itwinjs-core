/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import { dirname } from "path";
import { DbResult, LocalFileName } from "@itwin/core-common";
import { SQLiteDb } from "../SQLiteDb";
import { IModelJsFs } from "../IModelJsFs";
import { SettingName, SettingObject, SettingType } from "./Settings";

/** A semver version range.
 * @see https://docs.npmjs.com/cli/v6/using-npm/semver
 */
export type VersionRange = string;

/** The semver "persistence version" ranges required to read and write a SettingDb. */
export interface RequiredVersionRanges {
  /** a range of acceptable persistence versions for reading from a SettingDb. */
  readonly readVersion: VersionRange;
  /** a range of acceptable persistence versions for writing to a SettingDb. */
  readonly writeVersion: VersionRange;
}

type ValueTypes = string | number | boolean | Uint8Array | SettingObject;

class SettingDb extends SQLiteDb {
  public static readonly requiredVersions = { readVersion: "^3.0", writeVersion: "^3.0" };

  /** The current semver "persistence version" of this package.
   * @note This value should only be changed when logic in this code is modified in a way that affects the operation of extant SettingDbs.
   * If this value is outside of the range of accepted versions of a to-be-opened SettingDb, the operation will fail. In this manner, if
   * changes are made to the format of a Setting, or if bug fixes are necessary, the `requiredVersions` range in a SettingDb may be updated (e.g. via `CodeAdmin`)
   * and immediately old versions of this package will refuse to open the SettingDb, with a message to the user that they need to upgrade their
   * software. Likewise, if a new version of this package is asked to open an older SettingDb that has not been upgrade to the lowest version
   * supported by it, the user will be informed that they need to upgrade their SettingDb.
   * @note this identifier is independent of the version this package in `package.json`.
  */
  public static readonly myVersion = "3.0.0";

  public setRequiredVersions(versions: RequiredVersionRanges): void {
    // NOTE: It might look tempting to just stringify the supplied `versions` object, but we only include required members - there may be others.
    this.nativeDb.saveFileProperty(SettingDb._versionProps, JSON.stringify({ readVersion: versions.readVersion, writeVersion: versions.writeVersion }));
  }

  public static createNewDb(fileName: LocalFileName) {
    const db = new SettingDb();
    IModelJsFs.recursiveMkDirSync(dirname(fileName));
    if (fs.existsSync(fileName))
      fs.unlinkSync(fileName);

    db.createDb(fileName);
    db.executeSQL(`CREATE TABLE settings (name TEXT NOT NULL PRIMARY KEY,type,value)`);
    db.setRequiredVersions(this.requiredVersions);
    db.closeDb(true);
  }

  public getSetting(settingName: SettingName): any {
    return this.withSqliteStatement("SELECT type,value from settings WHERE name=?", (stmt) => {
      stmt.bindString(1, settingName);
      if (!stmt.nexRow())
        return undefined;
      switch (stmt.getValueString(0)) {
        case "string":
          return stmt.getValueString(1);
        case "boolean":
          return stmt.getValueInteger(1) !== 0;
        case "blob":
          return stmt.getValueBlob(1);
        case "number":
          return stmt.getValueDouble(1);
        case "object":
          return JSON.parse(stmt.getValueString(1)) as SettingObject;
      }
      return undefined;
    });
  }

  public getString(name: SettingName, defaultValue: string): string;
  public getString(name: SettingName): string | undefined;
  public getString(name: SettingName, defaultValue?: string): string | undefined {
    const out = this.getSetting(name);
    return typeof out === "string" ? out : defaultValue;
  }
  public getBoolean(name: SettingName, defaultValue: boolean): boolean;
  public getBoolean(name: SettingName): boolean | undefined;
  public getBoolean(name: SettingName, defaultValue?: boolean): boolean | undefined {
    const out = this.getSetting(name);
    return typeof out === "boolean" ? out : defaultValue;
  }
  public getNumber(name: SettingName, defaultValue: number): number;
  public getNumber(name: SettingName): number | undefined;
  public getNumber(name: SettingName, defaultValue?: number): number | undefined {
    const out = this.getSetting(name);
    return typeof out === "number" ? out : defaultValue;
  }
  public getObject<T extends object>(name: SettingName, defaultValue: T): T;
  public getObject<T extends object>(name: SettingName): T | undefined;
  public getObject<T extends object>(name: SettingName, defaultValue?: T): T | undefined {
    const out = this.getSetting(name);
    return typeof out === "object" ? out as T : defaultValue;
  }

  public deleteSetting(settingName: SettingName) {
    this.withSqliteStatement("DELETE from settings WHERE name=?", (stmt) => {
      stmt.bindString(1, settingName);
      stmt.step();
    });
  }

  public saveSetting(settingName: SettingName, value: ValueTypes) {
    this.withSqliteStatement("INSERT OR REPLACE INTO settings(name,type,value) VALUES (?,?,?)", (stmt) => {
      stmt.bindString(1, settingName);
      switch (typeof value) {
        case "string":
          stmt.bindString(2, "string");
          stmt.bindString(3, value);
          break;
        case "boolean":
          stmt.bindString(2, "boolean");
          stmt.bindInteger(3, value ? 1 : 0);
          break;
        case "number":
          stmt.bindString(2, "number");
          stmt.bindDouble(3, value);
          break;
        case "object":
          if (value instanceof Uint8Array) {
            stmt.bindString(2, "blob");
            stmt.bindBlob(3, value);
          } else {
            stmt.bindString(2, "object");
            stmt.bindString(3, JSON.stringify(value))
          };
          break;
        default:
          throw new Error("illegal setting value type");
      }
      if (stmt.step() !== DbResult.BE_SQLITE_DONE)
        throw new Error("error saving setting value type");

    });
  }
}
}
